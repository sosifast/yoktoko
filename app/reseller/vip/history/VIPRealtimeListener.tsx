"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { getPusherClient } from "@/lib/pusher-client";

export default function VIPRealtimeListener({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("reseller-transactions");

    const handleVipUpdated = (data: any) => {
      if (data && String(data.id_user) === String(userId)) {
        toast.success("Status membership VIP telah diperbarui!", { icon: "👑" });
        router.refresh();
      }
    };

    channel.bind("vip-plan-updated", handleVipUpdated);

    return () => {
      channel.unbind("vip-plan-updated", handleVipUpdated);
      pusher.unsubscribe("reseller-transactions");
    };
  }, [userId, router]);

  return <Toaster position="top-center" />;
}
