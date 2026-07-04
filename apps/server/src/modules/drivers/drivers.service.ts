import { driversRepository, DriverRepository } from './drivers.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';
import type { CreateDriverDto, UpdateDriverDto } from './drivers.dto.js';

export class DriverService {
  constructor(private readonly repo: DriverRepository = driversRepository) {}

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
    if (!item) throw ApiError.notFound('Driver not found');
    return item;
  }

  create(dto: CreateDriverDto): Promise<unknown> {
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateDriverDto): Promise<unknown> {
    await this.getById(id);
    return this.repo.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.repo.delete(id);
  }
}

export const driversService = new DriverService();
