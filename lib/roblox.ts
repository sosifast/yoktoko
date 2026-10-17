export interface CheckRobloxResult {
  success: boolean;
  user?: {
    id: number;
    name: string;
    displayName: string;
    avatarUrl: string;
  };
  error?: string;
}

/**
 * Memeriksa validitas akun Roblox berdasarkan username atau user ID.
 * Mengembalikan informasi akun (ID, username resmi, displayName, dan avatar).
 */
export async function checkRobloxAccount(identifier: string): Promise<CheckRobloxResult> {
  const query = identifier?.trim();
  if (!query) {
    return { success: false, error: "Username Roblox tidak boleh kosong." };
  }

  const robloxApiKey = process.env.ROBLOX_API?.replace(/"/g, "").trim();

  try {
    let robloxUser: { id: number; name: string; displayName: string } | null = null;

    // 1. Cek User ID jika seluruhnya angka
    if (/^\d+$/.test(query)) {
      try {
        const idRes = await fetch(`https://users.roblox.com/v1/users/${query}`, {
          headers: robloxApiKey ? { "x-api-key": robloxApiKey } : undefined,
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(4000),
        });
        if (idRes.ok) {
          const idData = await idRes.json();
          if (idData && idData.id) {
            robloxUser = {
              id: idData.id,
              name: idData.name,
              displayName: idData.displayName || idData.name,
            };
          }
        }
      } catch (err) {
        console.error("Gagal lookup Roblox by ID:", err);
      }
    }

    // 2. Lookup via Roblox usernames API
    if (!robloxUser) {
      try {
        const usernameRes = await fetch("https://users.roblox.com/v1/usernames/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(robloxApiKey ? { "x-api-key": robloxApiKey } : {}),
          },
          body: JSON.stringify({
            usernames: [query],
            excludeBannedUsers: false,
          }),
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(4000),
        });

        if (usernameRes.ok) {
          const usernameData = await usernameRes.json();
          if (usernameData.data && usernameData.data.length > 0) {
            const u = usernameData.data[0];
            robloxUser = {
              id: u.id,
              name: u.name,
              displayName: u.displayName || u.name,
            };
          }
        }
      } catch (userLookupErr) {
        console.error("Gagal lookup Roblox by Username:", userLookupErr);
      }
    }

    if (!robloxUser) {
      return { success: false, error: "Akun Roblox tidak ditemukan. Periksa kembali username Anda." };
    }

    // 3. Ambil avatar thumbnail resolusi tinggi
    let avatarUrl = "";
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUser.id}&size=420x420&format=Png&isCircular=false`,
        {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(4000),
        }
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData.data && thumbData.data.length > 0 && thumbData.data[0].imageUrl) {
          avatarUrl = thumbData.data[0].imageUrl;
        }
      }
    } catch (thumbErr) {
      console.error("Gagal mengambil avatar thumbnail Roblox:", thumbErr);
    }

    return {
      success: true,
      user: {
        id: robloxUser.id,
        name: robloxUser.name,
        displayName: robloxUser.displayName,
        avatarUrl,
      },
    };
  } catch (err: any) {
    console.error("Error checkRobloxAccount:", err);
    return { success: false, error: "Terjadi kesalahan saat memeriksa akun Roblox." };
  }
}
