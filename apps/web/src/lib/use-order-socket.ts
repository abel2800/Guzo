'use client';

import { useEffect, useRef } from 'react';
import { SOCKET_EVENTS, type DriverLocationPayload } from '@delivery/types';
import { getSocket } from './socket';

interface OrderStatusPayload {
  orderId: string;
  status: string;
}

interface OrderSocketHandlers {
  onStatus?: (payload: OrderStatusPayload) => void;
  onTracking?: (payload: DriverLocationPayload) => void;
}

export function useOrderSocket(orderId: string | undefined, handlers: OrderSocketHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();

    const join = () => socket.emit('order:subscribe', orderId);
    if (socket.connected) join();
    socket.on('connect', join);

    const onStatus = (p: OrderStatusPayload) => ref.current.onStatus?.(p);
    const onTracking = (p: DriverLocationPayload) => ref.current.onTracking?.(p);
    socket.on(SOCKET_EVENTS.ORDER_STATUS, onStatus);
    socket.on(SOCKET_EVENTS.ORDER_TRACKING, onTracking);

    return () => {
      socket.emit('order:unsubscribe', orderId);
      socket.off('connect', join);
      socket.off(SOCKET_EVENTS.ORDER_STATUS, onStatus);
      socket.off(SOCKET_EVENTS.ORDER_TRACKING, onTracking);
    };
  }, [orderId]);
}

export function emitDriverLocation(payload: DriverLocationPayload) {
  getSocket().emit(SOCKET_EVENTS.DRIVER_LOCATION, payload);
}
