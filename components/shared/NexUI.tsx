
import React, { useEffect, useRef } from 'react';
import { LucideIcon, ChevronRight, X } from 'lucide-react';

interface NexBadgeProps {
  children?: React.ReactNode;
  variant?: 'slate' | 'blue' | 'rose' | 'emerald' | 'amber';
  className?: string;
}

export const NexBadge: React.FC<NexBadgeProps> = ({ children, variant = 'slate', className = '' }) => {
  const styles = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    rose: 'bg-red-50 text-red-700 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100'
  };
  return (
    <span 
      className={`px-2.5 py-0.5 text-[11px] font-bold border ${styles[variant]} ${className}`}
      style={{ borderRadius: 'var(--radius-base)' }}
    >
      {children}
    </span>
  );
};

export const NexSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; icon?: LucideIcon }> = ({ checked, onChange, label, icon: Icon }) => (
  <label 
    className="flex items-center justify-between border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
    style={{ padding: 'var(--space-base)', borderRadius: 'var(--radius-base)' }}
  >
    <div className="flex items-center gap-3">
      {Icon && <Icon size={16} className={checked ? 'text-blue-600' : 'text-slate-400'} />}
      <span className={`text-[13px] font-semibold transition-colors ${checked ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
    </div>
    <div 
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </label>
);

export const NexCard: React.FC<{ children?: React.ReactNode; onClick?: () => void; className?: string; hover?: boolean }> = ({ children, onClick, className = '', hover = true }) => (
  <div 
    onClick={onClick}
    className={`bg-white border border-slate-200 shadow-sm ${onClick ? 'cursor-pointer' : ''} ${hover && onClick ? 'hover:border-blue-400' : ''} ${className}`}
    style={{ borderRadius: 'var(--radius-base)' }}
  >
    {children}
  </div>
);

interface NexButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
}

export const NexButton: React.FC<NexButtonProps> = ({ children, variant = 'primary', onClick, icon: Icon, className = '', disabled = false, type = 'button', size = 'md' }) => {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-blue-700/10',
    secondary: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
    danger: 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100'
  };
  
  const sizes = {
      sm: 'px-2.5 py-1 text-[11px]',
      md: 'px-4 py-2 text-[13px]',
      lg: 'px-6 py-3 text-[15px]'
  };

  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${sizes[size]} font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none border ${styles[variant]} ${className}`}
      style={{ borderRadius: 'var(--radius-base)' }}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
};

export const NexFormGroup: React.FC<{ label: string; children: React.ReactNode; helpText?: string; icon?: LucideIcon; required?: boolean }> = ({ label, children, helpText, icon: Icon, required }) => (
  <div className="space-y-1.5">
    <label className="prop-label">
      {Icon && <Icon size={14} className="text-slate-400" />}
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {helpText && <p className="text-[11px] text-slate-500 leading-tight">{helpText}</p>}
  </div>
);

export const NexHistoryFeed = ({ history }: { history: any[] }) => (
  <div className="space-y-4">
    {history.map((item, idx) => (
      <div key={item.id || idx} className="flex gap-4 group">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[11px] font-bold group-last:bg-blue-50 group-last:text-blue-700 group-last:border-blue-200">
                {item.author?.[0] || item.userName?.[0]}
            </div>
            <div className="w-px h-full bg-slate-100 group-last:hidden"></div>
        </div>
        <div className="pb-6 flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[13px] font-bold text-slate-900">{item.author || item.userName}</span>
            <span className="text-[11px] font-medium text-slate-400">
              {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-[13px] text-slate-600 leading-relaxed">
            {item.description || item.text}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const NexModal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-modal bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in">
      <div 
        ref={modalRef} 
        className={`bg-white w-full ${maxWidths[size]} border border-slate-200 shadow-2xl animate-slide-up flex flex-col max-h-[90vh]`}
        style={{ borderRadius: 'calc(var(--radius-base) * 2)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <h3 className="text-[16px] font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
