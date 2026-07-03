/* eslint-disable no-console */
import { PrismaClient, CouponType, DeliveryType, VehicleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'OPERATIONS_MANAGER',
  'WAREHOUSE_MANAGER',
  'WAREHOUSE_STAFF',
  'DRIVER',
  'MERCHANT',
  'CUSTOMER',
  'SUPPORT',
  'FINANCE',
] as const;

const RESOURCES = [
  'users',
  'roles',
  'orders',
  'packages',
  'drivers',
  'merchants',
  'warehouses',
  'vehicles',
  'payments',
  'coupons',
  'pricing',
  'tracking',
  'notifications',
  'reviews',
  'tickets',
  'reports',
  'analytics',
  'settings',
];
const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'];

async function main() {
  console.log('Seeding database...');

  // 1) Permissions
  const permissions = [];
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      permissions.push({
        key: `${resource}.${action}`,
        resource,
        action,
        description: `${action} ${resource}`,
      });
    }
  }
  await prisma.permission.createMany({ data: permissions, skipDuplicates: true });
  const allPermissions = await prisma.permission.findMany();
  console.log(`  ${allPermissions.length} permissions`);

  // 2) Roles
  for (const name of ROLES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystem: true, description: `${name} role` },
    });
  }
  const roles = await prisma.role.findMany();
  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));
  console.log(`  ${roles.length} roles`);

  // 3) Role -> Permission mapping
  // SUPER_ADMIN & ADMIN -> all permissions
  for (const roleName of ['SUPER_ADMIN', 'ADMIN']) {
    await prisma.rolePermission.createMany({
      data: allPermissions.map((p) => ({ roleId: roleByName[roleName].id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
  // CUSTOMER -> read own orders/packages/tracking + create orders
  const customerPerms = allPermissions.filter((p) =>
    ['orders.create', 'orders.read', 'packages.read', 'tracking.read', 'reviews.create', 'payments.read'].includes(p.key),
  );
  await prisma.rolePermission.createMany({
    data: customerPerms.map((p) => ({ roleId: roleByName.CUSTOMER.id, permissionId: p.id })),
    skipDuplicates: true,
  });
  // DRIVER -> deliveries/tracking
  const driverPerms = allPermissions.filter((p) =>
    ['orders.read', 'tracking.create', 'tracking.read', 'packages.read', 'packages.update'].includes(p.key),
  );
  await prisma.rolePermission.createMany({
    data: driverPerms.map((p) => ({ roleId: roleByName.DRIVER.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // OPERATIONS_MANAGER -> orchestrate fulfilment (orders/drivers/packages/tracking/warehouses)
  const opsPerms = allPermissions.filter((p) =>
    ['orders', 'packages', 'drivers', 'tracking', 'warehouses', 'vehicles', 'reports', 'analytics'].includes(
      p.resource,
    ),
  );
  await prisma.rolePermission.createMany({
    data: opsPerms.map((p) => ({ roleId: roleByName.OPERATIONS_MANAGER.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // WAREHOUSE_MANAGER -> full warehouse domain
  const whPerms = allPermissions.filter((p) =>
    ['warehouses', 'packages', 'tracking', 'reports'].includes(p.resource),
  );
  await prisma.rolePermission.createMany({
    data: whPerms.map((p) => ({ roleId: roleByName.WAREHOUSE_MANAGER.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // WAREHOUSE_STAFF -> operate packages/tracking (no manage)
  const whStaffPerms = allPermissions.filter((p) =>
    ['packages.read', 'packages.update', 'tracking.read', 'tracking.create', 'warehouses.read'].includes(p.key),
  );
  await prisma.rolePermission.createMany({
    data: whStaffPerms.map((p) => ({ roleId: roleByName.WAREHOUSE_STAFF.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // FINANCE -> money domain
  const financePerms = allPermissions.filter((p) =>
    ['payments', 'reports', 'analytics', 'coupons', 'pricing'].includes(p.resource),
  );
  await prisma.rolePermission.createMany({
    data: financePerms.map((p) => ({ roleId: roleByName.FINANCE.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // SUPPORT -> tickets + read customers/orders
  const supportPerms = allPermissions.filter((p) =>
    ['tickets', 'reviews'].includes(p.resource) ||
    ['orders.read', 'customers.read', 'tracking.read'].includes(p.key),
  );
  await prisma.rolePermission.createMany({
    data: supportPerms.map((p) => ({ roleId: roleByName.SUPPORT.id, permissionId: p.id })),
    skipDuplicates: true,
  });
  console.log('  role-permission mappings done');

  // 4) Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@delivery.local' },
    update: {},
    create: {
      email: 'superadmin@delivery.local',
      phone: '+251900000001',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: roleByName.SUPER_ADMIN.id }] },
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@delivery.local' },
    update: {},
    create: {
      email: 'admin@delivery.local',
      phone: '+251900000002',
      passwordHash,
      firstName: 'Platform',
      lastName: 'Admin',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: roleByName.ADMIN.id }] },
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@delivery.local' },
    update: {},
    create: {
      email: 'customer@delivery.local',
      phone: '+251900000003',
      passwordHash,
      firstName: 'Casey',
      lastName: 'Customer',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: roleByName.CUSTOMER.id }] },
      customer: { create: { customerCode: 'CUST-000001' } },
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@delivery.local' },
    update: {},
    create: {
      email: 'driver@delivery.local',
      phone: '+251900000004',
      passwordHash,
      firstName: 'Dana',
      lastName: 'Driver',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: roleByName.DRIVER.id }] },
      driver: {
        create: {
          driverCode: 'DRV-000001',
          approvalStatus: 'APPROVED',
          approvedAt: new Date(),
        },
      },
    },
    include: { driver: true },
  });

  await prisma.user.upsert({
    where: { email: 'merchant@delivery.local' },
    update: {},
    create: {
      email: 'merchant@delivery.local',
      phone: '+251900000005',
      passwordHash,
      firstName: 'Morgan',
      lastName: 'Merchant',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: roleByName.MERCHANT.id }] },
      merchant: { create: { merchantCode: 'MER-000001', businessName: 'Morgan Goods Ltd' } },
    },
  });

  // Staff users for the remaining roles (password: Password123!)
  const staff: Array<{ email: string; phone: string; first: string; last: string; role: string }> = [
    { email: 'ops@delivery.local', phone: '+251900000006', first: 'Olivia', last: 'Operations', role: 'OPERATIONS_MANAGER' },
    { email: 'warehouse.manager@delivery.local', phone: '+251900000007', first: 'Wendy', last: 'Manager', role: 'WAREHOUSE_MANAGER' },
    { email: 'warehouse.staff@delivery.local', phone: '+251900000008', first: 'Sam', last: 'Stock', role: 'WAREHOUSE_STAFF' },
    { email: 'support@delivery.local', phone: '+251900000009', first: 'Sara', last: 'Support', role: 'SUPPORT' },
    { email: 'finance@delivery.local', phone: '+251900000010', first: 'Frank', last: 'Finance', role: 'FINANCE' },
  ];
  for (const s of staff) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        phone: s.phone,
        passwordHash,
        firstName: s.first,
        lastName: s.last,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        roles: { create: [{ roleId: roleByName[s.role].id }] },
      },
    });
  }

  console.log('  users created (password for all: Password123!)');

  // 5) Vehicle for the driver
  if (driverUser.driver) {
    await prisma.vehicle.upsert({
      where: { plateNumber: 'AA-12345' },
      update: {},
      create: {
        driverId: driverUser.driver.id,
        type: VehicleType.MOTORCYCLE,
        plateNumber: 'AA-12345',
        brand: 'Bajaj',
        model: 'Boxer',
        color: 'Red',
      },
    });
  }

  // 6) Warehouse
  await prisma.warehouse.upsert({
    where: { code: 'WH-ADD-001' },
    update: {},
    create: {
      code: 'WH-ADD-001',
      name: 'Addis Central Hub',
      line1: 'Bole Road',
      city: 'Addis Ababa',
      country: 'ET',
      latitude: 8.9806,
      longitude: 38.7578,
      capacity: 10000,
    },
  });

  // 7) Pricing rules
  for (const type of [DeliveryType.STANDARD, DeliveryType.EXPRESS, DeliveryType.SAME_DAY]) {
    await prisma.pricingRule.create({
      data: {
        name: `${type} pricing`,
        deliveryType: type,
        baseFee: type === DeliveryType.STANDARD ? 50 : type === DeliveryType.EXPRESS ? 90 : 150,
        perKmFee: type === DeliveryType.STANDARD ? 8 : 12,
        perKgFee: 5,
        minFee: 50,
        surgeMultiplier: 1,
        taxPercent: 15,
      },
    });
  }

  // 8) Coupon
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: CouponType.PERCENTAGE,
      value: 10,
      maxDiscount: 100,
      perUserLimit: 1,
      isActive: true,
    },
  });

  // 9) Global settings
  const settings: Array<[string, unknown]> = [
    ['platform.name', 'Delivery Platform'],
    ['platform.currency', 'ETB'],
    ['platform.supportEmail', 'support@delivery.local'],
    ['delivery.maxWeightKg', 50],
  ];
  for (const [key, value] of settings) {
    const existing = await prisma.setting.findFirst({ where: { scope: 'GLOBAL', ownerId: null, key } });
    if (existing) {
      await prisma.setting.update({ where: { id: existing.id }, data: { value: value as object } });
    } else {
      await prisma.setting.create({ data: { scope: 'GLOBAL', key, value: value as object } });
    }
  }

  // 10) Demo support tickets + notifications + customer addresses
  const supportUser = await prisma.user.findUnique({ where: { email: 'support@delivery.local' } });
  if (supportUser && customerUser) {
    const existingTicket = await prisma.supportTicket.findFirst({ where: { ticketNumber: 'TIC-DEMO-001' } });
    if (!existingTicket) {
      await prisma.supportTicket.create({
        data: {
          ticketNumber: 'TIC-DEMO-001',
          subject: 'Package arrived damaged (demo)',
          category: 'PACKAGE',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          requesterId: customerUser.id,
          assigneeId: supportUser.id,
          messages: {
            create: [
              { authorId: customerUser.id, body: 'The box was crushed on delivery. Order ORD-2026-000001.' },
              { authorId: supportUser.id, body: 'Sorry about that! We are arranging a replacement shipment.' },
              { authorId: supportUser.id, body: 'Internal: check courier handling log.', isInternal: true },
            ],
          },
        },
      });
      console.log('  demo support ticket TIC-DEMO-001');
    }

    await prisma.notification.createMany({
      data: [
        {
          userId: customerUser.id,
          type: 'ORDER_STATUS',
          title: 'Order update',
          body: 'Your shipment is out for delivery.',
          status: 'SENT',
          sentAt: new Date(),
        },
        {
          userId: customerUser.id,
          type: 'SUPPORT_REPLY',
          title: 'Support replied',
          body: 'Sara from support responded to your ticket.',
          status: 'SENT',
          sentAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });

    const addrCount = await prisma.address.count({ where: { userId: customerUser.id } });
    if (addrCount === 0) {
      await prisma.address.createMany({
        data: [
          {
            userId: customerUser.id,
            label: 'Home',
            type: 'HOME',
            line1: 'Bole 22, Apt 4',
            city: 'Addis Ababa',
            country: 'ET',
            contactName: 'Casey Customer',
            contactPhone: '+251900000003',
            isDefault: true,
          },
          {
            userId: customerUser.id,
            label: 'Office',
            type: 'WORK',
            line1: 'Kazanchis Business Center',
            city: 'Addis Ababa',
            country: 'ET',
            isDefault: false,
          },
        ],
      });
      console.log('  demo customer addresses');
    }
  }

  console.log('Seed complete. Logins (password: Password123!):');
  console.log('  superadmin@delivery.local / admin@delivery.local');
  console.log('  customer@delivery.local / driver@delivery.local / merchant@delivery.local');
  console.log(`  super admin id: ${superAdmin.id}, customer id: ${customerUser.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
