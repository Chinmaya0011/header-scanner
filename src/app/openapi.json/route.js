import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

export async function GET() {
  try {
    const yamlPath = path.join(process.cwd(), "public", "openapi.yaml");
    const fileContents = await fs.readFile(yamlPath, "utf8");
    const jsonSpec = yaml.load(fileContents);

    return NextResponse.json(jsonSpec, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Failed to load or parse openapi.yaml:", error);
    return NextResponse.json(
      { error: "Failed to generate OpenAPI JSON specification." },
      { status: 500 }
    );
  }
}
