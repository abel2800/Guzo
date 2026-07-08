'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { SITE } from '@/constants/site';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-white/10 bg-guzo-bg/80 py-3 backdrop-blur-xl' : 'py-5',
      )}
    >
      <div className="container flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-white">
          GU<span className="text-guzo-primary">ZO</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {SITE.nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-guzo-muted transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link href="http://localhost:3000/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/download">Download App</Link>
          </Button>
        </div>

        <button type="button" className="text-white md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 bg-guzo-bg/95 px-6 py-4 md:hidden"
        >
          <div className="flex flex-col gap-4">
            {SITE.nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-guzo-muted" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Button asChild className="w-full">
              <Link href="/download">Download App</Link>
            </Button>
          </div>
        </motion.div>
      )}
    </header>
  );
}
