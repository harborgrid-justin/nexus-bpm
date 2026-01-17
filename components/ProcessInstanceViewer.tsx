
import React, { useState, useRef, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { ProcessDefinition, ProcessInstance, ProcessStep } from '../types';
import { 
  Play, Pause, FastForward, CheckCircle, AlertTriangle, 
  MessageSquare, Save, Settings, X, Activity, ZoomIn, ZoomOut, User,
  FileJson, Calendar, Paperclip, Share2, MoreVertical, ChevronDown
} from 'lucide-react';

interface Props {
  instanceId: string;
  onClose: () => void;
}

export const ProcessInstanceViewer: React.FC<Props> = ({ instanceId, onClose }) => {
  const { instances, processes, adminOverrideStep, updateInstanceVariables, toggleInstanceSuspension, addInstanceComment } = useBPM();
  
  const instance = instances.find(i => i.id === instanceId);
  const process = processes.find(p => p.id === instance?.definitionId);
  
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [rightPanelTab, setRightPanelTab] = useState<'info' | 'variables' | 'comments'>('info');
  const [showAdminPanel, setShowAdminPanel] = useState(true);
  const [variableJson, setVariableJson] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (instance) setVariableJson(JSON.stringify(instance.variables, null, 2));
    
    if (process && instance && instance.activeStepIds.length > 0 && canvasRef.current) {
      const activeStep = process.steps.find(s => s.id === instance.activeStepIds[0]);
      if (activeStep?.position) {
        setViewport({
          x: (canvasRef.current.clientWidth / 2) - activeStep.position.x - 90,
          y: (canvasRef.current.clientHeight / 2) - activeStep.position.y - 40,
          zoom: 1
        });
      }
    }
  }, [instanceId, process]);

  if (!instance || !process) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setViewport(prev => ({ ...prev, x: prev.x + (e.clientX - dragStart.current.x), y: prev.y + (e.clientY - dragStart.current.y) }));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => { isDragging.current = false; };

  return (
    <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col animate-fade-in overflow-hidden">
      <div className="h-12 bg-white border-b border-slate-300 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-3">
           <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-500"><X size={18}/></button>
           <div className="h-5 w-px bg-slate-200"></div>
           <div className="flex items-center gap-3">
             <h2 className="font-bold text-slate-800 text-sm tracking-tight">{process.name}</h2>
             <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${instance.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{instance.status}</span>
             <span className="text-[10px] text-slate-400 font-mono">{instance.id}</span>
           </div>
        </div>
        <button onClick={() => setShowAdminPanel(!showAdminPanel)} className={`p-1.5 rounded-sm ${showAdminPanel ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}><Activity size={18}/></button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div 
          ref={canvasRef}
          className="flex-1 relative bg-[#f0f2f5] touch-none designer-grid"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0' }}>
             <svg className="overflow-visible absolute top-0 left-0 pointer-events-none">
                {process.steps.flatMap(step => (step.nextStepIds || []).map(targetId => {
                  const t = process.steps.find(s => s.id === targetId);
                  if (!t || !step.position || !t.position) return null;
                  const x1=step.position.x+200; const y1=step.position.y+40;
                  const x2=t.position.x; const y2=t.position.y+40;
                  const isActive = instance.activeStepIds.includes(step.id);
                  return <path key={`${step.id}-${targetId}`} d={`M ${x1} ${y1} C ${x1+50} ${y1}, ${x2-50} ${y2}, ${x2} ${y2}`} stroke={isActive ? "#059669" : "#94a3b8"} strokeWidth={isActive ? 3 : 2} fill="none" className={isActive ? "animate-pulse" : ""}/>
                }))}
             </svg>

             {process.steps.map(step => (
               <div key={step.id} className={`absolute w-[200px] h-[80px] rounded-sm border flex flex-col p-3 transition-all ${instance.activeStepIds.includes(step.id) ? 'bg-white border-emerald-500 ring-2 ring-emerald-500 z-10' : 'bg-white border-slate-300 opacity-80'}`} style={{ left: step.position?.x, top: step.position?.y }}>
                  <div className="text-[9px] font-bold uppercase text-slate-400 mb-1">{step.type}</div>
                  <div className="text-xs font-bold truncate text-slate-800">{step.name}</div>
                  {instance.activeStepIds.includes(step.id) && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full border border-white animate-bounce shadow-sm flex items-center justify-center"><Activity size={8} className="text-white"/></div>}
               </div>
             ))}
          </div>
        </div>

        {showAdminPanel && (
          <aside className="w-80 bg-white border-l border-slate-300 flex flex-col shadow-xl z-20">
             <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Monitor</h3>
             </div>
             
             <div className="flex border-b border-slate-200">
                {['info', 'variables', 'comments'].map(tab => (
                  <button key={tab} onClick={() => setRightPanelTab(tab as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${rightPanelTab === tab ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-white'}`}>{tab}</button>
                ))}
             </div>

             <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {rightPanelTab === 'info' && (
                  <div className="space-y-4">
                     <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm">
                        <h4 className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Health Check</h4>
                        <div className="flex justify-between items-center">
                           <span className="text-xl font-black text-emerald-900">Optimal</span>
                           <CheckCircle size={20} className="text-emerald-500"/>
                        </div>
                     </div>
                     
                     <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1">Audit Trail</h4>
                        {instance.history.map((h, i) => (
                          <div key={i} className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-sm transition-colors border border-transparent hover:border-slate-100">
                             <div className="w-6 h-6 rounded-sm bg-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0 text-slate-600">{h.performer[0]}</div>
                             <div>
                                <div className="text-xs font-bold text-slate-800">{h.stepName}</div>
                                <div className="text-[10px] text-slate-500">{h.action}</div>
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(h.timestamp).toLocaleTimeString()}</div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                {rightPanelTab === 'variables' && (
                  <textarea 
                     className="w-full h-full min-h-[400px] bg-slate-50 text-slate-700 p-3 rounded-sm font-mono text-xs border border-slate-200 outline-none focus:border-blue-400 resize-none"
                     value={variableJson}
                     onChange={e => setVariableJson(e.target.value)}
                  />
                )}
             </div>
          </aside>
        )}
      </div>
    </div>
  );
};
