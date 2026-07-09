'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

export function IphoneMockup({ children, className }: Props) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 180, damping: 22 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 180, damping: 22 });

  return (
    <div className={className} style={{ perspective: 1200 }}>
      <motion.div
        className="relative mx-auto w-[270px] [transform-style:preserve-3d]"
        style={{ rotateX, rotateY }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - rect.left) / rect.width - 0.5);
          my.set((e.clientY - rect.top) / rect.height - 0.5);
        }}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        
        <div className="absolute -bottom-10 left-1/2 h-16 w-48 -translate-x-1/2 rounded-full bg-guzo-primary/25 blur-3xl" />

        
        <div className="relative rounded-[3rem] bg-gradient-to-br from-zinc-700 via-zinc-900 to-black p-[3px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)_inset,0_2px_4px_rgba(255,255,255,0.12)_inset]">
          
          <div className="relative overflow-hidden rounded-[2.85rem] bg-black p-[10px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            
            <div className="absolute -left-[2px] top-[88px] h-7 w-[3px] rounded-l-sm bg-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
            <div className="absolute -left-[2px] top-[128px] h-12 w-[3px] rounded-l-sm bg-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
            <div className="absolute -left-[2px] top-[168px] h-12 w-[3px] rounded-l-sm bg-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
            
            <div className="absolute -right-[2px] top-[140px] h-16 w-[3px] rounded-r-sm bg-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />

            
            <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.35rem] bg-guzo-bg">
              
              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-7 pt-3 text-[10px] font-semibold text-white/90">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <svg viewBox="0 0 16 12" className="h-2.5 w-3.5 fill-white/90" aria-hidden>
                    <rect x="0" y="8" width="3" height="4" rx="0.5" />
                    <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
                    <rect x="9" y="2" width="3" height="10" rx="0.5" />
                    <rect x="13" y="0" width="3" height="12" rx="0.5" opacity="0.35" />
                  </svg>
                  <svg viewBox="0 0 16 12" className="h-2.5 w-4 fill-white/90" aria-hidden>
                    <path d="M8 2.5C10.2 2.5 12.1 3.4 13.5 4.9L14.9 3.5C13.1 1.6 10.7 0.5 8 0.5C5.3 0.5 2.9 1.6 1.1 3.5L2.5 4.9C3.9 3.4 5.8 2.5 8 2.5ZM8 6.5C9.4 6.5 10.7 7 11.6 8L13 6.6C11.7 5.3 9.9 4.5 8 4.5C6.1 4.5 4.3 5.3 3 6.6L4.4 8C5.3 7 6.6 6.5 8 6.5ZM8 10.5C8.8 10.5 9.5 10.8 10.1 11.3L8 13.4L5.9 11.3C6.5 10.8 7.2 10.5 8 10.5Z" />
                  </svg>
                  <div className="flex h-2.5 w-5 items-center rounded-[3px] border border-white/50 px-[1px]">
                    <div className="h-1.5 w-3 rounded-[2px] bg-white/90" />
                  </div>
                </div>
              </div>

              
              <div className="absolute left-1/2 top-3 z-20 h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_2px_rgba(255,255,255,0.06)]" />

              
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
              <div className="pointer-events-none absolute -right-8 top-0 z-10 h-full w-1/2 rotate-12 bg-gradient-to-l from-white/[0.04] to-transparent" />

              
              <div className="relative z-0 flex h-full flex-col pt-12">{children}</div>

              
              <div className="absolute bottom-2 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-white/30" />
            </div>
          </div>
        </div>

        
        <div
          className="absolute inset-0 -z-10 translate-y-4 scale-[0.97] rounded-[3rem] bg-black/40 blur-md"
          style={{ transform: 'translateZ(-40px)' }}
        />
      </motion.div>
    </div>
  );
}
