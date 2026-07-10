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
  status?: 'OFFLINE' | 'ONLINE' | 'ON_DELIVERY' | 'ON_BREAK';
  isAvailable?: boolean;
  isOnline?: boolean;
  rating?: string | number;
  totalDeliveries?: number;
  currentLat?: number | null;
  currentLng?: number | null;
  lastLocationAt?: string | null;
  createdAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
    status?: string;
    avatarUrl?: string | null;
    avatar?: { storageKey: string } | null;
  } | null;
}

function qs(params: Record<string, unknown>) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) s.set(k, String(v));
  });
  return s.toString();
}

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

export interface PendingApprovals {
  pendingUsers: number;
  pendingDrivers: number;
  pendingMerchants: number;
  pendingBranchStaff: number;
}

export interface AdminUserDetail extends AdminUser {
  avatarUrl?: string | null;
  gender?: string;
  lastLoginAt?: string | null;
  pendingOrders?: number;
  customer?: {
    id: string;
    customerCode: string;
    walletBalance: number;
    loyaltyPoints: number;
    orderCount: number;
  } | null;
  driver?: {
    id: string;
    driverCode: string;
    approvalStatus: string;
    status: string;
    isAvailable: boolean;
    isOnline: boolean;
    rating: number;
    totalDeliveries: number;
    earningsBalance: number;
    currentLat: number | null;
    currentLng: number | null;
    lastLocationAt: string | null;
    activeDeliveries: number;
  } | null;
  merchant?: {
    id: string;
    merchantCode: string;
    businessName: string;
    businessEmail: string | null;
    businessPhone: string | null;
    isVerified: boolean;
    walletBalance: number;
    orderCount: number;
  } | null;
  branches?: Array<{
    id: string;
    code: string;
    name: string;
    city: string;
    isActive: boolean;
    pendingInventory: number;
    assignedAt: string;
  }>;
}

export interface AdminDriverDetail extends AdminDriver {
  activeDeliveries?: Array<{ id: string; orderNumber: string; status: string }>;
}

export async function getPendingApprovals(): Promise<PendingApprovals> {
  const { data } = await api.get<ApiResponse<PendingApprovals>>('/admin/approvals/pending');
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function getUserAdminDetail(id: string): Promise<AdminUserDetail> {
  const { data } = await api.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}/detail`);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function approveUserAccount(id: string): Promise<AdminUserDetail> {
  const { data } = await api.post<ApiResponse<AdminUserDetail>>(`/admin/users/${id}/approve`, {});
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function getDriverAdminDetail(id: string): Promise<AdminDriverDetail> {
  const { data } = await api.get<ApiResponse<AdminDriverDetail>>(`/admin/drivers/${id}/detail`);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function listLiveDrivers(): Promise<AdminDriver[]> {
  const { data } = await api.get<ApiResponse<AdminDriver[]>>('/admin/drivers/live');
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export const DRIVER_STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  OFFLINE: { label: 'Offline', variant: 'secondary' },
  ONLINE: { label: 'Online', variant: 'success' },
  ON_DELIVERY: { label: 'On delivery', variant: 'default' },
  ON_BREAK: { label: 'On break', variant: 'outline' },
};

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
