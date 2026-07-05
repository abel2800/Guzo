'use client';

import { io, type Socket } from 'socket.io-client';
import { authSelectors } from './auth-store';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

/**
 * Lazily create a single shared Socket.IO connection authenticated with the
 * current access token. Reused across hooks so we never open duplicate sockets.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: (cb) => cb({ token: authSelectors.getAccess() ?? '' }),
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
