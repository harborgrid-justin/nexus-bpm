
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { LucideIcon, ChevronRight, X, ChevronDown, Search, Check, AlertCircle, ArrowUp, ArrowDown, Lock } from 'lucide-react';
import { useBPM } from '../../contexts/BPMContext';
import { Permission } from '../../types';

// --- BASE COMPONENTS ---

interface NexBadgeProps {
  children?: React.ReactNode;
  variant?: 'slate' | 'blue' | 'rose' | 'emerald' | 'amber' | 'violet';
  className?: string;
  icon?: LucideIcon;
}

export const NexBadge: React.FC<NexBadgeProps> = ({ children, variant = 'slate', className = '', icon: Icon }) => {
  const styles = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200'
  };
  return (
    <span 
      className={`px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 w-fit uppercase tracking-wider ${styles[variant]} ${className}`}
      style={{ borderRadius: 'var(--radius-base)' }}
    >
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
};

// Rule 2: Unified Badge System
export const NexStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const s = status.toLowerCase();
    let variant: NexBadgeProps['variant'] = 'slate';
    if (['active', 'completed', 'resolved', 'approved', 'open'].includes(s)) variant = 'emerald';
    if (['in progress', 'pending', 'claimed'].includes(s)) variant = 'blue';
    if (['critical', 'rejected', 'terminated', 'closed', 'breach'].includes(s)) variant = 'rose';
    if (['suspended', 'warning', 'review'].includes(s)) variant = 'amber';

    return <NexBadge variant={variant}>{status}</NexBadge>;
};

// Rule 11: Permission Guard
export const Restricted: React.FC<{ to: Permission; fallback?: React.ReactNode; children: React.ReactNode }> = ({ to, fallback, children }) => {
    const { hasPermission } = useBPM();
    if (hasPermission(to)) return <>{children}</>;
    return fallback ? <>{fallback}</> : null;
};

// Rule 7: Loading Skeleton
export const NexSkeleton: React.FC<{ height?: string; width?: string; className?: string }> = ({ height = '20px', width = '100%', className = '' }) => (
    <div className={`bg-slate-200 animate-pulse rounded-sm ${className}`} style={{ height, width }}></div>
);

// Rule 1: Structured Card
export const NexCard: React.FC<{ 
    children?: React.ReactNode; 
    onClick?: () => void; 
    className?: string; 
    title?: React.ReactNode;
    actions?: React.ReactNode;
}> = ({ children, onClick, className = '', title, actions }) => (
  <div 
    onClick={onClick}
    className={`bg-white border border-slate-200 shadow-sm flex flex-col ${onClick ? 'cursor-pointer hover:border-blue-400' : ''} ${className}`}
    style={{ borderRadius: 'var(--radius-base)' }}
  >
    {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50" style={{ padding: 'var(--space-base)' }}>
            <div className="font-bold text-slate-800 text-sm">{title}</div>
            <div className="flex items-center gap-2">{actions}</div>
        </div>
    )}
    <div className="flex-1">
        {children}
    </div>
  </div>
);

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

export const NexSearchSelect: React.FC<{ value: string; onChange: (val: string) => void; options: { label: string; value: string }[]; placeholder?: string; className?: string }> = ({ value, onChange, options, placeholder = "Select...", className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find(o => o.value === value)?.label || value;
    const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            <div 
                className="prop-input flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`text-xs truncate ${!value ? 'text-slate-400' : 'text-slate-800'}`}>
                    {value ? selectedLabel : placeholder}
                </span>
                <ChevronDown size={14} className="text-slate-400"/>
            </div>
            
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-sm shadow-xl z-50 animate-slide-up max-h-60 flex flex-col">
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                                className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs outline-none focus:border-blue-500"
                                placeholder="Filter..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="p-2 text-center text-[10px] text-slate-400 italic">No matches found.</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <button 
                                    key={opt.value} 
                                    onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-sm flex items-center justify-between ${value === opt.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {opt.label}
                                    {value === opt.value && <Check size={12}/>}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// 6. Empty State Component
export const NexEmptyState: React.FC<{ icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }> = ({ icon: Icon, title, description, action }) => (
    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-sm bg-slate-50 flex flex-col items-center justify-center gap-3 h-full min-h-[200px]">
        <Icon size={32} className="text-slate-300"/>
        <div className="max-w-xs">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
        </div>
        {action && <div className="mt-2">{action}</div>}
    </div>
);

// 3. Search & Filter Bar
export const NexSearchFilterBar: React.FC<{ 
    placeholder?: string; 
    onSearch: (val: string) => void; 
    searchValue: string; 
    actions?: React.ReactNode;
    filters?: React.ReactNode;
}> = ({ placeholder = "Search...", onSearch, searchValue, actions, filters }) => (
    <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
            <input 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-sm text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none"
                placeholder={placeholder}
                value={searchValue}
                onChange={e => onSearch(e.target.value)}
            />
        </div>
        {filters && <div className="flex gap-2 items-center">{filters}</div>}
        {actions && <div className="flex gap-2 items-center">{actions}</div>}
    </div>
);

// 18. User Display
export const NexUserDisplay: React.FC<{ userId: string; showEmail?: boolean; size?: 'sm' | 'md' }> = ({ userId, showEmail = false, size = 'sm' }) => {
    const { users } = useBPM();
    const user = users.find(u => u.id === userId);
    
    if (!user) return <span className="text-slate-400 italic text-xs">Unknown User ({userId})</span>;

    const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';

    return (
        <div className="flex items-center gap-2">
            <div className={`${sizeClass} rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 uppercase`}>
                {user.name.charAt(0)}
            </div>
            <div>
                <div className={`font-medium text-slate-700 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{user.name}</div>
                {showEmail && <div className="text-[10px] text-slate-400">{user.email}</div>}
            </div>
        </div>
    );
};

// 9. Generic Data Table
interface Column<T> {
    header: string;
    accessor: (item: T) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
}

interface NexDataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    onRowClick?: (item: T) => void;
    emptyState?: React.ReactNode;
}

export function NexDataTable<T>({ data, columns, keyField, onRowClick, emptyState }: NexDataTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{ key: number | null, dir: 'asc' | 'desc' }>({ key: null, dir: 'asc' });

    const handleSort = (idx: number) => {
        setSortConfig(current => ({
            key: idx,
            dir: current.key === idx && current.dir === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedData = useMemo(() => {
        if (sortConfig.key === null) return data;
        const col = columns[sortConfig.key];
        
        return [...data].sort((a, b) => {
            const valA = col.accessor(a);
            const valB = col.accessor(b);
            // Basic string comparison logic for sorting - simplified for demo
            const strA = typeof valA === 'string' || typeof valA === 'number' ? String(valA).toLowerCase() : '';
            const strB = typeof valB === 'string' || typeof valB === 'number' ? String(valB).toLowerCase() : '';
            
            if (strA < strB) return sortConfig.dir === 'asc' ? -1 : 1;
            if (strA > strB) return sortConfig.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig, columns]);

    if (data.length === 0 && emptyState) return <>{emptyState}</>;

    return (
        <div className="bg-white rounded-sm border border-slate-300 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-[11px] font-bold text-slate-500 uppercase">
                            {columns.map((col, idx) => (
                                <th 
                                    key={idx} 
                                    className={`px-4 py-3 border-r border-slate-200 last:border-0 ${col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''}`} 
                                    style={{ width: col.width, textAlign: col.align }}
                                    onClick={() => col.sortable && handleSort(idx)}
                                >
                                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                                        {col.header}
                                        {sortConfig.key === idx && (
                                            sortConfig.dir === 'asc' ? <ArrowUp size={10}/> : <ArrowDown size={10}/>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedData.map((item) => (
                            <tr 
                                key={String(item[keyField])} 
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`text-xs group ${onRowClick ? 'hover:bg-slate-50 cursor-pointer transition-colors' : ''}`}
                            >
                                {columns.map((col, idx) => (
                                    <td 
                                        key={idx} 
                                        className="px-4 py-3 border-r border-slate-100 last:border-0"
                                        style={{ textAlign: col.align }}
                                    >
                                        {col.accessor(item)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
