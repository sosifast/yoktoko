import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionSignature } from "@/lib/security";

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string | null;
  level: string;
}

/**
 * Memastikan user sedang login dan mengembalikan data user dari database.
 * Melempar error jika sesi tidak valid.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const userLevel = cookieStore.get("user_level")?.value;
  const sessionSig = cookieStore.get("session_sig")?.value;

  if (!sessionToken) {
    throw new Error("Unauthorized: Silakan login terlebih dahulu.");
  }

  // Verifikasi signature cookie jika ada
  if (userLevel && sessionSig && !(await verifySessionSignature(sessionToken, userLevel, sessionSig))) {
    throw new Error("Unauthorized: Sesi tidak valid atau telah dimodifikasi.");
  }

  const res = await db.query(
    'SELECT id, username, email, level FROM "User" WHERE id::text = $1 LIMIT 1',
    [sessionToken]
  );

  if (res.rows.length === 0) {
    throw new Error("Unauthorized: Akun pengguna tidak ditemukan.");
  }

  const user = res.rows[0];
  return {
    id: String(user.id),
    username: String(user.username),
    email: user.email || null,
    level: String(user.level || "reseller").toLowerCase(),
  };
}

/**
 * Memastikan user memiliki hak akses sebagai OWNER.
 * Melempar error jika bukan owner.
 */
export async function requireOwner(): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (user.level !== "owner") {
    console.warn(`[Security Alert] Akses owner ditolak untuk user: ${user.username} (${user.id}) dengan level: ${user.level}`);
    throw new Error("Forbidden: Anda tidak memiliki izin untuk mengakses fitur ini.");
  }

  return user;
}
