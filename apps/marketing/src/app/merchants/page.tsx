import Link from 'next/link';
import { BarChart3, Boxes, KeyRound, Upload } from 'lucide-react';
import { PageHeader, SectionReveal } from '@/components/common/section-reveal';
import { Button } from '@/components/ui/button';
import { Newsletter } from '@/components/home/newsletter';

const FEATURES = [
  { icon: Upload, title: 'Bulk order upload', desc: 'CSV import for hundreds of shipments in seconds.' },
  { icon: BarChart3, title: 'Analytics dashboard', desc: 'Revenue, delivery rates, and status breakdowns.' },
  { icon: KeyRound, title: 'API & webhooks', desc: 'Integrate with Shopify, WooCommerce, or custom stacks.' },
  { icon: Boxes, title: 'Inventory sync', desc: 'Connect warehouse stock to outbound deliveries.' },
];

export const metadata = {
  title: 'Merchant Platform — GUZO',
  description: 'Bulk orders, analytics, and API integrations for Ethiopian merchants.',
};

export default function MerchantsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Merchant Platform"
        title="Scale your deliveries."
        description="Whether you ship 10 or 10,000 packages a month, GUZO gives merchants the tools to grow — bulk uploads, live tracking, and developer-friendly APIs."
      />

      <section className="container pb-16">
        <SectionReveal>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-guzo-card/50">
            <div className="border-b border-white/10 px-6 py-4">
              <p className="text-sm text-guzo-muted">Merchant Dashboard Preview</p>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-4">
              {['Total Orders', 'In Transit', 'Delivered', 'Revenue'].map((label, i) => (
                <div key={label} className="rounded-xl border border-white/10 bg-guzo-bg/60 p-4">
                  <p className="text-xs text-guzo-muted">{label}</p>
                  <p className="font-display text-2xl font-bold text-white">
                    {i === 3 ? 'ETB 284K' : [1247, 89, 1102][i]}
                  </p>
                </div>
              ))}
            </div>
            <div className="mx-6 mb-6 h-32 rounded-xl bg-gradient-to-r from-guzo-primary/20 via-transparent to-guzo-accent/10" />
          </div>
        </SectionReveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <SectionReveal key={f.title} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-white/10 bg-guzo-card/40 p-6">
                <f.icon className="mb-4 h-7 w-7 text-guzo-primary" />
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-guzo-muted">{f.desc}</p>
              </div>
            </SectionReveal>
          ))}
        </div>

        <SectionReveal className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href="/contact">Register your business</Link>
          </Button>
        </SectionReveal>
      </section>

      <Newsletter />
    </>
  );
}
