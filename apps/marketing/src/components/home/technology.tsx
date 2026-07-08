'use client';

import { Brain, Navigation, Radar, BarChart3, Bot, Shield } from 'lucide-react';
import { SectionReveal } from '@/components/common/section-reveal';

const TECH = [
  { icon: Brain, title: 'AI Route Optimization', desc: 'ML models reduce delivery time and fuel cost across Addis traffic patterns.' },
  { icon: Navigation, title: 'Real-Time GPS', desc: 'Sub-second location updates for customers, drivers, and operations teams.' },
  { icon: Radar, title: 'Smart Tracking', desc: 'Predictive ETAs that adapt to weather, traffic, and warehouse delays.' },
  { icon: BarChart3, title: 'Analytics Engine', desc: 'Business intelligence for merchants, finance, and fleet managers.' },
  { icon: Bot, title: 'Automation', desc: 'Auto-assign drivers, scan packages, and trigger customer notifications.' },
  { icon: Shield, title: 'Secure Payments', desc: 'Encrypted transactions, invoicing, and refund workflows built in.' },
];

export function Technology() {
  return (
    <section className="py-24">
      <div className="container">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-guzo-primary">Technology</p>
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">Built for scale. Designed for Ethiopia.</h2>
          <p className="mt-4 text-guzo-muted">
            Enterprise-grade infrastructure with the speed and reliability of global leaders — localized for our cities and roads.
          </p>
        </SectionReveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TECH.map((t, i) => (
            <SectionReveal key={t.title} delay={i * 0.06}>
              <div className="group h-full rounded-2xl border border-white/10 bg-gradient-to-br from-guzo-card/80 to-guzo-bg/40 p-6 transition hover:border-guzo-primary/40">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-guzo-primary/15 text-guzo-primary transition group-hover:scale-110">
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-guzo-muted">{t.desc}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
