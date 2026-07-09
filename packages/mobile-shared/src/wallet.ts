import { apiGet, apiList, apiPost } from './api';

export interface WalletSummary {
  balance: number;
  currency: string;
  holderType: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  currency: string;
  reference: string;
  description: string;
  createdAt: string;
}

export function getWallet(): Promise<WalletSummary> {
  return apiGet<WalletSummary>('/wallet');
}

export function listWalletTransactions(params: { page?: number; limit?: number } = {}) {
  return apiList<WalletTransaction>('/wallet/transactions', params);
}

export function topUpWallet(amount: number, description?: string): Promise<{ balance: number; currency: string }> {
  return apiPost('/wallet/top-up', { amount, description });
}
