import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const userLevel = cookieStore.get("user_level")?.value;

  if (sessionToken && userLevel === "owner") {
    redirect("/owner/dashboard");
  }

  redirect("/login");
}
