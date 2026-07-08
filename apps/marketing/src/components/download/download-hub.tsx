'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Apple, Download, MonitorSmartphone, Smartphone, TabletSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  APP_META,
  DOWNLOADS,
  type AppId,
  type PlatformId,
} from '@/data/app-downloads';

const APPS: AppId[] = ['customer', 'driver', 'merchant'];

export function DownloadHub() {
  const [app, setApp] = useState<AppId>('customer');
  const [platform, setPlatform] = useState<PlatformId>('android');

  const meta = APP_META[app];
  const artifact = DOWNLOADS[app][platform];

  const installNote = useMemo(() => {
    if (platform === 'android') {
      return 'Enable “Install from unknown sources” for your browser, then open the downloaded APK.';
    }
    return 'iOS preview builds require TestFlight or an enterprise/ad-hoc profile from your Apple Developer account.';
  }, [platform]);

  return (
    <div className="space-y-8">
      {/* App picker */}
      <div className="flex flex-wrap justify-center gap-2">
        {APPS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setApp(id)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              app === id
                ? 'bg-guzo-primary text-guzo-bg shadow-lg shadow-guzo-primary/25'
                : 'border border-white/10 bg-white/5 text-guzo-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            {APP_META[id].name.replace('GUZO ', '')}
          </button>
        ))}
      </div>

      {/* Platform toggle */}
      <div className="mx-auto flex max-w-xs rounded-full border border-white/10 bg-guzo-card/60 p-1">
        <button
          type="button"
          onClick={() => setPlatform('android')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all ${
            platform === 'android' ? 'bg-guzo-primary text-guzo-bg' : 'text-guzo-muted hover:text-white'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          Android
        </button>
        <button
          type="button"
          onClick={() => setPlatform('ios')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all ${
            platform === 'ios' ? 'bg-guzo-primary text-guzo-bg' : 'text-guzo-muted hover:text-white'
          }`}
        >
          <Apple className="h-4 w-4" />
          iOS
        </button>
      </div>

      {/* Selected app card */}
      <div
        className={`mx-auto max-w-lg rounded-3xl border border-white/10 bg-gradient-to-br ${meta.accent} p-8 text-center backdrop-blur`}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-guzo-primary/20">
          {platform === 'ios' ? (
            <Apple className="h-8 w-8 text-guzo-primary" />
          ) : (
            <TabletSmartphone className="h-8 w-8 text-guzo-primary" />
          )}
        </div>
        <h2 className="font-display text-2xl font-bold text-white">{meta.name}</h2>
        <p className="mt-2 text-sm text-guzo-muted">{meta.description}</p>
        <p className="mt-3 text-xs text-guzo-muted/70">
          v{artifact.version} · {platform === 'android' ? 'APK' : 'IPA / TestFlight'} ·{' '}
          {artifact.sizeLabel ?? 'Preview build'}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {artifact.available ? (
            <Button size="lg" asChild>
              <a href={artifact.file} download>
                <Download className="h-5 w-5" />
                Download for {platform === 'android' ? 'Android' : 'iOS'}
              </a>
            </Button>
          ) : artifact.storeUrl ? (
            <Button size="lg" asChild>
              <a href={artifact.storeUrl} target="_blank" rel="noopener noreferrer">
                <Apple className="h-5 w-5" />
                Open in App Store
              </a>
            </Button>
          ) : (
            <Button size="lg" disabled className="opacity-70">
              <Download className="h-5 w-5" />
              Build not uploaded yet
            </Button>
          )}
          {artifact.buildUrl && (
            <Button size="lg" variant="outline" asChild>
              <a href={artifact.buildUrl} target="_blank" rel="noopener noreferrer">
                EAS build page
              </a>
            </Button>
          )}
        </div>

        <p className="mt-4 text-xs text-guzo-muted">{installNote}</p>
        <p className="mt-2 text-xs text-guzo-muted/60">Deep link: {meta.scheme}://</p>
      </div>

      {/* Dev preview */}
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-guzo-card/40 p-6">
        <div className="flex items-start gap-4">
          <MonitorSmartphone className="mt-1 h-8 w-8 shrink-0 text-guzo-primary" />
          <div>
            <h3 className="font-display text-lg font-bold text-white">Preview on your phone (no APK needed)</h3>
            <p className="mt-2 text-sm text-guzo-muted">
              During development, install <strong className="text-white">Expo Go</strong> from the Play Store or App
              Store, run <code className="rounded bg-black/40 px-1.5 py-0.5 text-guzo-primary">npm run dev:mobile-{app}</code>
              , and scan the QR code. For a native-like build, use an Android emulator (Android Studio) or EAS cloud
              builds below.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-guzo-muted">
              <li>• <strong className="text-white">Android emulator</strong> — Android Studio → Device Manager → run{' '}
                <code className="text-guzo-primary">npm run android</code> in the app folder</li>
              <li>• <strong className="text-white">iOS Simulator</strong> — macOS + Xcode only (not available on Windows)</li>
              <li>• <strong className="text-white">Cursor / VS Code</strong> — extension “Android iOS Emulator” (needs Android Studio installed)</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-guzo-muted">
        Store listings go live at public launch.{' '}
        <Link href="/#newsletter" className="text-guzo-primary hover:underline">
          Join the waitlist
        </Link>{' '}
        for early access.
      </p>
    </div>
  );
}
