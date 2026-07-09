'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, CheckCircle2, Truck, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackShipment, type TrackOrder } from '@/lib/java-api';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_PAYMENT: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Driver assigned',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  AT_WAREHOUSE: 'At warehouse',
  AT_BRANCH: 'At branch',
  AT_DESTINATION_BRANCH: 'At destination branch',
  READY_FOR_PICKUP: 'Ready for pickup',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
  FAILED: 'Delivery attempted',
};

function formatStatus(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ').toLowerCase();
}

export function TrackingDemo() {
  const [ref, setRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackOrder | null>(null);

  async function onTrack(e?: React.FormEvent) {
    e?.preventDefault();
    if (!ref.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await trackShipment(ref);
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Shipment not found');
    } finally {
      setLoading(false);
    }
  }

  const pkg = order?.packages?.[0];
  const events = order?.trackingEvents ?? [];
  const driverName = order?.delivery?.driver?.user
    ? `${order.delivery.driver.user.firstName ?? ''} ${order.delivery.driver.user.lastName ?? ''}`.trim()
    : null;
  const route =
    order?.pickupAddress?.city && order?.dropoffAddress?.city
      ? `${order.pickupAddress.city} → ${order.dropoffAddress.city}`
      : 'Route details';

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-guzo-card/50 p-6 backdrop-blur">
        <form onSubmit={onTrack}>
          <label className="text-sm text-guzo-muted">Tracking or order reference</label>
          <div className="mt-2 flex gap-2">
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="TRK-… or ORD-…"
              className="flex-1 rounded-xl border border-white/15 bg-guzo-bg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-guzo-primary/50"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="relative mt-6 h-64 overflow-hidden rounded-2xl bg-guzo-bg">
          <svg viewBox="0 0 400 200" className="h-full w-full">
            <path d="M40,160 Q120,80 200,100 T360,40" fill="none" stroke="#22C55E" strokeWidth="3" opacity="0.5" />
            <motion.circle
              r="10"
              fill="#22C55E"
              animate={{ cx: [40, 120, 200, 280, 360], cy: [160, 100, 100, 70, 40] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <circle cx="40" cy="160" r="6" fill="#fff" opacity="0.5" />
            <circle cx="360" cy="40" r="6" fill="#10B981" />
          </svg>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-guzo-bg/90 px-3 py-1 text-xs">
            <Truck className="h-3 w-3 text-guzo-primary" />
            {order ? formatStatus(order.status) : 'Enter a reference to track'}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-guzo-card/50 p-5">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-guzo-primary" />
            <div>
              <p className="font-semibold text-white">
                {pkg?.trackingNumber ?? order?.orderNumber ?? 'No shipment loaded'}
              </p>
              <p className="text-sm text-guzo-muted">
                {order ? `${formatStatus(order.status)} · ${route}` : 'Live tracking from PostgreSQL'}
              </p>
              {driverName && <p className="text-xs text-guzo-primary mt-1">Driver {driverName}</p>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-guzo-card/50 p-5">
          <p className="mb-4 text-sm font-semibold text-white">Shipment timeline</p>
          <div className="space-y-4">
            {(events.length ? events : [{ id: '0', type: 'INFO', status: '—', description: 'Track a parcel to see events', createdAt: '' }]).map(
              (s, idx) => {
                const active = order && idx === events.length - 1;
                const done = order ? idx < events.length - 1 || order.status === 'DELIVERED' : false;
                return (
                  <div key={s.id} className="flex gap-3">
                    <div
                      className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                        done || active ? 'bg-guzo-primary/20 text-guzo-primary' : 'bg-white/5 text-guzo-muted'
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <MapPin className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className={`text-sm ${active ? 'font-semibold text-guzo-primary' : 'text-white'}`}>
                        {s.description ?? formatStatus(s.status)}
                      </p>
                      <p className="text-xs text-guzo-muted">
                        {s.createdAt ? new Date(s.createdAt).toLocaleString() : s.status}
                      </p>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
