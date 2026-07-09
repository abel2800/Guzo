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

export function resolveMapPoint(address: AddressLike, _seed?: string): MapPoint {
  if (address.latitude != null && address.longitude != null) {
    return { latitude: address.latitude, longitude: address.longitude, title: address.line1 };
  }
  return {
    latitude: ADDIS_ABABA.latitude,
    longitude: ADDIS_ABABA.longitude,
    title: address.line1,
  };
}
