'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { markBranchException, getMyBranches } from '@/lib/branch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';
import { BarcodeScanner } from '@/components/warehouse/barcode-scanner';

const REASONS = ['DAMAGED', 'WRONG_BRANCH', 'EXPIRED', 'RETURNED'] as const;

export function BranchExceptions() {
  const qc = useQueryClient();
  const { data: branches = [] } = useQuery({ queryKey: ['branch-me'], queryFn: getMyBranches });
  const branchId = branches[0]?.branchId ?? '';
  const [tracking, setTracking] = useState('');
  const [reason, setReason] = useState<(typeof REASONS)[number]>('RETURNED');

  const mark = useMutation({
    mutationFn: () => markBranchException(branchId, { trackingNumber: tracking.trim(), reason }),
    onSuccess: () => {
      toast.success('Exception recorded');
      setTracking('');
      qc.invalidateQueries({ queryKey: ['branch-stats'] });
      qc.invalidateQueries({ queryKey: ['branch-inventory'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Exceptions"
        icon={AlertTriangle}
        title="Returns & exceptions"
        description="Mark damaged, misrouted, or expired parcels for branch handling."
        stats={REASONS.map((r) => ({ label: r.replace('_', ' '), value: '—' })).slice(0, 3)}
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <BarcodeScanner value={tracking} onChange={setTracking} label="Tracking number" />
          <div className="space-y-2">
            <Label>Reason</Label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <Button key={r} type="button" variant={reason === r ? 'default' : 'outline'} size="sm" onClick={() => setReason(r)}>
                  {r.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
          <Button className="w-full" disabled={!tracking.trim() || !branchId || mark.isPending} onClick={() => mark.mutate()}>
            Record exception
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
