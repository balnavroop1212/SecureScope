import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'violet';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-obsidian';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-cyanBrand text-obsidian font-semibold hover:bg-cyanBrand-hover hover:shadow-cyan-glow focus:ring-cyanBrand',
    secondary:
      'bg-graphite text-textMain border border-slateBorder hover:border-cyanBrand/50 hover:bg-graphite-hover focus:ring-cyanBrand',
    danger:
      'bg-severity-high text-white hover:bg-red-600 focus:ring-red-500 shadow-sm',
    ghost:
      'text-textMuted hover:text-textMain hover:bg-graphite/60 focus:ring-slateBorder',
    violet:
      'bg-violetBrand text-obsidian font-semibold hover:bg-violetBrand-hover hover:shadow-violet-glow focus:ring-violetBrand',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};

