'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation, MapPin, Phone, ExternalLink } from 'lucide-react';
import { listMyDeliveries } from '@/lib/ops';
import { getDriverRoute } from '@/lib/driver-ops';
import { LeafletMap, type MapMarker } from '@/components/map';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';
import { ORDER_STATUS_META } from '@/lib/orders';

function mapsUrl(lat?: number | null, lng?: number | null, label?: string) {
  if (lat != null && lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  if (label) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
  return null;
}

export function DriverNavigation() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-navigation'],
    queryFn: () => listMyDeliveries({ limit: 30 }),
    refetchInterval: 20_000,
  });

  const { data: route } = useQuery({
    queryKey: ['driver-route'],
    queryFn: getDriverRoute,
    refetchInterval: 30_000,
  });

  const active = (data?.items ?? []).filter(
    (o) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status),
  );
  const selected = active.find((o) => o.id === selectedId) ?? active[0] ?? null;

  const markers: MapMarker[] = useMemo(() => {
    if (!selected) return [];
    const list: MapMarker[] = [];
    const p = selected.pickupAddress;
    const d = selected.dropoffAddress;
    if (p?.latitude != null && p?.longitude != null) {
      list.push({ lat: p.latitude, lng: p.longitude, label: 'Pickup', color: '#22c55e' });
    }
    if (d?.latitude != null && d?.longitude != null) {
      list.push({ lat: d.latitude, lng: d.longitude, label: 'Drop-off', color: '#f97316' });
    }
    return list;
  }, [selected]);

  const route: Array<[number, number]> = useMemo(
    () => markers.map((m) => [m.lat, m.lng] as [number, number]),
    [markers],
  );

  const pickupUrl = selected
    ? mapsUrl(selected.pickupAddress?.latitude, selected.pickupAddress?.longitude, `${selected.pickupAddress?.line1}, ${selected.pickupAddress?.city}`)
    : null;
  const dropUrl = selected
    ? mapsUrl(selected.dropoffAddress?.latitude, selected.dropoffAddress?.longitude, `${selected.dropoffAddress?.line1}, ${selected.dropoffAddress?.city}`)
    : null;

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Turn-by-turn"
        icon={Navigation}
        title="Navigation"
        description="Active delivery routes with pickup and drop-off pins. Open in Google Maps for directions."
        stats={[
          { label: 'Active', value: String(active.length) },
          { label: 'Route stops', value: String(route?.totalStops ?? 0) },
          { label: 'Est. km', value: route?.estimatedKm != null ? String(route.estimatedKm) : '—' },
        ]}
      />

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : active.length === 0 ? (
        <EmptyPanel icon={Navigation} title="No routes to navigate" description="Accept a delivery from Available jobs first." />
      ) : (
        <>
          {route && route.stops.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Optimized stop order (P3-10)</p>
                <ol className="space-y-1 text-sm">
                  {route.stops.map((s, i) => (
                    <li key={`${s.orderId}-${s.type}`} className="text-slate-300">
                      {i + 1}. {s.type === 'pickup' ? 'Pickup' : 'Drop'} · {s.orderNumber} · {s.city}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            {active.map((o) => {
              const m = ORDER_STATUS_META[o.status] ?? { label: o.status, variant: 'secondary' as const };
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${selected?.id === o.id ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">{o.orderNumber}</span>
                    <Badge variant={m.variant}>{m.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{o.pickupAddress?.city} → {o.dropoffAddress?.city}</p>
                </button>
              );
            })}
          </div>

          <Card className="lg:col-span-3">
            <CardContent className="space-y-4 p-4">
              {selected && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {pickupUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={pickupUrl} target="_blank" rel="noopener noreferrer">
                          <MapPin className="h-4 w-4" /> Navigate pickup <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {dropUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={dropUrl} target="_blank" rel="noopener noreferrer">
                          <MapPin className="h-4 w-4" /> Navigate drop-off <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {selected.pickupAddress?.contactPhone && (
                      <Button asChild size="sm" variant="ghost">
                        <a href={`tel:${selected.pickupAddress.contactPhone}`}>
                          <Phone className="h-4 w-4" /> Call pickup
                        </a>
                      </Button>
                    )}
                    {selected.dropoffAddress?.contactPhone && (
                      <Button asChild size="sm" variant="ghost">
                        <a href={`tel:${selected.dropoffAddress.contactPhone}`}>
                          <Phone className="h-4 w-4" /> Call recipient
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="h-72 overflow-hidden rounded-lg border border-white/10">
                    {markers.length > 0 ? (
                      <LeafletMap markers={markers} route={route.length > 1 ? route : undefined} className="h-full w-full" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        No coordinates — use external maps links above
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        </>
      )}
    </div>
  );
}
