import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GuzoLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Truck className="h-5 w-5" />
      </div>
      {showText && (
        <div className="leading-tight">
          <span className="block text-lg font-extrabold tracking-tight">GUZO</span>
          <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Moving Ethiopia Forward
          </span>
        </div>
      )}
    </div>
  );
}
