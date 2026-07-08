'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-guzo-primary/30 bg-gradient-to-br from-guzo-primary/10 via-guzo-card to-guzo-bg p-10 md:p-16"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-guzo-primary/20 blur-3xl" />
          <div className="relative max-w-xl">
            <Mail className="mb-4 h-8 w-8 text-guzo-primary" />
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">Join the waitlist</h2>
            <p className="mt-3 text-guzo-muted">
              Be first to access GUZO. Collect early access, driver slots, and merchant onboarding invites.
            </p>
            {done ? (
              <p className="mt-6 font-medium text-guzo-primary">You&apos;re on the list. We&apos;ll be in touch.</p>
            ) : (
              <form
                className="mt-8 flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.includes('@')) setDone(true);
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 flex-1 rounded-full border border-white/15 bg-guzo-bg/80 px-5 text-white placeholder:text-guzo-muted/60 focus:outline-none focus:ring-2 focus:ring-guzo-primary/50"
                />
                <Button type="submit" size="lg">
                  Join early access <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
