import { headers } from "next/headers";

/**
 * Mendapatkan Base URL aplikasi secara dinamis dan otomatis.
 * Prioritas:
 * 1. Environment Variable APP_URL atau NEXT_PUBLIC_APP_URL (jika diisi custom)
 * 2. Vercel Production URL (process.env.VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL)
 * 3. Dynamic Request Headers (Host / x-forwarded-host) -> Otomatis mendeteksi domain production saat diakses
 * 4. Fallback ke http://localhost:3000 untuk local development
 */
export async function getBaseUrl(): Promise<string> {
  // 1. Cek environment variable custom
  const envUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return envUrl.startsWith("http") ? envUrl.replace(/\/$/, "") : `https://${envUrl.replace(/\/$/, "")}`;
  }

  // 2. Cek Vercel deployment variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Deteksi otomatis dari request headers (Domain/Host aktual yang sedang diakses)
  try {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");

    if (host) {
      return `${proto}://${host}`;
    }
  } catch {
    // Di luar konteks request (misal background job)
  }

  // 4. Fallback default
  return "http://localhost:3000";
}
