'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Truck } from 'lucide-react';
import { SectionReveal } from '@/components/common/section-reveal';
import { Button } from '@/components/ui/button';

const ROUTES = [
  { id: 1, from: 'Bole', to: 'Piassa', eta: '22 min', progress: 65 },
  { id: 2, from: 'Megenagna', to: 'Kazanchis', eta: '14 min', progress: 40 },
  { id: 3, from: 'CMC', to: 'Sarbet', eta: '31 min', progress: 85 },
];

export function LiveMap() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 py-24">
      <div className="container">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">Live Deliveries Across Ethiopia</h2>
          <p className="mt-4 text-guzo-muted">
            Real-time GPS routing, animated ETAs, and fleet visibility — powered by GUZO&apos;s intelligent network.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.15} className="mt-14 grid gap-8 lg:grid-cols-5">
          <div className="relative col-span-3 min-h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-guzo-card/60 backdrop-blur">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(34,197,94,0.15),transparent_60%)]" />
            <svg viewBox="0 0 800 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
              {/* Grid */}
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 20} x2="800" y2={i * 20} stroke="rgba(255,255,255,0.04)" />
              ))}
              {Array.from({ length: 40 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="400" stroke="rgba(255,255,255,0.04)" />
              ))}
              {/* Routes */}
              <motion.path
                d="M80,320 C200,280 300,200 420,180 S620,80 720,60"
                fill="none"
                stroke="#22C55E"
                strokeWidth="3"
                strokeDasharray="8 6"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2 }}
              />
              <motion.path
                d="M100,100 C250,150 400,120 550,200 S700,280 750,350"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="6 8"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2.5, delay: 0.3 }}
              />
              {/* Moving vehicles */}
              <motion.g
                animate={{ offsetDistance: ['0%', '100%'] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                style={{ offsetPath: 'path("M80,320 C200,280 300,200 420,180 S620,80 720,60")' } as React.CSSProperties}
              >
                <circle r="8" fill="#22C55E" />
              </motion.g>
            </svg>
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-guzo-bg/80 px-3 py-1.5 text-xs text-guzo-muted backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-guzo-primary" />
              847 active deliveries
            </div>
          </div>

          <div className="col-span-2 space-y-3">
            {ROUTES.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-guzo-card/50 p-4 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Truck className="h-4 w-4 text-guzo-primary" />
                    {r.from} → {r.to}
                  </div>
                  <span className="text-xs text-guzo-primary">{r.eta}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-guzo-primary"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${r.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/tracking">Open tracking demo</Link>
            </Button>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
