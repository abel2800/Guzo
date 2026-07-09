'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tags, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createCityZone,
  createPricingRule,
  listCityZones,
  listPricingRules,
  num,
  updateCityZone,
  updatePricingRule,
} from '@/lib/admin-platform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function AdminPricing() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'rules' | 'zones'>('rules');
  const [ruleForm, setRuleForm] = useState({ name: '', deliveryType: 'STANDARD', baseFee: '50' });
  const [zoneForm, setZoneForm] = useState({ city: '', zoneName: '', multiplier: '1' });

  const rulesQ = useQuery({ queryKey: ['admin-pricing-rules'], queryFn: () => listPricingRules({ limit: 20 }) });
  const zonesQ = useQuery({ queryKey: ['admin-city-zones'], queryFn: () => listCityZones({ limit: 20 }) });

  const createRule = useMutation({
    mutationFn: () => createPricingRule({ ...ruleForm, baseFee: Number(ruleForm.baseFee) }),
    onSuccess: () => {
      toast.success('Pricing rule created');
      qc.invalidateQueries({ queryKey: ['admin-pricing-rules'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createZone = useMutation({
    mutationFn: () => createCityZone({ ...zoneForm, multiplier: Number(zoneForm.multiplier) }),
    onSuccess: () => {
      toast.success('City zone created');
      qc.invalidateQueries({ queryKey: ['admin-city-zones'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRule = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updatePricingRule(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pricing-rules'] }),
  });

  const toggleZone = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateCityZone(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-city-zones'] }),
  });

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Revenue engine"
        icon={Tags}
        title="Pricing"
        description="Delivery fee rules and city zone multipliers for dynamic quoting."
        stats={[{ label: 'Rules', value: String(rulesQ.data?.items.length ?? 0) }, { label: 'Zones', value: String(zonesQ.data?.items.length ?? 0) }]}
      />

      <div className="flex gap-2">
        <Button variant={tab === 'rules' ? 'default' : 'outline'} onClick={() => setTab('rules')}>Rules</Button>
        <Button variant={tab === 'zones' ? 'default' : 'outline'} onClick={() => setTab('zones')}>City zones</Button>
      </div>

      {tab === 'rules' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>New rule</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Name</Label><Input value={ruleForm.name} onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Base fee (ETB)</Label><Input value={ruleForm.baseFee} onChange={(e) => setRuleForm((f) => ({ ...f, baseFee: e.target.value }))} /></div>
              <Button disabled={createRule.isPending} onClick={() => createRule.mutate()}>
                {createRule.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create rule
              </Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {rulesQ.isLoading ? <Skeleton className="h-32" /> : rulesQ.data?.items.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-white">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.deliveryType} · ETB {num(r.baseFee)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggleRule.mutate({ id: r.id, isActive: !r.isActive })}>
                    <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Off'}</Badge>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>New city zone</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>City</Label><Input value={zoneForm.city} onChange={(e) => setZoneForm((f) => ({ ...f, city: e.target.value }))} /></div>
              <div><Label>Zone name</Label><Input value={zoneForm.zoneName} onChange={(e) => setZoneForm((f) => ({ ...f, zoneName: e.target.value }))} /></div>
              <div><Label>Multiplier</Label><Input value={zoneForm.multiplier} onChange={(e) => setZoneForm((f) => ({ ...f, multiplier: e.target.value }))} /></div>
              <Button disabled={createZone.isPending} onClick={() => createZone.mutate()}>
                {createZone.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create zone
              </Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {zonesQ.isLoading ? <Skeleton className="h-32" /> : zonesQ.data?.items.map((z) => (
              <Card key={z.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-white">{z.city}</p>
                    <p className="text-sm text-muted-foreground">{z.zoneName} · ×{num(z.multiplier)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggleZone.mutate({ id: z.id, isActive: !z.isActive })}>
                    <Badge variant={z.isActive ? 'success' : 'secondary'}>{z.isActive ? 'Active' : 'Off'}</Badge>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
