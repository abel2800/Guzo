'use client';

import { useQuery } from '@tanstack/react-query';
import { Truck, MapPin, Navigation } from 'lucide-react';
import { getLiveTrucks } from '@/lib/manifests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function OpsTruckMap() {
  const { data, isLoading } = useQuery({
    queryKey: ['live-trucks'],
    queryFn: getLiveTrucks,
    refetchInterval: 30_000,
  });

  const trucks = data ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Operations"
        icon={Truck}
        title="Live trucks"
        description="Manifests currently in transit with last known driver GPS pings."
        stats={[
          { label: 'In transit', value: String(trucks.length) },
          { label: 'Refresh', value: '30s' },
          { label: 'Map', value: 'Coords' },
        ]}
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : trucks.length === 0 ? (
        <EmptyPanel title="No trucks in transit" description="Departed manifests will appear here with driver location." icon={Truck} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {trucks.map((t) => {
            const lat = t.driver?.currentLat;
            const lng = t.driver?.currentLng;
            const mapsUrl = lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null;
            return (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {t.manifestNumber}
                    </span>
                    <Badge>{t.parcelCount} parcels</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {t.origin?.city ?? 'Origin'} → {t.destination?.city ?? 'Destination'}
                  </p>
                  {t.driver && (
                    <p>Driver: <span className="font-mono">{t.driver.driverCode}</span></p>
                  )}
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      {lat?.toFixed(4)}, {lng?.toFixed(4)}
                    </a>
                  ) : (
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> No GPS ping yet
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
