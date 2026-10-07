import { imagekit } from "@/lib/imagekit";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
  } catch (err) {
    return NextResponse.json({ error: "ImageKit Auth failed" }, { status: 500 });
  }
}
