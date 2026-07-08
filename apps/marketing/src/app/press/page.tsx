import Link from 'next/link';
import { Download, Mail } from 'lucide-react';
import { PageHeader, SectionReveal } from '@/components/common/section-reveal';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Press — GUZO',
  description: 'GUZO press kit, media contacts, and company news.',
};

export default function PressPage() {
  return (
    <>
      <PageHeader
        eyebrow="Press"
        title="Media & press."
        description="Coverage, brand assets, and spokesperson contacts for journalists and partners."
      />

      <section className="container max-w-3xl pb-24">
        <SectionReveal>
          <p className="leading-relaxed text-guzo-muted">
            GUZO is building category-defining logistics infrastructure for Ethiopia and East Africa.
            For interviews, data, or brand assets, contact our communications team.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.1} className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-guzo-card/40 p-6">
            <Mail className="mb-3 h-6 w-6 text-guzo-primary" />
            <h3 className="font-semibold text-white">Press contact</h3>
            <p className="mt-2 text-sm text-guzo-muted">press@guzo.et</p>
            <Button className="mt-4" variant="outline" asChild>
              <Link href="mailto:press@guzo.et">Email press team</Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-guzo-card/40 p-6">
            <Download className="mb-3 h-6 w-6 text-guzo-primary" />
            <h3 className="font-semibold text-white">Media kit</h3>
            <p className="mt-2 text-sm text-guzo-muted">Logos, brand colors, and executive bios.</p>
            <Button className="mt-4" variant="outline" asChild>
              <Link href="mailto:press@guzo.et?subject=Media%20kit%20request">Request kit</Link>
            </Button>
          </div>
        </SectionReveal>
      </section>
    </>
  );
}
