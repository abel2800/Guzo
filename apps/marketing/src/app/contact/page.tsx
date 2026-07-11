'use client';

import { useState } from 'react';
import { Mail, MapPin } from 'lucide-react';
import { PageHeader, SectionReveal } from '@/components/common/section-reveal';
import { Button } from '@/components/ui/button';
import { submitContact } from '@/lib/java-api';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's move forward together."
        description="Partnerships, enterprise sales, driver onboarding, and press — we'd love to hear from you."
      />

      <section className="container pb-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionReveal>
            <div className="space-y-6">
              {[
                { icon: Mail, label: 'Email', value: 'hello@guzo.et' },
                { icon: MapPin, label: 'HQ', value: 'Addis Ababa, Ethiopia' },
              ].map((item) => (
                <div key={item.label} className="flex gap-4 rounded-2xl border border-white/10 bg-guzo-card/40 p-5">
                  <item.icon className="h-6 w-6 text-guzo-primary" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-guzo-muted">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {sent ? (
              <div className="rounded-2xl border border-guzo-primary/30 bg-guzo-primary/10 p-8 text-center">
                <p className="font-semibold text-white">Message received</p>
                <p className="mt-2 text-sm text-guzo-muted">Our team will respond within 1–2 business days.</p>
              </div>
            ) : (
              <form
                className="space-y-4 rounded-2xl border border-white/10 bg-guzo-card/40 p-8"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  setLoading(true);
                  try {
                    await submitContact({ name, email, topic, message });
                    setSent(true);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not send message');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <input
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-guzo-bg/60 px-4 py-3 text-white placeholder:text-guzo-muted/60 focus:border-guzo-primary focus:outline-none"
                />
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-guzo-bg/60 px-4 py-3 text-white placeholder:text-guzo-muted/60 focus:border-guzo-primary focus:outline-none"
                />
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-guzo-bg/60 px-4 py-3 text-white focus:border-guzo-primary focus:outline-none"
                >
                  <option value="general">General inquiry</option>
                  <option value="merchant">Merchant / API</option>
                  <option value="driver">Become a driver</option>
                  <option value="press">Press</option>
                </select>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we help?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-guzo-bg/60 px-4 py-3 text-white placeholder:text-guzo-muted/60 focus:border-guzo-primary focus:outline-none"
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send message'}
                </Button>
              </form>
            )}
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
