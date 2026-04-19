
import React from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { Permission } from '../../types';

export interface ListItemProps {
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
}

export const NexListItem: React.FC<ListItemProps> = ({ title, subtitle, meta, status, icon: Icon, iconColor, selected, onClick, actions, before }) => {
    return (
        <div 
            onClick={onClick}
            className={`px-05 py-04 border-b border-default transition-all duration-200 relative group flex items-start gap-03 ${onClick ? 'cursor-pointer' : ''} ${selected ? 'bg-active border-l-4 border-l-blue-600 pl-3' : 'border-l-4 border-l-transparent bg-panel hover:bg-subtle'}`}
        >
            {before && <div className="mt-01" onClick={e => e.stopPropagation()}>{before}</div>}
            
            {Icon && (
                <div className={`w-8 h-8 rounded-base flex items-center justify-center shrink-0 border border-default ${iconColor || 'bg-subtle text-secondary'}`}>
                    <Icon size={16}/>
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-01">
                    <div className={`font-bold truncate text-sm ${selected ? 'text-blue-900 dark:text-blue-100' : 'text-primary'}`}>
                        {title}
                    </div>
                    {meta && <div className="shrink-0 pl-03">{meta}</div>}
                </div>
                
                <div className="flex justify-between items-center text-xs text-secondary">
                    <div className="truncate pr-03">{subtitle}</div>
                    <div className="flex items-center gap-03 shrink-0">{status}</div>
                </div>
            </div>

            {actions && (
                <div className="absolute right-03 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-02 bg-panel/90 p-02 rounded border border-default shadow-sm" onClick={e => e.stopPropagation()}>
                    {actions}
                </div>
            )}
        </div>
    );
};
