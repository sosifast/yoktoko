/**
 * Session security helpers for Edge Runtime & Node.js using Web Crypto API.
 * This file avoids importing Node.js built-in modules (like 'crypto') so it can run safely
 * in Next.js Edge Middleware and edge routes.
 */

const SESSION_SECRET = process.env.SESSION_SECRET || "yok-entertaiment-session-secret-key-2026-prod";

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Buat signature HMAC-SHA256 menggunakan Web Crypto API
 */
export async function createSessionSignature(userId: string, level: string): Promise<string> {
  const key = await getHmacKey(SESSION_SECRET);
  const data = new TextEncoder().encode(`${userId}:${level.toLowerCase().trim()}`);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Validasi signature session cookie menggunakan Web Crypto API (timing-safe)
 */
export async function verifySessionSignature(
  userId: string,
  level: string,
  signature?: string | null
): Promise<boolean> {
  if (!userId || !level || !signature) return false;
  try {
    const key = await getHmacKey(SESSION_SECRET);
    const data = new TextEncoder().encode(`${userId}:${level.toLowerCase().trim()}`);

    if (signature.length % 2 !== 0) return false;
    const sigBytes = new Uint8Array(signature.length / 2);
    for (let i = 0; i < signature.length; i += 2) {
      const byte = parseInt(signature.slice(i, i + 2), 16);
      if (Number.isNaN(byte)) return false;
      sigBytes[i / 2] = byte;
    }

    return await crypto.subtle.verify("HMAC", key, sigBytes, data);
  } catch {
    return false;
  }
}
