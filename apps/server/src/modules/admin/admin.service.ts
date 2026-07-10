import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { filePublicUrl } from '../../utils/file-url.js';
import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';

const userAvatarSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  status: true,
  gender: true,
  createdAt: true,
  lastLoginAt: true,
  avatar: { select: { storageKey: true } },
  roles: { include: { role: { select: { name: true } } } },
} as const;

function mapUserBase(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  gender?: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  avatar?: { storageKey: string } | null;
  roles: { role: { name: string } }[];
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    status: user.status,
    gender: user.gender,
    roles: user.roles.map((r) => r.role.name),
    avatarUrl: filePublicUrl(user.avatar?.storageKey),
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

export async function getPendingApprovals() {
  const [pendingUsers, pendingDrivers, pendingMerchants, pendingBranchStaff] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null, status: 'PENDING' } }),
    prisma.driver.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.user.count({
      where: {
        deletedAt: null,
        status: 'PENDING',
        roles: { some: { role: { name: 'MERCHANT' } } },
      },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        status: 'PENDING',
        roles: { some: { role: { name: 'BRANCH_STAFF' } } },
      },
    }),
  ]);

  return { pendingUsers, pendingDrivers, pendingMerchants, pendingBranchStaff };
}

export async function approveDriverAccount(driverId: string, adminUserId: string) {
  const existing = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { id: true, userId: true, user: { select: { firstName: true } } },
  });
  if (!existing) throw ApiError.notFound('Driver not found');

  const driver = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: existing.userId }, data: { status: 'ACTIVE' } });
    return tx.driver.update({
      where: { id: driverId },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedById: adminUserId,
        isAvailable: true,
      },
      include: {
        user: { select: userAvatarSelect },
      },
    });
  });

  eventBus.publish(DOMAIN_EVENTS.NOTIFICATION_REQUESTED, {
    userId: existing.userId,
    type: 'ACCOUNT_APPROVED',
    title: 'Driver account approved',
    body: `Hi ${existing.user.firstName}, your driver account has been approved. You can sign in now.`,
  });

  return serializeDriver(driver);
}

export async function approveUserAccount(userId: string, adminUserId?: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, firstName: true, status: true },
  });
  if (!user) throw ApiError.notFound('User not found');

  if (user.status !== 'ACTIVE') {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } }),
      prisma.driver.updateMany({
        where: { userId },
        data: {
          approvalStatus: 'APPROVED',
          approvedAt: new Date(),
          ...(adminUserId ? { approvedById: adminUserId } : {}),
          isAvailable: true,
        },
      }),
      prisma.merchant.updateMany({ where: { userId }, data: { isVerified: true } }),
    ]);

    eventBus.publish(DOMAIN_EVENTS.NOTIFICATION_REQUESTED, {
      userId,
      type: 'ACCOUNT_APPROVED',
      title: 'Account approved',
      body: `Hi ${user.firstName}, your account has been approved. You can sign in now.`,
    });
  }

  return getUserAdminDetail(userId);
}

export async function getUserAdminDetail(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      ...userAvatarSelect,
      customer: {
        select: {
          id: true,
          customerCode: true,
          walletBalance: true,
          loyaltyPoints: true,
          _count: { select: { orders: true } },
        },
      },
      driver: {
        select: {
          id: true,
          driverCode: true,
          approvalStatus: true,
          status: true,
          isAvailable: true,
          rating: true,
          totalDeliveries: true,
          currentLat: true,
          currentLng: true,
          lastLocationAt: true,
          earningsBalance: true,
        },
      },
      merchant: {
        select: {
          id: true,
          merchantCode: true,
          businessName: true,
          businessEmail: true,
          businessPhone: true,
          isVerified: true,
          walletBalance: true,
          _count: { select: { orders: true } },
        },
      },
    },
  });
  if (!user) throw ApiError.notFound('User not found');

  const branchAssignments = await prisma.guzoBranchStaff.findMany({
    where: { userId },
    include: {
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
          city: true,
          isActive: true,
          _count: {
            select: {
              inventory: { where: { pickedUpAt: null } },
            },
          },
        },
      },
    },
  });

  const [pendingOrders, activeDeliveries] = await Promise.all([
    prisma.order.count({
      where: {
        status: { in: ['PENDING_PAYMENT', 'CONFIRMED', 'ASSIGNED'] },
        OR: [
          { customer: { userId } },
          { merchant: { userId } },
          { delivery: { driver: { userId } } },
        ],
      },
    }),
    user.driver
      ? prisma.delivery.count({
          where: { driverId: user.driver.id, deliveredAt: null },
        })
      : Promise.resolve(0),
  ]);

  return {
    ...mapUserBase(user),
    customer: user.customer
      ? {
          id: user.customer.id,
          customerCode: user.customer.customerCode,
          walletBalance: Number(user.customer.walletBalance),
          loyaltyPoints: user.customer.loyaltyPoints,
          orderCount: user.customer._count.orders,
        }
      : null,
    driver: user.driver
      ? {
          id: user.driver.id,
          driverCode: user.driver.driverCode,
          approvalStatus: user.driver.approvalStatus,
          status: user.driver.status,
          isAvailable: user.driver.isAvailable,
          isOnline: user.driver.status !== 'OFFLINE',
          rating: Number(user.driver.rating),
          totalDeliveries: user.driver.totalDeliveries,
          earningsBalance: Number(user.driver.earningsBalance),
          currentLat: user.driver.currentLat,
          currentLng: user.driver.currentLng,
          lastLocationAt: user.driver.lastLocationAt?.toISOString() ?? null,
          activeDeliveries,
        }
      : null,
    merchant: user.merchant
      ? {
          id: user.merchant.id,
          merchantCode: user.merchant.merchantCode,
          businessName: user.merchant.businessName,
          businessEmail: user.merchant.businessEmail,
          businessPhone: user.merchant.businessPhone,
          isVerified: user.merchant.isVerified,
          walletBalance: Number(user.merchant.walletBalance),
          orderCount: user.merchant._count.orders,
        }
      : null,
    branches: branchAssignments.map((row) => ({
      id: row.branch.id,
      code: row.branch.code,
      name: row.branch.name,
      city: row.branch.city,
      isActive: row.branch.isActive,
      pendingInventory: row.branch._count.inventory,
      assignedAt: row.assignedAt.toISOString(),
    })),
    pendingOrders,
  };
}

export async function getDriverAdminDetail(driverId: string) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      user: { select: userAvatarSelect },
      deliveries: {
        where: { deliveredAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          order: { select: { orderNumber: true, status: true } },
        },
      },
    },
  });
  if (!driver) throw ApiError.notFound('Driver not found');

  return {
    ...serializeDriver(driver),
    activeDeliveries: driver.deliveries.map((d) => ({
      id: d.id,
      orderNumber: d.order.orderNumber,
      status: d.order.status,
    })),
  };
}

export async function listLiveDrivers() {
  const drivers = await prisma.driver.findMany({
    where: { approvalStatus: 'APPROVED' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: { select: { storageKey: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  return drivers.map(serializeDriver);
}

function serializeDriver(driver: {
  id: string;
  driverCode: string;
  approvalStatus: string;
  status: string;
  isAvailable: boolean;
  rating: { toString(): string } | number | string;
  totalDeliveries: number;
  currentLat: number | null;
  currentLng: number | null;
  lastLocationAt: Date | null;
  createdAt?: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
    status?: string;
    avatar?: { storageKey: string } | null;
  } | null;
}) {
  return {
    id: driver.id,
    driverCode: driver.driverCode,
    approvalStatus: driver.approvalStatus,
    status: driver.status,
    isAvailable: driver.isAvailable,
    isOnline: driver.status !== 'OFFLINE',
    rating: Number(driver.rating),
    totalDeliveries: driver.totalDeliveries,
    currentLat: driver.currentLat,
    currentLng: driver.currentLng,
    lastLocationAt: driver.lastLocationAt?.toISOString() ?? null,
    createdAt: driver.createdAt?.toISOString(),
    user: driver.user
      ? {
          id: driver.user.id,
          firstName: driver.user.firstName,
          lastName: driver.user.lastName,
          phone: driver.user.phone ?? null,
          email: driver.user.email ?? null,
          status: driver.user.status,
          avatarUrl: filePublicUrl(driver.user.avatar?.storageKey),
        }
      : null,
  };
}
