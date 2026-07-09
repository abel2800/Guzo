'use client';

import { Undo2 } from 'lucide-react';
import { FinancePayments } from './finance-payments';

export function FinanceRefunds() {
  return (
    <FinancePayments
      defaultStatus="REFUNDED"
      title="Refunds"
      eyebrow="Refund ledger"
      icon={Undo2}
      description="Review issued refunds, trace reversal history, and monitor refund volume from a dedicated finance view."
      stats={[
        { label: 'Filter', value: 'Refunded only' },
        { label: 'Trace', value: 'Full history' },
        { label: 'Scope', value: 'Platform-wide' },
      ]}
    />
  );
}
