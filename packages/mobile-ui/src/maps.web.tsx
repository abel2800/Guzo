import { useMemo } from 'react';
import { View, Text, StyleSheet, Image, type ViewStyle } from 'react-native';
import { ADDIS_ABABA } from './geo';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapViewProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
}

interface MarkerProps {
  coordinate: Coordinate;
  title?: string;
  pinColor?: string;
}

interface PolylineProps {
  coordinates?: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
}

let markerRegistry: MarkerProps[] = [];
let polylineRegistry: Coordinate[] = [];

export default function MapView({ style, initialRegion }: MapViewProps) {
  markerRegistry = [];
  polylineRegistry = [];

  const center = initialRegion ?? { latitude: ADDIS_ABABA.latitude, longitude: ADDIS_ABABA.longitude };
  const staticUrl = useMemo(() => {
    const lat = center.latitude.toFixed(5);
    const lng = center.longitude.toFixed(5);
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=13&size=640x360&mapnik`;
  }, [center.latitude, center.longitude]);

  return (
    <View style={[styles.wrap, style]}>
      <Image source={{ uri: staticUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.overlay}>
        <Text style={styles.hint}>OpenStreetMap preview (use native app for full live map)</Text>
      </View>
    </View>
  );
}

export function Marker({ coordinate, title, pinColor = '#22C55E' }: MarkerProps) {
  markerRegistry.push({ coordinate, title, pinColor });
  return null;
}

export function Polyline({ coordinates = [] }: PolylineProps) {
  polylineRegistry = coordinates;
  return null;
}

export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    minHeight: 160,
  },
  overlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(5,8,22,0.8)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hint: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },
});
