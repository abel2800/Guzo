import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { parseTrackingCode } from '@guzo/mobile-shared';
import { colors, radius } from './design';

export type TrackingScannerProps = {
  value: string;
  onChange: (v: string) => void;
  onScanned?: (code: string) => void;
  placeholder?: string;
};

export function TrackingScanner({
  value,
  onChange,
  onScanned,
  placeholder = 'TRK-…',
}: TrackingScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [scanned, setScanned] = useState(false);

  const handleCode = useCallback(
    (raw: string) => {
      const code = parseTrackingCode(raw);
      onChange(code);
      onScanned?.(code);
      setScanned(true);
    },
    [onChange, onScanned],
  );

  return (
    <View>
      <View style={styles.toggleRow}>
        <Pressable onPress={() => setMode('scan')} style={[styles.toggle, mode === 'scan' && styles.toggleActive]}>
          <Ionicons name="barcode-outline" size={16} color={mode === 'scan' ? colors.primary : colors.textMuted} />
          <Text style={[styles.toggleText, mode === 'scan' && styles.toggleTextActive]}>Scan</Text>
        </Pressable>
        <Pressable onPress={() => setMode('manual')} style={[styles.toggle, mode === 'manual' && styles.toggleActive]}>
          <Ionicons name="keypad-outline" size={16} color={mode === 'manual' ? colors.primary : colors.textMuted} />
          <Text style={[styles.toggleText, mode === 'manual' && styles.toggleTextActive]}>Manual</Text>
        </Pressable>
      </View>

      {mode === 'scan' ? (
        !permission?.granted ? (
          <Pressable style={styles.permBox} onPress={requestPermission}>
            <Text style={styles.permText}>Tap to allow camera for barcode scan</Text>
          </Pressable>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
              onBarcodeScanned={({ data }) => {
                if (scanned) return;
                handleCode(data);
              }}
            />
          </View>
        )
      ) : (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(t) => {
            setScanned(false);
            onChange(t);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          autoCapitalize="characters"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.1)' },
  toggleText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  toggleTextActive: { color: colors.primary },
  permBox: {
    height: 160,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  permText: { color: colors.textMuted, textAlign: 'center' },
  cameraWrap: {
    height: 160,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  camera: { flex: 1 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
  },
});
