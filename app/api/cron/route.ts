import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");

  const isAuth = secret
    ? authHeader === `Bearer ${secret}` || querySecret === secret
    : process.env.NODE_ENV !== "production";

  if (!isAuth) {
    return NextResponse.json({ success: false, message: "Unauthorized cron execution" }, { status: 401 });
  }

  const origin = req.nextUrl.origin;

  const headers: Record<string, string> = {};
  if (authHeader) headers["authorization"] = authHeader;

  const urlParams = querySecret ? `?secret=${encodeURIComponent(querySecret)}` : "";

  try {
    const [pgRes, vipRes] = await Promise.allSettled([
      fetch(`${origin}/api/cron/payment-gateway${urlParams}`, { headers, cache: "no-store" }),
      fetch(`${origin}/api/cron/vip-membership${urlParams}`, { headers, cache: "no-store" }),
    ]);

    const pgData = pgRes.status === "fulfilled" ? await pgRes.value.json() : { error: "Failed to run payment-gateway cron" };
    const vipData = vipRes.status === "fulfilled" ? await vipRes.value.json() : { error: "Failed to run vip-membership cron" };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      jobs: {
        payment_gateway: pgData,
        vip_membership: vipData,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
