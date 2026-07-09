import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Platform, StyleSheet, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  acceptOrder,
  getOrder,
  updateOrderStatus,
  submitPod,
  postDriverLocation,
  postLocationWithQueue,
  useTrackingMapData,
  DRIVER_NEXT_STATUS,
  DRIVER_ALT_STATUS,
  ORDER_STATUS_LABELS,
  listBranches,
  submitPickupProof,
  handoffAtBranch,
  markDeliveryFailed,
  reattemptDelivery,
  type OrderStatus,
} from '@guzo/mobile-shared';
import { TrackingScanner } from '@/components/tracking-scanner';
import { LiveTrackingMap, OfflineBanner, GlassCard, GradientButton, colors, designStyles, radius, SignatureCapture, strokesToSignatureUpload } from '@guzo/mobile-ui';

export default function DeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [queuedPings, setQueuedPings] = useState(0);
  const [scannedTracking, setScannedTracking] = useState('');
  const [showHandoff, setShowHandoff] = useState(false);
  const [branchId, setBranchId] = useState('');
  const [failedNote, setFailedNote] = useState('');
  const [showFailed, setShowFailed] = useState(false);
  const [showPickupSig, setShowPickupSig] = useState(false);
  const [showPodSig, setShowPodSig] = useState(false);
  const [pickupStrokes, setPickupStrokes] = useState<Array<Array<{ x: number; y: number }>>>([]);
  const [podStrokes, setPodStrokes] = useState<Array<Array<{ x: number; y: number }>>>([]);

  const { data: order, refetch } = useQuery({
    queryKey: ['delivery', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
    refetchInterval: 10_000,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => listBranches(),
    enabled: showHandoff,
  });

  useEffect(() => {
    if (!order || order.status === 'DELIVERED') return;
    let timer: ReturnType<typeof setInterval>;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const ping = async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setMyLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          const result = await postLocationWithQueue(
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              orderId: order.id,
              speed: loc.coords.speed ?? undefined,
              heading: loc.coords.heading ?? undefined,
            },
            postDriverLocation,
          );
          if (result === 'queued') setQueuedPings((n) => n + 1);
        } catch {}
      };
      await ping();
      timer = setInterval(ping, 15_000);
    })();
    return () => clearInterval(timer);
  }, [order?.id, order?.status]);

  const acceptMut = useMutation({
    mutationFn: () => acceptOrder(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery', id] }); refetch(); },
    onError: (e: Error) => setError(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id!, status),
    onSuccess: () => refetch(),
    onError: (e: Error) => setError(e.message),
  });

  const pickupProofMut = useMutation({
    mutationFn: async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) throw new Error('Camera permission required');
      const photo = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (photo.canceled) throw new Error('Pickup photo required');
      const asset = photo.assets[0];
      const signature = strokesToSignatureUpload(pickupStrokes);
      const loc = await Location.getCurrentPositionAsync({});
      return submitPickupProof(id!, {
        photo: { uri: asset.uri, name: 'pickup.jpg', type: 'image/jpeg' },
        signature,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    },
    onSuccess: () => {
      setShowPickupSig(false);
      setPickupStrokes([]);
      refetch();
    },
    onError: (e: Error) => setError(e.message),
  });

  const handoffMut = useMutation({
    mutationFn: () => handoffAtBranch(id!, { branchId, trackingNumber: scannedTracking }),
    onSuccess: () => { setShowHandoff(false); refetch(); },
    onError: (e: Error) => setError(e.message),
  });

  const failedMut = useMutation({
    mutationFn: () => markDeliveryFailed(id!, failedNote || undefined),
    onSuccess: () => { setShowFailed(false); refetch(); },
    onError: (e: Error) => setError(e.message),
  });

  const reattemptMut = useMutation({
    mutationFn: () => reattemptDelivery(id!),
    onSuccess: () => refetch(),
    onError: (e: Error) => setError(e.message),
  });

  const podMut = useMutation({
    mutationFn: async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) throw new Error('Camera permission required');
      const photo = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (photo.canceled) throw new Error('Photo required');
      const asset = photo.assets[0];
      const signature = strokesToSignatureUpload(podStrokes);
      const loc = await Location.getCurrentPositionAsync({});
      return submitPod(id!, {
        photo: { uri: asset.uri, name: 'pod.jpg', type: 'image/jpeg' },
        signature,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    },
    onSuccess: () => {
      setShowPodSig(false);
      setPodStrokes([]);
      refetch();
    },
    onError: (e: Error) => setError(e.message),
  });

  const mapData = useTrackingMapData(
    order?.pickupAddress ?? { line1: '', city: '' },
    order?.dropoffAddress ?? { line1: '', city: '' },
    myLocation,
  );

  if (!order) {
    return (
      <View style={[designStyles.screen, designStyles.screenPad, { paddingTop: insets.top }]}>
        <Text style={{ color: colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const next = DRIVER_NEXT_STATUS[order.status];
  const altActions = DRIVER_ALT_STATUS[order.status] ?? [];
  const isAvailable = order.status === 'CONFIRMED';
  const expectedTracking = order.packages[0]?.trackingNumber ?? '';
  const trackingOk = !expectedTracking || scannedTracking === expectedTracking || scannedTracking === '';

  function openMaps(address: { line1: string; city: string; latitude?: number | null; longitude?: number | null }) {
    const q = address.latitude && address.longitude
      ? `${address.latitude},${address.longitude}`
      : encodeURIComponent(`${address.line1}, ${address.city}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${q}`,
      android: `geo:0,0?q=${q}`,
      default: `https://maps.google.com/?q=${q}`,
    });
    if (url) Linking.openURL(url);
  }

  function callPhone(phone?: string | null) {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  }

  return (
    <ScrollView style={designStyles.screen} contentContainerStyle={[designStyles.screenPad, { paddingTop: insets.top, paddingBottom: 40 }]}>
      <OfflineBanner />
      {queuedPings > 0 && (
        <View style={styles.queueBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
          <Text style={styles.queueText}>
            {queuedPings} GPS ping{queuedPings > 1 ? 's' : ''} queued — will sync when online
          </Text>
        </View>
      )}

      <View style={styles.statusRow}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{ORDER_STATUS_LABELS[order.status]}</Text>
        </View>
        <Text style={styles.ref}>{order.orderNumber}</Text>
      </View>

      {order.status !== 'DELIVERED' && order.status !== 'FAILED' && (
        <GlassCard glow style={{ marginBottom: 16 }}>
          <Text style={styles.sectionLabel}>Route map</Text>
          <LiveTrackingMap
            pickup={mapData.pickup}
            dropoff={mapData.dropoff}
            driverLocation={myLocation}
            routeCoordinates={mapData.routeCoordinates}
            routeMeta={mapData.routeMeta}
            height={220}
          />
        </GlassCard>
      )}

      {['ASSIGNED', 'PICKED_UP'].includes(order.status) && (
        <GlassCard style={{ marginBottom: 12 }}>
          <Text style={styles.sectionLabel}>Scan parcel</Text>
          <Text style={styles.hint}>Expected: {expectedTracking || '—'}</Text>
          <TrackingScanner
            value={scannedTracking}
            onChange={setScannedTracking}
            onScanned={setScannedTracking}
          />
          {scannedTracking && !trackingOk ? (
            <Text style={styles.warn}>Tracking mismatch — verify parcel label</Text>
          ) : scannedTracking ? (
            <Text style={styles.ok}>Parcel verified</Text>
          ) : null}
        </GlassCard>
      )}

      <GlassCard style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.sectionLabel}>Pickup</Text>
        </View>
        <Text style={styles.addressText}>{order.pickupAddress.line1}, {order.pickupAddress.city}</Text>
        {order.pickupAddress.contactPhone && (
          <Pressable style={styles.callRow} onPress={() => callPhone(order.pickupAddress.contactPhone)}>
            <Ionicons name="call" size={16} color={colors.primary} />
            <Text style={styles.callText}>{order.pickupAddress.contactPhone}</Text>
          </Pressable>
        )}
        <Pressable style={styles.navBtn} onPress={() => openMaps(order.pickupAddress)}>
          <Ionicons name="navigate" size={16} color={colors.accent} />
          <Text style={styles.navText}>Navigate to pickup</Text>
        </Pressable>
      </GlassCard>

      <GlassCard style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <Ionicons name="flag" size={18} color={colors.accent} />
          <Text style={styles.sectionLabel}>Drop-off</Text>
        </View>
        <Text style={styles.addressText}>{order.dropoffAddress.line1}, {order.dropoffAddress.city}</Text>
        {order.dropoffAddress.contactPhone && (
          <Pressable style={styles.callRow} onPress={() => callPhone(order.dropoffAddress.contactPhone)}>
            <Ionicons name="call" size={16} color={colors.primary} />
            <Text style={styles.callText}>{order.dropoffAddress.contactPhone}</Text>
          </Pressable>
        )}
        <Pressable style={styles.navBtn} onPress={() => openMaps(order.dropoffAddress)}>
          <Ionicons name="navigate" size={16} color={colors.accent} />
          <Text style={styles.navText}>Navigate to drop-off</Text>
        </Pressable>
      </GlassCard>

      {order.scheduledPickupAt && (
        <GlassCard>
          <Text style={styles.sectionLabel}>Scheduled pickup</Text>
          <Text style={styles.addressText}>{new Date(order.scheduledPickupAt).toLocaleString()}</Text>
        </GlassCard>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {isAvailable && (
          <GradientButton
            label={acceptMut.isPending ? 'Accepting…' : 'Accept job'}
            onPress={() => acceptMut.mutate()}
            disabled={acceptMut.isPending}
            loading={acceptMut.isPending}
          />
        )}
        {order.status === 'ASSIGNED' && (
          <>
            <Pressable style={styles.podBtn} onPress={() => setShowPickupSig(true)}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={styles.podText}>Customer signature (optional)</Text>
            </Pressable>
            <Pressable style={styles.podBtn} onPress={() => pickupProofMut.mutate()} disabled={pickupProofMut.isPending}>
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={styles.podText}>{pickupProofMut.isPending ? 'Uploading…' : 'Capture pickup proof'}</Text>
            </Pressable>
          </>
        )}
        {next && (
          <GradientButton
            label={
              order.status === 'FAILED'
                ? (reattemptMut.isPending ? 'Starting…' : next.label)
                : (statusMut.isPending ? 'Updating…' : next.label)
            }
            onPress={() => (order.status === 'FAILED' ? reattemptMut.mutate() : statusMut.mutate(next.next))}
            disabled={statusMut.isPending || reattemptMut.isPending || !!(['ASSIGNED', 'PICKED_UP'].includes(order.status) && scannedTracking && !trackingOk)}
            loading={statusMut.isPending || reattemptMut.isPending}
          />
        )}
        {altActions.map((alt) => (
          alt.next === 'AT_BRANCH' ? (
            <Pressable key={alt.next} style={styles.altBtn} onPress={() => setShowHandoff(true)}>
              <Ionicons name="storefront-outline" size={18} color={colors.accent} />
              <Text style={styles.altText}>{alt.label}</Text>
            </Pressable>
          ) : alt.next === 'FAILED' ? (
            <Pressable key={alt.next} style={styles.altBtn} onPress={() => setShowFailed(true)}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
              <Text style={[styles.altText, { color: colors.warning }]}>{alt.label}</Text>
            </Pressable>
          ) : (
            <Pressable key={alt.next} style={styles.altBtn} onPress={() => statusMut.mutate(alt.next)}>
              <Ionicons name="arrow-forward-circle-outline" size={18} color={colors.accent} />
              <Text style={styles.altText}>{alt.label}</Text>
            </Pressable>
          )
        ))}
        {order.status === 'OUT_FOR_DELIVERY' && (
          <>
            <Pressable style={styles.podBtn} onPress={() => setShowPodSig(true)}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={styles.podText}>Recipient signature (optional)</Text>
            </Pressable>
            <Pressable style={styles.podBtn} onPress={() => podMut.mutate()} disabled={podMut.isPending}>
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={styles.podText}>{podMut.isPending ? 'Uploading…' : 'Capture proof of delivery'}</Text>
            </Pressable>
          </>
        )}
      </View>

      <Modal visible={showHandoff} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Drop at branch</Text>
            <Text style={styles.hint}>Scan parcel and select branch</Text>
            <TrackingScanner value={scannedTracking} onChange={setScannedTracking} />
            <ScrollView style={{ maxHeight: 120, marginTop: 8 }}>
              {(branches ?? []).map((b) => (
                <Pressable
                  key={b.id}
                  style={[styles.branchRow, branchId === b.id && styles.branchRowActive]}
                  onPress={() => setBranchId(b.id)}
                >
                  <Text style={styles.branchName}>{b.name}</Text>
                  <Text style={styles.branchCity}>{b.city}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowHandoff(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <GradientButton
                label={handoffMut.isPending ? 'Handing off…' : 'Confirm handoff'}
                onPress={() => handoffMut.mutate()}
                disabled={!branchId || !scannedTracking || handoffMut.isPending}
                loading={handoffMut.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPickupSig} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pickup signature</Text>
            <SignatureCapture onChange={setPickupStrokes} />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowPickupSig(false)}>
                <Text style={styles.cancelText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPodSig} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delivery signature</Text>
            <SignatureCapture onChange={setPodStrokes} />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowPodSig(false)}>
                <Text style={styles.cancelText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showFailed} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Failed delivery</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Reason (optional)"
              placeholderTextColor={colors.textDim}
              value={failedNote}
              onChangeText={setFailedNote}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowFailed(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <GradientButton
                label={failedMut.isPending ? 'Saving…' : 'Mark failed'}
                onPress={() => failedMut.mutate()}
                disabled={failedMut.isPending}
                loading={failedMut.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  queueBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, padding: 10, backgroundColor: 'rgba(251,191,36,0.1)', borderRadius: radius.md },
  queueText: { color: colors.warning, fontSize: 12, flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  statusBadge: { backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderGlow },
  statusBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  ref: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sectionLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: 8 },
  warn: { color: colors.warning, fontSize: 12, marginTop: 8 },
  ok: { color: colors.primary, fontSize: 12, marginTop: 8, fontWeight: '600' },
  addressCard: { marginBottom: 12 },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  addressText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  callRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  callText: { color: colors.primary, fontWeight: '600' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  navText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  error: { color: colors.error, textAlign: 'center', marginVertical: 12 },
  actions: { gap: 12, marginTop: 8 },
  podBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  podText: { color: colors.primary, fontWeight: '600' },
  altBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  altText: { color: colors.accent, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, gap: 8 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  branchRow: { padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: 6 },
  branchRowActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.08)' },
  branchName: { color: colors.text, fontWeight: '600' },
  branchCity: { color: colors.textMuted, fontSize: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'center' },
  cancelBtn: { padding: 12 },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  noteInput: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, color: colors.text, minHeight: 80, textAlignVertical: 'top' },
});
