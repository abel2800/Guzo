'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { SectionReveal } from '@/components/common/section-reveal';
import { Button } from '@/components/ui/button';
import { TRACKING_STEPS } from '@/constants/marketing-content';
import { cn } from '@/lib/utils';

export function TrackingTimeline() {
  const [activeStep, setActiveStep] = useState(3);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s >= TRACKING_STEPS.length - 1 ? 0 : s + 1));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="border-y border-white/10 bg-guzo-card/20 py-24">
      <div className="container">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-guzo-primary">Real-Time Tracking</p>
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">Know where your package is — always</h2>
          <p className="mt-4 text-guzo-muted">
            Interactive tracking from order creation to doorstep delivery. Every milestone, verified and visible.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.15} className="mx-auto mt-16 max-w-2xl">
          <div className="relative rounded-3xl border border-white/10 bg-guzo-bg/80 p-8 backdrop-blur">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-guzo-muted">Tracking #</p>
                <p className="font-mono text-lg font-semibold text-white">GZ-28491-ETH</p>
              </div>
              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-guzo-primary/15"
              >
                <Package className="h-6 w-6 text-guzo-primary" />
              </motion.div>
            </div>

            <div className="space-y-0">
              {TRACKING_STEPS.map((step, i) => {
                const done = i <= activeStep;
                const current = i === activeStep;
                return (
                  <div key={step.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition',
                          done
                            ? 'border-guzo-primary bg-guzo-primary text-guzo-bg'
                            : 'border-white/20 bg-transparent text-guzo-muted',
                          current && 'ring-4 ring-guzo-primary/30',
                        )}
                      >
                        {done ? '✓' : i + 1}
                      </div>
                      {i < TRACKING_STEPS.length - 1 && (
                        <div
                          className={cn('my-1 w-0.5 flex-1 min-h-[28px]', done ? 'bg-guzo-primary' : 'bg-white/10')}
                        />
                      )}
                    </div>
                    <div className={cn('pb-6 pt-1', current && 'text-white')}>
                      <p className={cn('font-medium', done ? 'text-white' : 'text-guzo-muted')}>{step.label}</p>
                      {current && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-1 text-xs text-guzo-primary"
                        >
                          In progress now
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-center">
              <Button variant="outline" asChild>
                <Link href="/tracking">Try live tracking</Link>
              </Button>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
