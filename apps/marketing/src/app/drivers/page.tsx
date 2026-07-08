import Link from 'next/link';
import { Clock, Smartphone, Shield, Wallet } from 'lucide-react';
import { PageHeader, SectionReveal } from '@/components/common/section-reveal';
import { EarningsCalculator } from '@/components/drivers/earnings-calculator';
import { Button } from '@/components/ui/button';
import { Newsletter } from '@/components/home/newsletter';

const BENEFITS = [
  { icon: Wallet, title: 'Competitive earnings', desc: 'Transparent payouts per delivery with weekly deposits.' },
  { icon: Smartphone, title: 'Smart driver app', desc: 'Navigation, job queue, and proof-of-delivery in one place.' },
  { icon: Clock, title: 'Flexible schedule', desc: 'Go online when you want — full-time or part-time.' },
  { icon: Shield, title: 'Insurance & support', desc: 'Driver protection and 24/7 operations support.' },
];

export const metadata = {
  title: 'Become a Driver — GUZO',
  description: 'Join GUZO as a delivery driver. Flexible earnings, smart navigation, instant payouts.',
};

export default function DriversPage() {
  return (
    <>
      <PageHeader
        eyebrow="Driver Platform"
        title="Drive Ethiopia forward."
        description="Join GUZO's driver network. Earn on your schedule with smart routing, instant notifications, and transparent payouts."
      />

      <section className="container pb-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionReveal>
            <h2 className="font-display text-2xl font-bold text-white">Why drive with GUZO?</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.title} className="rounded-2xl border border-white/10 bg-guzo-card/40 p-5">
                  <b.icon className="mb-3 h-6 w-6 text-guzo-primary" />
                  <h3 className="font-semibold text-white">{b.title}</h3>
                  <p className="mt-1 text-sm text-guzo-muted">{b.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <h3 className="font-semibold text-white">Requirements</h3>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-guzo-muted">
                <li>Valid driver&apos;s license</li>
                <li>Smartphone with GPS</li>
                <li>Motorcycle or delivery van</li>
                <li>Background check clearance</li>
              </ul>
              <Button className="mt-6" size="lg" asChild>
                <Link href="/contact">Apply to drive</Link>
              </Button>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.15}>
            <EarningsCalculator />
          </SectionReveal>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
