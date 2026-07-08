import { Hero } from '@/components/home/hero';
import { Stats } from '@/components/home/stats';
import { LiveMap } from '@/components/home/live-map';
import { HowItWorks } from '@/components/home/how-it-works';
import { Services } from '@/components/home/services';
import { Technology } from '@/components/home/technology';
import { Testimonials } from '@/components/home/testimonials';
import { Partners } from '@/components/home/partners';
import { FAQ } from '@/components/home/faq';
import { Newsletter } from '@/components/home/newsletter';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <LiveMap />
      <HowItWorks />
      <Services />
      <Technology />
      <Testimonials />
      <Partners />
      <FAQ />
      <Newsletter />
    </>
  );
}
