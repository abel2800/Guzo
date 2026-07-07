import { View, Text, StyleSheet } from 'react-native';

export default function MapView({ style, children }: { style?: object; children?: React.ReactNode }) {
  return (
    <View style={[styles.stub, style]}>
      <Text style={styles.text}>Map preview (native only)</Text>
      {children}
    </View>
  );
}

export function Marker() {
  return null;
}

export function Polyline() {
  return null;
}

export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  stub: { backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  text: { color: '#94a3b8', fontSize: 12 },
});
