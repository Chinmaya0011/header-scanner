import connectDB from "@/lib/mongodb";
import ApiScan from "@/lib/models/ApiScan";
import { maskDomain } from "@/lib/analyzer";
import { sendScanStatusToUser } from "@/server/socketServer";

import { discoverOpenApi } from "./discovery/openapi";
import { discoverFromJsBundles } from "./discovery/jsAnalyzer";
import { discoverFromWeb } from "./discovery/webCrawler";

import { checkBola } from "./checks/api1-bola";
import { checkAuthentication } from "./checks/api2-authentication";
import { checkPropertyAuthorization } from "./checks/api3-property-authorization";
import { checkResourceConsumption } from "./checks/api4-resource-consumption";
import { checkBfla } from "./checks/api5-bfla";
import { checkMisconfiguration } from "./checks/api8-misconfiguration";
import { checkInventory } from "./checks/api9-inventory";
import { checkBusinessFlowsAndSsrf } from "./checks/api6_7_10";

/**
 * Execute API Security Scan Background Job
 */
export async function runApiScanJob(scanId, authTokens = {}) {
  const startTime = Date.now();

  try {
    await connectDB();
    const scan = await ApiScan.findById(scanId);
    if (!scan || scan.status === "cancelled") return;

    const { primaryToken, secondaryToken, apiKeyHeader, apiKeyValue } = authTokens;
    const userIdStr = scan.owner.toString();

    // Prepare Headers
    const primaryHeaders = {};
    const secondaryHeaders = {};

    if (scan.authType === "bearer" && primaryToken) {
      primaryHeaders["Authorization"] = `Bearer ${primaryToken}`;
      if (secondaryToken) {
        secondaryHeaders["Authorization"] = `Bearer ${secondaryToken}`;
      }
    } else if (scan.authType === "apikey" && apiKeyValue) {
      const headerKey = apiKeyHeader || "X-API-Key";
      primaryHeaders[headerKey] = apiKeyValue;
    }

    // Phase 1: Update Status - Discovering
    scan.status = "discovering";
    scan.progress = 15;
    scan.statusMessage = "Discovering API endpoints (OpenAPI, JS bundles, Web crawler)...";
    await scan.save();
    sendScanStatusToUser(userIdStr, { status: "progress", scanId, progress: 15, message: scan.statusMessage });

    // Fetch HTML for JS bundle extraction
    let htmlText = "";
    try {
      const htmlRes = await fetch(scan.targetUrl, {
        headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0", ...primaryHeaders },
        signal: AbortSignal.timeout(5000)
      });
      if (htmlRes.ok) htmlText = await htmlRes.text();
    } catch {
      // Ignore
    }

    // Run Endpoint Discovery Concurrent Tasks
    const [openApiEndpoints, jsEndpoints, webEndpoints] = await Promise.all([
      discoverOpenApi(scan.targetUrl, primaryHeaders),
      discoverFromJsBundles(scan.targetUrl, htmlText, primaryHeaders),
      discoverFromWeb(scan.targetUrl, primaryHeaders)
    ]);

    // Deduplicate endpoints by Method + Path
    const endpointMap = new Map();
    const allDiscovered = [...openApiEndpoints, ...jsEndpoints, ...webEndpoints];

    for (const ep of allDiscovered) {
      const key = `${ep.method}:${ep.path}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, ep);
      }
    }

    // If no endpoints discovered, add base target URL as fallback endpoint
    if (endpointMap.size === 0) {
      let normPath = "/";
      try { normPath = new URL(scan.targetUrl).pathname || "/"; } catch {}
      endpointMap.set(`GET:${normPath}`, {
        method: "GET",
        path: normPath,
        url: scan.targetUrl,
        source: "web",
        parameters: [],
        authenticationRequired: true,
        tags: ["target-root"]
      });
    }

    const endpointsList = Array.from(endpointMap.values());
    scan.endpoints = endpointsList;
    scan.totalEndpoints = endpointsList.length;
    scan.progress = 40;
    scan.status = "testing";
    scan.statusMessage = `Discovered ${endpointsList.length} endpoints. Executing OWASP API Security checks...`;
    await scan.save();
    sendScanStatusToUser(userIdStr, { status: "progress", scanId, progress: 40, message: scan.statusMessage });

    // Phase 2: OWASP API Security Checks Pipeline
    const allFindings = [];
    let testedCount = 0;

    for (const ep of endpointsList) {
      // Check cancellation signal
      const currentScanState = await ApiScan.findById(scanId).select("status").lean();
      if (currentScanState?.status === "cancelled") return;

      const epFindings = [];

      // Execute Security Check Modules
      const bolaFindings = await checkBola(ep, primaryHeaders, secondaryHeaders);
      const authFindings = await checkAuthentication(ep, primaryHeaders);
      const propFindings = await checkPropertyAuthorization(ep, primaryHeaders);
      const resFindings = await checkResourceConsumption(ep, primaryHeaders);
      const bflaFindings = await checkBfla(ep, primaryHeaders);
      const misconfigFindings = await checkMisconfiguration(ep, primaryHeaders);
      const flowFindings = await checkBusinessFlowsAndSsrf(ep, primaryHeaders);

      epFindings.push(
        ...bolaFindings,
        ...authFindings,
        ...propFindings,
        ...resFindings,
        ...bflaFindings,
        ...misconfigFindings,
        ...flowFindings
      );

      // Set endpoint test status
      if (epFindings.some(f => f.severity === "critical" || f.severity === "high")) {
        ep.testStatus = "FAIL";
        ep.riskScore = 80;
      } else if (epFindings.some(f => f.severity === "medium" || f.severity === "low")) {
        ep.testStatus = "WARNING";
        ep.riskScore = 40;
      } else {
        ep.testStatus = "PASS";
        ep.riskScore = 0;
      }

      allFindings.push(...epFindings);
      testedCount++;

      // Progress update
      const currentProgress = Math.min(95, 40 + Math.floor((testedCount / endpointsList.length) * 50));
      sendScanStatusToUser(userIdStr, {
        status: "progress",
        scanId,
        progress: currentProgress,
        message: `Tested ${testedCount}/${endpointsList.length} endpoints (${allFindings.length} findings)...`
      });
    }

    // Inventory checks
    const inventoryFindings = await checkInventory(endpointsList);
    allFindings.push(...inventoryFindings);

    // Phase 3: Aggregation, OWASP Distribution & Score Calculation
    const severitySummary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    const owaspDist = {
      api1_bola: 0, api2_auth: 0, api3_properties: 0, api4_resources: 0,
      api5_bfla: 0, api6_business: 0, api7_ssrf: 0, api8_config: 0,
      api9_inventory: 0, api10_consumption: 0
    };

    for (const f of allFindings) {
      if (severitySummary[f.severity] !== undefined) {
        severitySummary[f.severity]++;
      }
      if (f.category.includes("API1")) owaspDist.api1_bola++;
      else if (f.category.includes("API2")) owaspDist.api2_auth++;
      else if (f.category.includes("API3")) owaspDist.api3_properties++;
      else if (f.category.includes("API4")) owaspDist.api4_resources++;
      else if (f.category.includes("API5")) owaspDist.api5_bfla++;
      else if (f.category.includes("API6")) owaspDist.api6_business++;
      else if (f.category.includes("API7")) owaspDist.api7_ssrf++;
      else if (f.category.includes("API8")) owaspDist.api8_config++;
      else if (f.category.includes("API9")) owaspDist.api9_inventory++;
      else if (f.category.includes("API10")) owaspDist.api10_consumption++;
    }

    // Compute Security Score (100 base, deductions based on severity)
    let scoreDeduction = (severitySummary.critical * 25) + (severitySummary.high * 15) + (severitySummary.medium * 8) + (severitySummary.low * 3);
    const finalScore = Math.max(0, 100 - scoreDeduction);

    // Compute inventory counts
    const documentedCount = endpointsList.filter(e => e.source === "openapi").length;
    const undocumentedCount = endpointsList.filter(e => e.source !== "openapi").length;
    const legacyCount = endpointsList.filter(e => /\/(v0|v1|legacy)\//i.test(e.path)).length;
    const internalCount = endpointsList.filter(e => /\/(internal|admin)\//i.test(e.path)).length;

    // Save final scan state
    scan.status = "completed";
    scan.progress = 100;
    scan.statusMessage = "API Security Scan completed successfully.";
    scan.testedEndpoints = testedCount;
    scan.score = finalScore;
    scan.findings = allFindings;
    scan.severitySummary = severitySummary;
    scan.owaspDistribution = owaspDist;
    scan.inventory = {
      documented: documentedCount,
      undocumented: undocumentedCount,
      legacy: legacyCount,
      internal: internalCount,
    };
    scan.durationMs = Date.now() - startTime;
    await scan.save();

    sendScanStatusToUser(userIdStr, {
      status: "completed",
      scanId,
      score: finalScore,
      totalEndpoints: endpointsList.length,
      findingsCount: allFindings.length,
      message: "API Security scan completed."
    });

  } catch (err) {
    console.error("API Security scan job error:", err);
    try {
      await ApiScan.findByIdAndUpdate(scanId, {
        status: "failed",
        statusMessage: `Scan error: ${err.message}`
      });
    } catch {}
  }
}
