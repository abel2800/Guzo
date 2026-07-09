import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WarehouseState {
  selectedId: string | null;
  setSelected: (id: string) => void;
}

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set) => ({
      selectedId: null,
      setSelected: (id) => set({ selectedId: id }),
    }),
    { name: 'guzo-warehouse' },
  ),
);
