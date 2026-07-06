import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type DriverLocationPayload } from '@delivery/types';

let socket: Socket | null = null;
let getTokenFn: (() => Promise<string | null>) | null = null;

export function socketUrlFromApi(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/api\/v\d+\/?$/, '');
}

export async function connectSocket(socketUrl: string, getToken: () => Promise<string | null>): Promise<Socket> {
  getTokenFn = getToken;
  if (socket?.connected) return socket;

  const token = await getToken();
  socket = io(socketUrl, {
    transports: ['websocket'],
    auth: { token: token ?? '' },
  });

  socket.io.on('reconnect_attempt', async () => {
    const t = await getTokenFn?.();
    if (t && socket) socket.auth = { token: t };
  });

  return socket;
}

export function getSocket(): Socket {
  if (!socket) throw new Error('Socket not initialized — call connectSocket first');
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  getTokenFn = null;
}

export interface OrderSocketHandlers {
  onStatus?: (payload: { orderId: string; status: string }) => void;
  onTracking?: (payload: DriverLocationPayload) => void;
}

export function subscribeToOrder(orderId: string, handlers: OrderSocketHandlers): () => void {
  const s = getSocket();
  const join = () => s.emit('order:subscribe', orderId);
  if (s.connected) join();
  else s.once('connect', join);

  const onStatus = (p: { orderId: string; status: string }) => {
    if (p.orderId === orderId) handlers.onStatus?.(p);
  };
  const onTracking = (p: DriverLocationPayload) => {
    if (p.orderId === orderId) handlers.onTracking?.(p);
  };
  s.on(SOCKET_EVENTS.ORDER_STATUS, onStatus);
  s.on(SOCKET_EVENTS.ORDER_TRACKING, onTracking);

  return () => {
    s.emit('order:unsubscribe', orderId);
    s.off('connect', join);
    s.off(SOCKET_EVENTS.ORDER_STATUS, onStatus);
    s.off(SOCKET_EVENTS.ORDER_TRACKING, onTracking);
  };
}

export function subscribeToUserNotifications(onNew: (notification: unknown) => void): () => void {
  const s = getSocket();
  const handler = (n: unknown) => onNew(n);
  s.on(SOCKET_EVENTS.NOTIFICATION_NEW, handler);
  return () => s.off(SOCKET_EVENTS.NOTIFICATION_NEW, handler);
}
