import { PageHeader, SectionReveal } from '@/components/common/section-reveal';
import { TrackingDemo } from '@/components/tracking/tracking-demo';
import { Technology } from '@/components/home/technology';

export const metadata = {
  title: 'Live Tracking — GUZO',
  description: 'Track your GUZO shipment in real time with live GPS and ETA updates.',
};

export default function TrackingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Live Tracking"
        title="Follow every mile."
        description="Enter a tracking reference to see live GPS, driver location, and delivery timeline — the same experience customers get in the GUZO app."
      />
      <section className="container pb-24">
        <SectionReveal>
          <TrackingDemo />
        </SectionReveal>
      </section>
      <Technology />
    </>
  );
}
