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
import { BulkUpload } from '@/components/merchant/bulk-upload';
import { MerchantOrders } from '@/components/merchant/merchant-orders';
import { MerchantAnalytics } from '@/components/merchant/merchant-analytics';
import { WarehouseReceiving } from '@/components/warehouse/receiving';
import { WarehouseInventory } from '@/components/warehouse/inventory';
import { WarehouseDispatch } from '@/components/warehouse/dispatch';
import { CustomerSupport } from '@/components/support/customer-support';
import { SupportTickets } from '@/components/support/support-tickets';
import { FinancePayments } from '@/components/finance/finance-payments';
import { FinanceInvoices } from '@/components/finance/finance-invoices';
import { FinanceRefunds } from '@/components/finance/finance-refunds';
import { FinanceRevenue } from '@/components/finance/finance-revenue';
import { CustomerAddresses } from '@/components/customer/addresses';
import { CustomerInvoices } from '@/components/customer/invoices';
import { AdminAnalytics } from '@/components/admin/admin-analytics';
import { AdminReports } from '@/components/admin/admin-reports';
import { NotificationInbox } from '@/components/shared/notification-center';

/**
 * Maps `${roleSlug}/${section}` to a fully-built feature component. Anything not
 * registered here falls back to the routed "coming soon" placeholder.
 */
export const SECTION_REGISTRY: Record<string, ComponentType> = {
  // Customer
  'customer/book': BookShipment,
  'customer/orders': MyOrders,
  'customer/track': TrackShipment,
  'customer/addresses': CustomerAddresses,
  'customer/invoices': CustomerInvoices,

  // Admin / Super Admin / Operations — order management
  'admin/orders': AdminOrders,
  'super-admin/orders': AdminOrders,
  'operations/orders': AdminOrders,

  // User management
  'admin/users': AdminUsers,
  'super-admin/users': AdminUsers,

  // Driver management / approval
  'admin/drivers': AdminDrivers,
  'super-admin/drivers': AdminDrivers,
  'operations/drivers': AdminDrivers,

  // Driver
  'driver/available': DriverAvailable,
  'driver/accepted': DriverDeliveries,
  'driver/pod': PodHistory,

  // Merchant
  'merchant/bulk-upload': BulkUpload,
  'merchant/orders': MerchantOrders,
  'merchant/analytics': MerchantAnalytics,

  // Warehouse staff
  'warehouse/incoming': WarehouseReceiving,
  'warehouse/scanning': WarehouseReceiving,
  'warehouse/sorting': WarehouseInventory,
  'warehouse/inventory': WarehouseInventory,
  'warehouse/dispatch': WarehouseDispatch,

  // Warehouse manager
  'warehouse-manager/incoming': WarehouseReceiving,
  'warehouse-manager/inventory': WarehouseInventory,
  'warehouse-manager/storage': WarehouseInventory,
  'warehouse-manager/outgoing': WarehouseDispatch,

  // Support tickets
  'customer/support': CustomerSupport,
  'support/tickets': SupportTickets,
  'support/notifications': NotificationInbox,
  'admin/support': SupportTickets,
  'super-admin/support': SupportTickets,
  'admin/analytics': AdminAnalytics,
  'super-admin/analytics': AdminAnalytics,
  'operations/analytics': AdminAnalytics,
  'admin/reports': AdminReports,
  'super-admin/reports': AdminReports,
  'operations/reports': AdminReports,

  // Finance
  'finance/payments': FinancePayments,
  'finance/invoices': FinanceInvoices,
  'finance/refunds': FinanceRefunds,
  'finance/revenue': FinanceRevenue,
  'finance/reports': FinanceRevenue,
};
