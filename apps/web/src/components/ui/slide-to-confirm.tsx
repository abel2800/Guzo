'use client';

import { useRef, useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SlideToConfirmProps {
  label: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  tone?: 'primary' | 'warning';
}

export function SlideToConfirm({ label, onConfirm, disabled, loading, className, tone = 'primary' }: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [done, setDone] = useState(false);

  const finish = async () => {
    setDone(true);
    await onConfirm();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || loading || done) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const max = rect.width - 52;
    setOffset(Math.max(0, Math.min(e.clientX - rect.left - 26, max)));
  };

  const onPointerUp = () => {
    if (!dragging || !trackRef.current) return;
    setDragging(false);
    const max = trackRef.current.clientWidth - 52;
    if (offset > max * 0.82) {
      setOffset(max);
      void finish();
    } else {
      setOffset(0);
    }
  };

  const accent = tone === 'warning' ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  const thumb = tone === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative mx-auto flex h-14 w-full max-w-md select-none items-center overflow-hidden rounded-full border',
        accent,
        disabled && 'opacity-45 pointer-events-none',
        className,
      )}
    >
      <p className="w-full text-center text-sm font-semibold">{done ? 'Confirmed' : label}</p>
      <div
        className={cn('absolute left-1 top-1 flex h-12 w-12 cursor-grab items-center justify-center rounded-full text-white', thumb)}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : done ? (
          <Check className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </div>
    </div>
  );
}
