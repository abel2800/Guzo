import Link from 'next/link';
import { PageHeader, SectionReveal } from '@/components/common/section-reveal';
import { Technology } from '@/components/home/technology';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Technology — GUZO',
  description: 'AI routing, GPS tracking, analytics, automation, and open API for developers.',
};

export default function TechnologyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Technology"
        title="Intelligence at every mile."
        description="From AI-optimized routes to real-time fleet analytics, GUZO's platform is engineered for reliability at national scale."
      />
      <Technology />
      <section className="container pb-24">
        <SectionReveal className="rounded-3xl border border-white/10 bg-guzo-card/50 p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold text-white">Open API for developers</h2>
          <p className="mt-4 max-w-2xl text-guzo-muted">
            RESTful endpoints for orders, tracking, webhooks, and bulk imports. Sandbox keys available at merchant onboarding.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-xl bg-guzo-bg p-4 text-xs text-guzo-primary">
{`POST /api/v1/orders
Authorization: Bearer <merchant_api_key>

{
  "pickupAddress": { "line1": "...", "city": "Addis Ababa" },
  "dropoffAddress": { "line1": "...", "city": "Addis Ababa" },
  "deliveryType": "EXPRESS"
}`}
          </pre>
          <Button className="mt-6" asChild>
            <Link href="/merchants">Get API access</Link>
          </Button>
        </SectionReveal>
      </section>
    </>
  );
}
