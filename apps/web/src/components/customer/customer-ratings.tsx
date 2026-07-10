'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPendingRatings, rateOrder } from '@/lib/platform';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function CustomerRatings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['pending-ratings'], queryFn: getPendingRatings });
  const [comments, setComments] = useState<Record<string, string>>({});

  const rateMut = useMutation({
    mutationFn: ({ orderId, rating, comment }: { orderId: string; rating: number; comment?: string }) =>
      rateOrder(orderId, rating, comment),
    onSuccess: () => {
      toast.success('Thanks for your rating!');
      qc.invalidateQueries({ queryKey: ['pending-ratings'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Feedback"
        icon={Star}
        title="Rate your delivery"
        description="Help us improve by rating drivers after completed shipments."
        stats={[{ label: 'Pending', value: String(items.length) }]}
      />
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyPanel title="All caught up" description="No deliveries waiting for a rating." icon={Star} />
      ) : (
        <div className="space-y-3">
          {items.map((o) => {
            const driver = o.delivery?.driver;
            const name = driver?.user
              ? `${driver.user.firstName ?? ''} ${driver.user.lastName ?? ''}`.trim()
              : driver?.driverCode ?? 'Driver';
            return (
              <Card key={o.id}>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <p className="font-semibold text-foreground">{o.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">Driver: {name}</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Button
                        key={n}
                        size="sm"
                        variant="outline"
                        disabled={rateMut.isPending}
                        onClick={() =>
                          rateMut.mutate({ orderId: o.id, rating: n, comment: comments[o.id] })
                        }
                      >
                        {n}★
                      </Button>
                    ))}
                  </div>
                  <Input
                    placeholder="Optional comment"
                    value={comments[o.id] ?? ''}
                    onChange={(e) => setComments((c) => ({ ...c, [o.id]: e.target.value }))}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {rateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
}
