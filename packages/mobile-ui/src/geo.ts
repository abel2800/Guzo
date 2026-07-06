/** Default map center — Addis Ababa */
export const ADDIS_ABABA = { latitude: 9.032, longitude: 38.7469 };

export interface MapPoint {
  latitude: number;
  longitude: number;
  title?: string;
}

export interface AddressLike {
  line1?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function resolveMapPoint(address: AddressLike, seed: string): MapPoint {
  if (address.latitude != null && address.longitude != null) {
    return { latitude: address.latitude, longitude: address.longitude, title: address.line1 };
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const latOff = ((hash % 1000) / 1000 - 0.5) * 0.08;
  const lngOff = (((hash >> 8) % 1000) / 1000 - 0.5) * 0.08;
  return {
    latitude: ADDIS_ABABA.latitude + latOff,
    longitude: ADDIS_ABABA.longitude + lngOff,
    title: address.line1,
  };
}
