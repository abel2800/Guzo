import { PageHeader } from '@/components/common/section-reveal';
import { FAQ } from '@/components/home/faq';
import { Newsletter } from '@/components/home/newsletter';

export const metadata = {
  title: 'FAQ — GUZO',
  description: 'Frequently asked questions about GUZO delivery, drivers, merchants, and launch.',
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="Questions answered."
        description="Everything you need to know before joining GUZO as a customer, driver, or merchant."
      />
      <FAQ />
      <Newsletter />
    </>
  );
}
