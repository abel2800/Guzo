import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMyBranches, type BranchStaffAssignment } from '@guzo/mobile-shared';
import { useAuth } from './auth';

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
  const [branchId, setBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!user) {
      setBranches([]);
      setBranchId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getMyBranches();
      setBranches(list);
      if (!branchId && list[0]?.branchId) setBranchId(list[0].branchId);
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
    [branches, branchId, branch, loading],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}
