import crypto from 'node:crypto';
import type {
  PaymentProvider,
  CreateChargeInput,
  ChargeResult,
  RefundInput,
  RefundResult,
} from './payment.interface.js';

/**
 * Local development payment provider. Always succeeds (unless amount <= 0) and
 * returns deterministic-looking references. Mirrors the shape a real gateway
 * would return so swapping later is trivial.
 */
export class FakePaymentProvider implements PaymentProvider {
  readonly name = 'fake';

  async charge(input: CreateChargeInput): Promise<ChargeResult> {
    const ref = `fake_${crypto.randomBytes(8).toString('hex')}`;
    const status = input.amount > 0 ? 'PAID' : 'FAILED';
    return { provider: this.name, providerRef: ref, status, raw: { simulated: true, ...input } };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    return { provider: this.name, providerRef: input.providerRef, status: 'REFUNDED' };
  }

  async verify(providerRef: string): Promise<ChargeResult> {
    return { provider: this.name, providerRef, status: 'PAID' };
  }
}
