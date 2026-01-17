
import React, { useEffect, useRef } from 'react';
import { LucideIcon, ChevronRight, X } from 'lucide-react';

interface NexBadgeProps {
  children?: React.ReactNode;
  variant?: 'slate' | 'blue' | 'rose' | 'emerald' | 'amber';
  className?: string;
}

export const NexBadge: React.FC<NexBadgeProps> = ({ children, variant = 'slate', className = '' }) => {
  const styles = {
    slate: 'bg-slate-100 text-slate-600 border-slate-300',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface NexCardProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hover?: boolean;
}

export const NexCard: React.FC<NexCardProps> = ({ children, onClick, className = '', hover = true }) => (
  <div 
    onClick={onClick}
    className={`bg-white border border-slate-300 rounded-sm shadow-sm ${onClick ? 'cursor-pointer' : ''} ${hover && onClick ? 'hover:bg-slate-50' : ''} ${className}`}
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
}

export const NexButton: React.FC<NexButtonProps> = ({ children, variant = 'primary', onClick, icon: Icon, className = '', disabled = false, type = 'button' }) => {
  const styles = {
    primary: 'bg-[#0284c7] text-white hover:bg-[#0369a1] border border-transparent',
    secondary: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
    danger: 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100'
  };
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-sm text-[12px] font-semibold flex items-center justify-center gap-2 transition-all active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${className}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
};

export const NexSectionHeader = ({ title, subtitle, icon: Icon }: { title: string, subtitle?: string, icon?: LucideIcon }) => (
  <div className="flex flex-col gap-1 mb-4 border-b border-slate-200 pb-2">
    <div className="flex items-center gap-2">
      {Icon && <div className="text-slate-500"><Icon size={18} /></div>}
      <h2 className="text-lg font-semibold text-slate-800 tracking-tight">{title}</h2>
    </div>
    {subtitle && <p className="text-[12px] text-slate-500">{subtitle}</p>}
  </div>
);

export const NexHistoryFeed = ({ history }: { history: any[] }) => (
  <div className="space-y-0 border-l border-slate-200 ml-2">
    {history.map((item, idx) => (
      <div key={item.id || idx} className="flex gap-3 pl-4 pb-4 relative">
        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white ring-1 ring-slate-100"></div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[12px] font-bold text-slate-800">{item.author || item.userName}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-[12px] text-slate-600 bg-slate-50 border border-slate-200 p-2 rounded-sm">
            {item.description || item.text}
          </div>
        </div>
      </div>
    ))}
  </div>
);

// --- New Enterprise Components ---

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
    <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div ref={modalRef} className={`bg-white w-full ${maxWidths[size]} rounded-sm border border-slate-300 shadow-2xl animate-slide-up flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-sm shrink-0">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const NexFormGroup: React.FC<{ label: string; children: React.ReactNode; helpText?: string }> = ({ label, children, helpText }) => (
  <div className="mb-4 space-y-1.5">
    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">{label}</label>
    {children}
    {helpText && <p className="text-[10px] text-slate-500 italic">{helpText}</p>}
  </div>
);
