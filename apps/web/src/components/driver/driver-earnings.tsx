'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp } from 'lucide-react';
import { getDriverEarnings } from '@/lib/ops';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function DriverEarnings() {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-earnings'],
    queryFn: getDriverEarnings,
  });

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Payouts"
        icon={Wallet}
        title="Earnings"
        description="Your balance and delivery payout ledger (15% commission per completed delivery)."
        stats={[
          { label: 'Balance', value: `ETB ${(data?.balance ?? 0).toLocaleString()}` },
          { label: 'Deliveries', value: String(data?.totalDeliveries ?? 0) },
          { label: 'Credits', value: String(data?.transactions.length ?? 0) },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <Wallet className="h-8 w-8 text-emerald-400" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Available balance</p>
                  <p className="text-2xl font-bold text-foreground">ETB {(data?.balance ?? 0).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <TrendingUp className="h-8 w-8 text-emerald-400" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Completed deliveries</p>
                  <p className="text-2xl font-bold text-foreground">{data?.totalDeliveries ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (data?.transactions.length ?? 0) === 0 ? (
            <EmptyPanel icon={Wallet} title="No payouts yet" description="Complete deliveries to earn commission credits." />
          ) : (
            <div className="divide-y divide-white/5">
              {data!.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="font-semibold text-foreground">{t.reference ?? 'Delivery'}</p>
                    <p className="text-xs text-muted-foreground">{t.description} · {new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="font-bold text-emerald-400">+ETB {t.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
