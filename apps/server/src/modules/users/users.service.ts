import { usersRepository, UsersRepository } from './users.repository.js';
import type { CreateUserDto, UpdateUserDto } from './users.dto.js';
import type { PublicUser } from './users.types.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword } from '../../utils/password.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';
import { USER_SORTABLE_FIELDS } from './users.constants.js';

type UserRow = NonNullable<Awaited<ReturnType<UsersRepository['findById']>>>;

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  async list(query: ParsedListQuery): Promise<{ items: PublicUser[]; meta: PaginationMeta }> {
    const sortBy = USER_SORTABLE_FIELDS.includes(query.sortBy as never) ? query.sortBy : 'createdAt';
    const { items, total } = await this.repo.list({
      skip: query.skip,
      take: query.take,
      search: query.search,
      status: query.filters.status,
      sortBy,
      sortOrder: query.sortOrder,
    });
    return { items: items.map(toPublic), meta: buildMeta(query.page, query.limit, total) };
  }

  async getById(id: string): Promise<PublicUser> {
    const user = await this.repo.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    return toPublic(user);
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const roleNames = dto.roles?.length ? dto.roles : ['CUSTOMER'];
    const roles = await this.repo.rolesByNames(roleNames);
    if (roles.length !== roleNames.length) throw ApiError.badRequest('One or more roles are invalid');

    const passwordHash = await hashPassword(dto.password);
    const user = await this.repo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      status: 'ACTIVE',
      roles: { create: roles.map((r) => ({ role: { connect: { id: r.id } } })) },
    });
    return toPublic(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    await this.getById(id);
    const user = await this.repo.update(id, dto);
    return toPublic(user);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.repo.softDelete(id);
  }

  async assignRoles(id: string, roleNames: string[]): Promise<PublicUser> {
    await this.getById(id);
    const roles = await this.repo.rolesByNames(roleNames);
    if (roles.length !== roleNames.length) throw ApiError.badRequest('One or more roles are invalid');
    const user = await this.repo.replaceRoles(id, roles.map((r) => r.id));
    return toPublic(user!);
  }
}

function toPublic(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    status: user.status,
    roles: user.roles.map((ur) => ur.role.name),
    createdAt: user.createdAt,
  };
}

export const usersService = new UsersService();
