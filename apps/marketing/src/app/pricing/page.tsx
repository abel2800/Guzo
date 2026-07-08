import Link from 'next/link';
import { Check } from 'lucide-react';
import { PageHeader, SectionReveal } from '@/components/common/section-reveal';
import { Button } from '@/components/ui/button';

const PLANS = [
  {
    name: 'Personal',
    price: 'From 89 ETB',
    desc: 'Same-day and scheduled delivery for individuals.',
    features: ['Live GPS tracking', 'Scheduled pickup', 'SMS notifications', 'Proof of delivery'],
  },
  {
    name: 'Business',
    price: 'Volume rates',
    desc: 'For shops, e-commerce, and growing merchants.',
    features: ['Bulk order upload', 'API & webhooks', 'Analytics dashboard', 'Dedicated support', 'Monthly invoicing'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'Warehouse integration, fleet management, SLA guarantees.',
    features: ['Custom routing rules', 'Multi-hub dispatch', 'White-label options', '24/7 ops desk', 'International lanes'],
  },
];

export const metadata = {
  title: 'Pricing — GUZO',
  description: 'Transparent delivery pricing for individuals and volume discounts for businesses.',
};

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Simple, transparent rates."
        description="Pay per delivery or unlock volume discounts as your business scales. No hidden fees."
      />

      <section className="container pb-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <SectionReveal key={plan.name} delay={i * 0.08}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-8 ${
                  plan.highlight
                    ? 'border-guzo-primary/50 bg-guzo-primary/5 shadow-lg shadow-guzo-primary/10'
                    : 'border-white/10 bg-guzo-card/40'
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-widest text-guzo-primary">{plan.name}</p>
                <p className="mt-2 font-display text-3xl font-bold text-white">{plan.price}</p>
                <p className="mt-2 text-sm text-guzo-muted">{plan.desc}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-guzo-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-guzo-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 w-full" variant={plan.highlight ? 'default' : 'outline'} asChild>
                  <Link href="/contact">{plan.name === 'Enterprise' ? 'Contact sales' : 'Get started'}</Link>
                </Button>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>
    </>
  );
}
