/**
 * Route & Endpoint Parameter Normalizer
 */

const ID_PATTERNS = [
  // Numeric ID: /users/123 -> /users/{id}
  { regex: /^\d+$/, replacement: "{id}" },
  // UUID v4: /orders/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 -> /orders/{id}
  { regex: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, replacement: "{id}" },
  // Mongo ObjectId: /items/507f1f77bcf86cd799439011 -> /items/{id}
  { regex: /^[0-9a-fA-F]{24}$/, replacement: "{id}" },
];

/**
 * Normalizes dynamic path IDs to parameterized placeholders
 * @param {string} path 
 * @returns {string} Normalized path
 */
export function normalizePath(path) {
  if (!path || typeof path !== "string") return "/";
  
  // Strip protocol and hostname if present
  let cleanPath = path;
  try {
    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      cleanPath = new URL(cleanPath).pathname;
    }
  } catch {
    // preserve
  }

  // Split path into segments
  const segments = cleanPath.split("/").filter(Boolean);
  const normalizedSegments = segments.map((segment) => {
    for (const pattern of ID_PATTERNS) {
      if (pattern.regex.test(segment)) {
        return pattern.replacement;
      }
    }
    return segment;
  });

  return "/" + normalizedSegments.join("/");
}

/**
 * Classify endpoint source & inventory status
 */
export function classifyEndpoint(path, source = "web") {
  const isApi = /^\/(api|v\d+|graphql|rest|v1|v2|v3)\//i.test(path);
  const isLegacy = /\/(v1|v0|legacy|old)\//i.test(path);
  const isInternal = /\/(internal|admin|private|management|manage)\//i.test(path);

  return {
    isApi,
    isLegacy,
    isInternal,
    source,
  };
}
