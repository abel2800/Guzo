import type { ApiResponse } from '@delivery/types';
import { api } from './api';

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

export async function getWallet(): Promise<WalletSummary> {
  const { data } = await api.get<ApiResponse<WalletSummary>>('/wallet');
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function listWalletTransactions(params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get<ApiResponse<{ items: WalletTransaction[]; meta: unknown }>>('/wallet/transactions', {
    params,
  });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function topUpWallet(amount: number, description?: string) {
  const { data } = await api.post<ApiResponse<{ balance: number; currency: string }>>('/wallet/top-up', {
    amount,
    description,
  });
  if (!data.success) throw new Error(data.message);
  return data.data;
}
