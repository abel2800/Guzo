'use client';

import type { ComponentType } from 'react';
import { BookShipment } from '@/components/customer/book-shipment';
import { MyOrders } from '@/components/customer/my-orders';
import { TrackShipment } from '@/components/customer/track-shipment';
import { AdminOrders } from '@/components/admin/orders-table';
import { AdminUsers } from '@/components/admin/users-table';
import { AdminDrivers } from '@/components/admin/drivers-table';
import { DriverAvailable } from '@/components/driver/available-jobs';
import { DriverDeliveries } from '@/components/driver/my-deliveries';
import { PodHistory } from '@/components/driver/pod-history';
import { DriverEarnings } from '@/components/driver/driver-earnings';
import { DriverHistory } from '@/components/driver/driver-history';
import { DriverNavigation } from '@/components/driver/driver-navigation';
import { DriverManifests } from '@/components/driver/driver-manifests';
import { DriverVehicle } from '@/components/driver/driver-vehicle';
import { BulkUpload } from '@/components/merchant/bulk-upload';
import { MerchantOrders } from '@/components/merchant/merchant-orders';
import { MerchantAnalytics } from '@/components/merchant/merchant-analytics';
import { MerchantApiKeys } from '@/components/merchant/merchant-api-keys';
import { MerchantCustomers } from '@/components/merchant/merchant-customers';
import { MerchantInvoices } from '@/components/merchant/merchant-invoices';
import { WarehouseReceiving } from '@/components/warehouse/receiving';
import { WarehouseInventory } from '@/components/warehouse/inventory';
import { WarehouseDispatch } from '@/components/warehouse/dispatch';
import { WarehouseSorting } from '@/components/warehouse/warehouse-sorting';
import { WarehouseManifests } from '@/components/warehouse/warehouse-manifests';
import { WarehouseAging } from '@/components/warehouse/warehouse-aging';
import { WarehouseEmployees } from '@/components/warehouse/warehouse-employees';
import { WarehouseReports } from '@/components/warehouse/warehouse-reports';
import { WarehouseTransfer } from '@/components/warehouse/warehouse-transfer';
import { OpsTruckMap } from '@/components/operations/ops-truck-map';
import { OpsTracking } from '@/components/operations/ops-tracking';
import { CustomerSupport } from '@/components/support/customer-support';
import { SupportTickets } from '@/components/support/support-tickets';
import { SupportOrders } from '@/components/support/support-orders';
import { SupportRefunds } from '@/components/support/support-refunds';
import { SupportKnowledgeBase } from '@/components/support/support-kb';
import { FinancePayments } from '@/components/finance/finance-payments';
import { FinanceInvoices } from '@/components/finance/finance-invoices';
import { FinanceRefunds } from '@/components/finance/finance-refunds';
import { FinanceRevenue } from '@/components/finance/finance-revenue';
import { FinanceTaxes } from '@/components/finance/finance-taxes';
import { CustomerAddresses } from '@/components/customer/addresses';
import { CustomerInvoices } from '@/components/customer/invoices';
import { CustomerWallet } from '@/components/customer/wallet';
import { BranchCounter } from '@/components/branch/branch-counter';
import { BranchInventory } from '@/components/branch/branch-inventory';
import { BranchRegister } from '@/components/branch/branch-register';
import { BranchExceptions } from '@/components/branch/branch-exceptions';
import { BranchShelf } from '@/components/branch/branch-shelf';
import { AdminAnalytics } from '@/components/admin/admin-analytics';
import { AdminReports } from '@/components/admin/admin-reports';
import { AdminMerchants } from '@/components/admin/admin-merchants';
import { AdminCustomers } from '@/components/admin/admin-customers';
import { AdminWarehouses } from '@/components/admin/admin-warehouses';
import { AdminBranches } from '@/components/admin/admin-branches';
import { AdminPricing } from '@/components/admin/admin-pricing';
import { AdminCoupons } from '@/components/admin/admin-coupons';
import { AdminVehicles } from '@/components/admin/admin-vehicles';
import { AdminRoles } from '@/components/admin/admin-roles';
import { AdminPermissions } from '@/components/admin/admin-permissions';
import { AdminAuditLogs } from '@/components/admin/admin-audit-logs';
import { AdminPayments } from '@/components/admin/admin-payments';
import { AdminExceptionCenter } from '@/components/admin/admin-exception-center';
import { AdminControlTower } from '@/components/admin/admin-control-tower';
import { NotificationInbox } from '@/components/shared/notification-center';
import { CustomerRatings } from '@/components/customer/customer-ratings';
import { CustomerLoyalty } from '@/components/customer/customer-loyalty';
import { CustomerInsuranceClaims } from '@/components/customer/customer-insurance';
import { AdminActivityLogs } from '@/components/admin/admin-activity-logs';
import { ProfileSettings } from '@/components/shared/profile-settings';

const SETTINGS_ROLES = [
  'admin',
  'super-admin',
  'operations',
  'warehouse-manager',
  'warehouse',
  'driver',
  'merchant',
  'customer',
  'branch',
  'support',
  'finance',
] as const;

const settingsEntries = Object.fromEntries(
  SETTINGS_ROLES.map((role) => [`${role}/settings`, ProfileSettings]),
);

export const SECTION_REGISTRY: Record<string, ComponentType> = {
    'customer/book': BookShipment,
  'customer/orders': MyOrders,
  'customer/track': TrackShipment,
  'customer/addresses': CustomerAddresses,
  'customer/invoices': CustomerInvoices,
  'customer/wallet': CustomerWallet,
  'customer/reviews': CustomerRatings,
  'customer/loyalty': CustomerLoyalty,
  'customer/insurance': CustomerInsuranceClaims,

  'branch/counter': BranchCounter,
  'branch/inventory': BranchInventory,
  'branch/register': BranchRegister,
  'branch/shelf': BranchShelf,
  'branch/exceptions': BranchExceptions,

    'admin/orders': AdminOrders,
  'super-admin/orders': AdminOrders,
  'operations/orders': AdminOrders,

    'admin/users': AdminUsers,
  'super-admin/users': AdminUsers,

    'admin/drivers': AdminDrivers,
  'super-admin/drivers': AdminDrivers,
  'operations/drivers': AdminDrivers,

    'driver/available': DriverAvailable,
  'driver/accepted': DriverDeliveries,
  'driver/pod': PodHistory,
  'driver/earnings': DriverEarnings,
  'driver/history': DriverHistory,
  'driver/navigation': DriverNavigation,
  'driver/manifests': DriverManifests,
  'driver/vehicle': DriverVehicle,

    'merchant/bulk-upload': BulkUpload,
  'merchant/orders': MerchantOrders,
  'merchant/create': BookShipment,
  'merchant/analytics': MerchantAnalytics,
  'merchant/customers': MerchantCustomers,
  'merchant/invoices': MerchantInvoices,
  'merchant/api-keys': MerchantApiKeys,

    'warehouse/incoming': WarehouseReceiving,
  'warehouse/scanning': WarehouseReceiving,
  'warehouse/sorting': WarehouseSorting,
  'warehouse/inventory': WarehouseInventory,
  'warehouse/dispatch': WarehouseDispatch,
  'warehouse/aging': WarehouseAging,
  'warehouse/manifests': WarehouseManifests,
  'warehouse/transfer': WarehouseTransfer,

    'warehouse-manager/incoming': WarehouseReceiving,
  'warehouse-manager/inventory': WarehouseInventory,
  'warehouse-manager/storage': WarehouseAging,
  'warehouse-manager/outgoing': WarehouseManifests,
  'warehouse-manager/manifests': WarehouseManifests,
  'warehouse-manager/employees': WarehouseEmployees,
  'warehouse-manager/reports': WarehouseReports,
  'warehouse-manager/aging': WarehouseAging,
  'warehouse-manager/sorting': WarehouseSorting,
  'warehouse-manager/transfer': WarehouseTransfer,
  'warehouse-manager/trucks': OpsTruckMap,

    'operations/trucks': OpsTruckMap,
  'admin/tracking': OpsTracking,
  'super-admin/tracking': OpsTracking,
  'operations/tracking': OpsTracking,

    'customer/support': CustomerSupport,
  'support/tickets': SupportTickets,
  'support/orders': SupportOrders,
  'support/refunds': SupportRefunds,
  'support/kb': SupportKnowledgeBase,
  'support/notifications': NotificationInbox,
  'admin/support': SupportTickets,
  'super-admin/support': SupportTickets,
  'admin/analytics': AdminAnalytics,
  'super-admin/analytics': AdminAnalytics,
  'operations/analytics': AdminAnalytics,
  'admin/reports': AdminReports,
  'super-admin/reports': AdminReports,
  'operations/reports': AdminReports,

  'super-admin/roles': AdminRoles,
  'super-admin/permissions': AdminPermissions,
  'super-admin/merchants': AdminMerchants,
  'super-admin/customers': AdminCustomers,
  'super-admin/branches': AdminBranches,
  'super-admin/warehouses': AdminWarehouses,
  'super-admin/pricing': AdminPricing,
  'super-admin/coupons': AdminCoupons,
  'super-admin/vehicles': AdminVehicles,
  'super-admin/payments': AdminPayments,
  'super-admin/audit-logs': AdminAuditLogs,
  'super-admin/activity-logs': AdminActivityLogs,
  'super-admin/exceptions': AdminExceptionCenter,
  'super-admin/control-tower': AdminControlTower,

  'admin/merchants': AdminMerchants,
  'admin/customers': AdminCustomers,
  'admin/branches': AdminBranches,
  'admin/warehouses': AdminWarehouses,
  'admin/payments': AdminPayments,
  'admin/exceptions': AdminExceptionCenter,
  'admin/control-tower': AdminControlTower,
  'admin/activity-logs': AdminActivityLogs,

  'operations/merchants': AdminMerchants,
  'operations/warehouses': AdminWarehouses,
  'operations/branches': AdminBranches,
  'operations/vehicles': AdminVehicles,
  'operations/exceptions': AdminExceptionCenter,
  'operations/control-tower': AdminControlTower,

    'finance/payments': FinancePayments,
  'finance/invoices': FinanceInvoices,
  'finance/refunds': FinanceRefunds,
  'finance/revenue': FinanceRevenue,
  'finance/reports': FinanceRevenue,
  'finance/taxes': FinanceTaxes,

  ...settingsEntries,
};
