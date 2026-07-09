export const SITE = {
  name: 'GUZO',
  tagline: 'Delivering Ethiopia Forward.',
  description:
    'Guzo connects people, businesses, and couriers through intelligent logistics. Track deliveries in real time, manage shipments effortlessly, and experience a faster, smarter way to move packages across Ethiopia.',
  url: 'https://guzo.et',
  stats: [
    { value: '5000+', label: 'Packages Delivered' },
    { value: '500+', label: 'Business Partners' },
    { value: '99.2%', label: 'Successful Deliveries' },
    { value: '24/7', label: 'Customer Support' },
    { value: 'Real-Time', label: 'Tracking' },
  ],
  nav: [
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Technology', href: '/technology' },
    { label: 'Tracking', href: '/tracking' },
    { label: 'Drivers', href: '/drivers' },
    { label: 'Merchants', href: '/merchants' },
    { label: 'Download', href: '/download' },
  ],
  footerLinks: {
    Product: [
      { label: 'Tracking', href: '/tracking' },
      { label: 'Download App', href: '/download' },
      { label: 'API', href: '/technology' },
      { label: 'Pricing', href: '/pricing' },
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
      { label: 'Contact', href: '/contact' },
    ],
  },
} as const;
