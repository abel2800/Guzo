'use client';

import { SectionReveal } from '@/components/common/section-reveal';
import { TECH_FEATURES } from '@/constants/marketing-content';

export function Technology() {
  return (
    <section className="py-24">
      <div className="container">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-guzo-primary">Smart Technology</p>
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">Technology that moves Ethiopia forward</h2>
          <p className="mt-4 text-guzo-muted">
            AI routing, real-time GPS, secure payments, and cloud infrastructure — the stack behind Ethiopia&apos;s
            smartest logistics platform.
          </p>
        </SectionReveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TECH_FEATURES.map((t, i) => (
            <SectionReveal key={t.title} delay={i * 0.05}>
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
