'use client';

import Link from 'next/link';
import { ArrowRight, Check, Shield } from 'lucide-react';
import { SectionReveal } from '@/components/common/section-reveal';
import { Button } from '@/components/ui/button';
import { BUSINESS_BENEFITS, SECURITY_FEATURES } from '@/constants/marketing-content';

export function BusinessAndSecurity() {
  return (
    <section className="border-y border-white/10 bg-guzo-card/20 py-24">
      <div className="container grid gap-16 lg:grid-cols-2">
        <SectionReveal>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-guzo-primary">Guzo for Businesses</p>
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">Ship smarter. Spend less. Grow faster.</h2>
          <p className="mt-4 text-guzo-muted">
            From startups to enterprise — Guzo gives you the tools to deliver faster, cut logistics costs, and keep
            customers informed every step of the way.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {BUSINESS_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-guzo-muted">
                <Check className="h-4 w-4 shrink-0 text-guzo-primary" />
                {b}
              </li>
            ))}
          </ul>
          <Button className="mt-8" asChild>
            <Link href="/merchants">
              Become a Partner <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <div className="glass rounded-3xl p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-guzo-primary/15">
                <Shield className="h-6 w-6 text-guzo-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">Security & Trust</h3>
                <p className="text-sm text-guzo-muted">Enterprise-grade protection</p>
              </div>
            </div>
            <ul className="space-y-3">
              {SECURITY_FEATURES.map((s) => (
                <li key={s} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white">
                  <Check className="h-4 w-4 shrink-0 text-guzo-primary" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
