import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("user_level");
  cookieStore.delete("session_sig");
  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("user_level");
  cookieStore.delete("session_sig");
  return NextResponse.redirect(new URL("/login", request.url));
}
