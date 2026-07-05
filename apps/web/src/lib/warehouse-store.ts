import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WarehouseState {
  selectedId: string | null;
  setSelected: (id: string) => void;
}

/** Remembers which warehouse the operator is working from across sections. */
export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set) => ({
      selectedId: null,
      setSelected: (id) => set({ selectedId: id }),
    }),
    { name: 'guzo-warehouse' },
  ),
);
