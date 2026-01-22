
import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  content?: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pills' | 'enclosed';
}

export const Tabs: React.FC<TabsProps> = ({ items, activeTab, onChange, className = '', variant = 'underline' }) => {
  const styles = {
    underline: {
      nav: 'border-b border-default',
      btn: (active: boolean) => `px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-secondary hover:text-primary'}`
    },
    pills: {
      nav: 'flex gap-1 bg-subtle p-1 rounded-sm border border-default',
      btn: (active: boolean) => `flex-1 px-3 py-1.5 text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-2 ${active ? 'bg-panel text-blue-600 shadow-sm' : 'text-secondary hover:text-primary'}`
    },
    enclosed: {
      nav: 'flex gap-1 border-b border-default',
      btn: (active: boolean) => `px-4 py-2 text-xs font-bold flex items-center gap-2 border-t border-x rounded-t-sm -mb-px transition-colors ${active ? 'bg-panel border-default text-primary' : 'bg-subtle border-transparent text-secondary hover:text-primary'}`
    }
  };

  const style = styles[variant];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className={`flex overflow-x-auto no-scrollbar shrink-0 ${style.nav}`}>
        {items.map(item => (
          <button 
            key={item.id} 
            onClick={() => onChange(item.id)} 
            className={style.btn(activeTab === item.id)}
          >
            {item.icon && <item.icon size={14} />}
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {items.find(i => i.id === activeTab)?.content}
      </div>
    </div>
  );
};
