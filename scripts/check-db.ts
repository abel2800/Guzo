import { prisma } from '@delivery/database';

async function main() {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log('Table count:', tables.length);
  console.log('Tables:', tables.map((t) => t.tablename).join(', '));
  const [users, roles, orders] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.order.count(),
  ]);
  console.log('Users:', users, 'Roles:', roles, 'Orders:', orders);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
