import crypto from 'node:crypto';
import { prisma } from '@delivery/database';
import { generateReference } from '@delivery/utils';
import { hashPassword } from '../../utils/password.js';
import { ROLES } from '../../constants/index.js';
import { normalizePhone } from '../../utils/phone.js';
import { findUserByPhoneVariants } from '../customers/customer-link.service.js';

export async function resolveCustomerByPhone(phone: string, name?: string) {
  const normalized = normalizePhone(phone);
  let user = await findUserByPhoneVariants(phone);

  if (!user) {
    const role = await prisma.role.findFirst({ where: { name: ROLES.CUSTOMER } });
    const slug = normalized.replace(/\D/g, '') || Date.now().toString();
    user = await prisma.user.create({
      data: {
        email: `walkin.${slug}@walkin.guzo.local`,
        phone: normalized,
        firstName: name?.trim().split(/\s+/)[0] || 'Walk-in',
        lastName: name?.trim().split(/\s+/).slice(1).join(' ') || 'Customer',
        passwordHash: await hashPassword(crypto.randomUUID()),
        status: 'ACTIVE',
        ...(role ? { roles: { create: [{ roleId: role.id }] } } : {}),
      },
      include: { customer: true },
    });
  } else if (user.phone !== normalized) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { phone: normalized },
      include: { customer: true },
    });
  }

  let customer = user.customer ?? (await prisma.customer.findUnique({ where: { userId: user.id } }));
  if (!customer) {
    customer = await prisma.customer.create({
      data: { userId: user.id, customerCode: generateReference('CUST') },
    });
  }

  return { user, customer };
}

export async function resolveReceiverUserId(phone?: string): Promise<string | null> {
  if (!phone?.trim()) return null;
  const user = await findUserByPhoneVariants(phone);
  return user?.id ?? null;
}
