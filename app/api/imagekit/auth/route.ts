import { imagekit } from "@/lib/imagekit";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
  } catch (err) {
    return NextResponse.json({ error: "ImageKit Auth failed" }, { status: 500 });
  }
}
