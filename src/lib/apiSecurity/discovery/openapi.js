import { normalizePath } from "./normalizer.js";

const COMMON_OPENAPI_PATHS = [
  "/openapi.json",
  "/swagger.json",
  "/api-docs",
  "/swagger/v1/swagger.json",
  "/api/openapi.json",
  "/api/v1/openapi.json",
  "/v2/swagger.json"
];

/**
 * Discover & extract endpoints from OpenAPI / Swagger definitions
 */
export async function discoverOpenApi(targetUrl, headers = {}) {
  const discovered = [];

  let baseUrl = targetUrl;
  try {
    const parsed = new URL(targetUrl);
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    // preserve
  }

  for (const docPath of COMMON_OPENAPI_PATHS) {
    try {
      const fullUrl = `${baseUrl}${docPath}`;
      const res = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "HeaderGuard-ApiScanner/2.0",
          ...headers
        },
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok && res.headers.get("content-type")?.includes("json")) {
        const spec = await res.json();
        if (spec && spec.paths) {
          for (const [pathKey, methods] of Object.entries(spec.paths)) {
            for (const [method, details] of Object.entries(methods)) {
              if (["get", "post", "put", "patch", "delete", "head", "options"].includes(method.toLowerCase())) {
                const normPath = normalizePath(pathKey);
                const parameters = (details.parameters || []).map(p => ({
                  name: p.name || "param",
                  location: p.in || "query",
                  type: p.schema?.type || p.type || "string",
                  required: !!p.required
                }));

                discovered.push({
                  method: method.toUpperCase(),
                  path: normPath,
                  url: `${baseUrl}${normPath}`,
                  source: "openapi",
                  parameters,
                  authenticationRequired: details.security ? details.security.length > 0 : true,
                  tags: details.tags || ["openapi-discovered"]
                });
              }
            }
          }
          break; // Successfully extracted OpenAPI spec
        }
      }
    } catch {
      // Ignore failed probes silently
    }
  }

  return discovered;
}
