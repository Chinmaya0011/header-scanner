import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    
    // Clear cookie by setting maxAge to 0 and an expired date
    response.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to log out: " + error.message },
      { status: 500 }
    );
  }
}
