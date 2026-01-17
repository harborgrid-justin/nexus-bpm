
import React from 'react';

interface TabBtnProps {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}

export const TabBtn: React.FC<TabBtnProps> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <Icon size={16}/> {label}
  </button>
);
