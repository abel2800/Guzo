'use client';

import dynamic from 'next/dynamic';

export const HeroCanvas = dynamic(
  () => import('./city-scene').then((m) => m.HeroCanvas),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-guzo-bg" /> },
);
