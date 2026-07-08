import Link from 'next/link';
import { PageHeader, SectionReveal } from '@/components/common/section-reveal';
import { Button } from '@/components/ui/button';

const ROLES = [
  { title: 'Senior Backend Engineer', team: 'Engineering', location: 'Addis Ababa · Hybrid' },
  { title: 'Operations Manager', team: 'Operations', location: 'Addis Ababa' },
  { title: 'Mobile Engineer (React Native)', team: 'Engineering', location: 'Remote · East Africa' },
  { title: 'Driver Success Lead', team: 'Operations', location: 'Addis Ababa' },
  { title: 'Product Designer', team: 'Design', location: 'Hybrid' },
];

export const metadata = {
  title: 'Careers — GUZO',
  description: 'Join GUZO and build Ethiopia\'s next-generation logistics platform.',
};

export default function CareersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Careers"
        title="Build the future of logistics."
        description="We're hiring engineers, operators, and designers who want to move Ethiopia forward."
      />

      <section className="container pb-24">
        <SectionReveal>
          <div className="rounded-2xl border border-white/10 bg-guzo-card/40 p-8">
            <h2 className="font-display text-xl font-bold text-white">Why GUZO?</h2>
            <p className="mt-3 max-w-2xl text-guzo-muted">
              Work on real infrastructure — routing engines, warehouse systems, driver apps, and APIs used by
              thousands of deliveries. Competitive compensation, equity for early team members, and impact at national scale.
            </p>
          </div>
        </SectionReveal>

        <div className="mt-10 space-y-4">
          {ROLES.map((role, i) => (
            <SectionReveal key={role.title} delay={i * 0.05}>
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-guzo-bg/40 p-6 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-white">{role.title}</h3>
                  <p className="text-sm text-guzo-muted">
                    {role.team} · {role.location}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="mailto:careers@guzo.et">Apply</Link>
                </Button>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>
    </>
  );
}
