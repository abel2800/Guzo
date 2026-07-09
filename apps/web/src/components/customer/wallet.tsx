'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { getWallet, listWalletTransactions, topUpWallet } from '@/lib/wallet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

const TOP_UP_AMOUNTS = [100, 250, 500, 1000];

export function CustomerWallet() {
  const qc = useQueryClient();
  const { data: wallet, isLoading } = useQuery({ queryKey: ['wallet'], queryFn: getWallet });
  const { data: txns, isLoading: txLoading } = useQuery({
    queryKey: ['wallet-txns'],
    queryFn: () => listWalletTransactions({ limit: 30 }),
  });

  const topUp = useMutation({
    mutationFn: (amount: number) => topUpWallet(amount, 'Web top-up'),
    onSuccess: () => {
      toast.success('Wallet topped up');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['wallet-txns'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currency = wallet?.currency ?? 'ETB';
  const balance = Number(wallet?.balance ?? 0);

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Payments"
        icon={Wallet}
        title="Wallet"
        description="Top up your balance and review recent wallet activity."
        stats={[
          { label: 'Currency', value: currency },
          { label: 'Top-up', value: 'Instant' },
          { label: 'History', value: '30 recent' },
        ]}
      />

      <Card>
        <CardContent className="space-y-6 p-6">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available balance</p>
              <p className="mt-2 text-4xl font-black text-white">
                {currency} {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Quick top-up</p>
            <div className="flex flex-wrap gap-2">
              {TOP_UP_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  disabled={topUp.isPending}
                  onClick={() => topUp.mutate(amt)}
                >
                  {currency} {amt}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {txLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (txns?.items ?? []).length === 0 ? (
            <EmptyPanel icon={Wallet} title="No transactions yet" description="Top up your wallet to get started." />
          ) : (
            <ul className="divide-y divide-white/10">
              {(txns?.items ?? []).map((txn) => (
                <li key={txn.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-semibold text-white">{txn.type}</p>
                    <p className="text-xs text-slate-400">{txn.description || txn.reference}</p>
                  </div>
                  <p className={txn.type === 'CREDIT' ? 'font-bold text-guzo-primary' : 'font-bold text-red-400'}>
                    {txn.type === 'CREDIT' ? '+' : '-'}
                    {txn.currency} {Number(txn.amount).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
