
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
    blue: 'bg-blue-50 text-blue-600 ring-blue-100 group-hover:bg-blue-600',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100 group-hover:bg-amber-600',
    red: 'bg-red-50 text-red-600 ring-red-100 group-hover:bg-red-600',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200 group-hover:bg-slate-600'
  };
  return (
    <button onClick={onClick} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-lg hover:-translate-y-1 transition-all group text-left ring-4 ring-transparent hover:ring-slate-100">
      <div className={`p-4 rounded-xl transition-all group-hover:text-white group-hover:scale-110 ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
          {label} <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
        </p>
      </div>
    </button>
  );
};
