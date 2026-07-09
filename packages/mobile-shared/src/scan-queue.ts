import type { OfflineStorage } from './offline';

export interface ScanAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  ts: number;
}

const SCAN_QUEUE_KEY = 'guzo:queue:scans';

let store: OfflineStorage | null = null;
let getIsOnline: () => boolean = () => true;

export function initScanQueue(storage: OfflineStorage, isOnline: () => boolean) {
  store = storage;
  getIsOnline = isOnline;
}

async function readQueue(): Promise<ScanAction[]> {
  if (!store) return [];
  const raw = await store.getItem(SCAN_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ScanAction[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: ScanAction[]) {
  if (!store) return;
  if (queue.length === 0) {
    await store.removeItem(SCAN_QUEUE_KEY);
    return;
  }
  await store.setItem(SCAN_QUEUE_KEY, JSON.stringify(queue.slice(-100)));
}

export async function enqueueScanAction(type: string, payload: Record<string, unknown>) {
  const queue = await readQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    ts: Date.now(),
  });
  await writeQueue(queue);
}

export async function flushScanQueue(
  handler: (action: ScanAction) => Promise<void>,
): Promise<number> {
  if (!getIsOnline()) return 0;
  const queue = await readQueue();
  if (queue.length === 0) return 0;

  const remaining: ScanAction[] = [];
  let sent = 0;
  for (const action of queue) {
    try {
      await handler(action);
      sent++;
    } catch {
      remaining.push(action);
    }
  }
  await writeQueue(remaining);
  return sent;
}

export async function getScanQueueLength(): Promise<number> {
  return (await readQueue()).length;
}
