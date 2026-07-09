'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation, Truck } from 'lucide-react';
import { getLiveTrucks } from '@/lib/manifests';
import { listBranches } from '@/lib/admin-platform';
import { Map } from '@/components/map';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function AdminControlTower() {
  const trucksQ = useQuery({
    queryKey: ['live-trucks'],
    queryFn: getLiveTrucks,
    refetchInterval: 30_000,
  });
  const branchesQ = useQuery({
    queryKey: ['admin-branches-map'],
    queryFn: () => listBranches(true),
  });

  const trucks = trucksQ.data ?? [];
  const branches = branchesQ.data ?? [];

  const markers = useMemo(() => {
    const truckMarkers = trucks
      .filter((t) => t.driver?.currentLat != null && t.driver?.currentLng != null)
      .map((t) => ({
        lat: t.driver!.currentLat!,
        lng: t.driver!.currentLng!,
        label: `${t.manifestNumber} (${t.driver!.driverCode})`,
        color: '#22c55e',
      }));
    const branchMarkers = branches
      .filter((b) => b.isActive && b.latitude != null && b.longitude != null)
      .map((b) => ({
        lat: b.latitude!,
        lng: b.longitude!,
        label: b.name,
        color: '#2563eb',
      }));
    const warehouseMarkers = trucks
      .flatMap((t) => [t.origin, t.destination])
      .filter((w): w is NonNullable<typeof w> => !!w && w.latitude != null && w.longitude != null)
      .map((w) => ({
        lat: w.latitude!,
        lng: w.longitude!,
        label: w.name,
        color: '#f97316',
      }));
    return [...truckMarkers, ...branchMarkers, ...warehouseMarkers];
  }, [trucks, branches]);

  const isLoading = trucksQ.isLoading || branchesQ.isLoading;

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Network control tower"
        icon={Navigation}
        title="Live map"
        description="Trucks in transit, branch pickup points, and warehouse endpoints on one map."
        stats={[
          { label: 'Trucks', value: String(trucks.length) },
          { label: 'Markers', value: String(markers.length) },
          { label: 'Refresh', value: '30s' },
        ]}
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[420px] w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : markers.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6">
                <EmptyPanel title="No map pins" description="GPS pings and branch coordinates will appear here." icon={Truck} />
              </div>
            ) : (
              <Map markers={markers} className="h-full min-h-[420px] rounded-lg" />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-[#22c55e]" /> Trucks</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-[#2563eb]" /> Branches</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-[#f97316]" /> Warehouses</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {trucks.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-mono font-semibold text-white">{t.manifestNumber}</p>
                <p className="text-sm text-muted-foreground">{t.origin?.city} → {t.destination?.city}</p>
              </div>
              <Badge>{t.parcelCount} pkgs</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
