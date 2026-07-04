export interface RecordLocationDto {
  orderId?: string;
  deliveryId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}
