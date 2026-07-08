import { PageHeader, SectionReveal } from '@/components/common/section-reveal';

export const metadata = {
  title: 'Terms of Service — GUZO',
  description: 'Terms governing use of GUZO delivery and platform services.',
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description="Last updated: July 2026. By using GUZO services you agree to these terms."
      />

      <section className="container max-w-3xl space-y-8 pb-24 text-guzo-muted">
        {[
          {
            h: 'Service description',
            p: 'GUZO provides logistics, delivery, tracking, and merchant platform services in Ethiopia. Service availability may vary by city and product type.',
          },
          {
            h: 'User responsibilities',
            p: 'You must provide accurate addresses and contact information. Prohibited items include illegal goods, hazardous materials without authorization, and items restricted by Ethiopian law.',
          },
          {
            h: 'Payments & refunds',
            p: 'Fees are quoted at booking. Refunds for cancelled or failed deliveries follow our refund policy communicated at checkout. Merchants are billed per agreed contract terms.',
          },
          {
            h: 'Driver & merchant terms',
            p: 'Drivers and merchants accept separate partner agreements covering payouts, insurance, SLA requirements, and platform conduct standards.',
          },
          {
            h: 'Limitation of liability',
            p: 'GUZO liability for lost or damaged goods is limited to the declared value and applicable insurance coverage selected at shipment creation.',
          },
          {
            h: 'Contact',
            p: 'Legal inquiries: legal@guzo.et',
          },
        ].map((section) => (
          <SectionReveal key={section.h}>
            <h2 className="font-display text-xl font-bold text-white">{section.h}</h2>
            <p className="mt-3 leading-relaxed">{section.p}</p>
          </SectionReveal>
        ))}
      </section>
    </>
  );
}
