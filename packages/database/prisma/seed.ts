import { PrismaClient, CouponType, DeliveryType, VehicleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'OPERATIONS_MANAGER',
  'WAREHOUSE_MANAGER',
  'WAREHOUSE_STAFF',
  'BRANCH_STAFF',
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

      for (const roleName of ['SUPER_ADMIN', 'ADMIN']) {
    await prisma.rolePermission.createMany({
      data: allPermissions.map((p) => ({ roleId: roleByName[roleName].id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
    const customerPerms = allPermissions.filter((p) =>
    ['orders.create', 'orders.read', 'packages.read', 'tracking.read', 'reviews.create', 'payments.read'].includes(p.key),
  );
  await prisma.rolePermission.createMany({
    data: customerPerms.map((p) => ({ roleId: roleByName.CUSTOMER.id, permissionId: p.id })),
    skipDuplicates: true,
  });
    const driverPerms = allPermissions.filter((p) =>
    ['orders.read', 'tracking.create', 'tracking.read', 'packages.read', 'packages.update'].includes(p.key),
  );
  await prisma.rolePermission.createMany({
    data: driverPerms.map((p) => ({ roleId: roleByName.DRIVER.id, permissionId: p.id })),
    skipDuplicates: true,
  });

    const opsPerms = allPermissions.filter((p) =>
    ['orders', 'packages', 'drivers', 'tracking', 'warehouses', 'vehicles', 'reports', 'analytics'].includes(
      p.resource,
    ),
  );
  await prisma.rolePermission.createMany({
    data: opsPerms.map((p) => ({ roleId: roleByName.OPERATIONS_MANAGER.id, permissionId: p.id })),
    skipDuplicates: true,
  });

    const whPerms = allPermissions.filter((p) =>
    ['warehouses', 'packages', 'tracking', 'reports'].includes(p.resource),
  );
  await prisma.rolePermission.createMany({
    data: whPerms.map((p) => ({ roleId: roleByName.WAREHOUSE_MANAGER.id, permissionId: p.id })),
    skipDuplicates: true,
  });

    const whStaffPerms = allPermissions.filter((p) =>
    ['packages.read', 'packages.update', 'tracking.read', 'tracking.create', 'warehouses.read'].includes(p.key),
  );
  await prisma.rolePermission.createMany({
    data: whStaffPerms.map((p) => ({ roleId: roleByName.WAREHOUSE_STAFF.id, permissionId: p.id })),
    skipDuplicates: true,
  });

    const branchPerms = allPermissions.filter((p) =>
    ['packages.read', 'packages.update', 'tracking.read', 'tracking.create', 'orders.read', 'orders.create'].includes(p.key),
  );
  await prisma.rolePermission.createMany({
    data: branchPerms.map((p) => ({ roleId: roleByName.BRANCH_STAFF.id, permissionId: p.id })),
    skipDuplicates: true,
  });

    const financePerms = allPermissions.filter((p) =>
    ['payments', 'reports', 'analytics', 'coupons', 'pricing'].includes(p.resource),
  );
  await prisma.rolePermission.createMany({
    data: financePerms.map((p) => ({ roleId: roleByName.FINANCE.id, permissionId: p.id })),
    skipDuplicates: true,
  });

    const supportPerms = allPermissions.filter((p) =>
    ['tickets', 'reviews'].includes(p.resource) ||
    ['orders.read', 'customers.read', 'tracking.read'].includes(p.key),
  );
  await prisma.rolePermission.createMany({
    data: supportPerms.map((p) => ({ roleId: roleByName.SUPPORT.id, permissionId: p.id })),
    skipDuplicates: true,
  });
  console.log('  role-permission mappings done');

    const demoPassword = process.env.SEED_DEMO_PASSWORD;
    if (!demoPassword) {
      throw new Error('Set SEED_DEMO_PASSWORD in your environment before running db:seed.');
    }
    const passwordHash = await bcrypt.hash(demoPassword, 10);

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

    const staff: Array<{ email: string; phone: string; first: string; last: string; role: string }> = [
    { email: 'ops@delivery.local', phone: '+251900000006', first: 'Olivia', last: 'Operations', role: 'OPERATIONS_MANAGER' },
    { email: 'warehouse.manager@delivery.local', phone: '+251900000007', first: 'Wendy', last: 'Manager', role: 'WAREHOUSE_MANAGER' },
    { email: 'warehouse.staff@delivery.local', phone: '+251900000008', first: 'Sam', last: 'Stock', role: 'WAREHOUSE_STAFF' },
    { email: 'branch.staff@delivery.local', phone: '+251900000011', first: 'Betty', last: 'Branch', role: 'BRANCH_STAFF' },
    { email: 'support@delivery.local', phone: '+251900000009', first: 'Sara', last: 'Support', role: 'SUPPORT' },
    { email: 'finance@delivery.local', phone: '+251900000010', first: 'Frank', last: 'Finance', role: 'FINANCE' },
  ];
  for (const s of staff) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: { status: 'ACTIVE', emailVerifiedAt: new Date() },
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

  console.log('  demo users created');

    const branches = [
    { id: 'br_add_bole', code: 'BR-ADD-BOLE', name: 'Guzo Bole', line1: 'Bole Road', city: 'Addis Ababa', latitude: 8.9972, longitude: 38.7897, phone: '+251911000001', openingHours: 'Mon-Sat 8:00-20:00', queueLevel: 2 },
    { id: 'br_add_piassa', code: 'BR-ADD-PIASSA', name: 'Guzo Piassa', line1: 'Churchill Ave', city: 'Addis Ababa', latitude: 9.0336, longitude: 38.7465, phone: '+251911000002', openingHours: 'Mon-Sat 8:00-20:00', queueLevel: 1 },
    { id: 'br_haw_center', code: 'BR-HAW-CTR', name: 'Guzo Hawassa', line1: 'Main Street', city: 'Hawassa', latitude: 7.0621, longitude: 38.4764, phone: '+251911000003', openingHours: 'Mon-Sat 8:00-18:00', queueLevel: 0 },
    { id: 'br_adm_center', code: 'BR-ADM-CTR', name: 'Guzo Adama', line1: 'Station Road', city: 'Adama', latitude: 8.54, longitude: 39.27, phone: '+251911000004', openingHours: 'Mon-Sat 8:00-18:00', queueLevel: 0 },
  ];
  for (const b of branches) {
    await prisma.guzoBranch.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }

  const branchStaffUser = await prisma.user.findUnique({ where: { email: 'branch.staff@delivery.local' } });
  if (branchStaffUser) {
    await prisma.guzoBranchStaff.upsert({
      where: { userId_branchId: { userId: branchStaffUser.id, branchId: 'br_add_bole' } },
      update: {},
      create: { userId: branchStaffUser.id, branchId: 'br_add_bole' },
    });
    console.log('  branch staff assigned to Guzo Bole (br_add_bole)');
  }

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

  console.log('Seed complete. Demo accounts created (see seeded user emails in the output above).');
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
