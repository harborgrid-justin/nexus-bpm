
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
      className={`absolute w-[200px] h-[80px] bg-white border flex items-center gap-3 px-4 shadow-sm transition-all select-none ${
        isSelected 
          ? 'border-blue-600 ring-1 ring-blue-600 z-20' 
          : 'border-slate-300 hover:border-slate-400 z-10'
      }`} 
      style={{ 
        left: step.position?.x, 
        top: step.position?.y,
        borderRadius: '2px' // Enterprise sharp corners
      }}
    >
      <div className={`w-8 h-8 flex items-center justify-center rounded-sm bg-slate-100 border border-slate-200`}>
        <Icon size={16} className={color.replace('text-', 'text-opacity-80 text-')} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-slate-800 truncate leading-tight">
          {step.name}
        </p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wide truncate mt-0.5">
          {step.type}
        </p>
      </div>
      
      {/* Connector Handle */}
      <div 
        data-handle-id={step.id} 
        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-400 border border-white rounded-full cursor-crosshair hover:bg-blue-600 hover:scale-125 transition-all z-30"
      />
    </div>
  );
};
