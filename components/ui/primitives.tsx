
import React, { useRef, useEffect, useState } from 'react';
import { LucideIcon, GripVertical } from 'lucide-react';

// --- BUTTON ---
export interface NexButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
}

export const NexButton: React.FC<NexButtonProps> = ({ children, variant = 'primary', icon: Icon, className = '', size = 'md', ...props }) => {
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

// --- CARD ---
export interface NexCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: React.ReactNode;
    actions?: React.ReactNode;
    dragHandle?: boolean;
}

export const NexCard = React.forwardRef<HTMLDivElement, NexCardProps>(({ children, className = '', title, actions, dragHandle, onClick, ...props }, ref) => (
  <div 
    ref={ref}
    onClick={onClick}
    className={`bg-panel border border-default shadow-sm flex flex-col rounded-base transition-colors ${onClick ? 'cursor-pointer hover:border-active' : ''} ${className}`}
    {...props}
  >
    {(title || actions || dragHandle) && (
        <div className="flex items-center justify-between border-b border-default bg-subtle px-card py-2">
            <div className="flex items-center gap-2">
                {dragHandle && <GripVertical size={14} className="text-tertiary cursor-grab active:cursor-grabbing drag-handle hover:text-primary"/>}
                <div className="font-bold text-primary text-sm">{title}</div>
            </div>
            <div className="flex items-center gap-2">{actions}</div>
        </div>
    )}
    <div className="flex-1 min-h-0 flex flex-col">{children}</div>
  </div>
));

// --- BADGE ---
export interface NexBadgeProps {
  children?: React.ReactNode;
  variant?: 'slate' | 'blue' | 'rose' | 'emerald' | 'amber' | 'violet';
  icon?: LucideIcon;
  className?: string;
}

export const NexBadge: React.FC<NexBadgeProps> = ({ children, variant = 'slate', className = '', icon: Icon }) => {
  const styles = {
    slate: 'bg-subtle text-secondary border-default',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200'
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-base flex items-center gap-1 w-fit uppercase tracking-wider ${styles[variant]} ${className}`}>
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
};

// --- INPUTS ---
export const NexFormGroup: React.FC<{ label: string; children: React.ReactNode; helpText?: string; icon?: LucideIcon; required?: boolean }> = ({ label, children, helpText, icon: Icon, required }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-2">
      {Icon && <Icon size={14} className="text-tertiary" />}
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {helpText && <p className="text-[11px] text-tertiary leading-tight">{helpText}</p>}
  </div>
);
