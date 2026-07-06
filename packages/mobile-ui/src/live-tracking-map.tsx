import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { ADDIS_ABABA, resolveMapPoint, type AddressLike } from './geo';

export interface LiveTrackingMapProps {
  pickup: AddressLike;
  dropoff: AddressLike;
  driverLocation?: { latitude: number; longitude: number } | null;
  height?: number;
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#050816' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
];

export function LiveTrackingMap({ pickup, dropoff, driverLocation, height = 220 }: LiveTrackingMapProps) {
  const mapRef = useRef<MapView>(null);

  const pickupPt = useMemo(() => resolveMapPoint(pickup, `p-${pickup.line1}`), [pickup]);
  const dropPt = useMemo(() => resolveMapPoint(dropoff, `d-${dropoff.line1}`), [dropoff]);

  const coords = useMemo(() => {
    const pts = [pickupPt, dropPt];
    if (driverLocation) pts.push({ ...driverLocation, title: 'Driver' });
    return pts;
  }, [pickupPt, dropPt, driverLocation]);

  const region = useMemo((): Region => {
    const lats = coords.map((c) => c.latitude);
    const lngs = coords.map((c) => c.longitude);
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
  }, [coords]);

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

  const routeLine = [
    { latitude: pickupPt.latitude, longitude: pickupPt.longitude },
    ...(driverLocation ? [driverLocation] : []),
    { latitude: dropPt.latitude, longitude: dropPt.longitude },
  ];

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
        <Marker coordinate={dropPt} title="Drop-off" pinColor="#10B981" />
        {driverLocation && (
          <Marker coordinate={driverLocation} title="Driver" pinColor="#fbbf24" />
        )}
        <Polyline coordinates={routeLine} strokeColor="#22C55E" strokeWidth={3} lineDashPattern={[6, 4]} />
      </MapView>
      {!driverLocation && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Waiting for driver GPS…</Text>
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
});
