import { GUZO_COLORS } from '@guzo/mobile-shared';
import { StyleSheet } from 'react-native';

export const theme = GUZO_COLORS;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: theme.muted, marginBottom: 20, lineHeight: 22 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  label: { fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    color: theme.text,
    fontSize: 16,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: theme.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: theme.bg, fontWeight: '700', fontSize: 16 },
  btnTextOutline: { color: theme.text, fontWeight: '600', fontSize: 16 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: theme.primary, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  error: { color: '#ef4444', marginTop: 8, fontSize: 14 },
});
