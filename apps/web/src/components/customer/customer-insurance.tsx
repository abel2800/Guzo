'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { listInsuranceClaims, submitInsuranceClaim } from '@/lib/platform';
import { listOrders } from '@/lib/orders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyPanel, FuturisticHero, PanelSelect } from '@/components/dashboard/futuristic-primitives';

export function CustomerInsuranceClaims() {
  const qc = useQueryClient();
  const [orderId, setOrderId] = useState('');
  const [description, setDescription] = useState('');

  const claimsQ = useQuery({ queryKey: ['insurance-claims'], queryFn: () => listInsuranceClaims({ limit: 20 }) });
  const ordersQ = useQuery({
    queryKey: ['insured-orders'],
    queryFn: () => listOrders({ limit: 20, status: 'DELIVERED' }),
  });

  const submitMut = useMutation({
    mutationFn: () => submitInsuranceClaim({ orderId, description }),
    onSuccess: () => {
      toast.success('Claim submitted');
      setDescription('');
      qc.invalidateQueries({ queryKey: ['insurance-claims'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const insuredOrders = (ordersQ.data?.items ?? []).filter((o) => (o as { hasInsurance?: boolean }).hasInsurance);

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Protection"
        icon={Shield}
        title="Insurance claims"
        description="File a claim for insured parcels that were lost or damaged in transit."
        stats={[]}
      />
      <Card>
        <CardContent className="space-y-3 p-4">
          <div>
            <Label>Insured order</Label>
            <PanelSelect className="mt-1" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">Select order…</option>
              {insuredOrders.map((o) => (
                <option key={o.id} value={o.id}>{o.orderNumber}</option>
              ))}
            </PanelSelect>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" />
          </div>
          <Button disabled={!orderId || submitMut.isPending} onClick={() => submitMut.mutate()}>
            {submitMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit claim
          </Button>
        </CardContent>
      </Card>

      {claimsQ.data?.items.length ? (
        <div className="space-y-2">
          {claimsQ.data.items.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-mono text-foreground">{c.order?.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                </div>
                <Badge>{c.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyPanel title="No claims" description="Your submitted claims appear here." icon={Shield} />
      )}
    </div>
  );
}
