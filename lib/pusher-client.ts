import PusherClient from "pusher-js";

let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1";

  if (!key) {
    return null;
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(key, {
      cluster,
    });
  }

  return pusherClientInstance;
}
