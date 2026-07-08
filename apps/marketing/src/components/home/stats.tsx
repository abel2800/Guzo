'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { SITE } from '@/constants/site';

function Counter({ value }: { value: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const numeric = parseInt(value.replace(/\D/g, ''), 10);
  const suffix = value.replace(/[\d]/g, '');
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView || !numeric) return;
    let start = 0;
    const step = Math.ceil(numeric / 60);
    const id = setInterval(() => {
      start += step;
      if (start >= numeric) {
        setCount(numeric);
        clearInterval(id);
      } else setCount(start);
    }, 20);
    return () => clearInterval(id);
  }, [inView, numeric]);

  return (
    <span ref={ref}>
      {inView ? count.toLocaleString() : '0'}
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="border-y border-white/10 bg-guzo-card/30 py-20">
      <div className="container grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {SITE.stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="text-center"
          >
            <p className="font-display text-4xl font-bold text-white md:text-5xl">
              <Counter value={s.value} />
            </p>
            <p className="mt-2 text-sm text-guzo-muted">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
