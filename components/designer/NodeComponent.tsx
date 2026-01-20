
import React, { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ProcessStep } from '../../types';
import { getStepTypeMetadata } from './designerUtils';
import { FunctionSquare, RefreshCw, Code, Layers, ShieldAlert, StickyNote, Box } from 'lucide-react';
import { validateStepConfiguration } from './stepSchemas';

interface CustomNodeData {
  step: ProcessStep;
  isValid?: boolean;
  isSimulating?: boolean;
}

export const NodeComponent = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const { step, isSimulating } = data;
  const { icon: DefaultIcon, color } = getStepTypeMetadata(step.type);
  
  const isNote = step.type === 'note' as any;
  const isSubProcess = step.type === 'sub-process';
  
  const hasRule = !!step.businessRuleId;
  const hasScript = !!step.onEntryAction || !!step.onExitAction;
  const hasRetry = step.retryPolicy?.enabled;
  const isLoop = step.isMultiInstance;
  
  const isValid = useMemo(() => isNote ? true : validateStepConfiguration(step.type, step.data), [step.type, step.data, isNote]);

  // Handle Custom Icons
  const IconComponent = useMemo(() => {
      if (step.data?.iconUrl) {
          return () => <img src={step.data!.iconUrl} alt="Custom" className="w-4 h-4 object-contain" />;
      }
      return DefaultIcon;
  }, [step.data?.iconUrl, DefaultIcon]);

  if (isNote) {
      return (
        <div 
            className={`w-[200px] min-h-[100px] bg-yellow-100 border border-yellow-200 shadow-sm p-4 relative group transition-all ${selected ? 'ring-2 ring-blue-500/30' : ''}`}
            style={{ borderRadius: '2px', boxShadow: '2px 2px 5px rgba(0,0,0,0.05)' }}
        >
            <div className="absolute top-0 right-0 w-4 h-4 bg-yellow-200" style={{ clipPath: 'polygon(0 0, 0% 100%, 100% 100%)' }}></div>
            <div className="absolute top-0 right-0 w-4 h-4 bg-white/50" style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.1)' }}></div>
            <div className="text-yellow-800 text-xs font-handwriting leading-relaxed whitespace-pre-wrap outline-none h-full w-full">
                {step.description || "Add annotation..."}
            </div>
        </div>
      );
  }

  // Special rendering for Sub-Processes (Expandable Container Look)
  if (isSubProcess) {
      return (
        <div 
            className={`min-w-[240px] min-h-[120px] border-2 border-dashed flex flex-col shadow-sm transition-all select-none group relative bg-slate-50/50 ${
                selected ? 'border-blue-500 bg-blue-50/10' : 'border-slate-300'
            }`}
            style={{ borderRadius: '8px' }}
        >
            <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-3 !h-3 !-left-1.5 hover:!bg-blue-600 transition-colors z-50" />
            
            <div className="px-3 py-2 border-b border-dashed border-slate-300 flex items-center gap-2 bg-white/80 rounded-t-md">
                <Box size={14} className="text-slate-500"/>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{step.name}</span>
                <span className="ml-auto text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded">SUB</span>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-[10px] text-slate-400 italic text-center">
                    {step.description || "Drop nested steps here (Visual placeholder)"}
                </p>
            </div>

            <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-3 !h-3 !-right-1.5 hover:!bg-blue-600 transition-colors z-50" />
        </div>
      )
  }

  return (
    <div 
      className={`w-[200px] h-[80px] border flex flex-col shadow-sm transition-all select-none group relative bg-white ${
        selected 
          ? 'border-active ring-2 ring-blue-500/20 shadow-md' 
          : (isValid ? 'border-default hover:border-tertiary' : 'border-rose-300 ring-1 ring-rose-200')
      } ${isSimulating ? 'ring-4 ring-emerald-400 border-emerald-500 scale-105 shadow-xl' : ''}`} 
      style={{ borderRadius: 'var(--radius-base)' }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-slate-400 !w-2.5 !h-2.5 !-left-1.5 hover:!bg-blue-600 transition-colors z-50" 
        style={{ borderColor: '#fff', borderWidth: '2px' }}
      />
      
      <div className="flex items-center gap-3 px-3 pt-3 pb-1 flex-1 overflow-hidden pointer-events-none">
        <div className={`w-8 h-8 flex items-center justify-center rounded-base bg-subtle border border-default relative shrink-0`}>
          <IconComponent size={16} className={step.data?.iconUrl ? '' : color.replace('text-', 'text-opacity-80 text-')} />
          {!isValid && (
             <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm border border-rose-100 z-10" title="Invalid Configuration">
                <ShieldAlert size={14} className="text-rose-500 fill-rose-50"/>
             </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-primary truncate leading-tight">
            {step.name}
          </p>
          <p className="text-[10px] text-secondary uppercase tracking-wide truncate mt-0.5 opacity-80">
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
        className="!bg-slate-400 !w-2.5 !h-2.5 !-right-1.5 hover:!bg-blue-600 transition-colors z-50"
        style={{ borderColor: '#fff', borderWidth: '2px' }}
      />
    </div>
  );
});
