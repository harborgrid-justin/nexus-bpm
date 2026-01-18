
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
      className={`absolute w-node h-node bg-panel border flex items-center gap-3 px-4 shadow-sm transition-all select-none ${
        isSelected 
          ? 'border-active ring-1 ring-blue-600 z-node-active' 
          : 'border-default hover:border-tertiary z-node'
      }`} 
      style={{ 
        left: step.position?.x, 
        top: step.position?.y,
        borderRadius: 'var(--radius-base)' 
      }}
    >
      <div className={`w-8 h-8 flex items-center justify-center rounded-base bg-subtle border border-default`}>
        <Icon size={16} className={color.replace('text-', 'text-opacity-80 text-')} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-primary truncate leading-tight">
          {step.name}
        </p>
        <p className="text-[10px] text-secondary uppercase tracking-wide truncate mt-0.5">
          {step.type}
        </p>
      </div>
      
      {/* Connector Handle */}
      <div 
        data-handle-id={step.id} 
        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-tertiary border border-white rounded-full cursor-crosshair hover:bg-active hover:scale-125 transition-all z-tooltip"
      />
    </div>
  );
};
