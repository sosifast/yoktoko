import PusherServer from "pusher";

let pusherServerInstance: PusherServer | null = null;

export function getPusherServer(): PusherServer | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || "ap1";

  if (!appId || !key || !secret) {
    return null;
  }

  if (!pusherServerInstance) {
    pusherServerInstance = new PusherServer({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }

  return pusherServerInstance;
}

export async function triggerPusherEvent(channel: string, event: string, data: any) {
  try {
    const pusher = getPusherServer();
    if (pusher) {
      await pusher.trigger(channel, event, data);
    }
  } catch (err) {
    console.warn("Pusher server trigger warning:", err);
  }
}
