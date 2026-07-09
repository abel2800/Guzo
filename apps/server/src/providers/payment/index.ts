import { env } from '../../config/env.js';
import type { PaymentProvider } from './payment.interface.js';
import { FakePaymentProvider } from './fake.provider.js';

function createPaymentProvider(): PaymentProvider {
  switch (env.payment.provider) {
    case 'fake':
    default:
      return new FakePaymentProvider();

  }
}

export const paymentProvider = createPaymentProvider();
export type * from './payment.interface.js';
