import { PageHeader, SectionReveal } from '@/components/common/section-reveal';

export const metadata = {
  title: 'Privacy Policy — GUZO',
  description: 'How GUZO collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="Last updated: July 2026. This policy describes how GUZO Logistics PLC handles your information."
      />

      <section className="container max-w-3xl space-y-8 pb-24 text-guzo-muted">
        {[
          {
            h: 'Information we collect',
            p: 'We collect account details (name, email, phone), delivery addresses, payment metadata, device identifiers for push notifications, and GPS location when you use tracking or driver services.',
          },
          {
            h: 'How we use data',
            p: 'Data powers order fulfillment, route optimization, customer support, fraud prevention, and product improvements. We do not sell personal data to third parties.',
          },
          {
            h: 'Location data',
            p: 'Drivers share location during active deliveries. Customers may share location for pickup scheduling. You can revoke location permissions in device settings.',
          },
          {
            h: 'Data retention',
            p: 'Order and delivery records are retained as required for legal, tax, and operational purposes. You may request account deletion by contacting privacy@guzo.et.',
          },
          {
            h: 'Contact',
            p: 'Questions about this policy: privacy@guzo.et',
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
