'use client';

import { motion } from 'framer-motion';
import { Truck, Zap, Building2, Store, BarChart3, CreditCard, Code } from 'lucide-react';

const SERVICES = [
  { icon: PackageIcon, title: 'Parcel Delivery', desc: 'Same-day and scheduled delivery across Ethiopia.' },
  { icon: Zap, title: 'Express', desc: 'Priority routing for time-critical shipments.' },
  { icon: Building2, title: 'Warehouse', desc: 'Receive, sort, and dispatch at GUZO hubs.' },
  { icon: Store, title: 'Merchant Platform', desc: 'Bulk orders, analytics, and API integrations.' },
  { icon: BarChart3, title: 'Tracking & Analytics', desc: 'Live GPS, ETAs, and business intelligence.' },
  { icon: CreditCard, title: 'Digital Payments', desc: 'Secure checkout and invoicing built in.' },
  { icon: Code, title: 'Open API', desc: 'Integrate GUZO into your e-commerce stack.' },
];

function PackageIcon(props: React.ComponentProps<typeof Truck>) {
  return <Truck {...props} />;
}

export function Services() {
  return (
    <section className="border-t border-white/10 bg-guzo-card/20 py-24">
      <div className="container">
        <h2 className="font-display text-4xl font-bold text-white md:text-5xl">Services</h2>
        <p className="mt-4 max-w-2xl text-guzo-muted">One ecosystem for every logistics need — from a single parcel to enterprise fleet management.</p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-white/10 bg-guzo-bg/60 p-6 backdrop-blur"
            >
              <s.icon className="mb-4 h-8 w-8 text-guzo-primary" />
              <h3 className="font-display text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-guzo-muted">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
