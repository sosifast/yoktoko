import { getResellerProfile } from "../actions";
import { redirect } from "next/navigation";
import UpdateAccountClient from "./UpdateAccountClient";

export const dynamic = "force-dynamic";

export default async function UpdateAccountPage() {
  const profile = await getResellerProfile();

  if (!profile) {
    redirect("/");
  }

  return (
    <UpdateAccountClient
      initialUser={{
        id: profile.id,
        username: profile.username,
        email: profile.email || null,
        profile_picture_url: profile.profile_picture_url || null,
        roblox_username: profile.roblox_username || null,
        tiktok_url: profile.tiktok_url || null,
      }}
    />
  );
}
