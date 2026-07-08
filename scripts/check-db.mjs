import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log('Table count:', tables.length);
  console.log('Sample:', tables.slice(0, 10).map((t) => t.tablename).join(', '));
  const [users, roles, orders] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.order.count(),
  ]);
  console.log('Users:', users, 'Roles:', roles, 'Orders:', orders);
} finally {
  await prisma.$disconnect();
}
