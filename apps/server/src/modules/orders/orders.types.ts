export interface PriceBreakdown {
  distanceKm: number;
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  surge: number;
  discount: number;
  tax: number;
  totalAmount: number;
  currency: string;
}
