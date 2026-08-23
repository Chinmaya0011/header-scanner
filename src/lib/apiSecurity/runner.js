import connectDB from "@/lib/mongodb";
import ApiScan from "@/lib/models/ApiScan";
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

    // Phase 0: Validate provided authentication credentials against target server
    if (Object.keys(primaryHeaders).length > 0) {
      scan.status = "discovering";
      scan.progress = 5;
      scan.statusMessage = "Verifying authentication credentials with target API server...";
      await scan.save();
      sendScanStatusToUser(userIdStr, { status: "progress", scanId, progress: 5, message: scan.statusMessage });


      try {
        const probeRes = await fetch(scan.targetUrl, {
          method: "GET",
          headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0", ...primaryHeaders },
          signal: AbortSignal.timeout(5000)
        });

        if (probeRes.status === 401 || probeRes.status === 403) {
          scan.status = "failed";
          scan.progress = 0;
          scan.statusMessage = `Authentication Error (${probeRes.status}): The provided ${scan.authType === "bearer" ? "Bearer Token" : "API Key"} was rejected by the target API server. Please check your credentials and try again.`;
          await scan.save();
          sendScanStatusToUser(userIdStr, { status: "failed", scanId, progress: 0, message: scan.statusMessage });
          return; // Abort scan on invalid credentials
        }
      } catch (probeErr) {
        // Continue if connection timeout, but log
      }
    }

    if (Object.keys(secondaryHeaders).length > 0) {
      try {
        const secondaryProbeRes = await fetch(scan.targetUrl, {
          method: "GET",
          headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0", ...secondaryHeaders },
          signal: AbortSignal.timeout(5000)
        });

        if (secondaryProbeRes.status === 401 || secondaryProbeRes.status === 403) {
          scan.status = "failed";
          scan.progress = 0;
          scan.statusMessage = `Secondary Credential Error (${secondaryProbeRes.status}): Provided Secondary Token (Identity B) was rejected by the target API server.`;
          await scan.save();
          sendScanStatusToUser(userIdStr, { status: "failed", scanId, progress: 0, message: scan.statusMessage });
          return;
        }
      } catch {
        // Ignore
      }
    }

    // Phase 1: Discovery Status Update
    scan.status = "discovering";
    scan.progress = 15;
    scan.statusMessage = "Discovering API endpoints (OpenAPI, JS static bundles, Web routes)...";
    await scan.save();
    sendScanStatusToUser(userIdStr, { status: "progress", scanId, progress: 15, message: scan.statusMessage });

    // Fetch target HTML for script bundle analysis
    let htmlText = "";
    try {
      const htmlRes = await fetch(scan.targetUrl, {
        headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0", ...primaryHeaders },
        signal: AbortSignal.timeout(5000)
      });
      if (htmlRes.ok) htmlText = await htmlRes.text();
    } catch {
      // Ignore html fetch error
    }


    // Run Endpoint Discovery concurrently
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

    // Fallback target root endpoint if no endpoints discovered
    if (endpointMap.size === 0) {
      let normPath = "/";
      try { normPath = new URL(scan.targetUrl).pathname || "/"; } catch {}
      endpointMap.set(`GET:${normPath}`, {
        method: "GET",
        path: normPath,
        url: scan.targetUrl,
        source: "web",
        parameters: [],
        authenticationRequired: false,
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

      // Execute OWASP Security Check Modules
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

      // Set endpoint test status and risk score
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

    // Phase 3: Aggregation & OWASP Top 10 Distribution
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

    // Compute Security Score (100 base, deductions for verified vulnerabilities)
    const scoreDeduction = (severitySummary.critical * 30) + (severitySummary.high * 18) + (severitySummary.medium * 8) + (severitySummary.low * 3);
    const finalScore = Math.max(0, 100 - scoreDeduction);

    // Compute inventory stats
    const documentedCount = endpointsList.filter(e => e.source === "openapi").length;
    const undocumentedCount = endpointsList.filter(e => e.source !== "openapi").length;
    const legacyCount = endpointsList.filter(e => /\/(v0|v1|legacy)\//i.test(e.path)).length;
    const internalCount = endpointsList.filter(e => /\/(internal|admin)\//i.test(e.path)).length;

    // Save final completed scan state
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

