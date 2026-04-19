
import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
}

export const NexButton: React.FC<ButtonProps> = ({ children, variant = 'primary', icon: Icon, className = '', size = 'md', ...props }) => {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent',
    secondary: 'bg-panel border-default text-secondary hover:bg-subtle hover:text-primary shadow-sm',
    danger: 'bg-panel border-rose-200 text-rose-600 hover:bg-rose-50',
    ghost: 'bg-transparent text-secondary hover:bg-subtle hover:text-primary'
  };
  const sizes = {
      sm: 'px-2.5 text-[11px] h-7',
      md: 'px-4 text-[13px] h-9',
      lg: 'px-6 text-[15px] h-11'
  };
  return (
    <button 
      className={`${sizes[size]} font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none border rounded-base ${styles[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
};
