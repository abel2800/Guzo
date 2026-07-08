'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, CheckCircle2, Truck } from 'lucide-react';

const STEPS = [
  { label: 'Order confirmed', time: '10:02 AM', done: true },
  { label: 'Driver assigned', time: '10:05 AM', done: true },
  { label: 'Picked up', time: '10:28 AM', done: true },
  { label: 'In transit', time: 'Now', done: true, active: true },
  { label: 'Delivered', time: 'ETA 11:12 AM', done: false },
];

export function TrackingDemo() {
  const [ref, setRef] = useState('GZ-28491');

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-guzo-card/50 p-6 backdrop-blur">
        <label className="text-sm text-guzo-muted">Tracking reference</label>
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-guzo-bg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-guzo-primary/50"
        />
        <div className="relative mt-6 h-64 overflow-hidden rounded-2xl bg-guzo-bg">
          <svg viewBox="0 0 400 200" className="h-full w-full">
            <path d="M40,160 Q120,80 200,100 T360,40" fill="none" stroke="#22C55E" strokeWidth="3" opacity="0.5" />
            <motion.circle
              r="10"
              fill="#22C55E"
              animate={{ cx: [40, 120, 200, 280, 360], cy: [160, 100, 100, 70, 40] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <circle cx="40" cy="160" r="6" fill="#fff" opacity="0.5" />
            <circle cx="360" cy="40" r="6" fill="#10B981" />
          </svg>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-guzo-bg/90 px-3 py-1 text-xs">
            <Truck className="h-3 w-3 text-guzo-primary" /> Driver en route
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-guzo-card/50 p-5">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-guzo-primary" />
            <div>
              <p className="font-semibold text-white">#{ref}</p>
              <p className="text-sm text-guzo-muted">Express · Bole → Kazanchis</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-guzo-card/50 p-5">
          <p className="mb-4 text-sm font-semibold text-white">Shipment timeline</p>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.label} className="flex gap-3">
                <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${s.done ? 'bg-guzo-primary/20 text-guzo-primary' : 'bg-white/5 text-guzo-muted'}`}>
                  {s.done ? <CheckCircle2 className="h-4 w-4" /> : <MapPin className="h-3 w-3" />}
                </div>
                <div>
                  <p className={`text-sm ${s.active ? 'font-semibold text-guzo-primary' : 'text-white'}`}>{s.label}</p>
                  <p className="text-xs text-guzo-muted">{s.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
