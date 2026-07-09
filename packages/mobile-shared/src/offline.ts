import type { Order } from './types';

export interface OfflineStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface LocationPing {
  latitude: number;
  longitude: number;
  orderId?: string;
  speed?: number;
  heading?: number;
  ts: number;
}

const ORDERS_LIST_KEY = 'guzo:orders:list';
const ORDER_PREFIX = 'guzo:order:';
const LOCATION_QUEUE_KEY = 'guzo:queue:locations';

let store: OfflineStorage | null = null;
let getIsOnline: () => boolean = () => true;

export function initOffline(storage: OfflineStorage, isOnline: () => boolean) {
  store = storage;
  getIsOnline = isOnline;
}

export function isOfflineMode(): boolean {
  return !getIsOnline();
}

export async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<{ data: T; fromCache: boolean }> {
  if (!store) {
    const data = await fetcher();
    return { data, fromCache: false };
  }

  if (getIsOnline()) {
    try {
      const data = await fetcher();
      await store.setItem(key, JSON.stringify({ data, ts: Date.now() }));
      return { data, fromCache: false };
    } catch (err) {
      const raw = await store.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: T };
        return { data: parsed.data, fromCache: true };
      }
      throw err;
    }
  }

  const raw = await store.getItem(key);
  if (raw) {
    const parsed = JSON.parse(raw) as { data: T };
    return { data: parsed.data, fromCache: true };
  }
  throw new Error('No network connection and no cached data available.');
}

export async function cacheOrdersList(items: Order[]) {
  if (!store) return;
  await store.setItem(ORDERS_LIST_KEY, JSON.stringify({ items, ts: Date.now() }));
}

export async function cacheOrder(order: Order) {
  if (!store) return;
  await store.setItem(`${ORDER_PREFIX}${order.id}`, JSON.stringify({ data: order, ts: Date.now() }));
}

export async function getCachedOrder(id: string): Promise<Order | null> {
  if (!store) return null;
  const raw = await store.getItem(`${ORDER_PREFIX}${id}`);
  if (!raw) return null;
  return (JSON.parse(raw) as { data: Order }).data;
}

async function readLocationQueue(): Promise<LocationPing[]> {
  if (!store) return [];
  const raw = await store.getItem(LOCATION_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocationPing[];
  } catch {
    return [];
  }
}

async function writeLocationQueue(queue: LocationPing[]) {
  if (!store) return;
  if (queue.length === 0) {
    await store.removeItem(LOCATION_QUEUE_KEY);
    return;
  }
  await store.setItem(LOCATION_QUEUE_KEY, JSON.stringify(queue.slice(-200)));
}

export async function enqueueLocationPing(ping: Omit<LocationPing, 'ts'> & { ts?: number }) {
  const queue = await readLocationQueue();
  queue.push({ ...ping, ts: ping.ts ?? Date.now() });
  await writeLocationQueue(queue);
}

export async function flushLocationQueue(
  send: (ping: Omit<LocationPing, 'ts'>) => Promise<void>,
): Promise<number> {
  if (!getIsOnline()) return 0;
  const queue = await readLocationQueue();
  if (queue.length === 0) return 0;

  const remaining: LocationPing[] = [];
  let sent = 0;
  for (const ping of queue) {
    try {
      const { ts: _ts, ...body } = ping;
      await send(body);
      sent++;
    } catch {
      remaining.push(ping);
    }
  }
  await writeLocationQueue(remaining);
  return sent;
}

export async function postLocationWithQueue(
  body: Omit<LocationPing, 'ts'>,
  send: (ping: Omit<LocationPing, 'ts'>) => Promise<void>,
): Promise<'sent' | 'queued'> {
  if (getIsOnline()) {
    try {
      await send(body);
      await flushLocationQueue(send);
      return 'sent';
    } catch {
      await enqueueLocationPing(body);
      return 'queued';
    }
  }
  await enqueueLocationPing(body);
  return 'queued';
}
