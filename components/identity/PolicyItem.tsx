
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
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-sm font-bold text-xs transition-all flex items-center justify-center gap-2">
                View Logs <ExternalLink size={12}/>
            </button>
        )
    }

  return (
    <div className="flex items-center gap-2">
       <div className={`w-3 h-3 border flex items-center justify-center rounded-sm ${active ? 'border-emerald-400 bg-emerald-500/20' : 'border-slate-600'}`}>
          {active && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-sm"></div>}
       </div>
       <span className="text-[11px] font-medium text-slate-300">{text}</span>
    </div>
  );
};
