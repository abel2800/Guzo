'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Star, Trash2, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  formatAddress,
  type Address,
  type AddressInput,
} from '@/lib/addresses';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  EmptyPanel,
  FuturisticHero,
  PanelSelect,
} from '@/components/dashboard/futuristic-primitives';

const EMPTY: AddressInput = {
  label: '',
  type: 'HOME',
  contactName: '',
  contactPhone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'ET',
  isDefault: false,
};

export function CustomerAddresses() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: listAddresses,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.line1.trim() || !form.city.trim()) throw new Error('Line 1 and city are required');
      if (editing) return updateAddress(editing.id, form);
      return createAddress(form);
    },
    onSuccess: () => {
      toast.success(editing ? 'Address updated' : 'Address saved');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      toast.success('Address removed');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({
      label: a.label ?? '',
      type: a.type,
      contactName: a.contactName ?? '',
      contactPhone: a.contactPhone ?? '',
      line1: a.line1,
      line2: a.line2 ?? '',
      city: a.city,
      state: a.state ?? '',
      postalCode: a.postalCode ?? '',
      country: a.country,
      isDefault: a.isDefault,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Location vault"
            icon={MapPin}
            title="Saved Addresses"
            description="Manage pickup and delivery locations for faster booking with one-tap address selection."
            stats={[
              { label: 'Types', value: 'Home · Office' },
              { label: 'Default', value: 'One-tap' },
              { label: 'Speed', value: 'Fast book' },
            ]}
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add address
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={form.label ?? ''} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Office…" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <PanelSelect
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as AddressInput['type'] })}
              >
                <option value="HOME">Home</option>
                <option value="OFFICE">Office</option>
                <option value="OTHER">Other</option>
              </PanelSelect>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Street address *</Label>
              <Input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Line 2</Label>
              <Input value={form.line2 ?? ''} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>City *</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contact phone</Label>
              <Input value={form.contactPhone ?? ''} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Set as default address
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
                {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? 'Update' : 'Save'}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <EmptyPanel
              icon={MapPin}
              title="No saved addresses"
              description="Add your home or office for one-tap booking."
              action={<Button onClick={openCreate}>Add address</Button>}
            />
          ) : (
            <div className="dashboard-divide">
              {addresses.map((a) => (
                <div key={a.id} className="dashboard-list-row flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{a.label || a.type}</p>
                      {a.isDefault && (
                        <Badge variant="success" className="gap-1">
                          <Star className="h-3 w-3" /> Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{formatAddress(a)}</p>
                    {a.contactPhone && <p className="text-xs text-muted-foreground">{a.contactPhone}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleteMut.isPending}
                      onClick={() => deleteMut.mutate(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
