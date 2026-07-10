'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { listMerchants } from '@/lib/admin-platform';
import { approveUserAccount } from '@/lib/admin';
import { fileUrl } from '@/lib/orders';
import { initials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { EmptyPanel, FuturisticHero, PaginationBar } from '@/components/dashboard/futuristic-primitives';

type MerchantRow = {
  id: string;
  merchantCode: string;
  businessName: string;
  isVerified?: boolean;
  createdAt?: string;
  user?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    status?: string;
    avatar?: { storageKey: string } | null;
  };
};

export function AdminMerchants() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MerchantRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-merchants', page],
    queryFn: () => listMerchants({ page, limit: 10 }),
  });

  const approveMut = useMutation({
    mutationFn: (userId: string) => approveUserAccount(userId),
    onSuccess: () => {
      toast.success('Merchant approved — they can sign in now');
      qc.invalidateQueries({ queryKey: ['admin-merchants'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = (data?.items ?? []) as MerchantRow[];

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Partner network"
        icon={Boxes}
        title="Merchants"
        description="Review merchant accounts, approve access, and view business profiles."
        stats={[{ label: 'Scope', value: 'B2B' }, { label: 'Approval', value: 'Admin' }]}
      />
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No merchants" description="Merchant accounts will appear here." icon={Boxes} />
      ) : (
        <div className="space-y-3">
          {items.map((m) => {
            const pending = m.user?.status === 'PENDING';
            const avatarSrc = fileUrl(m.user?.avatar?.storageKey);
            const name = m.user ? `${m.user.firstName ?? ''} ${m.user.lastName ?? ''}`.trim() : m.businessName;
            return (
              <Card key={m.id} className="cursor-pointer transition hover:border-primary/30" onClick={() => setSelected(m)}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {avatarSrc ? <AvatarImage src={avatarSrc} alt={name} /> : null}
                      <AvatarFallback>{initials(m.user?.firstName ?? m.businessName, m.user?.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{m.businessName}</p>
                      <p className="text-sm text-muted-foreground font-mono">{m.merchantCode}</p>
                      {m.user?.email && <p className="text-xs text-muted-foreground">{m.user.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pending ? (
                      <Badge variant="outline">Pending approval</Badge>
                    ) : (
                      <Badge variant={m.isVerified === false ? 'secondary' : 'success'}>
                        {m.isVerified === false ? 'Unverified' : 'Active'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <PaginationBar page={page} totalPages={data?.meta?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {fileUrl(selected.user?.avatar?.storageKey) ? (
                    <AvatarImage src={fileUrl(selected.user?.avatar?.storageKey)} alt={selected.businessName} />
                  ) : null}
                  <AvatarFallback>
                    {initials(selected.user?.firstName ?? selected.businessName, selected.user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle>{selected.businessName}</SheetTitle>
                  <p className="font-mono text-xs text-muted-foreground">{selected.merchantCode}</p>
                </div>
              </div>
              {selected.user?.email && <p className="text-sm">{selected.user.email}</p>}
              {selected.user?.phone && <p className="text-sm text-muted-foreground">{selected.user.phone}</p>}
              {selected.user?.status === 'PENDING' && selected.user?.id && (
                <Button
                  className="w-full"
                  disabled={approveMut.isPending}
                  onClick={() => approveMut.mutate(selected.user!.id!)}
                >
                  {approveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve merchant account
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
