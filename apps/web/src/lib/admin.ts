import { api } from './api';
import type { ApiResponse } from '@delivery/types';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  roles: string[];
  createdAt: string;
}

export interface RoleRow {
  id: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
}

export interface AdminDriver {
  id: string;
  driverCode: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  status?: string;
  isAvailable?: boolean;
  rating?: string | number;
  totalDeliveries?: number;
  createdAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
  } | null;
}

function qs(params: Record<string, unknown>) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) s.set(k, String(v));
  });
  return s.toString();
}

// ---- Users ----
export async function listUsers(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  const { data } = await api.get<ApiResponse<AdminUser[]>>(`/users?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<AdminUser> {
  const { data } = await api.patch<ApiResponse<AdminUser>>(`/users/${id}`, { status });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function assignUserRoles(id: string, roles: string[]): Promise<AdminUser> {
  const { data } = await api.put<ApiResponse<AdminUser>>(`/users/${id}/roles`, { roles });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function listRoles(): Promise<RoleRow[]> {
  const { data } = await api.get<ApiResponse<RoleRow[]>>('/roles?limit=100&sortBy=name&sortOrder=asc');
  if (!data.success) throw new Error(data.message);
  return data.data;
}

// ---- Drivers ----
export async function listDriversPaged(
  params: { page?: number; limit?: number; search?: string; approvalStatus?: string } = {},
) {
  const { data } = await api.get<ApiResponse<AdminDriver[]>>(`/drivers?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function approveDriver(id: string): Promise<AdminDriver> {
  const { data } = await api.post<ApiResponse<AdminDriver>>(`/admin/drivers/${id}/approve`, {});
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function rejectDriver(id: string): Promise<AdminDriver> {
  const { data } = await api.post<ApiResponse<AdminDriver>>(`/admin/drivers/${id}/reject`, {});
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export const USER_STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pending', variant: 'outline' },
  ACTIVE: { label: 'Active', variant: 'success' },
  SUSPENDED: { label: 'Suspended', variant: 'destructive' },
  BANNED: { label: 'Banned', variant: 'destructive' },
  DELETED: { label: 'Deleted', variant: 'secondary' },
};

export const DRIVER_APPROVAL_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pending', variant: 'outline' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  SUSPENDED: { label: 'Suspended', variant: 'destructive' },
};
