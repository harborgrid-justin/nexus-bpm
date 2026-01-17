
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface KPIButtonProps {
    icon: React.ElementType;
    label: string;
    value: number | string;
    color: 'blue' | 'amber' | 'red' | 'slate';
    onClick: () => void;
}

export const KPIButton: React.FC<KPIButtonProps> = ({ icon: Icon, label, value, color, onClick }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200'
  };
  return (
    <button onClick={onClick} className={`p-4 rounded-sm border shadow-sm flex items-center justify-between hover:shadow-md transition-all group text-left ${colors[color].replace('bg-', 'hover:border-blue-400 bg-white border-')}`}>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
          {label} <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
        </p>
        <h4 className="text-2xl font-bold text-slate-900 leading-none">{value}</h4>
      </div>
      <div className={`p-2 rounded-sm ${colors[color]}`}>
        <Icon size={18} />
      </div>
    </button>
  );
};
