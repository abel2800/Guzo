import { useEffect, useState } from 'react';
import type { MapAddress } from './map-types';
import { fetchRoute, geocodeAddress } from './maps';

async function resolvePoint(address: MapAddress): Promise<{ latitude: number; longitude: number } | null> {
  if (address.latitude != null && address.longitude != null) {
    return { latitude: address.latitude, longitude: address.longitude };
  }
  if (!address.line1?.trim() || !address.city?.trim()) return null;
  const hit = await geocodeAddress(address.line1, address.city);
  return hit ? { latitude: hit.lat, longitude: hit.lng } : null;
}

export function useTrackingMapData(
  pickup: MapAddress,
  dropoff: MapAddress,
  driverLocation?: { latitude: number; longitude: number } | null,
) {
  const [pickupPt, setPickupPt] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropPt, setDropPt] = useState<{ latitude: number; longitude: number } | null>(null);
  const [route, setRoute] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeMeta, setRouteMeta] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    resolvePoint(pickup).then((pt) => {
      if (!cancelled) setPickupPt(pt);
    });
    return () => {
      cancelled = true;
    };
  }, [pickup.line1, pickup.city, pickup.latitude, pickup.longitude]);

  useEffect(() => {
    let cancelled = false;
    resolvePoint(dropoff).then((pt) => {
      if (!cancelled) setDropPt(pt);
    });
    return () => {
      cancelled = true;
    };
  }, [dropoff.line1, dropoff.city, dropoff.latitude, dropoff.longitude]);

  useEffect(() => {
    if (!pickupPt || !dropPt) return;
    let cancelled = false;
    setLoading(true);
    const via = driverLocation ? [{ lat: driverLocation.latitude, lng: driverLocation.longitude }] : [];
    fetchRoute(
      { lat: pickupPt.latitude, lng: pickupPt.longitude },
      { lat: dropPt.latitude, lng: dropPt.longitude },
      via,
    )
      .then((result) => {
        if (cancelled) return;
        setRoute(result.coordinates.map(([lat, lng]) => ({ latitude: lat, longitude: lng })));
        setRouteMeta({ distanceKm: result.distanceKm, durationMin: result.durationMin });
      })
      .catch(() => {
        if (!cancelled) {
          setRoute([pickupPt, ...(driverLocation ? [driverLocation] : []), dropPt]);
          setRouteMeta(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pickupPt, dropPt, driverLocation?.latitude, driverLocation?.longitude]);

  return {
    loading,
    pickup: { ...pickup, latitude: pickupPt?.latitude ?? pickup.latitude, longitude: pickupPt?.longitude ?? pickup.longitude },
    dropoff: { ...dropoff, latitude: dropPt?.latitude ?? dropoff.latitude, longitude: dropPt?.longitude ?? dropoff.longitude },
    routeCoordinates: route,
    routeMeta,
  };
}
