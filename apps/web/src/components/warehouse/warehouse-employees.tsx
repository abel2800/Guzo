'use client';

import { Users, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function WarehouseEmployees() {
  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Team"
        icon={Users}
        title="Warehouse employees"
        description="Floor staff are platform users with the WAREHOUSE_STAFF role. Admins assign roles from the admin console."
        stats={[
          { label: 'Role', value: 'WAREHOUSE_STAFF' },
          { label: 'Access', value: 'Floor ops' },
          { label: 'Assign', value: 'Admin' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4" /> Staff onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Create or invite the user from Admin → Users.</p>
          <p>2. Assign the <strong className="text-foreground">WAREHOUSE_STAFF</strong> or <strong className="text-foreground">WAREHOUSE_MANAGER</strong> role.</p>
          <p>3. Staff sign in at the warehouse dashboard to receive, sort, and dispatch parcels.</p>
          <p>Shift scheduling and per-warehouse assignment will connect to branch-staff patterns in a later phase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
