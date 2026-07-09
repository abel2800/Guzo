'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroCanvas } from '@/components/three/hero-canvas';
import { DeliveryDemoCard } from '@/components/home/delivery-demo-card';
import { HERO } from '@/constants/marketing-content';

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-28">
      <div className="absolute inset-0 z-0 bg-hero-glow" />
      <div className="absolute inset-0 z-0">
        <HeroCanvas />
      </div>
      <div className="absolute inset-0 z-[1] bg-grid-fade pointer-events-none" />

      <div className="container relative z-10 grid items-center gap-12 pb-24 lg:grid-cols-2 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-guzo-primary/30 bg-guzo-primary/10 px-4 py-1.5 text-xs font-medium text-guzo-primary backdrop-blur">
            <MapPin className="h-3.5 w-3.5" /> {HERO.eyebrow}
          </p>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
            {HERO.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-guzo-muted">{HERO.subheading}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link href="/download">
                Download App <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/tracking">
                <Package className="h-4 w-4" /> Track Package
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/merchants">Become a Partner</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
        >
          <DeliveryDemoCard />
        </motion.div>
      </div>
    </section>
  );
}
