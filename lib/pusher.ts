import Pusher from 'pusher'

function createPusherServer(): Pusher | null {
  const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER } =
    process.env

  if (!PUSHER_APP_ID || !NEXT_PUBLIC_PUSHER_KEY || !PUSHER_SECRET || !NEXT_PUBLIC_PUSHER_CLUSTER) {
    return null
  }

  return new Pusher({
    appId:   PUSHER_APP_ID,
    key:     NEXT_PUBLIC_PUSHER_KEY,
    secret:  PUSHER_SECRET,
    cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS:  true,
  })
}

// null when env vars are not set — callers must guard before using
export const pusherServer = createPusherServer()
