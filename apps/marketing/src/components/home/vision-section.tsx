'use client';

import { SectionReveal } from '@/components/common/section-reveal';

export function VisionSection() {
  return (
    <section className="py-24">
      <div className="container">
        <SectionReveal className="relative overflow-hidden rounded-3xl border border-guzo-primary/20 bg-gradient-to-br from-guzo-primary/10 via-guzo-card/80 to-guzo-bg px-8 py-16 md:px-16 md:py-20">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-guzo-primary/15 blur-3xl" />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-guzo-primary">Company Vision</p>
            <h2 className="font-display text-4xl font-bold text-white md:text-5xl">
              Transforming Logistics Across Ethiopia
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-guzo-muted">
              Our mission is to make delivery faster, smarter, and more accessible for everyone. Guzo is building the
              technology that powers the future of Ethiopian logistics—from individuals sending personal packages to
              businesses delivering thousands of orders every day.
            </p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
