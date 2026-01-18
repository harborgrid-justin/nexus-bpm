
import React from 'react';
import { ProcessStep } from '../../types';
import { getStepTypeMetadata } from './designerUtils';
import { FunctionSquare, RefreshCw, Code, AlertCircle, Layers } from 'lucide-react';

interface NodeComponentProps {
  step: ProcessStep;
  isSelected: boolean;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({ step, isSelected }) => {
  const { icon: Icon, color } = getStepTypeMetadata(step.type);
  
  // Logic Detection
  const hasRule = !!step.businessRuleId;
  const hasScript = !!step.onEntryAction || !!step.onExitAction;
  const hasRetry = step.retryPolicy?.enabled;
  const isLoop = step.isMultiInstance;
  const missingConfig = step.type === 'service-task' && !step.data?.url; // Simple validation example

  return (
    <div 
      data-node-id={step.id} 
      className={`absolute w-[200px] h-[80px] bg-panel border flex flex-col shadow-sm transition-all select-none group ${
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
      {/* Main Body */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-1 flex-1 overflow-hidden">
        <div className={`w-8 h-8 flex items-center justify-center rounded-base bg-subtle border border-default relative shrink-0`}>
          <Icon size={16} className={color.replace('text-', 'text-opacity-80 text-')} />
          {missingConfig && (
             <div className="absolute -top-1 -right-1 bg-white rounded-full">
                <AlertCircle size={12} className="text-rose-500 fill-white"/>
             </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-primary truncate leading-tight">
            {step.name}
          </p>
          <p className="text-[10px] text-secondary uppercase tracking-wide truncate mt-0.5">
            {step.type.replace(/-/g, ' ')}
          </p>
        </div>
      </div>

      {/* Logic Badges Bar */}
      {(hasRule || hasScript || hasRetry || isLoop) && (
          <div className="px-3 pb-2 flex gap-1.5 items-center">
              {hasRule && (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-indigo-50 border border-indigo-100 rounded-[2px] text-[8px] font-bold text-indigo-700" title="Business Rule Attached">
                      <FunctionSquare size={8} /> RULE
                  </div>
              )}
              {hasScript && (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-50 border border-amber-100 rounded-[2px] text-[8px] font-bold text-amber-700" title="Entry/Exit Script Active">
                      <Code size={8} /> FN
                  </div>
              )}
              {hasRetry && (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-blue-50 border border-blue-100 rounded-[2px] text-[8px] font-bold text-blue-700" title={`Retry Policy: ${step.retryPolicy?.maxAttempts}x`}>
                      <RefreshCw size={8} /> {step.retryPolicy?.maxAttempts}x
                  </div>
              )}
              {isLoop && (
                  <div className="ml-auto text-secondary" title="Multi-Instance Loop">
                      <Layers size={10} />
                  </div>
              )}
          </div>
      )}
      
      {/* Connector Handle */}
      <div 
        data-handle-id={step.id} 
        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-tertiary border border-white rounded-full cursor-crosshair hover:bg-active hover:scale-125 transition-all z-tooltip opacity-0 group-hover:opacity-100"
      />
    </div>
  );
};
