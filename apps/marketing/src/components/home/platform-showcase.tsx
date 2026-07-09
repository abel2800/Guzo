'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { SectionReveal } from '@/components/common/section-reveal';
import { IphoneMockup } from '@/components/home/iphone-mockup';
import { APP_SHOWCASES, PLATFORM_STACK } from '@/constants/marketing-content';
import { cn } from '@/lib/utils';

const APP_ACCENTS: Record<string, string> = {
  customer: 'from-emerald-500/20 via-guzo-card to-guzo-bg',
  courier: 'from-cyan-500/20 via-guzo-card to-guzo-bg',
  business: 'from-violet-500/20 via-guzo-card to-guzo-bg',
  warehouse: 'from-amber-500/20 via-guzo-card to-guzo-bg',
};

const APP_ICONS: Record<string, string> = {
  customer: '📦',
  courier: '🛵',
  business: '🏪',
  warehouse: '🏭',
};

export function PlatformShowcase() {
  const [active, setActive] = useState(0);
  const app = APP_SHOWCASES[active];

  return (
    <section className="py-24">
      <div className="container">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-guzo-primary">One Platform</p>
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">Everything in One Platform</h2>
          <p className="mt-4 text-guzo-muted">
            Customer apps, courier tools, business dashboards, and warehouse operations — unified under Guzo.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.1} className="mx-auto mt-14 max-w-md">
          <div className="flex flex-col items-center gap-0">
            {PLATFORM_STACK.map((layer, i) => (
              <div key={layer} className="flex w-full flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="w-full rounded-xl border border-guzo-primary/20 bg-guzo-card/60 px-4 py-3 text-center text-sm font-medium text-white backdrop-blur"
                >
                  {layer}
                </motion.div>
                {i < PLATFORM_STACK.length - 1 && (
                  <ChevronDown className="my-1 h-5 w-5 text-guzo-primary/50" />
                )}
              </div>
            ))}
          </div>
        </SectionReveal>

        <SectionReveal delay={0.2} className="mt-20">
          <div className="flex flex-wrap justify-center gap-2">
            {APP_SHOWCASES.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition',
                  active === i
                    ? 'bg-guzo-primary text-guzo-bg'
                    : 'border border-white/10 text-guzo-muted hover:text-white',
                )}
              >
                {a.title.replace(' Mobile App', '').replace(' Management', '')}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="mt-12 grid items-center gap-12 lg:grid-cols-2"
            >
              <IphoneMockup className="mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      'flex h-full flex-col bg-gradient-to-b px-5 pb-8 pt-2',
                      APP_ACCENTS[app.id] ?? 'from-guzo-primary/20 via-guzo-card to-guzo-bg',
                    )}
                  >
                    <div className="mb-4 flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-guzo-primary/20 text-2xl ring-1 ring-guzo-primary/30">
                        {APP_ICONS[app.id]}
                      </div>
                    </div>
                    <p className="text-center font-display text-base font-bold leading-tight text-white">
                      {app.title.replace(' Mobile App', '').replace(' Management', '')}
                    </p>
                    <p className="mt-1.5 text-center text-[11px] leading-snug text-guzo-muted">{app.subtitle}</p>

                    <div className="mt-5 flex-1 space-y-2">
                      {app.features.slice(0, 5).map((f, i) => (
                        <motion.div
                          key={f}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/30 px-3 py-2.5 backdrop-blur-sm"
                        >
                          <Check className="h-3 w-3 shrink-0 text-guzo-primary" />
                          <span className="text-[11px] text-white/85">{f}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl bg-guzo-primary/90 py-2.5 text-center text-[11px] font-semibold text-guzo-bg">
                      Open Guzo App
                    </div>
                  </motion.div>
                </AnimatePresence>
              </IphoneMockup>

              <div>
                <h3 className="font-display text-2xl font-bold text-white md:text-3xl">{app.title}</h3>
                <p className="mt-3 text-guzo-muted">{app.subtitle}</p>
                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {app.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-guzo-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-guzo-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </SectionReveal>
      </div>
    </section>
  );
}
