import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);

    let token = null;
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value;
    } catch (e) {
      // ignore
    }

    if (!token && request.cookies && typeof request.cookies.get === "function") {
      token = request.cookies.get("token")?.value;
    }
    if (!token && request.headers) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        loggedIn: false,
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      loggedIn: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        emailVerified: user.isVerified,
        token: token,
      },
    });
  } catch (error) {
    console.error("Auth me check error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
