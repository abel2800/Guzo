import { PageHeader, SectionReveal } from '@/components/common/section-reveal';

const METRICS = [
  { label: 'Target cities by 2027', value: '50+' },
  { label: 'Platform modules', value: '12' },
  { label: 'Addressable market', value: '$2B+' },
  { label: 'Team growth YoY', value: '3×' },
];

export const metadata = {
  title: 'Investors — GUZO',
  description: 'GUZO is building intelligent logistics infrastructure for East Africa.',
};

export default function InvestorsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Investors"
        title="Infrastructure for a continent in motion."
        description="GUZO combines last-mile delivery, merchant SaaS, warehouse ops, and data intelligence — the full stack for modern logistics in Ethiopia."
      />

      <section className="container pb-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionReveal>
            <h2 className="font-display text-2xl font-bold text-white">Investment thesis</h2>
            <p className="mt-4 leading-relaxed text-guzo-muted">
              E-commerce penetration is accelerating while logistics remains fragmented. GUZO owns the full chain —
              from merchant API to driver app to customer tracking — creating network effects and recurring revenue
              through SaaS, delivery fees, and enterprise contracts.
            </p>
            <p className="mt-4 leading-relaxed text-guzo-muted">
              For investor inquiries: <a href="mailto:investors@guzo.et" className="text-guzo-primary hover:underline">investors@guzo.et</a>
            </p>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              {METRICS.map((m) => (
                <div key={m.label} className="rounded-2xl border border-white/10 bg-guzo-card/40 p-5 text-center">
                  <p className="font-display text-3xl font-bold text-guzo-primary">{m.value}</p>
                  <p className="mt-1 text-xs text-guzo-muted">{m.label}</p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
