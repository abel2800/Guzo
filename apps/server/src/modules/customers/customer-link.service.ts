import { prisma } from '@delivery/database';
import type { Prisma } from '@delivery/database';
import { isWalkInEmail, normalizePhone, phoneLookupVariants } from '../../utils/phone.js';

export async function findUserByPhoneVariants(phone: string) {
  const variants = phoneLookupVariants(phone);
  return prisma.user.findFirst({
    where: { phone: { in: variants } },
    orderBy: { createdAt: 'asc' },
    include: { customer: true },
  });
}

export function customerOrderAccessFilter(input: {
  customerId?: string;
  userId: string;
  phone?: string | null;
  scope?: 'sent' | 'incoming' | 'all';
}): Prisma.OrderWhereInput {
  const phoneVariants = input.phone ? phoneLookupVariants(input.phone) : [];
  const sent: Prisma.OrderWhereInput = input.customerId ? { customerId: input.customerId } : { id: '__none__' };
  const incoming: Prisma.OrderWhereInput = {
    OR: [
      { receiverUserId: input.userId },
      ...(phoneVariants.length ? [{ receiverPhone: { in: phoneVariants } }] : []),
    ],
  };

  if (input.scope === 'incoming') return incoming;
  if (input.scope === 'sent') return sent;
  return { OR: [sent, incoming] };
}

/** Link walk-in branch orders and receiver parcels to a real customer account. */
export async function linkOrdersToCustomerAccount(userId: string, phone?: string | null): Promise<void> {
  if (!phone?.trim()) return;

  const variants = phoneLookupVariants(phone);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customer: true },
  });
  if (!user?.customer) return;

  const normalized = normalizePhone(phone);
  if (user.phone !== normalized) {
    await prisma.user.update({ where: { id: userId }, data: { phone: normalized } });
  }

  await prisma.order.updateMany({
    where: { receiverUserId: null, receiverPhone: { in: variants } },
    data: { receiverUserId: userId },
  });

  const walkInUsers = await prisma.user.findMany({
    where: {
      phone: { in: variants },
      id: { not: userId },
      email: { endsWith: '@walkin.guzo.local' },
    },
    include: { customer: true },
  });

  for (const walkIn of walkInUsers) {
    if (!walkIn.customer) continue;
    await prisma.order.updateMany({
      where: { customerId: walkIn.customer.id },
      data: { customerId: user.customer.id },
    });
  }
}

export async function upgradeWalkInCustomer(input: {
  walkInUserId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const normalized = normalizePhone(input.phone);
  return prisma.user.update({
    where: { id: input.walkInUserId },
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: normalized,
      status: 'ACTIVE',
    },
    include: {
      avatar: true,
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
    },
  });
}

export { isWalkInEmail };
