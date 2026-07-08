'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

export function EarningsCalculator() {
  const [deliveries, setDeliveries] = useState(12);
  const [days, setDays] = useState(22);
  const avgPayout = 95;

  const daily = deliveries * avgPayout;
  const monthly = daily * days;

  return (
    <div className="rounded-3xl border border-guzo-primary/30 bg-gradient-to-br from-guzo-primary/10 via-guzo-card to-guzo-bg p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-guzo-primary/20 text-guzo-primary">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-white">Earnings Calculator</h3>
          <p className="text-sm text-guzo-muted">Estimate your monthly income as a GUZO driver.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-guzo-muted">Deliveries per day</span>
            <span className="font-semibold text-white">{deliveries}</span>
          </div>
          <input
            type="range"
            min={4}
            max={30}
            value={deliveries}
            onChange={(e) => setDeliveries(Number(e.target.value))}
            className="w-full accent-guzo-primary"
          />
        </div>
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-guzo-muted">Working days per month</span>
            <span className="font-semibold text-white">{days}</span>
          </div>
          <input
            type="range"
            min={15}
            max={26}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full accent-guzo-primary"
          />
        </div>
      </div>

      <motion.div
        key={monthly}
        initial={{ scale: 0.98, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mt-8 rounded-2xl border border-white/10 bg-guzo-bg/60 p-6 text-center"
      >
        <p className="text-sm text-guzo-muted">Estimated monthly earnings</p>
        <p className="font-display text-4xl font-bold text-guzo-primary">
          ETB {monthly.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-guzo-muted">~ETB {daily.toLocaleString()}/day · ETB {avgPayout} avg per delivery</p>
      </motion.div>
    </div>
  );
}
