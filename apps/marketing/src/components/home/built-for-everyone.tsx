'use client';

import { SectionReveal } from '@/components/common/section-reveal';
import { BUILT_FOR } from '@/constants/marketing-content';

export function BuiltForEveryone() {
  return (
    <section className="py-24">
      <div className="container">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-guzo-primary">Built for Everyone</p>
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">Logistics that scales with you</h2>
        </SectionReveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BUILT_FOR.map((item, i) => (
            <SectionReveal key={item.title} delay={i * 0.08}>
              <div className="glass h-full rounded-2xl p-6 text-center transition hover:border-guzo-primary/30">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-guzo-primary/15 text-guzo-primary">
                  <item.icon className="h-7 w-7" />
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
