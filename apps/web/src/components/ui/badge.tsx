import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-guzo-primary/30 bg-guzo-primary/15 text-guzo-primary',
        secondary: 'border-white/10 bg-white/10 text-slate-300',
        destructive: 'border-transparent bg-destructive/90 text-destructive-foreground',
        outline: 'border-white/20 bg-transparent text-slate-300',
        success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
