import { PageHeader, SectionReveal } from '@/components/common/section-reveal';
import { Technology } from '@/components/home/technology';
import { Services } from '@/components/home/services';

const TIMELINE = [
  { year: '2024', title: 'Vision', desc: 'GUZO founded to modernize logistics in Ethiopia.' },
  { year: '2025', title: 'Platform build', desc: 'Enterprise API, warehouse ops, and driver app developed.' },
  { year: '2026', title: 'Launch', desc: 'Early access for merchants and drivers in Addis Ababa.' },
  { year: 'Future', title: 'Nationwide', desc: 'Expand to 50+ cities with AI routing and international shipping.' },
];

export const metadata = {
  title: 'About — GUZO',
  description: 'GUZO is building Ethiopia\'s next-generation logistics ecosystem.',
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About GUZO"
        title="Moving Ethiopia Forward."
        description="GUZO is not just a courier company — it is an ecosystem connecting customers, merchants, warehouses, drivers, and technology into one intelligent delivery platform."
      />

      <section className="container pb-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionReveal>
            <h2 className="font-display text-2xl font-bold text-white">Our mission</h2>
            <p className="mt-4 leading-relaxed text-guzo-muted">
              Ethiopia deserves world-class logistics infrastructure. GUZO brings the reliability of global leaders
              — real-time tracking, smart routing, digital payments — built for local roads, merchants, and communities.
            </p>
            <h2 className="mt-10 font-display text-2xl font-bold text-white">Why Ethiopia needs GUZO</h2>
            <p className="mt-4 leading-relaxed text-guzo-muted">
              E-commerce is exploding, but delivery remains fragmented. GUZO unifies the entire chain: from merchant
              bulk orders to warehouse sorting, driver dispatch, and customer proof-of-delivery.
            </p>
          </SectionReveal>

          <SectionReveal delay={0.15}>
            <h2 className="font-display text-2xl font-bold text-white">Company timeline</h2>
            <div className="mt-8 space-y-6 border-l border-guzo-primary/30 pl-6">
              {TIMELINE.map((t) => (
                <div key={t.year} className="relative">
                  <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-guzo-primary" />
                  <p className="text-sm font-semibold text-guzo-primary">{t.year}</p>
                  <p className="font-semibold text-white">{t.title}</p>
                  <p className="text-sm text-guzo-muted">{t.desc}</p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      <Services />
      <Technology />
    </>
  );
}
