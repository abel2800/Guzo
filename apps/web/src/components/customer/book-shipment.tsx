'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, Package, CreditCard, Check, Loader2, Navigation } from 'lucide-react';
import { Map } from '@/components/map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  createOrder,
  quoteOrder,
  type AddressInput,
  type DeliveryType,
  type PackageInput,
  type PriceBreakdown,
} from '@/lib/orders';

const STEPS = [
  { title: 'Route', icon: MapPin },
  { title: 'Parcel', icon: Package },
  { title: 'Review & Pay', icon: CreditCard },
];

const DELIVERY_TYPES: Array<{ value: DeliveryType; label: string; desc: string }> = [
  { value: 'STANDARD', label: 'Standard', desc: '2–3 days' },
  { value: 'EXPRESS', label: 'Express', desc: 'Next day' },
  { value: 'SAME_DAY', label: 'Same Day', desc: 'Within hours' },
];

const emptyAddr: AddressInput = { line1: '', city: '', contactName: '', contactPhone: '' };

export function BookShipment() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pickup, setPickup] = useState<AddressInput>({ ...emptyAddr });
  const [dropoff, setDropoff] = useState<AddressInput>({ ...emptyAddr });
  const [setting, setSetting] = useState<'pickup' | 'dropoff'>('pickup');
  const [pkg, setPkg] = useState<PackageInput>({ weightKg: 1, description: '', isFragile: false });
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('STANDARD');
  const [couponCode, setCouponCode] = useState('');
  const [quote, setQuote] = useState<PriceBreakdown | null>(null);

  const markers = [
    pickup.latitude && pickup.longitude
      ? { lat: pickup.latitude, lng: pickup.longitude, color: '#16a34a', label: 'Pickup' }
      : null,
    dropoff.latitude && dropoff.longitude
      ? { lat: dropoff.latitude, lng: dropoff.longitude, color: '#ea580c', label: 'Dropoff' }
      : null,
  ].filter(Boolean) as Array<{ lat: number; lng: number; color: string; label: string }>;

  function handleMapClick(latlng: { lat: number; lng: number }) {
    const coords = { latitude: +latlng.lat.toFixed(6), longitude: +latlng.lng.toFixed(6) };
    if (setting === 'pickup') {
      setPickup((p) => ({ ...p, ...coords }));
      setSetting('dropoff');
    } else {
      setDropoff((p) => ({ ...p, ...coords }));
    }
  }

  const input = { deliveryType, pickup, dropoff, package: pkg, couponCode: couponCode || undefined };

  const quoteMut = useMutation({
    mutationFn: () => quoteOrder(input),
    onSuccess: setQuote,
    onError: (e: Error) => toast.error(e.message || 'Could not get a quote'),
  });

  const createMut = useMutation({
    mutationFn: () => createOrder(input),
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} booked!`);
      router.push(`/dashboard/customer/track?ref=${order.orderNumber}`);
    },
    onError: (e: Error) => toast.error(e.message || 'Could not place the order'),
  });

  function next() {
    if (step === 0) {
      if (!pickup.line1 || !pickup.city || !dropoff.line1 || !dropoff.city) {
        toast.error('Enter pickup and dropoff address (line 1 + city)');
        return;
      }
    }
    if (step === 1) {
      if (!pkg.weightKg || pkg.weightKg <= 0) {
        toast.error('Enter a parcel weight');
        return;
      }
      quoteMut.mutate();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Book a Shipment</h1>
        <p className="text-muted-foreground">Pick your route, describe the parcel, and pay.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.title} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary text-primary',
                  !done && !active && 'text-muted-foreground',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn('hidden text-sm font-medium sm:block', active ? 'text-foreground' : 'text-muted-foreground')}>
                {s.title}
              </span>
              {i < STEPS.length - 1 && <div className="mx-2 h-px flex-1 bg-border" />}
            </div>
          );
        })}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
        {step === 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Addresses</span>
                  <Badge variant={setting === 'pickup' ? 'success' : 'default'}>
                    Tap map to set {setting}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <AddressFields
                  title="Pickup"
                  dot="#16a34a"
                  value={pickup}
                  onChange={setPickup}
                  onFocusSet={() => setSetting('pickup')}
                />
                <AddressFields
                  title="Dropoff"
                  dot="#ea580c"
                  value={dropoff}
                  onChange={setDropoff}
                  onFocusSet={() => setSetting('dropoff')}
                />
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-[420px] w-full">
                <Map markers={markers} onMapClick={handleMapClick} />
              </div>
            </Card>
          </div>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Parcel details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 block">Delivery type</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {DELIVERY_TYPES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDeliveryType(d.value)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-colors',
                        deliveryType === d.value ? 'border-primary bg-accent' : 'hover:bg-muted',
                      )}
                    >
                      <p className="font-semibold">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min={0}
                    step={0.1}
                    value={pkg.weightKg}
                    onChange={(e) => setPkg((p) => ({ ...p, weightKg: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Declared value (ETB)</Label>
                  <Input
                    id="value"
                    type="number"
                    min={0}
                    value={pkg.declaredValue ?? ''}
                    onChange={(e) => setPkg((p) => ({ ...p, declaredValue: parseFloat(e.target.value) || undefined }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {(['lengthCm', 'widthCm', 'heightCm'] as const).map((dim) => (
                  <div key={dim} className="space-y-2">
                    <Label htmlFor={dim} className="capitalize">
                      {dim.replace('Cm', '')} (cm)
                    </Label>
                    <Input
                      id={dim}
                      type="number"
                      min={0}
                      value={pkg[dim] ?? ''}
                      onChange={(e) => setPkg((p) => ({ ...p, [dim]: parseFloat(e.target.value) || undefined }))}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input
                  id="desc"
                  placeholder="What's inside?"
                  value={pkg.description ?? ''}
                  onChange={(e) => setPkg((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Fragile</p>
                  <p className="text-xs text-muted-foreground">Handle with care</p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[hsl(var(--primary))]"
                  checked={pkg.isFragile ?? false}
                  onChange={(e) => setPkg((p) => ({ ...p, isFragile: e.target.checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon">Coupon code (optional)</Label>
                <Input
                  id="coupon"
                  placeholder="e.g. WELCOME10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Price breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {quoteMut.isPending ? (
                  <div className="flex h-40 items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating price…
                  </div>
                ) : quote ? (
                  <div className="space-y-2 text-sm">
                    <Row label={`Distance (${quote.distanceKm.toFixed(1)} km)`} value={`ETB ${quote.distanceFee}`} />
                    <Row label="Base fee" value={`ETB ${quote.baseFee}`} />
                    <Row label="Weight fee" value={`ETB ${quote.weightFee}`} />
                    {quote.surge > 0 && <Row label="Surge" value={`ETB ${quote.surge}`} />}
                    {quote.discount > 0 && <Row label="Discount" value={`- ETB ${quote.discount}`} accent />}
                    <Row label="Tax" value={`ETB ${quote.tax}`} />
                    <div className="my-2 h-px bg-border" />
                    <div className="flex items-center justify-between text-base font-bold">
                      <span>Total</span>
                      <span>
                        {quote.currency} {quote.totalAmount}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => quoteMut.mutate()}>
                      Recalculate
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <Button onClick={() => quoteMut.mutate()}>Get quote</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <SummaryLine icon={MapPin} label="From" value={`${pickup.line1}, ${pickup.city}`} color="#16a34a" />
                <SummaryLine icon={Navigation} label="To" value={`${dropoff.line1}, ${dropoff.city}`} color="#ea580c" />
                <SummaryLine icon={Package} label="Parcel" value={`${pkg.weightKg} kg · ${deliveryType}`} />
                <div className="h-40 overflow-hidden rounded-lg">
                  <Map markers={markers} />
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!quote || createMut.isPending}
                  onClick={() => createMut.mutate()}
                >
                  {createMut.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing payment…
                    </>
                  ) : (
                    <>Pay {quote ? `${quote.currency} ${quote.totalAmount}` : ''} & Book</>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Uses the sandbox payment provider — no real charge.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      {/* Nav */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 && <Button onClick={next}>Continue</Button>}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'font-medium'}>{value}</span>
    </div>
  );
}

function SummaryLine({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={color ? { color } : undefined} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function AddressFields({
  title,
  dot,
  value,
  onChange,
  onFocusSet,
}: {
  title: string;
  dot: string;
  value: AddressInput;
  onChange: (a: AddressInput) => void;
  onFocusSet: () => void;
}) {
  const set = (patch: Partial<AddressInput>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3" onFocusCapture={onFocusSet}>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: dot }} />
        <p className="font-semibold">{title}</p>
        {value.latitude && (
          <span className="text-xs text-muted-foreground">
            {value.latitude.toFixed(4)}, {value.longitude?.toFixed(4)}
          </span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Address line 1" value={value.line1} onChange={(e) => set({ line1: e.target.value })} />
        <Input placeholder="City" value={value.city} onChange={(e) => set({ city: e.target.value })} />
        <Input placeholder="Contact name" value={value.contactName ?? ''} onChange={(e) => set({ contactName: e.target.value })} />
        <Input placeholder="Contact phone" value={value.contactPhone ?? ''} onChange={(e) => set({ contactPhone: e.target.value })} />
      </div>
    </div>
  );
}
