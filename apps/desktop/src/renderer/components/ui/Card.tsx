import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glass';
  isGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  isGlow = false,
  className,
  ...props
}) => {
  const baseStyles = 'bg-graphite rounded-xl border border-slateBorder p-5 transition-all duration-200';

  const variantStyles = {
    default: '',
    interactive: 'cursor-pointer hover:border-cyanBrand/50 hover:bg-graphite-hover hover:shadow-cyan-glow',
    glass: 'bg-graphite/80 backdrop-blur-md border-slateBorder/80',
  };

  const glowStyles = isGlow ? 'shadow-cyan-glow border-cyanBrand/40' : '';

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], glowStyles, className))}
      {...props}
    >
      {children}
    </div>
  );
};
