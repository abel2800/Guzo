'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Package, Play, RotateCcw, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Point = { x: number; y: number };

const ROUTE: Point[] = [
  { x: 22, y: 92 },
  { x: 22, y: 68 },
  { x: 48, y: 68 },
  { x: 48, y: 42 },
  { x: 82, y: 42 },
  { x: 82, y: 24 },
  { x: 118, y: 24 },
  { x: 148, y: 24 },
  { x: 148, y: 20 },
];

const V_STREETS = [10, 35, 60, 85, 110, 135, 160, 185];
const H_STREETS = [12, 34, 56, 78, 100, 118];

type Building = { x: number; y: number; w: number; h: number; roof: string; wall: string; kind: 'office' | 'residential' | 'park' };

const BUILDINGS: Building[] = [
  { x: 13, y: 15, w: 18, h: 16, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 38, y: 15, w: 18, h: 16, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 63, y: 15, w: 18, h: 16, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 63, y: 37, w: 18, h: 16, roof: '#2f3a2e', wall: '#20281f', kind: 'park' },
  { x: 88, y: 15, w: 18, h: 6, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 113, y: 15, w: 18, h: 6, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 138, y: 15, w: 18, h: 6, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 163, y: 15, w: 18, h: 16, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 13, y: 37, w: 18, h: 16, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 88, y: 27, w: 18, h: 26, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 113, y: 27, w: 18, h: 26, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 138, y: 27, w: 18, h: 26, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 163, y: 37, w: 18, h: 16, roof: '#2f3a2e', wall: '#20281f', kind: 'park' },
  { x: 13, y: 59, w: 18, h: 16, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 63, y: 59, w: 18, h: 16, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 88, y: 59, w: 18, h: 16, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 113, y: 59, w: 18, h: 16, roof: '#2f3a2e', wall: '#20281f', kind: 'park' },
  { x: 163, y: 59, w: 18, h: 16, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 13, y: 81, w: 18, h: 14, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 38, y: 81, w: 18, h: 14, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 88, y: 81, w: 18, h: 14, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 113, y: 81, w: 18, h: 14, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 138, y: 81, w: 18, h: 14, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 163, y: 81, w: 18, h: 14, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 38, y: 101, w: 18, h: 15, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 63, y: 101, w: 18, h: 15, roof: '#2f3a2e', wall: '#20281f', kind: 'park' },
  { x: 88, y: 101, w: 18, h: 15, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
  { x: 138, y: 101, w: 18, h: 15, roof: '#3a4459', wall: '#242c3d', kind: 'office' },
  { x: 163, y: 101, w: 18, h: 15, roof: '#33405a', wall: '#1f2636', kind: 'residential' },
];

const PHASES = [
  { at: 0, label: 'Driver assigned', sub: 'Dawit K. · 2 min away' },
  { at: 0.12, label: 'Picked up', sub: 'Bole hub · Package secured' },
  { at: 0.45, label: 'In transit', sub: 'En route via Kazanchis' },
  { at: 0.8, label: 'Arriving soon', sub: 'ETA 3 min · 400m away' },
  { at: 0.96, label: 'Delivered', sub: 'Proof of delivery captured' },
];

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function buildStreetPath(points: Point[], radius = 4) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const inVec = { x: curr.x - prev.x, y: curr.y - prev.y };
    const outVec = { x: next.x - curr.x, y: next.y - curr.y };
    const inLen = Math.hypot(inVec.x, inVec.y) || 1;
    const outLen = Math.hypot(outVec.x, outVec.y) || 1;
    const r = Math.min(radius, inLen / 2, outLen / 2);
    const p1 = { x: curr.x - (inVec.x / inLen) * r, y: curr.y - (inVec.y / inLen) * r };
    const p2 = { x: curr.x + (outVec.x / outLen) * r, y: curr.y + (outVec.y / outLen) * r };
    d += ` L ${p1.x} ${p1.y} Q ${curr.x} ${curr.y} ${p2.x} ${p2.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function useRoutePath() {
  return useMemo(() => {
    const segments: { a: Point; b: Point; len: number }[] = [];
    let total = 0;
    for (let i = 0; i < ROUTE.length - 1; i++) {
      const a = ROUTE[i];
      const b = ROUTE[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      segments.push({ a, b, len });
      total += len;
    }
    return { segments, total, d: buildStreetPath(ROUTE) };
  }, []);
}

function getDriverPosition(progress: number, segments: { a: Point; b: Point; len: number }[], total: number) {
  const t = Math.min(Math.max(progress, 0), 1);
  let dist = t * total;
  for (const seg of segments) {
    if (dist <= seg.len || seg === segments[segments.length - 1]) {
      const localT = seg.len === 0 ? 0 : Math.min(dist / seg.len, 1);
      const x = seg.a.x + (seg.b.x - seg.a.x) * localT;
      const y = seg.a.y + (seg.b.y - seg.a.y) * localT;
      const angle = (Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x) * 180) / Math.PI;
      return { x, y, angle };
    }
    dist -= seg.len;
  }
  const end = ROUTE[ROUTE.length - 1];
  return { x: end.x, y: end.y, angle: 0 };
}

function DeliveryVanSvg() {
  return (
    <g>
      <ellipse cx="0.4" cy="2.2" rx="9.5" ry="3.6" fill="#000" opacity="0.4" />
      <rect x="-8.6" y="-4" width="15.4" height="8" rx="2.2" fill="#e7ebf1" />
      <rect x="-8.6" y="-4" width="15.4" height="8" rx="2.2" fill="url(#vanBodyShade)" />
      <rect x="-8.6" y="-4" width="15.4" height="8" rx="2.2" fill="none" stroke="#aab3c2" strokeWidth="0.3" />
      <rect x="-7.7" y="-3.2" width="8.6" height="6.4" rx="1.1" fill="#15803d" />
      <rect x="-7.7" y="-3.2" width="8.6" height="6.4" rx="1.1" fill="url(#vanCargoShade)" />
      <text x="-3.4" y="0.9" textAnchor="middle" fill="#ecfdf5" fontSize="2.5" fontWeight="700" fontFamily="system-ui,sans-serif" letterSpacing="0.1">
        GZ
      </text>
      <rect x="1.3" y="-3.2" width="5.4" height="6.4" rx="0.9" fill="#c3ccd8" />
      <rect x="1.9" y="-2.5" width="2.7" height="5" rx="0.5" fill="#7b8ba3" />
      <rect x="1.9" y="-2.5" width="2.7" height="5" rx="0.5" fill="url(#glassShine)" />
      <rect x="4.9" y="-2.5" width="1.6" height="5" rx="0.4" fill="#5c6b80" />
      <rect x="6.7" y="-2.6" width="1.1" height="5.2" rx="0.4" fill="#38414f" />
      <rect x="-1.1" y="-4.6" width="1.6" height="1.4" rx="0.4" fill="#94a2b6" />
      <rect x="-1.1" y="3.2" width="1.6" height="1.4" rx="0.4" fill="#5b6577" />
      {[
        [-5.6, -4.6],
        [-5.6, 4.6],
        [3.6, -4.6],
        [3.6, 4.6],
      ].map(([cx, cy], idx) => (
        <g key={idx} transform={`translate(${cx}, ${cy})`}>
          <rect x="-1.1" y="-0.7" width="2.2" height="1.4" rx="0.4" fill="#0b0e14" />
          <rect x="-0.7" y="-0.4" width="1.4" height="0.8" rx="0.25" fill="#2a3242" />
        </g>
      ))}
      <rect x="-9.4" y="-0.9" width="1" height="1.8" rx="0.4" fill="#fde68a" />
      <rect x="7.6" y="-0.9" width="1" height="1.8" rx="0.4" fill="#fca5a5" />
    </g>
  );
}

function MapPin({ x, y, colorFill, colorStroke, iconPath, label, pulse }: {
  x: number; y: number; colorFill: string; colorStroke: string; iconPath: ReactNode; label: string; pulse?: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {pulse && (
        <motion.circle
          r="4"
          fill={colorFill}
          opacity="0.28"
          animate={{ r: [4, 13], opacity: [0.35, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <ellipse cy="9.4" rx="3.4" ry="1.1" fill="#000" opacity="0.35" />
      <path
        d="M0 -9 C-4.4 -9 -7.6 -5.7 -7.6 -1.7 C-7.6 3.6 0 10.6 0 10.6 C0 10.6 7.6 3.6 7.6 -1.7 C7.6 -5.7 4.4 -9 0 -9 Z"
        fill={colorFill}
        stroke={colorStroke}
        strokeWidth="0.6"
        filter="url(#pinShadow)"
      />
      <path
        d="M-5.6 -6.4 C-3.5 -8.2 -1.6 -8.7 0.4 -8.5"
        fill="none"
        stroke="#fff"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle r="3.3" fill="#0b1220" />
      <g fill="#f8fafc">{iconPath}</g>
      <text y="17.5" textAnchor="middle" fill="#c9d3e0" fontSize="4.6" fontWeight="600" fontFamily="system-ui,sans-serif">
        {label}
      </text>
    </g>
  );
}

export function DeliveryDemoCard() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [runId, setRunId] = useState(0);

  const { segments, total, d: routePath } = useRoutePath();

  useEffect(() => {
    if (!playing) return;
    const start = performance.now();
    const duration = 14000;
    let frame: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const linear = Math.min(elapsed / duration, 1);
      setProgress(easeInOutCubic(linear));
      if (linear < 1) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, runId]);

  const phase = [...PHASES].reverse().find((p) => progress >= p.at) ?? PHASES[0];
  const { x: driverX, y: driverY, angle } = getDriverPosition(progress, segments, total);
  const etaMins = Math.max(1, Math.round(18 * (1 - progress)));

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-8 rounded-full bg-guzo-primary/20 blur-3xl" />
      <div className="relative rounded-[2.5rem] border border-white/15 bg-guzo-card/80 p-3 shadow-2xl backdrop-blur-xl">
        <div className="rounded-[2rem] bg-guzo-bg p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-guzo-muted">Live delivery</span>
            <motion.span
              key={phase.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-full bg-guzo-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-guzo-primary"
            >
              {phase.label}
            </motion.span>
          </div>

          <div className="relative mb-4 h-48 overflow-hidden rounded-xl border border-white/10 bg-[#0a1018]">
            <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full">
              <defs>
                <linearGradient id="mapBase" x1="0" y1="0" x2="0.3" y2="1">
                  <stop offset="0%" stopColor="#0e1626" />
                  <stop offset="100%" stopColor="#080d17" />
                </linearGradient>
                <linearGradient id="vanBodyShade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="vanCargoShade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#052e16" stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="roofShade" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <filter id="vanGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="0.4" stdDeviation="1.1" floodColor="#22c55e" floodOpacity="0.5" />
                </filter>
                <filter id="pinShadow" x="-60%" y="-40%" width="220%" height="180%">
                  <feDropShadow dx="0" dy="0.6" stdDeviation="0.5" floodColor="#000" floodOpacity="0.45" />
                </filter>
                <filter id="routeGlow">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect width="200" height="120" fill="url(#mapBase)" />

              {H_STREETS.map((y, i) => (
                <line key={`h-${i}`} x1="0" y1={y} x2="200" y2={y} stroke="#1c2536" strokeWidth={i % 2 === 0 ? 2.6 : 1.6} />
              ))}
              {V_STREETS.map((x, i) => (
                <line key={`v-${i}`} x1={x} y1="0" x2={x} y2="120" stroke="#1c2536" strokeWidth={i % 2 === 0 ? 2.6 : 1.6} />
              ))}
              {H_STREETS.map((y, i) => (
                <line key={`hd-${i}`} x1="0" y1={y} x2="200" y2={y} stroke="#2c374d" strokeWidth="0.4" strokeDasharray="1.5 2" opacity="0.6" />
              ))}

              {BUILDINGS.map((b, idx) => (
                <g key={idx}>
                  <rect x={b.x + 1} y={b.y + 1.2} width={b.w} height={b.h} rx="1" fill="#000" opacity="0.3" />
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="1" fill={b.wall} stroke="#000" strokeOpacity="0.25" strokeWidth="0.3" />
                  {b.kind === 'park' ? (
                    <>
                      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="1" fill="#233527" />
                      {Array.from({ length: 6 }).map((_, ti) => {
                        const tx = b.x + 2.5 + (ti % 3) * (b.w - 5) / 2;
                        const ty = b.y + 3 + Math.floor(ti / 3) * (b.h - 6);
                        return <circle key={ti} cx={tx} cy={ty} r="1.7" fill="#3a5a3a" />;
                      })}
                    </>
                  ) : (
                    <>
                      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="1" fill="url(#roofShade)" />
                      {Array.from({ length: Math.max(1, Math.floor(b.w / 4)) }).map((_, wi) =>
                        Array.from({ length: Math.max(1, Math.floor(b.h / 3.4)) }).map((_, hi) => (
                          <rect
                            key={`${wi}-${hi}`}
                            x={b.x + 1.6 + wi * 4}
                            y={b.y + 1.4 + hi * 3.4}
                            width="2.1"
                            height="2.1"
                            rx="0.25"
                            fill={(wi + hi + idx) % 3 === 0 ? '#fde68a' : (wi + hi + idx) % 3 === 1 ? '#0f1826' : '#5b91c9'}
                            opacity={(wi + hi + idx) % 3 === 1 ? 0.5 : 0.85}
                          />
                        )),
                      )}
                    </>
                  )}
                </g>
              ))}

              <path d={routePath} fill="none" stroke="#000" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" transform="translate(0.5, 0.7)" />
              <path d={routePath} fill="none" stroke="#3a4560" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={routePath} fill="none" stroke="rgba(34,197,94,0.22)" strokeWidth="8" strokeLinecap="round" filter="url(#routeGlow)" />

              <motion.path
                d={routePath}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress }}
              />
              <path d={routePath} fill="none" stroke="rgba(226,232,240,0.4)" strokeWidth="0.5" strokeDasharray="2 3" strokeLinecap="round" />

              <MapPin
                x={ROUTE[0].x}
                y={ROUTE[0].y}
                colorFill="#16a34a"
                colorStroke="#0f7a34"
                label="Pickup"
                iconPath={<path d="M-1.6 -1.8 L0 -3 L1.6 -1.8 L1.6 1.6 L-1.6 1.6 Z" />}
              />
              <MapPin
                x={ROUTE[ROUTE.length - 1].x}
                y={ROUTE[ROUTE.length - 1].y}
                colorFill="#10b981"
                colorStroke="#0a7a5c"
                label="Dropoff"
                iconPath={<path d="M-1.7 -0.4 L0 -2 L1.7 -0.4 L1.7 1.7 L0.5 1.7 L0.5 0.2 L-0.5 0.2 L-0.5 1.7 L-1.7 1.7 Z" />}
              />

              {playing && (
                <motion.circle
                  cx={driverX}
                  cy={driverY}
                  r="3.6"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="0.7"
                  animate={{ r: [3.6, 11], opacity: [0.5, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                />
              )}

              <g transform={`translate(${driverX}, ${driverY}) rotate(${angle})`} filter="url(#vanGlow)">
                <DeliveryVanSvg />
              </g>
            </svg>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070d16]/85 via-transparent to-[#070d16]/10" />

            <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-black/55 px-2 py-1 text-[9px] text-guzo-muted backdrop-blur-sm">
              <Store className="h-3 w-3 text-guzo-primary" /> Pickup
              <Home className="ml-1 h-3 w-3 text-emerald-400" /> Dropoff
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Package className="mt-0.5 h-5 w-5 shrink-0 text-guzo-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">GZ-28491 · Bole → Kazanchis</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={phase.sub}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-guzo-muted"
                >
                  {phase.sub}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-guzo-muted">ETA</p>
              <p className="font-display text-lg font-bold text-guzo-primary">{etaMins}m</p>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-guzo-primary to-guzo-accent"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 gap-2"
        onClick={() => {
          setProgress(0);
          setRunId((n) => n + 1);
          setPlaying(true);
        }}
      >
        {playing ? (
          <>
            <RotateCcw className="h-3 w-3" /> Replay demo
          </>
        ) : (
          <>
            <Play className="h-3 w-3" /> Watch demo
          </>
        )}
      </Button>
    </div>
  );
}
