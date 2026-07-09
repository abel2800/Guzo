'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { listRoles } from '@/lib/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function AdminRoles() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-roles'], queryFn: listRoles });
  const items = data ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero eyebrow="RBAC" icon={ShieldCheck} title="Roles" description="System and custom roles that gate dashboard access." stats={[]} />
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No roles" description="Roles are seeded at install." icon={ShieldCheck} />
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {items.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-white">{r.name}</p>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                </div>
                {r.isSystem && <Badge variant="outline">System</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
