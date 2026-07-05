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

  // Fully-built feature for this role/section, if one is registered.
  const Feature = SECTION_REGISTRY[`${slug}/${section}`];
  if (Feature) return <Feature />;

  const item = config?.nav.find((n) => n.href === section);
  const title = item?.title ?? section?.replace(/-/g, ' ');
  const Icon = item?.icon ?? Construction;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold capitalize tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{config?.label} module</p>
          </div>
        </div>
        <Badge variant="secondary">Coming next phase</Badge>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Construction className="h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-semibold capitalize">{title}</p>
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
