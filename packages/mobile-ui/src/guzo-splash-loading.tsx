import { ActivityIndicator, Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

type Props = {
  splashSource: ImageSourcePropType;
};

export function GuzoSplashLoading({ splashSource }: Props) {
  return (
    <View style={styles.root}>
      <Image source={splashSource} style={styles.splash} resizeMode="cover" accessibilityLabel="GUZO" />
      <ActivityIndicator color="#22C55E" size="large" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splash: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  spinner: {
    position: 'absolute',
    bottom: 72,
  },
});
