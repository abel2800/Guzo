'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FileText, Clock, Truck, Boxes } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';
import type { RoleSlug } from '@/lib/roles';

const REPORT_LINKS: Array<{ title: string; description: string; href: string; icon: typeof FileText }> = [
  { title: 'Inventory aging', description: 'Parcels sitting too long in storage', href: 'aging', icon: Clock },
  { title: 'Sorting lanes', description: 'Stock grouped by destination city', href: 'sorting', icon: Boxes },
  { title: 'Truck manifests', description: 'Outbound and inbound transfer logs', href: 'manifests', icon: Truck },
  { title: 'Live trucks', description: 'GPS map of manifests in transit', href: 'trucks', icon: Truck },
  { title: 'Cross transfer', description: 'Move stock between warehouses', href: 'transfer', icon: FileText },
];

export function WarehouseReports() {
  const params = useParams();
  const role = (params?.role as RoleSlug) ?? 'warehouse-manager';
  const base = `/dashboard/${role}`;

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Analytics"
        icon={FileText}
        title="Warehouse reports"
        description="Quick links to operational reports for capacity planning and SLA tracking."
        stats={[
          { label: 'Reports', value: String(REPORT_LINKS.length) },
          { label: 'Refresh', value: 'Live' },
          { label: 'Export', value: 'Soon' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_LINKS.map((item) => (
          <Link key={item.href} href={`${base}/${item.href}`}>
            <Card className="h-full transition hover:border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-primary">Open report →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
