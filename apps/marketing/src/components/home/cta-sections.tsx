'use client';

import Link from 'next/link';
import { ArrowRight, Smartphone } from 'lucide-react';
import { SectionReveal } from '@/components/common/section-reveal';
import { Button } from '@/components/ui/button';

export function DownloadCta() {
  return (
    <section className="py-24">
      <div className="container">
        <SectionReveal className="relative overflow-hidden rounded-3xl border border-white/10 bg-guzo-card/60 p-10 text-center md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.15),transparent_60%)]" />
          <div className="relative">
            <Smartphone className="mx-auto mb-6 h-12 w-12 text-guzo-primary" />
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">Download Guzo Today</h2>
            <p className="mx-auto mt-4 max-w-xl text-guzo-muted">
              Experience intelligent logistics built for Ethiopia. Track packages, schedule deliveries, and manage
              shipments from your phone.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/download">Google Play</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/download">App Store</Link>
              </Button>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="pb-24">
      <div className="container">
        <SectionReveal className="relative overflow-hidden rounded-3xl border border-guzo-primary/30 bg-gradient-to-br from-guzo-primary/15 via-guzo-card to-guzo-bg p-10 md:p-16">
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-guzo-primary/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              Ready to Experience Smarter Logistics?
            </h2>
            <p className="mt-4 text-guzo-muted">
              Start shipping with confidence using Ethiopia&apos;s most advanced logistics platform.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/download">
                  Download App <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/merchants">Create Business Account</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/drivers">Become a Courier</Link>
              </Button>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
