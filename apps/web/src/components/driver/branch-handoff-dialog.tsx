'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Store } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '@/lib/orders';
import { handoffAtBranch } from '@/lib/ops';
import { apiGet } from '@/lib/api';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Branch {
  id: string;
  name: string;
  city: string;
}

interface Props {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}

export function BranchHandoffDialog({ order, open, onOpenChange, onCompleted }: Props) {
  const [branchId, setBranchId] = useState('');
  const [tracking, setTracking] = useState('');

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiGet<Branch[]>('/branches'),
    enabled: open,
  });

  const handoff = useMutation({
    mutationFn: () => {
      if (!order) throw new Error('No order');
      return handoffAtBranch(order.id, { branchId, trackingNumber: tracking.trim() });
    },
    onSuccess: () => {
      toast.success('Dropped at branch');
      onCompleted();
      onOpenChange(false);
      setBranchId('');
      setTracking('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const expected = order?.packages?.[0]?.trackingNumber ?? '';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Branch handoff</SheetTitle>
        {order && <p className="text-sm text-slate-400">{order.orderNumber}</p>}
        <div className="mt-4 space-y-4">
          <div>
            <Label>Tracking number</Label>
            <Input className="mt-1" placeholder={expected || 'TRK-…'} value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </div>
          <div>
            <Label>Branch</Label>
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {(branches ?? []).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBranchId(b.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${branchId === b.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10'}`}
                >
                  {b.name} · {b.city}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" disabled={!branchId || !tracking || handoff.isPending} onClick={() => handoff.mutate()}>
            Confirm handoff
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
