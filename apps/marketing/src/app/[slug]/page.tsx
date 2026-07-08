import Link from 'next/link';
import { Button } from '@/components/ui/button';

const PAGES: Record<string, { title: string; body: string }> = {
  about: {
    title: 'About GUZO',
    body: 'GUZO is building Ethiopia\'s intelligent delivery ecosystem — connecting customers, merchants, drivers, and warehouses on one platform.',
  },
  services: {
    title: 'Services',
    body: 'Parcel delivery, express shipping, warehouse management, merchant tools, fleet management, and international logistics.',
  },
  technology: {
    title: 'Technology',
    body: 'AI route optimization, real-time GPS tracking, analytics dashboards, automation, and a developer-friendly Open API.',
  },
  drivers: {
    title: 'Become a Driver',
    body: 'Flexible earnings, smart navigation, and instant payouts. Join thousands of GUZO drivers moving Ethiopia forward.',
  },
  merchants: {
    title: 'Merchant Platform',
    body: 'Bulk orders, analytics, API keys, and integrations for e-commerce and retail businesses.',
  },
  pricing: {
    title: 'Pricing',
    body: 'Transparent rates for individuals and volume discounts for businesses. Full pricing launches with the app.',
  },
  contact: {
    title: 'Contact',
    body: 'Reach us at hello@guzo.et for partnerships, press, and enterprise inquiries.',
  },
  careers: { title: 'Careers', body: 'We\'re hiring engineers, operators, and designers. Send your CV to careers@guzo.et.' },
  blog: { title: 'Blog', body: 'News and updates coming soon.' },
  faq: { title: 'FAQ', body: 'Frequently asked questions will be published at launch.' },
  press: { title: 'Press', body: 'Media kit and press contacts available on request.' },
  investors: { title: 'Investors', body: 'GUZO is building category-defining logistics infrastructure for East Africa.' },
  privacy: { title: 'Privacy Policy', body: 'Your data is protected. Full policy published at launch.' },
  terms: { title: 'Terms of Service', body: 'Terms of use for GUZO services.' },
  download: { title: 'Download App', body: 'iOS and Android apps coming soon. Join the waitlist on the homepage.' },
  tracking: { title: 'Track Shipment', body: 'Live tracking will be available in the GUZO app and web dashboard.' },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export default async function MarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) return null;

  return (
    <section className="container py-32">
      <h1 className="font-display text-4xl font-bold text-white md:text-5xl">{page.title}</h1>
      <p className="mt-6 max-w-2xl text-lg text-guzo-muted">{page.body}</p>
      <div className="mt-10 flex gap-4">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Contact us</Link>
        </Button>
      </div>
    </section>
  );
}
