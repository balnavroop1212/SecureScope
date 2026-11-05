import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info'
  | 'success'
  | 'free'
  | 'premium'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  withDot = false,
  className,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide uppercase border';

  const variantStyles: Record<BadgeVariant, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    info: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    free: 'bg-slateBorder text-textMuted border-slateBorder-muted',
    premium: 'bg-cyanBrand/10 text-cyanBrand border-cyanBrand/40 shadow-cyan-glow',
    neutral: 'bg-graphite text-textMuted border-slateBorder',
  };

  const dotColors: Record<BadgeVariant, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-500',
    low: 'bg-sky-400',
    info: 'bg-slate-400',
    success: 'bg-emerald-400',
    free: 'bg-slate-400',
    premium: 'bg-cyanBrand animate-pulse',
    neutral: 'bg-slate-400',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variantStyles[variant], className))} {...props}>
      {withDot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};
