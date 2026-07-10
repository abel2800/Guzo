import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyBranches, type BranchStaffAssignment } from '@guzo/mobile-shared';
import { useAuth } from './auth';

const STORAGE_KEY = 'guzo_branch_selected_id';

interface BranchState {
  branches: BranchStaffAssignment[];
  branchId: string | null;
  branch: BranchStaffAssignment['branch'] | null;
  loading: boolean;
  setBranchId: (id: string) => void;
  refresh: () => Promise<void>;
}

const BranchContext = createContext<BranchState | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<BranchStaffAssignment[]>([]);
  const [branchId, setBranchIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setBranchId = useCallback((id: string) => {
    setBranchIdState(id);
    void AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  async function refresh() {
    if (!user) {
      setBranches([]);
      setBranchIdState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getMyBranches();
      setBranches(list);

      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const savedValid = saved && list.some((b) => b.branchId === saved);
      if (savedValid) {
        setBranchIdState(saved);
      } else if (list[0]?.branchId) {
        setBranchId(list[0].branchId);
      } else {
        setBranchIdState(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [user?.id]);

  const branch = useMemo(
    () => branches.find((b) => b.branchId === branchId)?.branch ?? null,
    [branches, branchId],
  );

  const value = useMemo(
    () => ({ branches, branchId, branch, loading, setBranchId, refresh }),
    [branches, branchId, branch, loading, setBranchId],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}
