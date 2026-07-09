import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { ADDIS_ABABA, resolveMapPoint, type AddressLike } from './geo';

export interface LiveTrackingMapProps {
  pickup: AddressLike;
  dropoff: AddressLike;
  driverLocation?: { latitude: number; longitude: number } | null;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  routeMeta?: { distanceKm: number; durationMin: number } | null;
  height?: number;
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#050816' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
];

function toRegion(points: Array<{ latitude: number; longitude: number }>): Region {
  const lats = points.map((c) => c.latitude);
  const lngs = points.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.012;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat + pad, 0.04),
    longitudeDelta: Math.max(maxLng - minLng + pad, 0.04),
  };
}

export function LiveTrackingMap({
  pickup,
  dropoff,
  driverLocation,
  routeCoordinates,
  routeMeta,
  height = 220,
}: LiveTrackingMapProps) {
  const mapRef = useRef<MapView>(null);

  const pickupPt = useMemo(() => resolveMapPoint(pickup, `p-${pickup.line1}`), [pickup]);
  const dropPt = useMemo(() => resolveMapPoint(dropoff, `d-${dropoff.line1}`), [dropoff]);

  const markerPoints = useMemo(() => {
    const pts = [pickupPt, dropPt];
    if (driverLocation) pts.push({ ...driverLocation, title: 'Driver' });
    return pts;
  }, [pickupPt, dropPt, driverLocation]);

  const region = useMemo(() => {
    const fitPts = routeCoordinates?.length ? routeCoordinates : markerPoints;
    return toRegion(fitPts);
  }, [markerPoints, routeCoordinates]);

  const routeLine = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length > 1) return routeCoordinates;
    return [
      { latitude: pickupPt.latitude, longitude: pickupPt.longitude },
      ...(driverLocation ? [driverLocation] : []),
      { latitude: dropPt.latitude, longitude: dropPt.longitude },
    ];
  }, [routeCoordinates, pickupPt, dropPt, driverLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    const fitPts = routeCoordinates?.length ? routeCoordinates : markerPoints;
    if (fitPts.length < 2) return;
    mapRef.current.fitToCoordinates(fitPts, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [routeCoordinates, markerPoints]);

  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;
    mapRef.current.animateToRegion(
      {
        ...region,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      },
      600,
    );
  }, [driverLocation?.latitude, driverLocation?.longitude, region]);

  const hasRealCoords =
    pickup.latitude != null &&
    pickup.longitude != null &&
    dropoff.latitude != null &&
    dropoff.longitude != null;

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
        userInterfaceStyle="dark"
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        <Marker coordinate={pickupPt} title="Pickup" pinColor="#22C55E" />
        <Marker coordinate={dropPt} title="Drop-off" pinColor="#EA580C" />
        {driverLocation && <Marker coordinate={driverLocation} title="Driver" pinColor="#3B82F6" />}
        <Polyline coordinates={routeLine} strokeColor="#22C55E" strokeWidth={4} />
      </MapView>

      {!hasRealCoords && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Resolving addresses on map…</Text>
        </View>
      )}
      {hasRealCoords && !driverLocation && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Waiting for driver GPS…</Text>
        </View>
      )}
      {routeMeta && (
        <View style={styles.metaBanner}>
          <Text style={styles.metaText}>
            {routeMeta.distanceKm.toFixed(1)} km · ~{routeMeta.durationMin} min
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    backgroundColor: '#0F172A',
  },
  banner: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(5,8,22,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bannerText: { color: '#CBD5E1', fontSize: 11 },
  metaBanner: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(5,8,22,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  metaText: { color: '#22C55E', fontSize: 11, fontWeight: '600' },
});
