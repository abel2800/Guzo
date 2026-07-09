'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { applyReferralCode, getLoyaltyProfile } from '@/lib/platform';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function CustomerLoyalty() {
  const [code, setCode] = useState('');
  const { data, isLoading, refetch } = useQuery({ queryKey: ['loyalty'], queryFn: getLoyaltyProfile });

  const applyMut = useMutation({
    mutationFn: () => applyReferralCode(code),
    onSuccess: (res) => {
      toast.success(`Referral applied! +${res.bonus} points`);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Rewards"
        icon={Gift}
        title="Loyalty & referrals"
        description="Earn points on every delivery and share your referral code with friends."
        stats={[{ label: 'Points', value: isLoading ? '…' : String(data?.loyaltyPoints ?? 0) }]}
      />
      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <p className="text-sm text-muted-foreground">Your referral code</p>
            <p className="font-mono text-xl font-bold text-white">{data?.referralCode ?? '—'}</p>
          </div>
          <p className="text-sm text-slate-400">
            Earn {data?.pointsPerDelivery ?? 10} points per delivery · {data?.referralBonus ?? 50} bonus per referral
          </p>
          <div className="border-t border-white/10 pt-4">
            <Label>Have a friend&apos;s code?</Label>
            <div className="mt-2 flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GZ…" />
              <Button disabled={!code || applyMut.isPending} onClick={() => applyMut.mutate()}>
                {applyMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
