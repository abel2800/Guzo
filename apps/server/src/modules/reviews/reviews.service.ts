import { reviewsRepository, ReviewRepository } from './reviews.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';
import type { CreateReviewDto, UpdateReviewDto } from './reviews.dto.js';
import { prisma } from '@delivery/database';

export class ReviewService {
  constructor(private readonly repo: ReviewRepository = reviewsRepository) {}

  async list(query: ParsedListQuery): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { items, total } = await this.repo.list({
      skip: query.skip,
      take: query.take,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      filters: query.filters,
    });
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  async getById(id: string): Promise<unknown> {
    const item = await this.repo.findById(id);
    if (!item) throw ApiError.notFound('Review not found');
    return item;
  }

  create(dto: CreateReviewDto): Promise<unknown> {
    return this.repo.create(dto);
  }

  async createForOrder(userId: string, orderId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) throw ApiError.badRequest('rating must be 1-5');

    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw ApiError.badRequest('Customer profile required');

    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId: customer.id, status: 'DELIVERED' },
      include: { delivery: { select: { driverId: true } } },
    });
    if (!order) throw ApiError.notFound('Delivered order not found');

    const existing = await prisma.review.findFirst({
      where: { authorId: userId, orderId, targetType: 'DRIVER' },
    });
    if (existing) throw ApiError.conflict('You already rated this delivery');

    const driverId = order.delivery?.driverId;
    if (!driverId) throw ApiError.badRequest('No driver assigned to rate');

    const review = await prisma.review.create({
      data: {
        authorId: userId,
        targetType: 'DRIVER',
        targetId: driverId,
        orderId,
        rating,
        comment,
      },
    });

    const agg = await prisma.review.aggregate({
      _avg: { rating: true },
      where: { targetType: 'DRIVER', targetId: driverId },
    });
    await prisma.driver.update({
      where: { id: driverId },
      data: { rating: agg._avg.rating ?? 0 },
    });

    return review;
  }

  async pendingForCustomer(userId: string) {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) return [];

    const orders = await prisma.order.findMany({
      where: { customerId: customer.id, status: 'DELIVERED' },
      orderBy: { deliveredAt: 'desc' },
      take: 20,
      select: {
        id: true,
        orderNumber: true,
        deliveredAt: true,
        delivery: { select: { driver: { select: { driverCode: true, user: { select: { firstName: true, lastName: true } } } } } },
      },
    });

    const reviewed = await prisma.review.findMany({
      where: { authorId: userId, orderId: { in: orders.map((o) => o.id) } },
      select: { orderId: true },
    });
    const reviewedSet = new Set(reviewed.map((r) => r.orderId));

    return orders.filter((o) => !reviewedSet.has(o.id));
  }

  async update(id: string, dto: UpdateReviewDto): Promise<unknown> {
    await this.getById(id);
    return this.repo.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.repo.delete(id);
  }
}

export const reviewsService = new ReviewService();
