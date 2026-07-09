import type { AddressInput } from '../../modules/orders/orders.dto.js';
import { nominatimProvider } from './nominatim.provider.js';

export async function resolveAddressCoords(
  address: AddressInput,
): Promise<{ lat: number; lng: number } | null> {
  if (address.latitude != null && address.longitude != null) {
    return { lat: address.latitude, lng: address.longitude };
  }
  if (!address.line1?.trim() || !address.city?.trim()) return null;

  const q = [address.line1, address.city, address.country ?? 'Ethiopia'].filter(Boolean).join(', ');
  const hit = await nominatimProvider.geocode(q);
  return hit ? { lat: hit.lat, lng: hit.lng } : null;
}
