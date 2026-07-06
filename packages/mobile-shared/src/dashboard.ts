import { apiGet } from './api';
import type { CustomerSummary, DriverSummary, MerchantSummary } from './types';

export function getCustomerDashboard(): Promise<CustomerSummary> {
  return apiGet<CustomerSummary>('/dashboard/customer');
}

export function getDriverDashboard(): Promise<DriverSummary> {
  return apiGet<DriverSummary>('/dashboard/driver');
}

export function getMerchantDashboard(): Promise<MerchantSummary> {
  return apiGet<MerchantSummary>('/dashboard/merchant');
}
