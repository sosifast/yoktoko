import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "yok-entertaiment-session-secret-key-2026-prod";

/**
 * Hash password menggunakan algoritma scrypt dengan salt acak 16 byte
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifikasi password (mendukung backward-compatibility dengan password legacy plaintext)
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // Jika hash menggunakan scrypt
  if (storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const [, salt, originalHash] = parts;

    const derivedKey = crypto.scryptSync(password, salt, 64);
    const originalBuffer = Buffer.from(originalHash, "hex");
    const derivedBuffer = Buffer.from(derivedKey.toString("hex"), "hex");

    if (originalBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(originalBuffer, derivedBuffer);
  }

  // Fallback untuk akun lama dengan password plaintext (lalu nanti otomatis di-upgrade saat login/ganti password)
  const a = Buffer.from(password);
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) {
    return password === storedHash;
  }
  return crypto.timingSafeEqual(a, b);
}

/**
 * Buat signature HMAC untuk cookie session & user_level agar tidak bisa dipalsukan via browser
 */
export function createSessionSignature(userId: string, level: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${userId}:${level.toLowerCase().trim()}`)
    .digest("hex");
}

/**
 * Validasi signature session cookie
 */
export function verifySessionSignature(userId: string, level: string, signature?: string | null): boolean {
  if (!userId || !level || !signature) return false;

  const expected = createSessionSignature(userId, level);
  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Sanitasi string input dasar untuk mencegah null byte injection & karakter kontrol
 */
export function sanitizeString(input: string, maxLen: number = 255): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/\0/g, "") // Hapus null byte
    .trim()
    .slice(0, maxLen);
}
