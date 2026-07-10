'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, Fuel } from 'lucide-react';
import { toast } from 'sonner';
import { getDriverVehicle, listVehicleLogs, createVehicleLog } from '@/lib/driver-ops';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

const LOG_TYPES = ['FUEL', 'MAINTENANCE', 'MILEAGE', 'INSPECTION'] as const;

export function DriverVehicle() {
  const qc = useQueryClient();
  const [type, setType] = useState<(typeof LOG_TYPES)[number]>('FUEL');
  const [odometer, setOdometer] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const { data: vehicle } = useQuery({ queryKey: ['driver-vehicle'], queryFn: getDriverVehicle });
  const { data: logs } = useQuery({ queryKey: ['vehicle-logs'], queryFn: listVehicleLogs });

  const save = useMutation({
    mutationFn: () => createVehicleLog({
      type,
      odometerKm: odometer ? Number(odometer) : undefined,
      amount: amount ? Number(amount) : undefined,
      note: note || undefined,
    }),
    onSuccess: () => {
      toast.success('Log saved');
      setOdometer('');
      setAmount('');
      setNote('');
      qc.invalidateQueries({ queryKey: ['vehicle-logs'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Fleet"
        icon={Car}
        title="Vehicle & logs"
        description="Fuel, maintenance, mileage, and inspection records for your assigned vehicle."
        stats={[
          { label: 'Vehicle', value: vehicle?.plateNumber ?? '—' },
          { label: 'Logs', value: String(logs?.length ?? 0) },
          { label: 'Types', value: '4' },
        ]}
      />

      <Card>
        <CardContent className="p-6">
          {vehicle ? (
            <p className="text-lg font-bold text-foreground">{vehicle.plateNumber} · {vehicle.brand} {vehicle.model}</p>
          ) : (
            <EmptyPanel icon={Car} title="No vehicle assigned" description="Contact dispatch to assign a vehicle." />
          )}
        </CardContent>
      </Card>

      {vehicle && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <Label>Log type</Label>
            <div className="flex flex-wrap gap-2">
              {LOG_TYPES.map((t) => (
                <Button key={t} size="sm" variant={type === t ? 'default' : 'outline'} onClick={() => setType(t)}>{t}</Button>
              ))}
            </div>
            <Input placeholder="Odometer (km)" value={odometer} onChange={(e) => setOdometer(e.target.value)} />
            {(type === 'FUEL' || type === 'MAINTENANCE') && (
              <Input placeholder="Amount ETB" value={amount} onChange={(e) => setAmount(e.target.value)} />
            )}
            <Input placeholder="Notes" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button disabled={save.isPending} onClick={() => save.mutate()}>
              <Fuel className="h-4 w-4" /> Save log
            </Button>
          </CardContent>
        </Card>
      )}

      {(logs?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="divide-y divide-white/5 p-0">
            {logs!.map((l) => (
              <div key={l.id} className="flex justify-between px-6 py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{l.type}</p>
                  <p className="text-muted-foreground">{l.note ?? '—'} · {new Date(l.loggedAt).toLocaleDateString()}</p>
                </div>
                <p className="text-muted-foreground">
                  {l.odometerKm != null ? `${l.odometerKm} km` : ''}
                  {l.amount != null ? ` · ETB ${l.amount}` : ''}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
