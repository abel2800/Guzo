/* eslint-disable */
// ============================================================================
// Module scaffolder. Generates the standard 8-file structure
// (controller/service/repository/route/validator/dto/types/constants) for each
// CRUD module so every module is consistent. Re-runnable & non-destructive:
// it never overwrites an existing file (so hand-written modules stay intact).
//
//   node scripts/scaffold-modules.mjs
// ============================================================================
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'apps', 'server', 'src', 'modules');

// model = Prisma delegate (camelCase). searchFields = string columns for ?search=.
// roles = who may access the management routes. write = roles allowed to mutate.
const MODULES = [
  { name: 'roles', model: 'role', pascal: 'Role', searchFields: ['name', 'description'], roles: ['ADMIN'], write: ['ADMIN'] },
  { name: 'permissions', model: 'permission', pascal: 'Permission', searchFields: ['key', 'resource'], roles: ['ADMIN'], write: ['ADMIN'] },
  { name: 'customers', model: 'customer', pascal: 'Customer', searchFields: ['customerCode', 'companyName'], roles: ['ADMIN', 'SUPPORT'], write: ['ADMIN'] },
  { name: 'drivers', model: 'driver', pascal: 'Driver', searchFields: ['driverCode', 'licenseNumber'], roles: ['ADMIN', 'SUPPORT'], write: ['ADMIN'] },
  { name: 'merchants', model: 'merchant', pascal: 'Merchant', searchFields: ['merchantCode', 'businessName'], roles: ['ADMIN', 'SUPPORT'], write: ['ADMIN'] },
  { name: 'warehouses', model: 'warehouse', pascal: 'Warehouse', searchFields: ['code', 'name', 'city'], roles: ['ADMIN', 'WAREHOUSE_STAFF'], write: ['ADMIN'] },
  { name: 'packages', model: 'package', pascal: 'Package', searchFields: ['trackingNumber', 'barcode'], roles: ['ADMIN', 'WAREHOUSE_STAFF', 'SUPPORT'], write: ['ADMIN', 'WAREHOUSE_STAFF'] },
  { name: 'deliveries', model: 'delivery', pascal: 'Delivery', searchFields: ['recipientName'], roles: ['ADMIN', 'SUPPORT', 'DRIVER'], write: ['ADMIN', 'DRIVER'] },
  { name: 'vehicles', model: 'vehicle', pascal: 'Vehicle', searchFields: ['plateNumber', 'brand', 'model'], roles: ['ADMIN'], write: ['ADMIN'] },
  { name: 'pricing', model: 'pricingRule', pascal: 'PricingRule', searchFields: ['name'], roles: ['ADMIN'], write: ['ADMIN'] },
  { name: 'coupons', model: 'coupon', pascal: 'Coupon', searchFields: ['code'], roles: ['ADMIN'], write: ['ADMIN'] },
  { name: 'notifications', model: 'notification', pascal: 'Notification', searchFields: ['title', 'type'], roles: ['ADMIN', 'SUPPORT'], write: ['ADMIN'] },
  { name: 'payments', model: 'payment', pascal: 'Payment', searchFields: ['reference', 'providerRef'], roles: ['ADMIN', 'SUPPORT'], write: ['ADMIN'] },
  { name: 'reviews', model: 'review', pascal: 'Review', searchFields: ['comment'], roles: ['ADMIN', 'SUPPORT'], write: ['ADMIN'] },
  { name: 'support', model: 'supportTicket', pascal: 'SupportTicket', searchFields: ['ticketNumber', 'subject'], roles: ['ADMIN', 'SUPPORT'], write: ['ADMIN', 'SUPPORT'] },
  { name: 'settings', model: 'setting', pascal: 'Setting', searchFields: ['key'], roles: ['ADMIN'], write: ['ADMIN'] },
];

const tpl = {
  constants: (m) => `export const ${m.name.toUpperCase()}_MESSAGES = {
  FETCHED: '${m.pascal} list fetched',
  FOUND: '${m.pascal} found',
  CREATED: '${m.pascal} created',
  UPDATED: '${m.pascal} updated',
  DELETED: '${m.pascal} deleted',
} as const;

export const ${m.pascal.toUpperCase()}_SEARCH_FIELDS = ${JSON.stringify(m.searchFields)} as const;
`,

  dto: (m) => `// DTOs for the ${m.name} module. Refine fields as the module grows.
export type Create${m.pascal}Dto = Record<string, unknown>;
export type Update${m.pascal}Dto = Record<string, unknown>;
`,

  types: (m) => `// Domain types for the ${m.name} module.
export interface ${m.pascal}ListResult<T> {
  items: T[];
  total: number;
}
`,

  validator: (m) => `import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the ${m.name} contract solidifies.
export const create${m.pascal}Validator = [body().custom(() => true)];
export const update${m.pascal}Validator = [param('id').isString().notEmpty()];
`,

  repository: (m) => `import { prisma } from '@delivery/database';

/**
 * Repository for ${m.name}. Generic CRUD over the Prisma "${m.model}" delegate.
 * The delegate is accessed dynamically so this stays small; tighten types as
 * the module matures (mirror the fully-typed users/auth repositories).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const delegate = (prisma as any).${m.model};

export interface ${m.pascal}ListParams {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: Record<string, any>;
}

export class ${m.pascal}Repository {
  async list(params: ${m.pascal}ListParams) {
    const searchFields = ${JSON.stringify(m.searchFields)};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { ...(params.filters ?? {}) };
    if (params.search && searchFields.length) {
      where.OR = searchFields.map((f) => ({ [f]: { contains: params.search, mode: 'insensitive' } }));
    }
    const orderBy = params.sortBy ? { [params.sortBy]: params.sortOrder } : { createdAt: params.sortOrder };
    const [items, total] = await Promise.all([
      delegate.findMany({ where, skip: params.skip, take: params.take, orderBy }),
      delegate.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return delegate.findUnique({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(data: any) {
    return delegate.create({ data });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(id: string, data: any) {
    return delegate.update({ where: { id }, data });
  }

  delete(id: string) {
    return delegate.delete({ where: { id } });
  }
}

export const ${m.name}Repository = new ${m.pascal}Repository();
`,

  service: (m) => `import { ${m.name}Repository, ${m.pascal}Repository } from './${m.name}.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';
import type { Create${m.pascal}Dto, Update${m.pascal}Dto } from './${m.name}.dto.js';

export class ${m.pascal}Service {
  constructor(private readonly repo: ${m.pascal}Repository = ${m.name}Repository) {}

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
    if (!item) throw ApiError.notFound('${m.pascal} not found');
    return item;
  }

  create(dto: Create${m.pascal}Dto): Promise<unknown> {
    return this.repo.create(dto);
  }

  async update(id: string, dto: Update${m.pascal}Dto): Promise<unknown> {
    await this.getById(id);
    return this.repo.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.repo.delete(id);
  }
}

export const ${m.name}Service = new ${m.pascal}Service();
`,

  controller: (m) => `import type { Request, Response } from 'express';
import { ${m.name}Service } from './${m.name}.service.js';
import { ${m.name.toUpperCase()}_MESSAGES } from './${m.name}.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const ${m.name}Controller = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await ${m.name}Service.list(parseListQuery(req));
    return ok(res, items, ${m.name.toUpperCase()}_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await ${m.name}Service.getById(req.params.id);
    return ok(res, item, ${m.name.toUpperCase()}_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await ${m.name}Service.create(req.body);
    return created(res, item, ${m.name.toUpperCase()}_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await ${m.name}Service.update(req.params.id, req.body);
    return ok(res, item, ${m.name.toUpperCase()}_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await ${m.name}Service.remove(req.params.id);
    return noContent(res);
  }),
};
`,

  routes: (m) => {
    const readRoles = m.roles.map((r) => `'${r}'`).join(', ');
    const writeRoles = m.write.map((r) => `'${r}'`).join(', ');
    return `import { Router } from 'express';
import { ${m.name}Controller } from './${m.name}.controller.js';
import { idParamValidator, create${m.pascal}Validator, update${m.pascal}Validator } from './${m.name}.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize(${readRoles}), ${m.name}Controller.list);
router.get('/:id', authorize(${readRoles}), validate(idParamValidator), ${m.name}Controller.getById);
router.post('/', authorize(${writeRoles}), validate(create${m.pascal}Validator), ${m.name}Controller.create);
router.patch('/:id', authorize(${writeRoles}), validate(update${m.pascal}Validator), ${m.name}Controller.update);
router.delete('/:id', authorize(${writeRoles}), validate(idParamValidator), ${m.name}Controller.remove);

export default router;
`;
  },
};

let createdCount = 0;
let skipped = 0;
for (const m of MODULES) {
  const dir = join(MODULES_DIR, m.name);
  mkdirSync(dir, { recursive: true });
  const files = {
    [`${m.name}.constants.ts`]: tpl.constants(m),
    [`${m.name}.dto.ts`]: tpl.dto(m),
    [`${m.name}.types.ts`]: tpl.types(m),
    [`${m.name}.validator.ts`]: tpl.validator(m),
    [`${m.name}.repository.ts`]: tpl.repository(m),
    [`${m.name}.service.ts`]: tpl.service(m),
    [`${m.name}.controller.ts`]: tpl.controller(m),
    [`${m.name}.routes.ts`]: tpl.routes(m),
  };
  for (const [file, content] of Object.entries(files)) {
    const path = join(dir, file);
    if (existsSync(path)) {
      skipped++;
      continue;
    }
    writeFileSync(path, content, 'utf8');
    createdCount++;
  }
}

console.log(`Scaffold complete. ${createdCount} files written, ${skipped} skipped (already existed).`);
console.log(`Modules: ${MODULES.map((m) => m.name).join(', ')}`);
