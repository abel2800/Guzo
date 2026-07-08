import { PageHeader } from '@/components/common/section-reveal';
import { Services } from '@/components/home/services';
import { HowItWorks } from '@/components/home/how-it-works';
import { Technology } from '@/components/home/technology';

export const metadata = {
  title: 'Services — GUZO',
  description: 'Parcel delivery, express shipping, warehouse ops, merchant tools, and Open API for Ethiopia.',
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Every logistics need, one platform."
        description="From a single parcel to enterprise fleet management — GUZO covers the full delivery chain across Ethiopia."
      />
      <Services />
      <HowItWorks />
      <Technology />
    </>
  );
}
