'use client';

import { FinancePayments } from './finance-payments';

/** Refunds view is the payments queue pre-filtered to refunded transactions. */
export function FinanceRefunds() {
  return <FinancePayments defaultStatus="REFUNDED" title="Refunds" />;
}
