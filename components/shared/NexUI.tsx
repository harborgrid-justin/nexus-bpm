
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { LucideIcon, Search, Check, ArrowUp, ArrowDown, X, ChevronDown, GripVertical, ChevronRight } from 'lucide-react';
import { useBPM } from '../../contexts/BPMContext';
import { Permission } from '../../types';

// Re-export Primitives
export * from '../ui/primitives';
import { NexBadge } from '../ui/primitives';

// --- LOADING SKELETON ---
export const NexSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 rounded-sm ${className}`} />
);

// --- NEW CONSOLIDATED COMPONENTS (Phase 4) ---

export const NexMetricItem: React.FC<{
    icon: React.ElementType;
    label: string;
    value: number | string;
    color: 'blue' | 'amber' | 'red' | 'slate' | 'emerald';
    onClick?: () => void;
    subtext?: string;
    loading?: boolean;
}> = ({ icon: Icon, label, value, color, onClick, subtext, loading }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
  return (
    <button onClick={onClick} className={`w-full p-4 rounded-sm border shadow-sm flex items-center justify-between transition-all group text-left bg-white border-default hover:border-active ${onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
          {label} {onClick && <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>}
        </p>
        {loading ? (
            <NexSkeleton className="h-8 w-24 my-1" />
        ) : (
            <h4 className="text-2xl font-bold text-primary leading-none">{value}</h4>
        )}
        {subtext && <p className="text-[10px] text-tertiary mt-1">{subtext}</p>}
      </div>
      <div className={`p-2 rounded-sm ${colors[color]}`}>
        <Icon size={18} />
      </div>
    </button>
  );
};

export const NexListItem: React.FC<{
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    meta?: React.ReactNode;
    status?: React.ReactNode;
    icon?: React.ElementType;
    iconColor?: string; // e.g. "bg-blue-50 text-blue-600"
    selected?: boolean;
    onClick?: () => void;
    actions?: React.ReactNode;
    before?: React.ReactNode; // Checkbox, etc.
}> = ({ title, subtitle, meta, status, icon: Icon, iconColor, selected, onClick, actions, before }) => {
    return (
        <div 
            onClick={onClick}
            className={`px-4 py-3 border-b border-default transition-all duration-200 relative group flex items-start gap-3 ${onClick ? 'cursor-pointer' : ''} ${selected ? 'bg-active border-l-4 border-l-blue-600 pl-3' : 'border-l-4 border-l-transparent bg-panel hover:bg-subtle'}`}
        >
            {before && <div className="mt-1" onClick={e => e.stopPropagation()}>{before}</div>}
            
            {Icon && (
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border border-default ${iconColor || 'bg-subtle text-secondary'}`}>
                    <Icon size={16}/>
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                    <div className={`font-bold truncate text-sm ${selected ? 'text-blue-900 dark:text-blue-100' : 'text-primary'}`}>
                        {title}
                    </div>
                    {meta && <div className="shrink-0 pl-2">{meta}</div>}
                </div>
                
                <div className="flex justify-between items-center text-xs text-secondary">
                    <div className="truncate pr-2">{subtitle}</div>
                    <div className="flex items-center gap-2 shrink-0">{status}</div>
                </div>
            </div>

            {actions && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-panel/90 p-1 rounded border border-default shadow-sm" onClick={e => e.stopPropagation()}>
                    {actions}
                </div>
            )}
        </div>
    );
};

// --- EXISTING COMPONENTS ---

export const NexStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const s = status.toLowerCase();
    let variant: any = 'slate';
    if (['active', 'completed', 'resolved', 'approved', 'open'].includes(s)) variant = 'emerald';
    if (['in progress', 'pending', 'claimed'].includes(s)) variant = 'blue';
    if (['critical', 'rejected', 'terminated', 'closed', 'breach'].includes(s)) variant = 'rose';
    if (['suspended', 'warning', 'review'].includes(s)) variant = 'amber';

    return <NexBadge variant={variant}>{status}</NexBadge>;
};

export const Restricted: React.FC<{ to: Permission; fallback?: React.ReactNode; children: React.ReactNode }> = ({ to, fallback, children }) => {
    const { hasPermission } = useBPM();
    if (hasPermission(to)) return <>{children}</>;
    return fallback ? <>{fallback}</> : null;
};

export const NexDebouncedInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    debounce?: number;
    placeholder?: string;
    className?: string;
    icon?: LucideIcon;
}> = ({ value: initialValue, onChange, debounce = 300, placeholder, className, icon: Icon }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value);
        }, debounce);
        return () => clearTimeout(timeout);
    }, [value, debounce, onChange]);

    return (
        <div className="relative w-full">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={14}/>}
            <input 
                className={`${className} ${Icon ? 'pl-9' : 'pl-3'}`}
                value={value} 
                onChange={e => setValue(e.target.value)}
                placeholder={placeholder}
                style={{ height: 'var(--input-height)', fontSize: 'var(--text-base-size)' }}
            />
        </div>
    );
};

export const NexSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; icon?: LucideIcon }> = ({ checked, onChange, label, icon: Icon }) => (
  <label 
    className="flex items-center justify-between border border-default hover:bg-subtle transition-colors cursor-pointer group rounded-base px-layout gap-base"
    style={{ padding: 'var(--space-base)' }}
  >
    <div className="flex items-center gap-3">
      {Icon && <Icon size={16} className={checked ? 'text-blue-600' : 'text-tertiary'} />}
      <span className={`text-[13px] font-semibold transition-colors ${checked ? 'text-primary' : 'text-secondary'}`}>{label}</span>
    </div>
    <div 
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </label>
);

export const NexHistoryFeed = ({ history }: { history: any[] }) => (
  <div className="space-y-4">
    {history.map((item, idx) => (
      <div key={item.id || idx} className="flex gap-4 group">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-subtle border border-default flex items-center justify-center text-secondary text-[11px] font-bold group-last:bg-blue-50 group-last:text-blue-700 group-last:border-blue-200">
                {item.author?.[0] || item.userName?.[0]}
            </div>
            <div className="w-px h-full bg-default group-last:hidden"></div>
        </div>
        <div className="pb-6 flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[13px] font-bold text-primary">{item.author || item.userName}</span>
            <span className="text-[11px] font-medium text-tertiary">
              {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-[13px] text-secondary leading-relaxed">
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
    <div className="fixed inset-0 z-modal bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in">
      <div 
        ref={modalRef} 
        className={`bg-panel w-full ${maxWidths[size]} border border-default shadow-2xl animate-slide-up flex flex-col max-h-[90vh] rounded-lg`}
      >
        <div className="flex items-center justify-between p-5 border-b border-default shrink-0">
          <h3 className="text-[16px] font-bold text-primary">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-subtle text-tertiary hover:text-primary transition-colors">
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
                style={{ height: 'var(--input-height)', fontSize: 'var(--text-base-size)' }}
            >
                <span className={`truncate ${!value ? 'text-tertiary' : 'text-primary'}`}>
                    {value ? selectedLabel : placeholder}
                </span>
                <ChevronDown size={14} className="text-tertiary"/>
            </div>
            
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-panel border border-default rounded-sm shadow-xl z-50 animate-slide-up max-h-60 flex flex-col">
                    <div className="p-2 border-b border-default sticky top-0 bg-panel">
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-tertiary"/>
                            <input 
                                className="w-full pl-7 pr-2 py-1.5 bg-subtle border border-default rounded-sm text-xs outline-none focus:border-blue-500 text-primary"
                                placeholder="Filter..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="p-2 text-center text-[10px] text-tertiary italic">No matches found.</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <button 
                                    key={opt.value} 
                                    onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-sm flex items-center justify-between ${value === opt.value ? 'bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/30 dark:text-blue-300' : 'text-secondary hover:bg-subtle hover:text-primary'}`}
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

export const NexEmptyState: React.FC<{ icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }> = ({ icon: Icon, title, description, action }) => (
    <div className="p-12 text-center border-2 border-dashed border-default rounded-sm bg-subtle flex flex-col items-center justify-center gap-3 h-full min-h-[200px]">
        <Icon size={32} className="text-tertiary"/>
        <div className="max-w-xs">
            <p className="text-sm font-bold text-secondary">{title}</p>
            {description && <p className="text-xs text-tertiary mt-1">{description}</p>}
        </div>
        {action && <div className="mt-2">{action}</div>}
    </div>
);

export const NexSearchFilterBar: React.FC<{ 
    placeholder?: string; 
    onSearch: (val: string) => void; 
    searchValue: string; 
    actions?: React.ReactNode;
    filters?: React.ReactNode;
}> = ({ placeholder = "Search...", onSearch, searchValue, actions, filters }) => (
    <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
            <NexDebouncedInput 
                value={searchValue} 
                onChange={onSearch} 
                placeholder={placeholder}
                className="w-full pr-4 bg-panel border border-default rounded-sm font-medium focus:ring-1 focus:ring-blue-600 outline-none text-primary placeholder:text-tertiary"
                icon={Search}
            />
        </div>
        {filters && <div className="flex gap-2 items-center">{filters}</div>}
        {actions && <div className="flex gap-2 items-center">{actions}</div>}
    </div>
);

export const NexUserDisplay: React.FC<{ userId: string; showEmail?: boolean; size?: 'sm' | 'md' }> = ({ userId, showEmail = false, size = 'sm' }) => {
    const { users } = useBPM();
    const user = users.find(u => u.id === userId);
    
    if (!user) return <span className="text-tertiary italic text-xs">Unknown User ({userId})</span>;

    const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';

    return (
        <div className="flex items-center gap-2">
            <div className={`${sizeClass} rounded-full bg-subtle flex items-center justify-center font-bold text-secondary border border-default uppercase`}>
                {user.name.charAt(0)}
            </div>
            <div>
                <div className={`font-medium text-primary ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{user.name}</div>
                {showEmail && <div className="text-[10px] text-tertiary">{user.email}</div>}
            </div>
        </div>
    );
};

export function NexVirtualList<T>({ 
    items, 
    renderItem, 
    itemHeight, 
    className 
}: { 
    items: T[], 
    renderItem: (item: T, index: number) => React.ReactNode, 
    itemHeight: number,
    className?: string
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    useEffect(() => {
        if (containerRef.current) {
            setContainerHeight(containerRef.current.clientHeight);
            const handleScroll = () => setScrollTop(containerRef.current?.scrollTop || 0);
            const current = containerRef.current;
            current.addEventListener('scroll', handleScroll);
            return () => current.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const totalHeight = items.length * itemHeight;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const renderStart = Math.max(0, startIndex - 5);
    const renderEnd = Math.min(items.length, startIndex + visibleCount + 5);
    
    const visibleItems = items.slice(renderStart, renderEnd).map((item, index) => ({
        item,
        index: renderStart + index,
        top: (renderStart + index) * itemHeight
    }));

    return (
        <div 
            ref={containerRef} 
            className={`overflow-y-auto relative ${className}`}
            style={{ height: '100%' }}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems.map(({ item, index, top }) => (
                    <div key={index} style={{ position: 'absolute', top, left: 0, right: 0, height: itemHeight }}>
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

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
            const strA = typeof valA === 'string' || typeof valA === 'number' ? String(valA).toLowerCase() : '';
            const strB = typeof valB === 'string' || typeof valB === 'number' ? String(valB).toLowerCase() : '';
            
            if (strA < strB) return sortConfig.dir === 'asc' ? -1 : 1;
            if (strA > strB) return sortConfig.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig, columns]);

    if (data.length === 0 && emptyState) return <>{emptyState}</>;

    return (
        <div className="bg-panel rounded-sm border border-default shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-subtle border-b border-default">
                        <tr className="text-[11px] font-bold text-secondary uppercase">
                            {columns.map((col, idx) => (
                                <th 
                                    key={idx} 
                                    className={`px-4 py-3 border-r border-default last:border-0 ${col.sortable ? 'cursor-pointer hover:bg-hover' : ''}`} 
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
                    <tbody className="divide-y divide-default">
                        {sortedData.map((item) => (
                            <tr 
                                key={String(item[keyField])} 
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`text-xs group ${onRowClick ? 'hover:bg-subtle cursor-pointer transition-colors' : ''}`}
                            >
                                {columns.map((col, idx) => (
                                    <td 
                                        key={idx} 
                                        className="px-4 py-3 border-r border-default last:border-0 text-primary"
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
