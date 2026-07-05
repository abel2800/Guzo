'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Warehouse as WarehouseIcon } from 'lucide-react';
import { listWarehouses } from '@/lib/warehouse';
import { useWarehouseStore } from '@/lib/warehouse-store';

/** Warehouse picker wired to the shared store; auto-selects the first warehouse. */
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
      <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
      <select
        value={selectedId ?? ''}
        onChange={(e) => setSelected(e.target.value)}
        className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>
            {w.code} — {w.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Convenience hook returning the currently selected warehouse id (may be null before load). */
export function useSelectedWarehouse() {
  return useWarehouseStore((s) => s.selectedId);
}
