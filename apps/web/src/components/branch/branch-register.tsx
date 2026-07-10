'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Printer } from 'lucide-react';
import { toast } from 'sonner';
import {
  registerParcelAtBranch,
  quoteBranchRegister,
  listBranches,
  getMyBranches,
  printBranchLabel,
  type ParcelLabel,
} from '@/lib/branch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PanelSelect } from '@/components/dashboard/futuristic-primitives';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';

type DestMode = 'branch' | 'home';
type PaymentChoice = 'PAY_LATER' | 'CASH_ON_DELIVERY' | 'FAKE' | 'TELEBIRR' | 'CBE' | 'CHAPA';

export function BranchRegister() {
  const qc = useQueryClient();
  const { data: branches = [] } = useQuery({ queryKey: ['branch-me'], queryFn: getMyBranches });
  const { data: allBranches = [] } = useQuery({ queryKey: ['branches-directory'], queryFn: () => listBranches() });
  const [branchId, setBranchId] = useState('');
  const activeBranch = branchId || branches[0]?.branchId || '';
  const [destMode, setDestMode] = useState<DestMode>('branch');
  const [label, setLabel] = useState<ParcelLabel | null>(null);
  const [form, setForm] = useState({
    senderPhone: '',
    senderName: '',
    receiverPhone: '',
    receiverName: '',
    destinationBranchId: '',
    dropoffCity: '',
    dropoffLine1: '',
    weightKg: '1',
    description: '',
    paymentMethod: 'PAY_LATER' as PaymentChoice,
  });

  const cities = [...new Set(allBranches.map((b) => b.city))].sort();
  const branchesInCity = allBranches.filter((b) => !form.dropoffCity || b.city === form.dropoffCity);

  const quoteInput = {
    senderPhone: form.senderPhone.trim(),
    senderName: form.senderName.trim(),
    receiverPhone: form.receiverPhone.trim(),
    receiverName: form.receiverName.trim(),
    weightKg: Number(form.weightKg) || 1,
    ...(destMode === 'branch'
      ? { destinationBranchId: form.destinationBranchId || undefined }
      : { dropoffCity: form.dropoffCity.trim(), dropoffLine1: form.dropoffLine1.trim() || undefined }),
  };

  const canQuote = Boolean(
    activeBranch &&
    form.senderPhone.trim() &&
    form.receiverPhone.trim() &&
    (destMode === 'branch' ? form.destinationBranchId : form.dropoffCity.trim()),
  );

  const { data: quote, refetch: refetchQuote } = useQuery({
    queryKey: ['branch-register-quote', activeBranch, quoteInput, destMode],
    queryFn: () => quoteBranchRegister(activeBranch, quoteInput),
    enabled: canQuote,
  });

  useEffect(() => {
    if (canQuote) void refetchQuote();
  }, [form.weightKg, form.destinationBranchId, form.dropoffCity, destMode, form.senderPhone, form.receiverPhone]);

  const register = useMutation({
    mutationFn: () =>
      registerParcelAtBranch(activeBranch, {
        ...quoteInput,
        description: form.description.trim() || undefined,
        paymentMethod: form.paymentMethod,
        payLater: form.paymentMethod === 'PAY_LATER',
      }),
    onSuccess: (res) => {
      toast.success(`Registered ${res.package?.trackingNumber}`);
      setLabel(res.label ?? null);
      qc.invalidateQueries({ queryKey: ['branch-stats'] });
      qc.invalidateQueries({ queryKey: ['branch-inventory'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Walk-in"
        icon={UserPlus}
        title="Register parcel"
        description="Branch staff register walk-in parcels. Sender does not need an account — we link deliveries by phone number."
        stats={[
          { label: 'Pricing', value: 'Live quote' },
          { label: 'Pay', value: 'Later / COD / Mobile' },
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

          <div className="sm:col-span-2 space-y-2">
            <Label>Destination type</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={destMode === 'branch' ? 'default' : 'outline'} size="sm" onClick={() => setDestMode('branch')}>GUZO branch pickup</Button>
              <Button type="button" variant={destMode === 'home' ? 'default' : 'outline'} size="sm" onClick={() => setDestMode('home')}>Home delivery</Button>
            </div>
          </div>

          {destMode === 'branch' ? (
            <>
              <div className="space-y-2">
                <Label>City</Label>
                <PanelSelect value={form.dropoffCity} onChange={set('dropoffCity')}>
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </PanelSelect>
              </div>
              <div className="space-y-2">
                <Label>Destination branch</Label>
                <PanelSelect value={form.destinationBranchId} onChange={set('destinationBranchId')}>
                  <option value="">Select branch</option>
                  {branchesInCity.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </PanelSelect>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2"><Label>Destination city</Label><Input value={form.dropoffCity} onChange={set('dropoffCity')} /></div>
              <div className="space-y-2"><Label>Address</Label><Input value={form.dropoffLine1} onChange={set('dropoffLine1')} /></div>
            </>
          )}

          <div className="space-y-2"><Label>Weight (kg)</Label><Input value={form.weightKg} onChange={set('weightKg')} /></div>
          <div className="space-y-2"><Label>Contents</Label><Input value={form.description} onChange={set('description')} /></div>

          <div className="space-y-2">
            <Label>Payment</Label>
            <PanelSelect value={form.paymentMethod} onChange={set('paymentMethod')}>
              <option value="PAY_LATER">Pay later</option>
              <option value="CASH_ON_DELIVERY">Cash on delivery</option>
              <option value="FAKE">Pay now (demo)</option>
              <option value="TELEBIRR">Telebirr</option>
              <option value="CBE">CBE</option>
              <option value="CHAPA">Chapa</option>
            </PanelSelect>
          </div>

          {quote ? (
            <div className="sm:col-span-2 rounded-xl border border-guzo-primary/30 bg-guzo-primary/10 p-4">
              <p className="text-sm text-muted-foreground">Estimated price</p>
              <p className="text-2xl font-bold text-guzo-primary">{quote.currency} {quote.totalAmount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{quote.distanceKm.toFixed(1)} km · includes weight fee</p>
            </div>
          ) : null}

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <Button disabled={!canQuote || register.isPending} onClick={() => register.mutate()}>Register parcel</Button>
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
