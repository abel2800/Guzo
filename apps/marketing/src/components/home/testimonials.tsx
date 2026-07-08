'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { SectionReveal } from '@/components/common/section-reveal';

const TESTIMONIALS = [
  {
    quote: 'GUZO transformed how we fulfill e-commerce orders. Same-day delivery in Addis is now our competitive edge.',
    name: 'Selam T.',
    role: 'E-commerce Founder, Addis Ababa',
  },
  {
    quote: 'As a driver, the app is intuitive and earnings are transparent. I completed 40+ deliveries my first week.',
    name: 'Dawit K.',
    role: 'GUZO Driver Partner',
  },
  {
    quote: 'Their API integration took one afternoon. Bulk uploads and live tracking just work.',
    name: 'Michael A.',
    role: 'Operations Lead, Retail Chain',
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-white/10 bg-guzo-card/20 py-24">
      <div className="container">
        <SectionReveal className="text-center">
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">Trusted by builders</h2>
          <p className="mt-4 text-guzo-muted">Early partners and drivers helping shape Ethiopia&apos;s logistics future.</p>
        </SectionReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <Quote className="mb-4 h-8 w-8 text-guzo-primary/60" />
              <p className="text-sm leading-relaxed text-guzo-muted">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="font-semibold text-white">{t.name}</p>
                <p className="text-xs text-guzo-muted">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
