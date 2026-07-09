import type { Order } from './orders';

export type ParcelBucketKey =
  | 'draft'
  | 'waiting'
  | 'pickedUp'
  | 'atBranch'
  | 'inTransit'
  | 'atWarehouse'
  | 'atDestinationBranch'
  | 'readyForPickup'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export const PARCEL_BUCKETS: { key: ParcelBucketKey; label: string; statuses: string[] }[] = [
  { key: 'draft', label: 'Draft', statuses: ['PENDING_PAYMENT'] },
  { key: 'waiting', label: 'Waiting for pickup', statuses: ['CONFIRMED', 'ASSIGNED'] },
  { key: 'pickedUp', label: 'Picked up', statuses: ['PICKED_UP'] },
  { key: 'atBranch', label: 'At branch', statuses: ['AT_BRANCH'] },
  { key: 'inTransit', label: 'In transit', statuses: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
  { key: 'atWarehouse', label: 'At warehouse', statuses: ['AT_WAREHOUSE'] },
  { key: 'atDestinationBranch', label: 'At destination branch', statuses: ['AT_DESTINATION_BRANCH'] },
  { key: 'readyForPickup', label: 'Ready for pickup', statuses: ['READY_FOR_PICKUP'] },
  { key: 'delivered', label: 'Collected', statuses: ['DELIVERED'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED', 'FAILED'] },
  { key: 'returned', label: 'Returned', statuses: ['RETURNED'] },
];

export function groupOrdersByBucket(orders: Order[]): Record<ParcelBucketKey, Order[]> {
  const groups = Object.fromEntries(PARCEL_BUCKETS.map((b) => [b.key, [] as Order[]])) as Record<
    ParcelBucketKey,
    Order[]
  >;
  for (const order of orders) {
    const bucket = PARCEL_BUCKETS.find((b) => b.statuses.includes(order.status));
    if (bucket) groups[bucket.key].push(order);
  }
  return groups;
}
