'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroCanvas } from '@/components/three/hero-canvas';
import { SITE } from '@/constants/site';

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-28">
      <div className="absolute inset-0 bg-hero-glow" />
      <HeroCanvas />
      <div className="absolute inset-0 bg-grid-fade pointer-events-none" />

      <div className="container relative z-10 grid items-center gap-12 pb-24 lg:grid-cols-2 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-guzo-primary/30 bg-guzo-primary/10 px-4 py-1.5 text-xs font-medium text-guzo-primary backdrop-blur">
            <MapPin className="h-3.5 w-3.5" /> Addis Ababa · Launching soon
          </p>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
            Ethiopia&apos;s Smart Logistics Future.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-guzo-muted">{SITE.description}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link href="/download">
                Download App <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/drivers">Become a Driver</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/merchants">Become a Merchant</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute -inset-8 rounded-full bg-guzo-primary/20 blur-3xl" />
          <div className="relative rounded-[2.5rem] border border-white/15 bg-guzo-card/80 p-3 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[2rem] bg-guzo-bg p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs text-guzo-muted">Live tracking</span>
                <span className="rounded-full bg-guzo-primary/20 px-2 py-0.5 text-[10px] font-semibold text-guzo-primary">
                  IN TRANSIT
                </span>
              </div>
              <div className="relative mb-4 h-36 overflow-hidden rounded-xl bg-guzo-card">
                <svg viewBox="0 0 200 120" className="h-full w-full">
                  <path d="M20,90 Q60,40 100,60 T180,30" fill="none" stroke="#22C55E" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                  <circle cx="20" cy="90" r="4" fill="#22C55E" />
                  <circle cx="180" cy="30" r="4" fill="#10B981" />
                  <motion.circle
                    cx="20"
                    cy="90"
                    r="6"
                    fill="#22C55E"
                    animate={{ cx: [20, 60, 100, 140, 180], cy: [90, 55, 60, 45, 30] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  />
                </svg>
              </div>
              <p className="font-semibold text-white">Package #GZ-28491</p>
              <p className="text-sm text-guzo-muted">ETA 18 min · Driver Dawit K.</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-guzo-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: '72%' }}
                  transition={{ duration: 2, delay: 0.5 }}
                />
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="absolute -bottom-4 left-1/2 -translate-x-1/2 gap-2" asChild>
            <Link href="/tracking">
              <Play className="h-3 w-3" /> Watch demo
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
