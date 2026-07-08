import { PageHeader } from '@/components/common/section-reveal';
import { DownloadHub } from '@/components/download/download-hub';
import { Newsletter } from '@/components/home/newsletter';

export const metadata = {
  title: 'Download App — GUZO',
  description: 'Download GUZO mobile apps for Android (APK) and iOS. Customer, driver, and merchant apps.',
};

export default function DownloadPage() {
  return (
    <>
      <PageHeader
        eyebrow="Download"
        title="GUZO in your pocket."
        description="Choose your app and platform — Android APK or iOS preview builds for customers, drivers, and merchants."
      />

      <section className="container pb-16">
        <DownloadHub />
      </section>

      <Newsletter />
    </>
  );
}
