import { Hero } from '@/components/home/hero';
import { Stats } from '@/components/home/stats';
import { WhatIsGuzo } from '@/components/home/what-is-guzo';
import { WhyChooseGuzo } from '@/components/home/why-choose-guzo';
import { LiveMap } from '@/components/home/live-map';
import { PlatformShowcase } from '@/components/home/platform-showcase';
import { TrackingTimeline } from '@/components/home/tracking-timeline';
import { Technology } from '@/components/home/technology';
import { BuiltForEveryone } from '@/components/home/built-for-everyone';
import { BusinessAndSecurity } from '@/components/home/business-security';
import { VisionSection } from '@/components/home/vision-section';
import { FAQ } from '@/components/home/faq';
import { DownloadCta, FinalCta } from '@/components/home/cta-sections';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <WhatIsGuzo />
      <WhyChooseGuzo />
      <LiveMap />
      <PlatformShowcase />
      <TrackingTimeline />
      <Technology />
      <BuiltForEveryone />
      <BusinessAndSecurity />
      <VisionSection />
      <FAQ />
      <DownloadCta />
      <FinalCta />
    </>
  );
}
