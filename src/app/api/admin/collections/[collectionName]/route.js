import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import connectDB from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/server/activityLogger";

/**
 * GET /api/admin/collections/[collectionName]
 * Fetch paginated document records for a specific collection
 */
export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const collectionName = resolvedParams?.collectionName;
    if (!collectionName) {
      return NextResponse.json({ success: false, error: "Collection name required." }, { status: 400 });
    }

    await connectDB();
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    let query = {};
    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      // Search across commonly indexed string fields or ObjectId
      const isValidObjectId = ObjectId.isValid(search.trim());
      
      const searchConditions = [
        { email: regex },
        { domain: regex },
        { eventType: regex },
        { name: regex },
        { description: regex },
        { status: regex },
        { role: regex },
      ];

      if (isValidObjectId) {
        searchConditions.push({ _id: new ObjectId(search.trim()) });
      }

      query = { $or: searchConditions };
    }

    const totalDocs = await collection.countDocuments(query);
    const documents = await collection
      .find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(totalDocs / limit) || 1;

    return NextResponse.json({
      success: true,
      collectionName,
      documents,
      pagination: {
        totalDocs,
        totalPages,
        currentPage: page,
        pageLimit: limit,
      },
    });
  } catch (error) {
    console.error(`Fetch documents for ${params.collectionName} error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch collection documents: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/collections/[collectionName]
 * Delete single document or purge all documents in collection
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const collectionName = resolvedParams?.collectionName;
    if (!collectionName) {
      return NextResponse.json({ success: false, error: "Collection name required." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("docId");
    const isPurge = searchParams.get("purge") === "true";

    await connectDB();
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);

    if (isPurge) {
      // WIPE / PURGE Entire Collection
      let filter = {};
      
      // Safety rule: If purging 'users' collection, preserve current logged-in admin user!
      if (collectionName.toLowerCase() === "users") {
        const adminId = new ObjectId(user._id);
        filter = { _id: { $ne: adminId } };
      }

      const result = await collection.deleteMany(filter);

      await logActivity({
        req: request,
        user,
        eventType: "DB_COLLECTION_PURGED",
        description: `Admin purged ${result.deletedCount} documents from collection '${collectionName}'.`,
        status: "warning",
        resourceType: "database",
        resourceId: collectionName,
        metadata: { collectionName, deletedCount: result.deletedCount },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully purged ${result.deletedCount} documents from collection '${collectionName}'.`,
        deletedCount: result.deletedCount,
      });
    }

    if (docId) {
      // Delete single document by docId
      let objectId;
      try {
        objectId = new ObjectId(docId);
      } catch {
        objectId = docId; // string fallback if not standard ObjectId
      }

      // Prevent self-deletion of current active admin from users collection
      if (collectionName.toLowerCase() === "users" && String(docId) === String(user._id)) {
        return NextResponse.json(
          { success: false, error: "Cannot delete your own active admin account through collection monitor." },
          { status: 400 }
        );
      }

      const result = await collection.deleteOne({ $or: [{ _id: objectId }, { _id: docId }] });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, error: "Document not found or already deleted." },
          { status: 404 }
        );
      }

      await logActivity({
        req: request,
        user,
        eventType: "DB_DOCUMENT_DELETED",
        description: `Admin deleted document '${docId}' from collection '${collectionName}'.`,
        status: "warning",
        resourceType: "database",
        resourceId: docId,
        metadata: { collectionName, docId },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully deleted document from collection '${collectionName}'.`,
        deletedCount: result.deletedCount,
      });
    }

    return NextResponse.json(
      { success: false, error: "Specify docId or purge=true parameter." },
      { status: 400 }
    );
  } catch (error) {
    console.error(`Delete document error in ${params.collectionName}:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to delete collection documents: " + error.message },
      { status: 500 }
    );
  }
}
