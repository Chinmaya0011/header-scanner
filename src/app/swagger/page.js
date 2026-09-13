import SwaggerClient from "./SwaggerClient";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Swagger API Explorer | HeaderGuard",
  description:
    "Interactive Swagger UI documentation and API testing interface for HeaderGuard HTTP Security Scanner.",
  url: "/swagger",
  keywords: ["swagger ui", "openapi tester", "security api reference"],
});

export default function SwaggerPage() {
  return <SwaggerClient />;
}
