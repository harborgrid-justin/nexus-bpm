
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
    className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition-all shrink-0 border-b-2 ${active ? 'text-blue-700 border-blue-600 bg-white' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
  >
    <Icon size={14}/> {label}
  </button>
);
