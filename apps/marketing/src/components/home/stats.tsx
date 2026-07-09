'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { STATS } from '@/constants/marketing-content';
import { fetchMarketingStats, type MarketingStat } from '@/lib/java-api';

function Counter({ value }: { value: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  const decimalMatch = value.match(/^([\d.]+)(%)?(\+)?$/);
  const isAnimated = Boolean(decimalMatch);
  const numeric = decimalMatch ? parseFloat(decimalMatch[1]) : 0;
  const suffix = decimalMatch ? `${decimalMatch[2] ?? ''}${decimalMatch[3] ?? ''}` : '';

  useEffect(() => {
    if (!inView || !isAnimated) return;
    const isDecimal = value.includes('.');
    let start = 0;
    const steps = 50;
    const step = numeric / steps;
    const id = setInterval(() => {
      start += step;
      if (start >= numeric) {
        setCount(numeric);
        clearInterval(id);
      } else {
        setCount(isDecimal ? Math.round(start * 10) / 10 : Math.floor(start));
      }
    }, 25);
    return () => clearInterval(id);
  }, [inView, isAnimated, numeric, value]);

  if (!isAnimated) {
    return (
      <span ref={ref} className="font-display text-4xl font-bold text-white md:text-5xl">
        {value}
      </span>
    );
  }

  const display = value.includes('.')
    ? `${inView ? count.toFixed(1) : '0.0'}${suffix}`
    : `${inView ? Math.floor(count).toLocaleString() : '0'}${suffix}`;

  return (
    <span ref={ref} className="font-display text-4xl font-bold text-white md:text-5xl">
      {display}
    </span>
  );
}

export function Stats() {
  const [rows, setRows] = useState<MarketingStat[]>([...STATS]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    fetchMarketingStats()
      .then((data) => {
        if (data.stats?.length) {
          setRows(data.stats);
          setLive(true);
        }
      })
      .catch(() => setLive(false));
  }, []);

  return (
    <section className="border-y border-white/10 bg-guzo-card/30 py-20">
      <div className="container mb-6 flex justify-center">
        <p className="text-xs uppercase tracking-[0.2em] text-guzo-muted">
          {live ? 'Live network metrics' : 'Trusted by thousands across Ethiopia'}
        </p>
      </div>
      <div className="container grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="text-center"
          >
            <Counter value={s.value} />
            <p className="mt-2 text-sm text-guzo-muted">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
