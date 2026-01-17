
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface PolicyItemProps {
    text?: string;
    active?: boolean;
    isButton?: boolean;
}

export const PolicyItem: React.FC<PolicyItemProps> = ({ text, active, isButton }) => {
    if (isButton) {
        return (
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2">
                View Security Logs <ExternalLink size={14}/>
            </button>
        )
    }

  return (
    <div className="flex items-center gap-3">
       <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-brand-500' : 'border-slate-700'}`}>
          {active && <div className="w-1.5 h-1.5 bg-brand-500 rounded-full"></div>}
       </div>
       <span className="text-[11px] font-medium text-slate-400">{text}</span>
    </div>
  );
};
