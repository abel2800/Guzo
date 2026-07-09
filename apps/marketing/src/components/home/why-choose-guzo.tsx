'use client';

import { SectionReveal } from '@/components/common/section-reveal';
import { WHY_GUZO } from '@/constants/marketing-content';

export function WhyChooseGuzo() {
  return (
    <section className="border-y border-white/10 bg-guzo-card/20 py-24">
      <div className="container">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-guzo-primary">Why Choose Guzo</p>
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">The smartest way to ship in Ethiopia</h2>
          <p className="mt-4 text-guzo-muted">
            Premium logistics technology — clean, reliable, and built for trust from the first mile to the last.
          </p>
        </SectionReveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_GUZO.map((item, i) => (
            <SectionReveal key={item.title} delay={i * 0.06}>
              <div className="glass group h-full rounded-2xl p-6 transition hover:border-guzo-primary/30">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-guzo-primary/15 text-guzo-primary transition group-hover:scale-110">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-guzo-muted">{item.desc}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
