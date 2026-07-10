import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GuzoLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-guzo-primary/30 bg-guzo-primary/15 text-guzo-primary shadow-[0_0_30px_rgba(34,197,94,0.2)]">
        <Truck className="h-5 w-5" />
      </div>
      {showText && (
        <div className="leading-tight">
          <span className="block text-lg font-extrabold tracking-tight text-foreground">GUZO</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Moving Ethiopia Forward
          </span>
        </div>
      )}
    </div>
  );
}
