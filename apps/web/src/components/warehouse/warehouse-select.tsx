'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Warehouse as WarehouseIcon } from 'lucide-react';
import { listWarehouses } from '@/lib/warehouse';
import { useWarehouseStore } from '@/lib/warehouse-store';
import { PanelSelect } from '@/components/dashboard/futuristic-primitives';

export function WarehouseSelect() {
  const { selectedId, setSelected } = useWarehouseStore();
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });

  useEffect(() => {
    if (warehouses.length && !warehouses.some((w) => w.id === selectedId)) {
      setSelected(warehouses[0].id);
    }
  }, [warehouses, selectedId, setSelected]);

  if (!warehouses.length) return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      <WarehouseIcon className="h-4 w-4 text-slate-400" />
      <PanelSelect
        value={selectedId ?? ''}
        onChange={(e) => setSelected(e.target.value)}
      >
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>
            {w.code} — {w.name}
          </option>
        ))}
      </PanelSelect>
    </label>
  );
}

export function useSelectedWarehouse() {
  return useWarehouseStore((s) => s.selectedId);
}
