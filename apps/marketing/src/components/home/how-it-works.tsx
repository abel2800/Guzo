'use client';

import { motion } from 'framer-motion';
import { Package, Truck, Warehouse, MapPin, CheckCircle2, ClipboardList } from 'lucide-react';

const STEPS = [
  { icon: ClipboardList, title: 'Request Delivery', desc: 'Book online or via the merchant API.' },
  { icon: Truck, title: 'Driver Assigned', desc: 'Smart routing matches the nearest driver.' },
  { icon: Package, title: 'Package Picked Up', desc: 'Real-time GPS from pickup to hub.' },
  { icon: Warehouse, title: 'Warehouse', desc: 'Sort, scan, and consolidate at GUZO hubs.' },
  { icon: MapPin, title: 'Out For Delivery', desc: 'Live ETA updates for recipients.' },
  { icon: CheckCircle2, title: 'Delivered', desc: 'Proof of delivery and instant notifications.' },
];

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">How GUZO Works</h2>
          <p className="mt-4 text-guzo-muted">Six steps from request to doorstep — fully tracked, fully transparent.</p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group rounded-2xl border border-white/10 bg-guzo-card/50 p-6 backdrop-blur transition hover:border-guzo-primary/40 hover:bg-guzo-card"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-guzo-primary/15 text-guzo-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-guzo-primary">Step {i + 1}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-guzo-muted">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
