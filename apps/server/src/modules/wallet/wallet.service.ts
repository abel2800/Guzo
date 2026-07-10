import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';

type BalanceHolder = { holderType: 'CUSTOMER' | 'MERCHANT' | 'NONE'; balance: number };

export class WalletService {
  private async resolveBalance(userId: string): Promise<BalanceHolder> {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (customer) {
      return { holderType: 'CUSTOMER', balance: Number(customer.walletBalance) };
    }
    const merchant = await prisma.merchant.findUnique({ where: { userId } });
    if (merchant) {
      return { holderType: 'MERCHANT', balance: Number(merchant.walletBalance) };
    }
    return { holderType: 'NONE', balance: 0 };
  }

  async summary(userId: string) {
    const holder = await this.resolveBalance(userId);
    return {
      balance: holder.balance,
      currency: 'ETB',
      holderType: holder.holderType,
    };
  }

  async transactions(userId: string, query: ParsedListQuery) {
    const [items, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      prisma.walletTransaction.count({ where: { userId } }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        currency: t.currency,
        reference: t.reference ?? '',
        description: t.description ?? '',
        createdAt: t.createdAt.toISOString(),
      })),
      meta: buildMeta(query.page, query.limit, total),
    };
  }

  async topUp(userId: string, amount: number, description?: string) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw ApiError.badRequest('Amount must be positive');
    }
    const holder = await this.resolveBalance(userId);
    if (holder.holderType === 'NONE') {
      throw ApiError.badRequest('Wallet not available for this account type');
    }

    const newBalance = holder.balance + amount;
    const txn = await prisma.$transaction(async (tx) => {
      if (holder.holderType === 'CUSTOMER') {
        await tx.customer.update({ where: { userId }, data: { walletBalance: newBalance } });
      } else {
        await tx.merchant.update({ where: { userId }, data: { walletBalance: newBalance } });
      }
      return tx.walletTransaction.create({
        data: {
          userId,
          type: 'CREDIT',
          amount,
          balanceAfter: newBalance,
          currency: 'ETB',
          reference: 'TOPUP',
          description: description ?? 'Wallet top-up',
        },
      });
    });

    return {
      balance: newBalance,
      currency: 'ETB',
      transaction: {
        id: txn.id,
        type: txn.type,
        amount: Number(txn.amount),
      },
    };
  }
}

export const walletService = new WalletService();
