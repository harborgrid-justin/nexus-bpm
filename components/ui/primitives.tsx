
import React from 'react';
import { LucideIcon } from 'lucide-react';

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
