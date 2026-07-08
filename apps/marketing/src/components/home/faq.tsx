'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionReveal } from '@/components/common/section-reveal';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'When is GUZO launching?',
    a: 'We are onboarding early-access merchants and drivers now. Public app launch is coming soon — join the waitlist to get notified first.',
  },
  {
    q: 'Which cities does GUZO serve?',
    a: 'We are starting in Addis Ababa and expanding to major Ethiopian cities throughout 2026. Check back for rollout updates.',
  },
  {
    q: 'How do I become a GUZO driver?',
    a: 'Apply on our Drivers page. You will need a valid license, smartphone, and vehicle (motorcycle or van depending on service type).',
  },
  {
    q: 'Can businesses integrate via API?',
    a: 'Yes. Merchants get API keys, webhooks, bulk order uploads, and sandbox access during onboarding.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'Mobile money, bank transfer, and card payments will be supported at launch with instant invoicing and receipts.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24">
      <div className="container max-w-3xl">
        <SectionReveal className="text-center">
          <h2 className="font-display text-4xl font-bold text-white">FAQ</h2>
          <p className="mt-4 text-guzo-muted">Everything you need to know before joining GUZO.</p>
        </SectionReveal>

        <div className="mt-12 space-y-3">
          {FAQS.map((item, i) => (
            <SectionReveal key={item.q} delay={i * 0.05}>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-guzo-card/40">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="font-medium text-white">{item.q}</span>
                  <ChevronDown className={cn('h-5 w-5 text-guzo-muted transition', open === i && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="border-t border-white/10 px-6 pb-4 pt-2 text-sm leading-relaxed text-guzo-muted">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
