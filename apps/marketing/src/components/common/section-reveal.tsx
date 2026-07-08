'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SectionReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <SectionReveal className="container max-w-3xl pb-12 pt-32">
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-guzo-primary">{eyebrow}</p>
      )}
      <h1 className="font-display text-4xl font-bold text-white md:text-5xl lg:text-6xl">{title}</h1>
      {description && <p className="mt-5 text-lg leading-relaxed text-guzo-muted">{description}</p>}
    </SectionReveal>
  );
}
