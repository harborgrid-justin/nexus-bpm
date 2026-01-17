
import React from 'react';
import { ProcessStep } from '../../types';
import { getStepTypeMetadata } from './designerUtils';

interface NodeComponentProps {
  step: ProcessStep;
  isSelected: boolean;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({ step, isSelected }) => {
  const { icon: Icon, color } = getStepTypeMetadata(step.type);
  
  return (
    <div 
      data-node-id={step.id} 
      className={`absolute w-[260px] h-[100px] bg-white rounded-2xl border-2 p-5 flex items-center gap-5 transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isSelected 
          ? 'border-blue-600 card-shadow z-20' 
          : 'border-slate-200 hover:border-slate-300 z-10'
      }`} 
      style={{ 
        left: step.position?.x, 
        top: step.position?.y,
      }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 relative ${
        isSelected ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'
      }`}>
        <Icon size={20} strokeWidth={isSelected ? 2.5 : 2} className={isSelected ? 'text-white' : color} />
      </div>
      
      <div className="overflow-hidden flex-1 relative">
        <p className={`text-[15px] font-black truncate tracking-tightest leading-tight mb-1 transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
          {step.name}
        </p>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            {step.type.replace('-', ' ')}
          </span>
          {step.role && (
            <>
              <span className="text-slate-300 text-[10px]">•</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider truncate max-w-[90px]">
                {step.role}
              </span>
            </>
          )}
        </div>
      </div>
      
      <div 
        data-handle-id={step.id} 
        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-900 border-2 border-white rounded-full cursor-crosshair hover:scale-125 hover:rotate-45 transition-all z-30 shadow-md flex items-center justify-center group"
        title="Connect Step"
      >
        <div className="w-1 h-1 bg-white rounded-full"></div>
      </div>
    </div>
  );
};
