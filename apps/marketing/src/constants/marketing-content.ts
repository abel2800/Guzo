import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  Globe,
  Lock,
  MapPin,
  Package,
  QrCode,
  Route,
  Shield,
  Store,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const HERO = {
  eyebrow: 'Ethiopia · Intelligent logistics',
  headline: 'Delivering Ethiopia Forward.',
  subheading:
    'Guzo connects people, businesses, and couriers through intelligent logistics. Track deliveries in real time, manage shipments effortlessly, and experience a faster, smarter way to move packages across Ethiopia.',
} as const;

export const STATS = [
  { value: '5000+', label: 'Packages Delivered' },
  { value: '500+', label: 'Business Partners' },
  { value: '99.2%', label: 'Successful Deliveries' },
  { value: '24/7', label: 'Customer Support' },
  { value: 'Real-Time', label: 'Tracking' },
] as const;

export const WHY_GUZO: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: MapPin, title: 'Real-Time Tracking', desc: 'Track every shipment from pickup to delivery with live GPS updates.' },
  { icon: Route, title: 'Smart Routing', desc: 'AI-powered route optimization reduces delivery time across Ethiopian cities.' },
  { icon: Zap, title: 'Fast Delivery', desc: 'Same-day and next-day delivery where available — speed you can count on.' },
  { icon: Shield, title: 'Secure Shipments', desc: 'Every package is monitored, verified, and protected end to end.' },
  { icon: CreditCard, title: 'Affordable Pricing', desc: 'Transparent pricing with no hidden costs. Pay only for what you ship.' },
  { icon: Globe, title: 'Nationwide Coverage', desc: 'Connecting every region of Ethiopia through one intelligent network.' },
];

export const PLATFORM_STACK = [
  'Customer App',
  'Courier App',
  'Business Dashboard',
  'Warehouse Dashboard',
  'Admin Dashboard',
  'Tracking System',
  'Analytics',
] as const;

export const APP_SHOWCASES = [
  {
    id: 'customer',
    title: 'Customer Mobile App',
    subtitle: 'Ship, track, and receive — all from your phone.',
    features: [
      'Live package tracking',
      'Push notifications',
      'Delivery history',
      'Multiple payment methods',
      'Saved addresses',
      'QR tracking',
      'Digital proof of delivery',
      'Customer support',
      'Easy scheduling',
    ],
  },
  {
    id: 'courier',
    title: 'Courier App',
    subtitle: 'Built for drivers who move Ethiopia forward.',
    features: [
      'Delivery tasks',
      'Route optimization',
      'Barcode scanning',
      'Package verification',
      'Signature capture',
      'Photo confirmation',
      'Earnings dashboard',
    ],
  },
  {
    id: 'business',
    title: 'Business Portal',
    subtitle: 'Scale shipping for companies and e-commerce.',
    features: [
      'Bulk shipping',
      'Shipment management',
      'API integration',
      'Analytics',
      'Employee accounts',
      'Invoice generation',
      'Order synchronization',
    ],
  },
  {
    id: 'warehouse',
    title: 'Warehouse Management',
    subtitle: 'Sort, store, and dispatch at hub speed.',
    features: [
      'Inventory management',
      'Package sorting',
      'Barcode scanning',
      'Shelf management',
      'Dispatch control',
      'Package transfers',
    ],
  },
] as const;

export const TRACKING_STEPS = [
  { label: 'Order Created', done: true },
  { label: 'Picked Up', done: true },
  { label: 'Sorting Center', done: true },
  { label: 'In Transit', done: true },
  { label: 'Destination Warehouse', done: false },
  { label: 'Out For Delivery', done: false },
  { label: 'Delivered', done: false },
] as const;

export const TECH_FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Route, title: 'AI Route Optimization', desc: 'Machine learning routes packages through traffic and city patterns.' },
  { icon: MapPin, title: 'Real-Time GPS', desc: 'Sub-second location updates for customers, couriers, and operations.' },
  { icon: QrCode, title: 'QR & Barcode System', desc: 'Scan-to-track at every handoff — warehouse to doorstep.' },
  { icon: Globe, title: 'Cloud Infrastructure', desc: 'Enterprise-grade cloud built to scale across Ethiopia.' },
  { icon: CreditCard, title: 'Secure Payments', desc: 'Encrypted transactions with instant receipts and invoicing.' },
  { icon: Lock, title: 'Data Encryption', desc: 'Your data and shipments protected with modern security standards.' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Automated alerts at every milestone — pickup, transit, delivery.' },
  { icon: BarChart3, title: 'Performance Analytics', desc: 'Insights for businesses, fleets, and operations teams.' },
];

export const BUILT_FOR = [
  { icon: Users, title: 'Individuals', desc: 'Send personal packages across the city with live tracking and fair pricing.' },
  { icon: Store, title: 'Businesses', desc: 'Bulk shipping, dashboards, and APIs for growing Ethiopian companies.' },
  { icon: Package, title: 'E-Commerce Stores', desc: 'Sync orders, notify customers, and deliver at marketplace speed.' },
  { icon: Building2, title: 'Enterprise Logistics', desc: 'Warehouse, fleet, and admin tools for large-scale operations.' },
];

export const BUSINESS_BENEFITS = [
  'Faster deliveries',
  'Lower logistics costs',
  'API integration',
  'Business dashboard',
  'Shipment analytics',
  'Customer notifications',
  'Bulk orders',
];

export const SECURITY_FEATURES = [
  'End-to-end tracking',
  'Secure payments',
  'Driver verification',
  'Encrypted data',
  'Fraud protection',
  'Verified deliveries',
];

export const FAQS = [
  {
    q: 'How do I send a package?',
    a: 'Download the Guzo customer app, enter pickup and delivery addresses, choose your service level, and schedule a pickup. A verified courier collects your package and you track it in real time until delivery.',
  },
  {
    q: 'How much does delivery cost?',
    a: 'Pricing is transparent and based on distance, package size, and delivery speed. Use the in-app calculator for an instant quote — no hidden fees.',
  },
  {
    q: 'How can I track my shipment?',
    a: 'Every shipment gets a tracking number and QR code. Track live in the app or on guzo.et/tracking with real-time GPS updates and delivery milestones.',
  },
  {
    q: 'Which cities are supported?',
    a: 'Guzo launches in Addis Ababa and expands to major Ethiopian cities nationwide. Check our coverage map for the latest service areas.',
  },
  {
    q: 'How do businesses integrate with Guzo?',
    a: 'Merchants get API keys, webhooks, bulk upload, and a business dashboard. Visit our Merchants page or contact sales to onboard your store.',
  },
];
