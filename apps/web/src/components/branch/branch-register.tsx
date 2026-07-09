'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { registerParcelAtBranch, getMyBranches, printBranchLabel, type ParcelLabel } from '@/lib/branch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function BranchRegister() {
  const qc = useQueryClient();
  const { data: branches = [] } = useQuery({ queryKey: ['branch-me'], queryFn: getMyBranches });
  const [branchId, setBranchId] = useState('');
  const activeBranch = branchId || branches[0]?.branchId || '';
  const [label, setLabel] = useState<ParcelLabel | null>(null);
  const [form, setForm] = useState({
    senderPhone: '',
    senderName: '',
    receiverPhone: '',
    receiverName: '',
    dropoffCity: '',
    dropoffLine1: '',
    weightKg: '1',
    description: '',
  });

  const register = useMutation({
    mutationFn: () =>
      registerParcelAtBranch(activeBranch, {
        ...form,
        weightKg: Number(form.weightKg) || 1,
        paymentMethod: 'CASH_ON_DELIVERY',
      }),
    onSuccess: (res) => {
      toast.success(`Registered ${res.package?.trackingNumber}`);
      setLabel(res.label ?? null);
      qc.invalidateQueries({ queryKey: ['branch-stats'] });
      qc.invalidateQueries({ queryKey: ['branch-inventory'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Walk-in"
        icon={UserPlus}
        title="Register parcel"
        description="Drop-off registration for walk-in customers. Sender must have a GUZO account."
        stats={[
          { label: 'Payment', value: 'COD' },
          { label: 'Label', value: 'Print' },
          { label: 'Branch', value: branches.find((b) => b.branchId === activeBranch)?.branch?.code ?? '—' },
        ]}
      />

      {branches.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => (
            <Button key={b.branchId} variant={activeBranch === b.branchId ? 'default' : 'outline'} size="sm" onClick={() => setBranchId(b.branchId)}>
              {b.branch?.name ?? b.branchId}
            </Button>
          ))}
        </div>
      ) : null}

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="space-y-2"><Label>Sender phone</Label><Input value={form.senderPhone} onChange={set('senderPhone')} /></div>
          <div className="space-y-2"><Label>Sender name</Label><Input value={form.senderName} onChange={set('senderName')} /></div>
          <div className="space-y-2"><Label>Receiver phone</Label><Input value={form.receiverPhone} onChange={set('receiverPhone')} /></div>
          <div className="space-y-2"><Label>Receiver name</Label><Input value={form.receiverName} onChange={set('receiverName')} /></div>
          <div className="space-y-2"><Label>Destination city</Label><Input value={form.dropoffCity} onChange={set('dropoffCity')} /></div>
          <div className="space-y-2"><Label>Address</Label><Input value={form.dropoffLine1} onChange={set('dropoffLine1')} /></div>
          <div className="space-y-2"><Label>Weight (kg)</Label><Input value={form.weightKg} onChange={set('weightKg')} /></div>
          <div className="space-y-2"><Label>Contents</Label><Input value={form.description} onChange={set('description')} /></div>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <Button disabled={!activeBranch || register.isPending} onClick={() => register.mutate()}>Register parcel</Button>
            {label ? (
              <Button variant="outline" onClick={() => printBranchLabel(label)}>
                <Printer className="mr-2 h-4 w-4" /> Print label
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
