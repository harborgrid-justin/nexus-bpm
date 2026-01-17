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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'info' | 'variables' | 'comments'>('info');
  const [showAdminPanel, setShowAdminPanel] = useState(window.innerWidth > 1024);
  const [newComment, setNewComment] = useState('');
  const [variableJson, setVariableJson] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (instance) setVariableJson(JSON.stringify(instance.variables, null, 2));
    
    // Auto-center logic
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
      {/* 1. Glass Header */}
      <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
           <div>
             <div className="flex items-center gap-2">
               <h2 className="font-black text-slate-800 text-sm tracking-tight">{process.name}</h2>
               <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${instance.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{instance.status}</span>
             </div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{instance.id}</p>
           </div>
        </div>
        <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="p-2 bg-slate-900 text-white rounded-lg shadow-lg"><Activity size={18}/></button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div 
          ref={canvasRef}
          className="flex-1 relative bg-slate-50 touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0' }}>
             {/* Simplified Instance Paths */}
             <svg className="overflow-visible absolute top-0 left-0 pointer-events-none">
                {process.steps.flatMap(step => (step.nextStepIds || []).map(targetId => {
                  const t = process.steps.find(s => s.id === targetId);
                  if (!t || !step.position || !t.position) return null;
                  const x1=step.position.x+180; const y1=step.position.y+40;
                  const x2=t.position.x; const y2=t.position.y+40;
                  const isActive = instance.activeStepIds.includes(step.id);
                  return <path key={`${step.id}-${targetId}`} d={`M ${x1} ${y1} C ${x1+50} ${y1}, ${x2-50} ${y2}, ${x2} ${y2}`} stroke={isActive ? "#22c55e" : "#cbd5e1"} strokeWidth={isActive ? 4 : 2} fill="none" className={isActive ? "animate-pulse" : ""}/>
                }))}
             </svg>

             {process.steps.map(step => (
               <div key={step.id} className={`absolute w-[180px] h-[80px] rounded-xl border-2 flex flex-col p-3 transition-all ${instance.activeStepIds.includes(step.id) ? 'bg-white border-green-500 shadow-2xl ring-4 ring-green-100' : 'bg-slate-50 border-slate-200 opacity-60'}`} style={{ left: step.position?.x, top: step.position?.y }}>
                  <div className="text-[8px] font-black uppercase text-slate-400 mb-1">{step.type}</div>
                  <div className="text-xs font-bold truncate">{step.name}</div>
                  {instance.activeStepIds.includes(step.id) && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-bounce shadow-lg flex items-center justify-center"><Activity size={12} className="text-white"/></div>}
               </div>
             ))}
          </div>
        </div>

        {/* 2. Admin Logic Panel (Mobile Responsive Bottom Sheet) */}
        <aside className={`fixed inset-x-0 bottom-0 bg-white shadow-2xl z-[60] border-t border-slate-200 transition-transform duration-500 md:relative md:inset-y-0 md:border-t-0 md:border-l md:w-96 md:translate-y-0 ${showAdminPanel ? 'translate-y-0' : 'translate-y-full'}`}>
           <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Execution Context</h3>
              <button onClick={() => setShowAdminPanel(false)} className="md:hidden p-2"><ChevronDown size={20}/></button>
           </div>
           
           <div className="flex border-b">
              {['info', 'variables', 'comments'].map(tab => (
                <button key={tab} onClick={() => setRightPanelTab(tab as any)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter transition-all ${rightPanelTab === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-400'}`}>{tab}</button>
              ))}
           </div>

           <div className="p-6 overflow-y-auto max-h-[60vh] md:max-h-full space-y-6">
              {rightPanelTab === 'info' && (
                <div className="space-y-6">
                   <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl">
                      <h4 className="text-[10px] font-black text-brand-700 uppercase mb-2">Process Velocity</h4>
                      <div className="flex justify-between items-center">
                         <span className="text-2xl font-black text-brand-900 tracking-tighter">98.2%</span>
                         <CheckCircle size={24} className="text-brand-500"/>
                      </div>
                      <p className="text-[10px] text-brand-600 font-bold mt-1">SLA Healthy - Ahead of Schedule</p>
                   </div>
                   
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Trail</h4>
                      {instance.history.map((h, i) => (
                        <div key={i} className="flex gap-4 items-start">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0">{h.performer[0]}</div>
                           <div>
                              <div className="text-xs font-bold text-slate-800">{h.stepName}</div>
                              <div className="text-[10px] text-slate-500">{h.action} • {new Date(h.timestamp).toLocaleTimeString()}</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {rightPanelTab === 'variables' && (
                <textarea 
                   className="w-full h-96 bg-slate-900 text-green-400 p-4 rounded-2xl font-mono text-[11px] border border-slate-700 shadow-inner"
                   value={variableJson}
                   onChange={e => setVariableJson(e.target.value)}
                />
              )}
           </div>
        </aside>
      </div>
    </div>
  );
};
