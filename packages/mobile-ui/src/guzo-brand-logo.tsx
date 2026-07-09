import { Image, type ImageSourcePropType, StyleSheet, View, type ViewStyle } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  width?: number;
  height?: number;
  style?: ViewStyle;
};

export function GuzoBrandLogo({ source, width = 220, height = 146, style }: Props) {
  return (
    <View style={[styles.wrap, { width, height }, style]}>
      <Image
        source={source}
        style={styles.image}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="GUZO"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  image: { width: '100%', height: '100%' },
});
