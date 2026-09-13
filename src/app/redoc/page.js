import RedocClient from "./RedocClient";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "REST API Reference",
  description:
    "Complete REST API Documentation for HeaderGuard powered by Redoc.",
  url: "/redoc",
  keywords: ["redoc api reference", "rest api schema", "security api endpoints"],
});

export default function RedocPage() {
  return <RedocClient />;
}
