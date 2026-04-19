
import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'slate' | 'blue' | 'rose' | 'emerald' | 'amber' | 'violet';
  icon?: LucideIcon;
  className?: string;
}

export const NexBadge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '', icon: Icon }) => {
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

export const NexStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const s = status.toLowerCase();
    let variant: BadgeProps['variant'] = 'slate';
    if (['active', 'completed', 'resolved', 'approved', 'open'].includes(s)) variant = 'emerald';
    if (['in progress', 'pending', 'claimed'].includes(s)) variant = 'blue';
    if (['critical', 'rejected', 'terminated', 'closed', 'breach'].includes(s)) variant = 'rose';
    if (['suspended', 'warning', 'review'].includes(s)) variant = 'amber';

    return <NexBadge variant={variant}>{status}</NexBadge>;
};
