import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { scanGitHub } from "@/lib/scanners/githubScanner";

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "GitHub username or organization name is required." }, { status: 400 });
    }

    const cleanUsername = username.trim();
    console.log(`[GitHub Scan] Initiating audit for: ${cleanUsername}`);
    
    const results = await scanGitHub(cleanUsername);

    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error("GitHub scan API error:", err);
    return NextResponse.json({ error: "An unexpected error occurred during repository analysis." }, { status: 500 });
  }
}
