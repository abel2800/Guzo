'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Loader2, Copy, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import {
  createMerchantApiKey,
  listMerchantApiKeys,
  listMerchantWebhooks,
  registerMerchantWebhook,
  revokeMerchantApiKey,
  setMerchantWebhookActive,
  testMerchantWebhook,
} from '@/lib/merchant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function MerchantApiKeys() {
  const qc = useQueryClient();
  const [label, setLabel] = useState('Production');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const keysQ = useQuery({ queryKey: ['merchant-api-keys'], queryFn: listMerchantApiKeys });
  const hooksQ = useQuery({ queryKey: ['merchant-webhooks'], queryFn: listMerchantWebhooks });

  const createKey = useMutation({
    mutationFn: () => createMerchantApiKey(label),
    onSuccess: (data) => {
      setNewKey(data.apiKey);
      toast.success('API key created — copy it now');
      qc.invalidateQueries({ queryKey: ['merchant-api-keys'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeKey = useMutation({
    mutationFn: revokeMerchantApiKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant-api-keys'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const registerHook = useMutation({
    mutationFn: () => registerMerchantWebhook(webhookUrl),
    onSuccess: () => {
      toast.success('Webhook registered');
      setWebhookUrl('');
      qc.invalidateQueries({ queryKey: ['merchant-webhooks'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleHook = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setMerchantWebhookActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant-webhooks'] }),
  });

  const testHook = useMutation({
    mutationFn: () => testMerchantWebhook({ hello: 'guzo' }),
    onSuccess: () => toast.success('Test event queued'),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Developer platform"
        icon={KeyRound}
        title="API Keys & Webhooks"
        description="Integrate Guzo into your store or ERP. Keys authenticate the /merchant-api endpoints."
        stats={[
          { label: 'Auth', value: 'Bearer key' },
          { label: 'Events', value: 'Status webhooks' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Create API key</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} /></div>
            <Button disabled={createKey.isPending} onClick={() => createKey.mutate()}>
              {createKey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Generate key
            </Button>
            {newKey && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                <p className="font-semibold text-amber-200">Copy now — shown once</p>
                <code className="mt-2 block break-all font-mono text-xs">{newKey}</code>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => navigator.clipboard.writeText(newKey)}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Webhook className="h-4 w-4" /> Webhook</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Endpoint URL</Label><Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-store.com/guzo/webhook" /></div>
            <div className="flex gap-2">
              <Button disabled={registerHook.isPending || !webhookUrl} onClick={() => registerHook.mutate()}>Register</Button>
              <Button variant="outline" disabled={testHook.isPending} onClick={() => testHook.mutate()}>Send test</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Active keys</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {keysQ.isLoading ? <Skeleton className="h-20" /> : keysQ.data?.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                <div>
                  <p className="font-medium text-white">{k.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{k.keyPrefix}…</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={k.isActive ? 'success' : 'secondary'}>{k.isActive ? 'Active' : 'Revoked'}</Badge>
                  {k.isActive && (
                    <Button size="sm" variant="outline" onClick={() => revokeKey.mutate(k.id)}>Revoke</Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Webhooks</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {hooksQ.isLoading ? <Skeleton className="h-20" /> : hooksQ.data?.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                <p className="truncate text-sm text-slate-300">{w.url}</p>
                <Button size="sm" variant="outline" onClick={() => toggleHook.mutate({ id: w.id, isActive: !w.isActive })}>
                  {w.isActive ? 'Pause' : 'Enable'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
