import { Router } from 'express';

import addressesRoutes from '../modules/addresses/addresses.routes.js';
import pushTokensRoutes from '../modules/push-tokens/push-tokens.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import rolesRoutes from '../modules/roles/roles.routes.js';
import permissionsRoutes from '../modules/permissions/permissions.routes.js';
import customersRoutes from '../modules/customers/customers.routes.js';
import driversRoutes from '../modules/drivers/drivers.routes.js';
import merchantsRoutes from '../modules/merchants/merchants.routes.js';
import warehousesRoutes from '../modules/warehouses/warehouses.routes.js';
import packagesRoutes from '../modules/packages/packages.routes.js';
import ordersRoutes from '../modules/orders/orders.routes.js';
import deliveriesRoutes from '../modules/deliveries/deliveries.routes.js';
import trackingRoutes from '../modules/tracking/tracking.routes.js';
import vehiclesRoutes from '../modules/vehicles/vehicles.routes.js';
import pricingRoutes from '../modules/pricing/pricing.routes.js';
import couponsRoutes from '../modules/coupons/coupons.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import paymentsRoutes from '../modules/payments/payments.routes.js';
import invoicesRoutes from '../modules/invoices/invoices.routes.js';
import reviewsRoutes from '../modules/reviews/reviews.routes.js';
import supportRoutes from '../modules/support/support.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';
import reportsRoutes from '../modules/reports/reports.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import searchRoutes from '../modules/search/search.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';

const router = Router();

/** Each module owns its own router; this is the single composition root. */
const modules: Array<[string, Router]> = [
  ['/auth', authRoutes],
  ['/push-tokens', pushTokensRoutes],
  ['/addresses', addressesRoutes],
  ['/users', usersRoutes],
  ['/roles', rolesRoutes],
  ['/permissions', permissionsRoutes],
  ['/customers', customersRoutes],
  ['/drivers', driversRoutes],
  ['/merchants', merchantsRoutes],
  ['/warehouses', warehousesRoutes],
  ['/packages', packagesRoutes],
  ['/orders', ordersRoutes],
  ['/deliveries', deliveriesRoutes],
  ['/tracking', trackingRoutes],
  ['/vehicles', vehiclesRoutes],
  ['/pricing', pricingRoutes],
  ['/coupons', couponsRoutes],
  ['/notifications', notificationsRoutes],
  ['/payments', paymentsRoutes],
  ['/invoices', invoicesRoutes],
  ['/reviews', reviewsRoutes],
  ['/support', supportRoutes],
  ['/settings', settingsRoutes],
  ['/reports', reportsRoutes],
  ['/analytics', analyticsRoutes],
  ['/dashboard', dashboardRoutes],
  ['/search', searchRoutes],
  ['/admin', adminRoutes],
];

for (const [path, moduleRouter] of modules) {
  router.use(path, moduleRouter);
}

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Delivery Platform API v1',
    modules: modules.map(([p]) => p),
  });
});

export default router;
