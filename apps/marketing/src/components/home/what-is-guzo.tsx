'use client';

import { Package, Sparkles } from 'lucide-react';
import { SectionReveal } from '@/components/common/section-reveal';

export function WhatIsGuzo() {
  return (
    <section className="py-24">
      <div className="container grid items-center gap-16 lg:grid-cols-2">
        <SectionReveal>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-guzo-primary">What is Guzo?</p>
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">More Than a Delivery App</h2>
          <p className="mt-6 text-lg leading-relaxed text-guzo-muted">
            Guzo is Ethiopia&apos;s intelligent logistics platform that simplifies shipping for individuals, businesses,
            and e-commerce stores. Whether you&apos;re sending a document across Addis Ababa or delivering thousands of
            customer orders nationwide, Guzo provides real-time tracking, secure delivery, smart route optimization, and
            reliable logistics technology.
          </p>
          <p className="mt-4 text-guzo-muted">
            Think Cainiao meets Stripe — a modern technology company built for Ethiopia&apos;s future, not a typical
            courier business.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <div className="relative flex min-h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-guzo-card/80 to-guzo-bg p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.12),transparent_70%)]" />
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-guzo-primary/15 ring-1 ring-guzo-primary/30">
                <Package className="h-12 w-12 text-guzo-primary" />
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-guzo-primary">
                <Sparkles className="h-4 w-4" />
                <span>Intelligent logistics for everyone</span>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                {['People', 'Business', 'Couriers'].map((label) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-guzo-muted">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
