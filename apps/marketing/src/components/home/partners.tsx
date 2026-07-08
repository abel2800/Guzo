'use client';

import { SectionReveal } from '@/components/common/section-reveal';

const PARTNERS = [
  'Ethio Telecom', 'Commercial Bank', 'RideShare ET', 'ShopLocal', 'AgriConnect',
  'TechHub AA', 'GreenFleet', 'PayFast', 'UrbanMart', 'CloudNine',
];

export function Partners() {
  const doubled = [...PARTNERS, ...PARTNERS];

  return (
    <section className="overflow-hidden py-16">
      <SectionReveal className="container mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-guzo-muted">Partners & Integrations</p>
      </SectionReveal>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-guzo-bg to-transparent" />
        <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-guzo-bg to-transparent" />
        <div className="flex animate-marquee gap-12 whitespace-nowrap">
          {doubled.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="text-lg font-semibold text-white/30 transition hover:text-white/60"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
