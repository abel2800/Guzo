export const SITE = {
  name: 'GUZO',
  tagline: 'Moving Ethiopia Forward.',
  description:
    "Ethiopia's next-generation logistics and smart delivery ecosystem connecting customers, businesses, merchants, warehouses, drivers and technology into one intelligent platform.",
  url: 'https://guzo.et',
  stats: [
    { value: '10M+', label: 'Packages' },
    { value: '500K+', label: 'Customers' },
    { value: '15K+', label: 'Drivers' },
    { value: '250+', label: 'Businesses' },
    { value: '50+', label: 'Cities' },
  ],
  nav: [
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Technology', href: '/technology' },
    { label: 'Drivers', href: '/drivers' },
    { label: 'Merchants', href: '/merchants' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
  ],
  footerLinks: {
    Product: [
      { label: 'Tracking', href: '/tracking' },
      { label: 'Download App', href: '/download' },
      { label: 'API', href: '/technology' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Investors', href: '/investors' },
    ],
    Legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
} as const;
