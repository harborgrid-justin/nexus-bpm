import React, { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ProcessStep } from '../../types';
import { getStepTypeMetadata } from './designerUtils';
import { FunctionSquare, RefreshCw, Code, Layers, ShieldAlert } from 'lucide-react';
import { validateStepConfiguration } from './stepSchemas';

interface CustomNodeData {
  step: ProcessStep;
}

export const NodeComponent = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const { step } = data;
  const { icon: Icon, color } = getStepTypeMetadata(step.type);
  
  const hasRule = !!step.businessRuleId;
  const hasScript = !!step.onEntryAction || !!step.onExitAction;
  const hasRetry = step.retryPolicy?.enabled;
  const isLoop = step.isMultiInstance;
  
  const isValid = useMemo(() => validateStepConfiguration(step.type, step.data), [step.type, step.data]);

  return (
    <div 
      className={`w-[200px] h-[80px] border flex flex-col shadow-sm transition-shadow select-none group ${
        selected 
          ? 'border-active ring-2 ring-blue-500/20 shadow-md' 
          : (isValid ? 'border-default hover:border-tertiary' : 'border-rose-300 ring-1 ring-rose-200')
      }`} 
      style={{ 
        borderRadius: 'var(--radius-base)',
        backgroundColor: 'var(--component-bg)',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-slate-400 !w-2.5 !h-2.5 !-left-1.5 hover:!bg-blue-600 transition-colors" 
        style={{ borderColor: 'var(--component-bg)', borderWidth: '2px' }}
      />
      
      <div className="flex items-center gap-3 px-3 pt-3 pb-1 flex-1 overflow-hidden pointer-events-none">
        <div className={`w-8 h-8 flex items-center justify-center rounded-base bg-subtle border border-default relative shrink-0`}>
          <Icon size={16} className={color.replace('text-', 'text-opacity-80 text-')} />
          {!isValid && (
             <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm" title="Invalid Configuration">
                <ShieldAlert size={14} className="text-rose-500 fill-rose-50"/>
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

      {(hasRule || hasScript || hasRetry || isLoop) && (
          <div className="px-3 pb-2 flex gap-1.5 items-center pointer-events-none">
              {hasRule && (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-indigo-50 border border-indigo-100 rounded-[2px] text-[8px] font-bold text-indigo-700">
                      <FunctionSquare size={8} /> RULE
                  </div>
              )}
              {hasScript && (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-50 border border-amber-100 rounded-[2px] text-[8px] font-bold text-amber-700">
                      <Code size={8} /> FN
                  </div>
              )}
              {hasRetry && (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-blue-50 border border-blue-100 rounded-[2px] text-[8px] font-bold text-blue-700">
                      <RefreshCw size={8} /> {step.retryPolicy?.maxAttempts}x
                  </div>
              )}
              {isLoop && (
                  <div className="ml-auto text-secondary">
                      <Layers size={10} />
                  </div>
              )}
          </div>
      )}

      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-slate-400 !w-2.5 !h-2.5 !-right-1.5 hover:!bg-blue-600 transition-colors"
        style={{ borderColor: 'var(--component-bg)', borderWidth: '2px' }}
      />
    </div>
  );
});