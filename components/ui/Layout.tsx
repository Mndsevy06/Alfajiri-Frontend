import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  variant?: 'default' | 'blue' | 'yellow' | 'red' | 'dark';
}

export const GlassCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, glow = true, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-[var(--bg-secondary)]/40 border-[var(--border-default)]/50 text-[var(--text-primary)]",
      blue: "bg-[#007FFF]/10 border-[#007FFF]/30 text-[#007FFF]",
      yellow: "bg-[#F7D618]/10 border-[#F7D618]/30 text-[#F7D618]",
      red: "bg-[#CE1021]/10 border-[#CE1021]/30 text-[#CE1021]",
      dark: "bg-slate-900/90 border-white/10 text-white"
    };

    return (
      <motion.div
        ref={ref as any}
        whileHover={glow ? { y: -4, transition: { duration: 0.2 } } : {}}
        className={cn(
          "backdrop-blur-xl rounded-xl border transition-all duration-300",
          variants[variant],
          glow && "hover:shadow-2xl hover:shadow-black/5",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'neon-yellow' | 'neon-red' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'default', className, ...props }, ref) => {
    const variants = {
      primary: "bg-[#007FFF] text-white hover:bg-[#005BBB] shadow-[0_0_15px_rgba(0,127,255,0.3)]",
      secondary: "border border-[#007FFF] text-[#007FFF] hover:bg-[#007FFF]/10",
      "neon-yellow": "bg-[#007FFF] text-white shadow-[0_0_15px_rgba(0,127,255,0.3)] font-bold",
      "neon-red": "bg-[#005BBB] text-white shadow-[0_0_15px_rgba(0,91,187,0.28)] font-bold",
      ghost: "text-[var(--text-secondary)] hover:text-[#007FFF] hover:bg-white/5",
      outline: "border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
    };

    const sizes = {
      default: "px-6 py-2.5 rounded-xl",
      sm: "h-9 px-3 rounded-md text-sm",
      lg: "h-11 px-8 rounded-md",
      icon: "h-10 w-10 rounded-xl flex items-center justify-center p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "font-medium transition-all duration-300 disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
