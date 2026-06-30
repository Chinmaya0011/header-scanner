import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";

const VALID_SORT_FIELDS = ["createdAt", "score", "grade", "domain", "scanDuration"];
const VALID_GRADES = ["A+", "A", "B", "C", "D", "F"];

/**
 * GET /api/scans
 * Retrieve paginated scans with filtering and sorting
 */
export async function GET(request) {
  const startTime = Date.now();

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return buildErrorResponse("Authentication required.", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const ownerFilter = user.role === "admin" ? {} : { owner: user.role === "user" ? new Object(user._id) : null };
    
    // Ensure normal users are restricted to their own scans
    const query = user.role === "admin" ? {} : { owner: user._id };
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // ========== SORTING ==========
    const sortBy = VALID_SORT_FIELDS.includes(searchParams.get("sortBy"))
      ? searchParams.get("sortBy")
      : "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // ========== BUILD QUERY FILTERS ==========

    // Score range filter
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    
    if (minScore || maxScore) {
      query.score = {};
      if (minScore) {
        const min = parseInt(minScore);
        if (isNaN(min) || min < 0 || min > 100) {
          return buildErrorResponse("minScore must be between 0 and 100", 400);
        }
        query.score.$gte = min;
      }
      if (maxScore) {
        const max = parseInt(maxScore);
        if (isNaN(max) || max < 0 || max > 100) {
          return buildErrorResponse("maxScore must be between 0 and 100", 400);
        }
        query.score.$lte = max;
      }
    }

    // Grade filter
    const grade = searchParams.get("grade");
    if (grade) {
      if (!VALID_GRADES.includes(grade)) {
        return buildErrorResponse(`grade must be one of: ${VALID_GRADES.join(", ")}`, 400);
      }
      query.grade = grade;
    }

    // Domain search (partial match, case-insensitive)
    const domain = searchParams.get("domain");
    if (domain) {
      query.domain = { $regex: domain, $options: "i" };
    }

    // Date range filter
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return buildErrorResponse("Invalid startDate format. Use ISO date (YYYY-MM-DD)", 400);
        }
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return buildErrorResponse("Invalid endDate format. Use ISO date (YYYY-MM-DD)", 400);
        }
        // Set to end of day
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Status code filter
    const statusCode = searchParams.get("statusCode");
    if (statusCode) {
      const code = parseInt(statusCode);
      if (isNaN(code) || code < 100 || code > 599) {
        return buildErrorResponse("statusCode must be between 100 and 599", 400);
      }
      query.statusCode = code;
    }

    // Compliance filter
    const compliant = searchParams.get("compliant");
    if (compliant) {
      const frameworks = ["GDPR", "PCI_DSS", "OWASP", "NIST"];
      if (!frameworks.includes(compliant)) {
        return buildErrorResponse(`compliant must be one of: ${frameworks.join(", ")}`, 400);
      }
      query[`compliance.${compliant}.compliant`] = true;
    }

    await connectDB();

    // ========== EXECUTE QUERIES IN PARALLEL ==========
    const [scans, totalScans, aggregateStats, availableFilters] = await Promise.all([
      // Main query with pagination
      Scan.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("-headers") // Exclude full headers for performance
        .populate("owner", "email role") // Populate owner info for admin view
        .lean(),
      
      // Total count for pagination
      Scan.countDocuments(query),
      
      // Get global statistics
      getAggregateStats(user.role === "admin" ? {} : { owner: new mongoose.Types.ObjectId(user._id) }),
      
      // Get available filter options
      getAvailableFilters(user.role === "admin" ? {} : { owner: new mongoose.Types.ObjectId(user._id) })
    ]);

    // Get filtered statistics based on current query
    const filteredStats = await getFilteredStats(query);

    const totalPages = Math.ceil(totalScans / limit);

    // Map scans for safety domain masking
    const mappedScans = scans.map(s => {
      // After populate, s.owner may be an object { _id, email, role } or a raw ObjectId (if populate failed)
      const ownerIdStr = s.owner
        ? (s.owner._id ? s.owner._id.toString() : s.owner.toString())
        : null;
      const isOwner = ownerIdStr && ownerIdStr === user._id.toString();
      const isAdmin = user.role === "admin";
      return {
        ...s,
        _id: s._id.toString(),
        domain: (isAdmin || isOwner) ? s.domain : s.maskedDomain,
        url: (isAdmin || isOwner) ? s.url : (s.url && s.domain ? s.url.replace(s.domain, s.maskedDomain) : s.maskedDomain)
      };
    });

    // Build response
    return NextResponse.json({
      success: true,
      data: {
        scans: mappedScans,
        pagination: {
          currentPage: page,
          totalPages,
          totalScans,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null
        },
        filters: {
          applied: {
            minScore: minScore ? parseInt(minScore) : null,
            maxScore: maxScore ? parseInt(maxScore) : null,
            grade: grade || null,
            domain: domain || null,
            startDate: startDate || null,
            endDate: endDate || null,
            statusCode: statusCode ? parseInt(statusCode) : null,
            compliant: compliant || null
          },
          available: availableFilters
        },
        summary: {
          ...filteredStats,
          global: aggregateStats
        }
      },
      responseTimeMs: Date.now() - startTime
    });

  } catch (error) {
    console.error("Error fetching scans:", error);

    if (error.name === "MongoError" || error.name === "MongooseError") {
      return buildErrorResponse("Database error. Please try again later.", 503, "DATABASE_ERROR");
    }

    return buildErrorResponse("Failed to retrieve scans. Please try again.", 500, "FETCH_FAILED");
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Get global aggregate statistics across all scans
 */
async function getAggregateStats(ownerFilter = {}) {
  const [stats] = await Scan.aggregate([
    { $match: ownerFilter },
    {
      $facet: {
        // Overall averages
        overall: [
          {
            $group: {
              _id: null,
              averageScore: { $avg: "$score" },
              averageDuration: { $avg: "$scanDuration" },
              totalScans: { $sum: 1 },
              uniqueDomains: { $addToSet: "$domain" }
            }
          },
          {
            $project: {
              averageScore: { $round: ["$averageScore", 1] },
              averageDuration: { $round: ["$averageDuration", 0] },
              totalScans: 1,
              uniqueDomainCount: { $size: "$uniqueDomains" }
            }
          }
        ],
        // Grade distribution
        gradeDistribution: [
          {
            $group: {
              _id: "$grade",
              count: { $sum: 1 }
            }
          },
          {
            $sort: { "_id": 1 }
          }
        ],
        // Most common missing headers
        missingHeaders: [
          { $unwind: "$recommendations" },
          { $match: { "recommendations.severity": "high" } },
          {
            $group: {
              _id: "$recommendations.header",
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ],
        // Compliance overview
        compliance: [
          {
            $group: {
              _id: null,
              gdprCompliant: { $sum: { $cond: ["$compliance.GDPR.compliant", 1, 0] } },
              pciCompliant: { $sum: { $cond: ["$compliance.PCI_DSS.compliant", 1, 0] } },
              owaspCompliant: { $sum: { $cond: ["$compliance.OWASP.compliant", 1, 0] } },
              nistCompliant: { $sum: { $cond: ["$compliance.NIST.compliant", 1, 0] } }
            }
          }
        ]
      }
    }
  ]);

  // Format grade distribution
  const gradeMap = { "A+": 0, "A": 0, "B": 0, "C": 0, "D": 0, "F": 0 };
  stats?.gradeDistribution?.forEach(item => {
    if (gradeMap[item._id] !== undefined) {
      gradeMap[item._id] = item.count;
    }
  });

  return {
    averageScore: stats?.overall?.[0]?.averageScore || 0,
    averageScanDuration: stats?.overall?.[0]?.averageDuration || 0,
    totalScans: stats?.overall?.[0]?.totalScans || 0,
    uniqueDomainsScanned: stats?.overall?.[0]?.uniqueDomainCount || 0,
    gradeDistribution: gradeMap,
    topMissingHeaders: stats?.missingHeaders || [],
    complianceStats: stats?.compliance?.[0] || {
      gdprCompliant: 0,
      pciCompliant: 0,
      owaspCompliant: 0,
      nistCompliant: 0
    }
  };
}

/**
 * Get statistics filtered by current query
 */
async function getFilteredStats(query) {
  const [stats] = await Scan.aggregate([
    { $match: query },
    {
      $facet: {
        averages: [
          {
            $group: {
              _id: null,
              averageScore: { $avg: "$score" },
              totalScans: { $sum: 1 },
              uniqueDomains: { $addToSet: "$domain" }
            }
          },
          {
            $project: {
              averageScore: { $round: ["$averageScore", 1] },
              totalScans: 1,
              uniqueDomainCount: { $size: "$uniqueDomains" }
            }
          }
        ],
        gradeDistribution: [
          {
            $group: {
              _id: "$grade",
              count: { $sum: 1 }
            }
          }
        ],
        mostCommonMissingHeader: [
          { $unwind: "$recommendations" },
          { $match: { "recommendations.severity": "high" } },
          {
            $group: {
              _id: "$recommendations.header",
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]
      }
    }
  ]);

  const gradeMap = { "A+": 0, "A": 0, "B": 0, "C": 0, "D": 0, "F": 0 };
  stats?.gradeDistribution?.forEach(item => {
    if (gradeMap[item._id] !== undefined) {
      gradeMap[item._id] = item.count;
    }
  });

  return {
    totalScans: stats?.averages?.[0]?.totalScans || 0,
    averageScore: stats?.averages?.[0]?.averageScore || 0,
    uniqueDomains: stats?.averages?.[0]?.uniqueDomainCount || 0,
    gradeDistribution: gradeMap,
    mostCommonMissingHeader: stats?.mostCommonMissingHeader?.[0]?._id || "none"
  };
}

/**
 * Get available filter options for UI
 */
async function getAvailableFilters(ownerFilter = {}) {
  const [grades, dateRange, domains, statusCodes] = await Promise.all([
    Scan.distinct("grade", ownerFilter),
    Scan.aggregate([
      { $match: ownerFilter },
      {
        $group: {
          _id: null,
          oldest: { $min: "$createdAt" },
          newest: { $max: "$createdAt" }
        }
      }
    ]),
    Scan.distinct("domain", ownerFilter).then(domains => domains.slice(0, 100)), // Limit to 100 for performance
    Scan.distinct("statusCode", ownerFilter)
  ]);

  return {
    grades: grades.sort(),
    statusCodes: statusCodes.sort((a, b) => a - b),
    domains: domains.sort(),
    dateRange: {
      oldest: dateRange[0]?.oldest || null,
      newest: dateRange[0]?.newest || null
    },
    scoreRange: {
      min: 0,
      max: 100
    }
  };
}

/**
 * Build standardized error response
 */
function buildErrorResponse(message, status, code = null) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: code || "ERROR"
    },
    { status }
  );
}

/**
 * DELETE /api/scans
 * Clear all scans history in the system (Admin only)
 */
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    
    // Authorization check
    if (!user || user.role !== "admin") {
      return buildErrorResponse("Forbidden. Admin access required.", 403, "FORBIDDEN");
    }

    await connectDB();
    
    // Clear all scans
    await Scan.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All security scan histories deleted successfully.",
    });
  } catch (error) {
    console.error("Error clearing scans:", error);
    return buildErrorResponse("Failed to clear scans: " + error.message, 500);
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}