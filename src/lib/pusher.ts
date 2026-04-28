import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

export const pusherServer = typeof window === 'undefined' ? new PusherServer({
  appId: process.env.PUSHER_APP_ID || 'dummy',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || 'dummy',
  secret: process.env.PUSHER_SECRET || 'dummy',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  useTLS: true,
}) : null as any;

export const getPusherClient = () => {
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || 'dummy', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  });
};
