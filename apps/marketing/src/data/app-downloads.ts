export type AppId = 'customer' | 'driver' | 'merchant' | 'branch';
export type PlatformId = 'android' | 'ios';

export interface DownloadArtifact {
    file: string;
  version: string;
    available: boolean;
    buildUrl?: string;
    storeUrl?: string;
  sizeLabel?: string;
}

export const APP_META: Record<
  AppId,
  { name: string; description: string; scheme: string; accent: string }
> = {
  customer: {
    name: 'GUZO Customer',
    description: 'Book deliveries, track live on the map, and manage your shipments.',
    scheme: 'guzo-customer',
    accent: 'from-emerald-500/20 to-cyan-500/10',
  },
  driver: {
    name: 'GUZO Driver',
    description: 'Accept jobs, navigate routes, and capture proof of delivery.',
    scheme: 'guzo-driver',
    accent: 'from-green-500/20 to-teal-500/10',
  },
  merchant: {
    name: 'GUZO Merchant',
    description: 'Create shipments, bulk upload orders, and view your business dashboard.',
    scheme: 'guzo-merchant',
    accent: 'from-lime-500/20 to-emerald-500/10',
  },
  branch: {
    name: 'GUZO Branch',
    description: 'Receive packages, manage shelf inventory, and run the customer pickup counter.',
    scheme: 'guzo-branch',
    accent: 'from-cyan-500/20 to-blue-500/10',
  },
};

export const DOWNLOADS: Record<AppId, Record<PlatformId, DownloadArtifact>> = {
  customer: {
    android: {
      file: '/downloads/guzo-customer-android.apk',
      version: '1.0.0',
      available: true,
      buildUrl: '/download',
      sizeLabel: '~45 MB',
    },
    ios: {
      file: '/downloads/guzo-customer-ios.ipa',
      version: '1.0.0',
      available: true,
      buildUrl: '/download',
    },
  },
  driver: {
    android: {
      file: '/downloads/guzo-driver-android.apk',
      version: '1.0.0',
      available: true,
      buildUrl: '/download',
      sizeLabel: '~48 MB',
    },
    ios: {
      file: '/downloads/guzo-driver-ios.ipa',
      version: '1.0.0',
      available: true,
      buildUrl: '/download',
    },
  },
  merchant: {
    android: {
      file: '/downloads/guzo-merchant-android.apk',
      version: '1.0.0',
      available: true,
      buildUrl: '/download',
      sizeLabel: '~42 MB',
    },
    ios: {
      file: '/downloads/guzo-merchant-ios.ipa',
      version: '1.0.0',
      available: true,
      buildUrl: '/download',
    },
  },
  branch: {
    android: {
      file: '/downloads/guzo-branch-android.apk',
      version: '1.0.0',
      available: true,
      buildUrl: '/download',
      sizeLabel: '~40 MB',
    },
    ios: {
      file: '/downloads/guzo-branch-ios.ipa',
      version: '1.0.0',
      available: true,
      buildUrl: '/download',
    },
  },
};
