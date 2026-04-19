import React from 'react';
import { LucideIcon, GripVertical, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
    icon: LucideIcon;
    color: 'blue' | 'emerald' | 'rose' | 'slate' | 'violet';
    onClick?: () => void;
    isEditable?: boolean;
    dragHandleProps?: any;
    style?: React.CSSProperties;
    className?: string;
}

export const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(({ 
    title, value, change, trend, icon: Icon, color, onClick, isEditable, dragHandleProps, style, className, ...props 
}, ref) => {
    const colors: Record<string, string> = {
        blue: 'text-blue-600 bg-blue-50 border-blue-200',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        rose: 'text-rose-600 bg-rose-50 border-rose-200',
        slate: 'text-slate-600 bg-slate-50 border-slate-200',
        violet: 'text-violet-600 bg-violet-50 border-violet-200',
    };
    
    return (
        <div 
            ref={ref} 
            onClick={onClick} 
            style={{ borderRadius: 'var(--radius-base)', ...style }} 
            className={`bg-panel p-04 border border-default rounded-sm shadow-sm cursor-pointer hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between h-full ${className}`} 
            {...props}
        >
            <div className="flex justify-between items-start relative z-10">
                <div className={`p-1.5 rounded-sm ${colors[color]}`}>
                    <Icon size={16}/>
                </div>
                {isEditable && (
                    <div 
                        {...dragHandleProps} 
                        className="drag-handle p-1 cursor-move text-tertiary hover:text-secondary"
                    >
                        <GripVertical size={12}/>
                    </div>
                )}
                {change && !isEditable && (
                    <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-sm ${trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                        {trend === 'up' ? <ArrowUpRight size={10} className="mr-0.5"/> : <ArrowDownRight size={10} className="mr-0.5"/>}
                        {change}
                    </span>
                )}
            </div>
            
            <div className="mt-4 relative z-10">
                <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">{title}</p>
                <h4 className="text-2xl font-bold text-primary leading-tight mt-1">{value}</h4>
            </div>

            <Icon 
                size={64} 
                className={`absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110 pointer-events-none ${colors[color].split(' ')[0]}`} 
            />
        </div>
    );
});

KPICard.displayName = 'KPICard';
