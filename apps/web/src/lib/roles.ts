import type { Role } from '@delivery/types';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Boxes,
  MapPin,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  ShieldCheck,
  Bell,
  Star,
  Gift,
  LifeBuoy,
  Warehouse,
  Receipt,
  Store,
  Tags,
  KeyRound,
  ScrollText,
  Navigation,
  ClipboardList,
  Car,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  UserPlus,
  Activity,
  type LucideIcon,
} from 'lucide-react';

export type RoleSlug =
  | 'super-admin'
  | 'admin'
  | 'operations'
  | 'warehouse-manager'
  | 'warehouse'
  | 'driver'
  | 'merchant'
  | 'customer'
  | 'support'
  | 'finance'
  | 'branch';

export interface NavItem {
  title: string;
  href: string;   icon: LucideIcon;
}

export interface RoleConfig {
  slug: RoleSlug;
  role: Role;
  label: string;
    overviewEndpoint: string;
  nav: NavItem[];
}

export const ROLE_TO_SLUG: Record<Role, RoleSlug> = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  OPERATIONS_MANAGER: 'operations',
  WAREHOUSE_MANAGER: 'warehouse-manager',
  WAREHOUSE_STAFF: 'warehouse',
  DRIVER: 'driver',
  MERCHANT: 'merchant',
  CUSTOMER: 'customer',
  SUPPORT: 'support',
  FINANCE: 'finance',
  BRANCH_STAFF: 'branch',
};

export const SLUG_TO_ROLE = Object.fromEntries(
  Object.entries(ROLE_TO_SLUG).map(([role, slug]) => [slug, role as Role]),
) as Record<RoleSlug, Role>;

const ROLE_PRIORITY: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'OPERATIONS_MANAGER',
  'FINANCE',
  'WAREHOUSE_MANAGER',
  'WAREHOUSE_STAFF',
  'BRANCH_STAFF',
  'SUPPORT',
  'MERCHANT',
  'DRIVER',
  'CUSTOMER',
];

export function primarySlugForRoles(roles: Role[]): RoleSlug {
  const best = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? 'CUSTOMER';
  return ROLE_TO_SLUG[best];
}

export const DEMO_EMAIL_TO_SLUG: Record<string, RoleSlug> = {
  'superadmin@delivery.local': 'super-admin',
  'admin@delivery.local': 'admin',
  'customer@delivery.local': 'customer',
  'driver@delivery.local': 'driver',
  'merchant@delivery.local': 'merchant',
  'finance@delivery.local': 'finance',
  'support@delivery.local': 'support',
  'ops@delivery.local': 'operations',
  'warehouse.manager@delivery.local': 'warehouse-manager',
  'warehouse.staff@delivery.local': 'warehouse',
  'branch.staff@delivery.local': 'branch',
};

export function dashboardPathForLogin(user: { roles: Role[] }, email: string): string {
  const preferred = DEMO_EMAIL_TO_SLUG[email.toLowerCase()];
  if (preferred && user.roles.includes(SLUG_TO_ROLE[preferred])) {
    return `/dashboard/${preferred}`;
  }
  return `/dashboard/${primarySlugForRoles(user.roles)}`;
}

const overview = (icon: LucideIcon): NavItem => ({ title: 'Overview', href: '', icon });

export const ROLE_CONFIG: Record<RoleSlug, RoleConfig> = {
  'super-admin': {
    slug: 'super-admin',
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    overviewEndpoint: '/dashboard/admin',
    nav: [
      overview(LayoutDashboard),
      { title: 'Analytics', href: 'analytics', icon: BarChart3 },
      { title: 'Users', href: 'users', icon: Users },
      { title: 'Roles', href: 'roles', icon: ShieldCheck },
      { title: 'Permissions', href: 'permissions', icon: KeyRound },
      { title: 'Drivers', href: 'drivers', icon: Truck },
      { title: 'Merchants', href: 'merchants', icon: Boxes },
      { title: 'Customers', href: 'customers', icon: Users },
      { title: 'Branches', href: 'branches', icon: MapPin },
      { title: 'Warehouses', href: 'warehouses', icon: Warehouse },
      { title: 'Orders', href: 'orders', icon: Package },
      { title: 'Tracking', href: 'tracking', icon: MapPin },
      { title: 'Control tower', href: 'control-tower', icon: Navigation },
      { title: 'Exceptions', href: 'exceptions', icon: AlertTriangle },
      { title: 'Payments', href: 'payments', icon: Wallet },
      { title: 'Pricing', href: 'pricing', icon: Tags },
      { title: 'Coupons', href: 'coupons', icon: Tags },
      { title: 'Audit Logs', href: 'audit-logs', icon: ScrollText },
      { title: 'Activity Logs', href: 'activity-logs', icon: Activity },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
  admin: {
    slug: 'admin',
    role: 'ADMIN',
    label: 'Admin',
    overviewEndpoint: '/dashboard/admin',
    nav: [
      overview(LayoutDashboard),
      { title: 'Users', href: 'users', icon: Users },
      { title: 'Orders', href: 'orders', icon: Package },
      { title: 'Drivers', href: 'drivers', icon: Truck },
      { title: 'Merchants', href: 'merchants', icon: Boxes },
      { title: 'Customers', href: 'customers', icon: Users },
      { title: 'Branches', href: 'branches', icon: MapPin },
      { title: 'Warehouses', href: 'warehouses', icon: Warehouse },
      { title: 'Tracking', href: 'tracking', icon: MapPin },
      { title: 'Control tower', href: 'control-tower', icon: Navigation },
      { title: 'Exceptions', href: 'exceptions', icon: AlertTriangle },
      { title: 'Payments', href: 'payments', icon: Wallet },
      { title: 'Support Tickets', href: 'support', icon: LifeBuoy },
      { title: 'Reports', href: 'reports', icon: FileText },
      { title: 'Analytics', href: 'analytics', icon: BarChart3 },
      { title: 'Activity Logs', href: 'activity-logs', icon: Activity },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
  operations: {
    slug: 'operations',
    role: 'OPERATIONS_MANAGER',
    label: 'Operations',
    overviewEndpoint: '/dashboard/admin',
    nav: [
      overview(LayoutDashboard),
      { title: 'Orders', href: 'orders', icon: Package },
      { title: 'Drivers', href: 'drivers', icon: Truck },
      { title: 'Tracking', href: 'tracking', icon: MapPin },
      { title: 'Control tower', href: 'control-tower', icon: Navigation },
      { title: 'Exceptions', href: 'exceptions', icon: AlertTriangle },
      { title: 'Live trucks', href: 'trucks', icon: Truck },
      { title: 'Warehouses', href: 'warehouses', icon: Warehouse },
      { title: 'Branches', href: 'branches', icon: MapPin },
      { title: 'Vehicles', href: 'vehicles', icon: Car },
      { title: 'Reports', href: 'reports', icon: FileText },
      { title: 'Analytics', href: 'analytics', icon: BarChart3 },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
  'warehouse-manager': {
    slug: 'warehouse-manager',
    role: 'WAREHOUSE_MANAGER',
    label: 'Warehouse Manager',
    overviewEndpoint: '/dashboard/warehouse',
    nav: [
      overview(LayoutDashboard),
      { title: 'Incoming', href: 'incoming', icon: Boxes },
      { title: 'Sorting', href: 'sorting', icon: ClipboardList },
      { title: 'Manifests', href: 'manifests', icon: Truck },
      { title: 'Inventory', href: 'inventory', icon: Warehouse },
      { title: 'Aging', href: 'aging', icon: Clock },
      { title: 'Transfer', href: 'transfer', icon: ArrowRightLeft },
      { title: 'Live trucks', href: 'trucks', icon: Truck },
      { title: 'Employees', href: 'employees', icon: Users },
      { title: 'Reports', href: 'reports', icon: FileText },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
  warehouse: {
    slug: 'warehouse',
    role: 'WAREHOUSE_STAFF',
    label: 'Warehouse',
    overviewEndpoint: '/dashboard/warehouse',
    nav: [
      overview(LayoutDashboard),
      { title: 'Incoming Parcels', href: 'incoming', icon: Boxes },
      { title: 'Sorting', href: 'sorting', icon: ClipboardList },
      { title: 'Manifests', href: 'manifests', icon: Truck },
      { title: 'Dispatch', href: 'dispatch', icon: Truck },
      { title: 'Inventory', href: 'inventory', icon: Warehouse },
      { title: 'Aging', href: 'aging', icon: Clock },
      { title: 'Transfer', href: 'transfer', icon: ArrowRightLeft },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
  driver: {
    slug: 'driver',
    role: 'DRIVER',
    label: 'Driver',
    overviewEndpoint: '/dashboard/driver',
    nav: [
      overview(LayoutDashboard),
      { title: 'Available', href: 'available', icon: Package },
      { title: 'Accepted', href: 'accepted', icon: ClipboardList },
      { title: 'Navigation', href: 'navigation', icon: Navigation },
      { title: 'Manifests', href: 'manifests', icon: Truck },
      { title: 'Vehicle', href: 'vehicle', icon: Car },
      { title: 'Proof of Delivery', href: 'pod', icon: FileText },
      { title: 'Earnings', href: 'earnings', icon: Wallet },
      { title: 'History', href: 'history', icon: ScrollText },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
  merchant: {
    slug: 'merchant',
    role: 'MERCHANT',
    label: 'Merchant',
    overviewEndpoint: '/dashboard/merchant',
    nav: [
      overview(LayoutDashboard),
      { title: 'Create shipment', href: 'create', icon: Package },
      { title: 'Orders', href: 'orders', icon: Package },
      { title: 'Bulk Upload', href: 'bulk-upload', icon: Boxes },
      { title: 'Customers', href: 'customers', icon: Users },
      { title: 'Invoices', href: 'invoices', icon: Receipt },
      { title: 'Analytics', href: 'analytics', icon: BarChart3 },
      { title: 'API Keys', href: 'api-keys', icon: KeyRound },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
  customer: {
    slug: 'customer',
    role: 'CUSTOMER',
    label: 'Customer',
    overviewEndpoint: '/dashboard/customer',
    nav: [
      overview(LayoutDashboard),
      { title: 'Book Shipment', href: 'book', icon: Package },
      { title: 'Track Shipment', href: 'track', icon: MapPin },
      { title: 'My Orders', href: 'orders', icon: ClipboardList },
      { title: 'Addresses', href: 'addresses', icon: MapPin },
      { title: 'Wallet', href: 'wallet', icon: Wallet },
      { title: 'Invoices', href: 'invoices', icon: Receipt },
      { title: 'Reviews', href: 'reviews', icon: Star },
      { title: 'Loyalty', href: 'loyalty', icon: Gift },
      { title: 'Insurance', href: 'insurance', icon: ShieldCheck },
      { title: 'Support', href: 'support', icon: LifeBuoy },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
  support: {
    slug: 'support',
    role: 'SUPPORT',
    label: 'Customer Support',
    overviewEndpoint: '/dashboard/support',
    nav: [
      overview(LayoutDashboard),
      { title: 'Tickets', href: 'tickets', icon: LifeBuoy },
      { title: 'Orders', href: 'orders', icon: Package },
      { title: 'Refund Requests', href: 'refunds', icon: Receipt },
      { title: 'Notifications', href: 'notifications', icon: Bell },
      { title: 'Knowledge Base', href: 'kb', icon: FileText },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
  finance: {
    slug: 'finance',
    role: 'FINANCE',
    label: 'Finance',
    overviewEndpoint: '/dashboard/finance',
    nav: [
      overview(LayoutDashboard),
      { title: 'Payments', href: 'payments', icon: Wallet },
      { title: 'Invoices', href: 'invoices', icon: Receipt },
      { title: 'Refunds', href: 'refunds', icon: Receipt },
      { title: 'Revenue', href: 'revenue', icon: BarChart3 },
      { title: 'Taxes', href: 'taxes', icon: FileText },
      { title: 'Reports', href: 'reports', icon: FileText },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
  branch: {
    slug: 'branch',
    role: 'BRANCH_STAFF',
    label: 'Branch',
    overviewEndpoint: '/dashboard/branch',
    nav: [
      overview(LayoutDashboard),
      { title: 'Counter', href: 'counter', icon: Store },
      { title: 'Register', href: 'register', icon: UserPlus },
      { title: 'Shelf', href: 'shelf', icon: Boxes },
      { title: 'Inventory', href: 'inventory', icon: Package },
      { title: 'Exceptions', href: 'exceptions', icon: AlertTriangle },
      { title: 'Settings', href: 'settings', icon: Settings },
    ],
  },
};
