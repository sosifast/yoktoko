import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markPlanPaymentSuccess } from "@/lib/payment-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
    }

    const { reference, merchant_ref, status, signature } = payload;

    if (!merchant_ref || !status) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validasi Signature sesuai payment-gateway.md:
    // $expected = hash_hmac('sha256', json_encode([
    //     'reference'    => $payload['reference'],
    //     'merchant_ref' => $payload['merchant_ref'],
    //     'status'       => $payload['status'],
    // ]), '3552760533433972');
    const kodeApi = process.env.PGKU_KODE_API || "3552760533433972";
    if (signature && kodeApi) {
      const dataToSign = JSON.stringify({
        reference: String(reference),
        merchant_ref: String(merchant_ref),
        status: String(status),
      });

      const expectedSignature = crypto
        .createHmac("sha256", kodeApi)
        .update(dataToSign)
        .digest("hex");

      const isValid =
        expectedSignature.toLowerCase() === String(signature).toLowerCase();

      if (!isValid) {
        console.warn("[Webhook] Signature tidak valid:", {
          received: signature,
          expected: expectedSignature,
        });
        return NextResponse.json(
          { success: false, message: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Cek jika status pembayaran berhasil (PAID / Success)
    const isSuccess =
      status === "PAID" ||
      status === "Success" ||
      status === "SETTLED" ||
      status === "COMPLETED";

    if (isSuccess) {
      await markPlanPaymentSuccess(merchant_ref, reference);
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (err: any) {
    console.error("[Webhook] Internal Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
