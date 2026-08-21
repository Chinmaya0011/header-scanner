import SwaggerClient from "./SwaggerClient";

export const metadata = {
  title: "Swagger API Explorer - HeaderGuard",
  description: "Interactive Swagger UI documentation and API testing interface for HeaderGuard HTTP Security Scanner.",
};

export default function SwaggerPage() {
  return <SwaggerClient />;
}
