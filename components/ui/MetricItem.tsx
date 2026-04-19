
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { NexSkeleton } from './Skeleton';

export interface MetricItemProps {
    icon: React.ElementType;
    label: string;
    value: number | string;
    color: 'blue' | 'amber' | 'red' | 'slate' | 'emerald';
    onClick?: () => void;
    subtext?: string;
    loading?: boolean;
}

export const NexMetricItem: React.FC<MetricItemProps> = ({ icon: Icon, label, value, color, onClick, subtext, loading }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
  return (
    <button 
      onClick={onClick} 
      className={`w-full p-05 rounded-base border shadow-sm flex items-center justify-between transition-all group text-left bg-panel border-default hover:border-active ${onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
    >
      <div className="flex-1">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-01 flex items-center gap-02">
          {label} {onClick && <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>}
        </p>
        {loading ? (
            <NexSkeleton className="h-08 w-24 my-1" />
        ) : (
            <h4 className="text-2xl font-bold text-primary leading-none">{value}</h4>
        )}
        {subtext && <p className="text-[10px] text-tertiary mt-01">{subtext}</p>}
      </div>
      <div className={`p-03 rounded-base ${colors[color]}`}>
        <Icon size={18} />
      </div>
    </button>
  );
};
