
import React from 'react';
import { Swimlane } from '../../types';

interface SwimlaneRendererProps {
  lanes: Swimlane[];
  width: number;
}

export const SwimlaneRenderer: React.FC<SwimlaneRendererProps> = ({ lanes, width }) => {
  let currentY = 0;

  const colorMap = {
    blue: 'bg-blue-50/30 border-blue-100 text-blue-700',
    slate: 'bg-slate-50/30 border-slate-200 text-slate-600',
    emerald: 'bg-emerald-50/30 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50/30 border-amber-100 text-amber-700',
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-0" style={{ width: width, height: '2000px' }}>
      {lanes.map((lane) => {
        const style = {
          top: currentY,
          height: lane.height,
          width: '100%',
        };
        currentY += lane.height;

        return (
          <div 
            key={lane.id} 
            className={`absolute border-b border-r flex flex-row ${colorMap[lane.color]}`} 
            style={style}
          >
            {/* Lane Header */}
            <div className="w-8 h-full border-r border-inherit flex items-center justify-center writing-mode-vertical rotate-180 bg-white/50 backdrop-blur-sm">
                <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {lane.name}
                </span>
            </div>
            {/* Lane Body */}
            <div className="flex-1 relative">
                {lane.roleId && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/80 rounded-sm text-[9px] font-mono border border-inherit">
                        Role: {lane.roleId}
                    </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
