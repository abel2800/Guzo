'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tags, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createCoupon, listCoupons } from '@/lib/admin-platform';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero, PaginationBar } from '@/components/dashboard/futuristic-primitives';

export function AdminCoupons() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [code, setCode] = useState('');
  const [value, setValue] = useState('10');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons', page],
    queryFn: () => listCoupons({ page, limit: 10 }),
  });

  const createMut = useMutation({
    mutationFn: () => createCoupon({ code: code.toUpperCase(), type: 'PERCENTAGE', value: Number(value) }),
    onSuccess: () => {
      toast.success('Coupon created');
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      setCode('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero eyebrow="Promotions" icon={Tags} title="Coupons" description="Discount codes and campaign limits." stats={[]} />
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1"><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SAVE10" /></div>
          <div className="space-y-1"><Label>% off</Label><Input value={value} onChange={(e) => setValue(e.target.value)} className="w-24" /></div>
          <Button disabled={createMut.isPending || !code} onClick={() => createMut.mutate()}>
            {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
          </Button>
        </CardContent>
      </Card>
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No coupons" description="Create a promotional code." icon={Tags} />
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-mono font-semibold text-white">{c.code}</p>
                  <p className="text-sm text-muted-foreground">{c.type} · {c.value}%</p>
                </div>
                <Badge variant={c.isActive ? 'success' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
              </CardContent>
            </Card>
          ))}
          <PaginationBar page={page} totalPages={data?.meta?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
