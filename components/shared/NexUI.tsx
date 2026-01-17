
import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

export const NexBadge = ({ children, variant = 'slate', className = '' }: { children?: React.ReactNode, variant?: 'slate' | 'blue' | 'rose' | 'emerald' | 'amber', className?: string }) => {
  const styles = {
    slate: 'bg-slate-100 text-slate-500 border-slate-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const NexCard = ({ children, onClick, className = '', hover = true }: { children?: React.ReactNode, onClick?: () => void, className?: string, hover?: boolean }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${hover ? 'hover:border-slate-300' : ''} ${className}`}
  >
    {children}
  </div>
);

export const NexButton = ({ children, variant = 'primary', onClick, icon: Icon, className = '', disabled = false }: { children?: React.ReactNode, variant?: 'primary' | 'secondary' | 'danger' | 'ghost', onClick?: () => void, icon?: LucideIcon, className?: string, disabled?: boolean }) => {
  const styles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50',
    danger: 'bg-white border border-rose-100 text-rose-600 hover:bg-rose-50',
    ghost: 'bg-transparent text-slate-400 hover:text-slate-900'
  };
  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

export const NexSectionHeader = ({ title, subtitle, icon: Icon }: { title: string, subtitle?: string, icon?: LucideIcon }) => (
  <div className="flex flex-col gap-2 mb-8">
    <div className="flex items-center gap-3">
      {Icon && <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Icon size={20} /></div>}
      <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">{title}</h2>
    </div>
    {subtitle && <p className="text-[14px] text-slate-500 font-medium leading-relaxed max-w-lg">{subtitle}</p>}
  </div>
);

export const NexHistoryFeed = ({ history }: { history: any[] }) => (
  <div className="space-y-6">
    {history.map((item, idx) => (
      <div key={item.id || idx} className="flex gap-4 group">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black z-10 shrink-0">
            {(item.author || item.userName || 'S')[0]}
          </div>
          {idx < history.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>}
        </div>
        <div className="flex-1 pb-6">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[13px] font-black text-slate-900">{item.author || item.userName}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-[14px] text-slate-600 leading-relaxed bg-white border border-slate-100 p-4 rounded-xl card-shadow group-hover:border-blue-100 transition-colors">
            {item.description || item.text}
          </p>
        </div>
      </div>
    ))}
  </div>
);
