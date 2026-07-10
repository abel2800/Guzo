import { randomInt } from 'node:crypto';
import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../config/logger.js';
import { normalizePhone } from '../../utils/phone.js';

const OTP_TTL_MINUTES = 10;
const VERIFICATION_WINDOW_MINUTES = 30;

export class OtpService {
  async send(phone: string): Promise<{ phone: string; message: string }> {
    const normalized = normalizePhone(phone);
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60_000);

    await prisma.phoneOtp.create({
      data: {
        phone: normalized,
        code,
        expiresAt,
      },
    });

    logger.info(`[OTP stub] Send code ${code} to ${normalized}`);
    logger.info(`════════ OTP for ${normalized}: ${code} ════════`);

    return {
      phone: normalized,
      message: 'OTP sent (check server logs in dev)',
    };
  }

  async verify(phone: string, code: string): Promise<void> {
    const normalized = normalizePhone(phone);
    const otp = await prisma.phoneOtp.findFirst({
      where: { phone: normalized, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw ApiError.badRequest('No OTP pending for this phone');
    if (otp.expiresAt < new Date()) throw ApiError.badRequest('OTP expired');
    if (otp.code !== code.trim()) throw ApiError.badRequest('Invalid OTP');

    await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { verifiedAt: new Date() },
    });
  }

  async assertRecentlyVerified(phone: string): Promise<void> {
    const normalized = normalizePhone(phone);
    const otp = await prisma.phoneOtp.findFirst({
      where: { phone: normalized, verifiedAt: { not: null } },
      orderBy: { verifiedAt: 'desc' },
    });

    if (!otp?.verifiedAt) {
      throw ApiError.badRequest('Phone not verified — complete OTP verification first');
    }

    const cutoff = new Date(Date.now() - VERIFICATION_WINDOW_MINUTES * 60_000);
    if (otp.verifiedAt < cutoff) {
      throw ApiError.badRequest('Phone verification expired — request a new OTP');
    }
  }
}

export const otpService = new OtpService();
