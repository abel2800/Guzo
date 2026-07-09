import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { randomBytes } from 'node:crypto';

const POINTS_PER_DELIVERY = 10;
const REFERRAL_BONUS = 50;

export class LoyaltyService {
  async getProfile(userId: string) {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw ApiError.badRequest('Customer profile not found');

    let referralCode = customer.referralCode;
    if (!referralCode) {
      referralCode = `GZ${randomBytes(3).toString('hex').toUpperCase()}`;
      await prisma.customer.update({ where: { id: customer.id }, data: { referralCode } });
    }

    return {
      loyaltyPoints: customer.loyaltyPoints,
      referralCode,
      pointsPerDelivery: POINTS_PER_DELIVERY,
      referralBonus: REFERRAL_BONUS,
    };
  }

  async applyReferral(userId: string, code: string) {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw ApiError.badRequest('Customer profile not found');
    if (customer.referredById) throw ApiError.badRequest('Referral already applied');

    const referrer = await prisma.customer.findFirst({ where: { referralCode: code.trim().toUpperCase() } });
    if (!referrer) throw ApiError.notFound('Invalid referral code');
    if (referrer.id === customer.id) throw ApiError.badRequest('Cannot refer yourself');

    await prisma.$transaction([
      prisma.customer.update({ where: { id: customer.id }, data: { referredById: referrer.id } }),
      prisma.customer.update({
        where: { id: referrer.id },
        data: { loyaltyPoints: { increment: REFERRAL_BONUS } },
      }),
      prisma.customer.update({
        where: { id: customer.id },
        data: { loyaltyPoints: { increment: REFERRAL_BONUS } },
      }),
    ]);

    return { applied: true, bonus: REFERRAL_BONUS };
  }

  async awardDeliveryPoints(customerId: string) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { increment: POINTS_PER_DELIVERY } },
    });
  }
}

export const loyaltyService = new LoyaltyService();
