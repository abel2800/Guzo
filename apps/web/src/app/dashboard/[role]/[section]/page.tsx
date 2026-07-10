'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';
import { ROLE_CONFIG, type RoleSlug } from '@/lib/roles';
import { SECTION_REGISTRY } from '@/components/dashboard/section-registry';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SectionPage() {
  const params = useParams();
  const slug = params.role as RoleSlug;
  const section = params.section as string;
  const config = ROLE_CONFIG[slug];

    const Feature = SECTION_REGISTRY[`${slug}/${section}`];
  if (Feature) return <Feature />;

  const item = config?.nav.find((n) => n.href === section);
  const title = item?.title ?? section?.replace(/-/g, ' ');
  const Icon = item?.icon ?? Construction;

  return (
    <div className="space-y-6">
      <div className="dashboard-hero">
        <div className="dashboard-orb -right-6 top-0 h-24 w-24 bg-guzo-primary/20" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-guzo-primary/15 text-guzo-primary shadow-[0_0_30px_rgba(34,197,94,0.18)]">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-guzo-primary">{config?.label} experience</p>
              <h1 className="text-3xl font-bold capitalize tracking-tight text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground">{config?.label} module</p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit border-border bg-muted/50 text-foreground">
            Coming next phase
          </Badge>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Construction className="h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-semibold capitalize text-foreground">{title}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              This module is scaffolded and routed. Its full UI (tables, filters, forms, charts and
              real-time data) will be built in the next phase. The backend endpoints already exist.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
