import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — GUZO',
  description: 'Contact GUZO for partnerships, enterprise sales, driver onboarding, and press.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
