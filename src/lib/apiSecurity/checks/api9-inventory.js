/**
 * API9:2023 - Improper Inventory Management Checker
 * Flags undocumented API endpoints and legacy versioned routes (/api/v1 vs /api/v2)
 */

export async function checkInventory(endpoints = []) {
  const findings = [];

  const legacyEndpoints = endpoints.filter(e => e.tags?.includes("legacy") || /\/(v0|v1|legacy)\//i.test(e.path));
  const undocumentedEndpoints = endpoints.filter(e => e.source !== "openapi");

  if (legacyEndpoints.length > 0) {
    const sample = legacyEndpoints[0];
    findings.push({
      findingId: `INVENTORY-LEGACY-${sample.path}`,
      category: "API9:2023 - Improper Inventory Management",
      title: "Active Legacy API Versions Discovered",
      severity: "medium",
      confidence: "high",
      endpoint: sample.path,
      method: sample.method,
      parameter: null,
      description: `Discovered ${legacyEndpoints.length} active legacy API endpoints (e.g. '${sample.path}') still exposed in production.`,
      impact: "Legacy API versions often lack modern security controls or patch updates, exposing unmonitored attack vectors.",
      remediation: "Deprecate and decommission unmaintained legacy API versions and enforce strict API lifecycle management.",
      evidence: {
        request: { method: sample.method, url: sample.url, headers: {}, body: null },
        response: { status: 200, headers: {}, body: `Discovered ${legacyEndpoints.length} legacy endpoints.` }
      }
    });
  }

  if (undocumentedEndpoints.length > 5) {
    const sample = undocumentedEndpoints[0];
    findings.push({
      findingId: `INVENTORY-UNDOCUMENTED-${sample.path}`,
      category: "API9:2023 - Improper Inventory Management",
      title: "Multiple Undocumented Shadow API Endpoints Detected",
      severity: "low",
      confidence: "medium",
      endpoint: sample.path,
      method: sample.method,
      parameter: null,
      description: `Found ${undocumentedEndpoints.length} API endpoints missing from official OpenAPI / Swagger documentation.`,
      impact: "Shadow APIs create security blind spots outside official API governance and security testing.",
      remediation: "Maintain an automated, single source of truth for API documentation using continuous OpenAPI spec generation.",
      evidence: {
        request: { method: sample.method, url: sample.url, headers: {}, body: null },
        response: { status: 200, headers: {}, body: `${undocumentedEndpoints.length} undocumented routes found via JS/web discovery.` }
      }
    });
  }

  return findings;
}
