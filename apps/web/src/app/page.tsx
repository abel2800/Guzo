'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Truck,
  MapPin,
  ShieldCheck,
  Clock,
  Boxes,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { GuzoLogo } from '@/components/guzo-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FEATURES = [
  { icon: MapPin, title: 'Live Tracking', desc: 'Real-time GPS tracking on OpenStreetMap with OSRM smart routing.' },
  { icon: Clock, title: 'Same-Day & Express', desc: 'Flexible delivery tiers with transparent, distance-based pricing.' },
  { icon: Boxes, title: 'Warehousing', desc: 'Receive, sort, scan and dispatch with full inventory control.' },
  { icon: ShieldCheck, title: 'Enterprise Security', desc: 'JWT, RBAC, audit logs and rate limiting baked in.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Operational insight for admins, merchants and finance.' },
  { icon: Truck, title: 'Driver Network', desc: 'Onboarding, earnings, availability and proof of delivery.' },
];

const STATS = [
  ['10', 'Role-based portals'],
  ['25+', 'Backend modules'],
  ['100%', 'Open-source stack'],
  ['24/7', 'Real-time updates'],
];

export default function LandingPage() {
  return (
    <div className="auth-shell min-h-screen">
      <div className="auth-orb -left-24 top-0 h-72 w-72 bg-guzo-primary/20" />
      <div className="auth-orb right-0 top-1/3 h-96 w-96 bg-emerald-500/10" />

      <header className="sticky top-0 z-40 border-b border-border bg-guzo-bg/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <GuzoLogo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container relative grid items-center gap-10 py-20 lg:grid-cols-2 lg:py-28">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-guzo-primary/25 bg-guzo-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-guzo-primary">
            <Truck className="h-3.5 w-3.5" /> Logistics, reimagined
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-foreground">
            Moving Ethiopia <span className="text-guzo-primary">Forward.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            GUZO is an enterprise delivery platform connecting customers, drivers, merchants and
            warehouses — with live tracking, smart routing and total operational control.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Start shipping <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Open dashboard</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <div className="dashboard-hero aspect-square p-1">
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-[1.4rem] p-8 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-guzo-primary/30 bg-guzo-primary/15 text-guzo-primary shadow-[0_0_40px_rgba(34,197,94,0.25)]">
                <Truck className="h-12 w-12" />
              </div>
              <p className="text-xl font-bold text-foreground">GUZO Control Tower</p>
              <p className="text-sm text-muted-foreground">
                One platform · ten role portals · real-time everything
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="container grid grid-cols-2 gap-6 py-12 md:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-extrabold text-guzo-primary">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Everything you need to deliver</h2>
          <p className="mt-3 text-muted-foreground">
            A complete logistics operating system, built on a scalable modular architecture.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full transition-all hover:border-guzo-primary/30 hover:shadow-[0_0_40px_rgba(34,197,94,0.08)]">
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-guzo-primary/25 bg-guzo-primary/10 text-guzo-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="dashboard-hero overflow-hidden p-12 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to move forward?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Create an account and book your first shipment, or sign in to your role dashboard.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">Create account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <GuzoLogo showText={false} />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GUZO Logistics. Moving Ethiopia Forward.
          </p>
        </div>
      </footer>
    </div>
  );
}
