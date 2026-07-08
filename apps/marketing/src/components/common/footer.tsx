import Link from 'next/link';
import { SITE } from '@/constants/site';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-guzo-card/50">
      <div className="container grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-bold text-white">
            GU<span className="text-guzo-primary">ZO</span>
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-guzo-muted">{SITE.description}</p>
          <p className="mt-6 text-xs text-guzo-muted/70">© {new Date().getFullYear()} GUZO Logistics. All rights reserved.</p>
        </div>
        {Object.entries(SITE.footerLinks).map(([title, links]) => (
          <div key={title}>
            <p className="mb-4 text-sm font-semibold text-white">{title}</p>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-guzo-muted transition hover:text-guzo-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
