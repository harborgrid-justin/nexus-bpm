
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  CheckCircle, AlertTriangle, 
  X, Activity, Send, Clock, PlayCircle, Rewind, FastForward, Pause, Play, History
} from 'lucide-react';
import { NexButton } from './shared/NexUI';

interface Props {
  instanceId: string;
  onClose: () => void;
}

export const ProcessInstanceViewer: React.FC<Props> = ({ instanceId, onClose }) => {
  const { instances, processes, addInstanceComment } = useBPM();
  
  const instance = instances.find(i => i.id === instanceId);
  const process = processes.find(p => p.id === instance?.definitionId);
  
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [rightPanelTab, setRightPanelTab] = useState<'info' | 'variables' | 'comments'>('info');
  const [showAdminPanel, setShowAdminPanel] = useState(true);
  const [variableJson, setVariableJson] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);

  // Time Travel State
  const [playbackIndex, setPlaybackIndex] = useState<number>(-1); // -1 means live/latest
  const [isPlaying, setIsPlaying] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (instance) {
        setVariableJson(JSON.stringify(instance.variables, null, 2));
        // Reset playback when instance loads
        setPlaybackIndex(instance.history.length - 1);
    }
    
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

  // Playback Loop
  useEffect(() => {
      let interval: any;
      if (isPlaying && instance) {
          interval = setInterval(() => {
              setPlaybackIndex(prev => {
                  if (prev >= instance.history.length - 1) {
                      setIsPlaying(false);
                      return prev;
                  }
                  return prev + 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isPlaying, instance]);

  // Derived State for Time Travel
  const currentHistoryItem = instance && playbackIndex >= 0 && playbackIndex < instance.history.length 
      ? instance.history[playbackIndex] 
      : null;

  // Calculate executed path links UP TO the playback index
  const executedLinks = useMemo(() => {
      if (!instance || !process) return [];
      
      const sortedHistory = [...instance.history].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Filter history based on playback
      const visibleHistory = playbackIndex === -1 ? sortedHistory : sortedHistory.slice(0, playbackIndex + 1);

      const takenPaths: Set<string> = new Set();
      const stepIdByName = new Map(process.steps.map(s => [s.name, s.id]));
      
      const startNode = process.steps.find(s => s.type === 'start');
      let previousStepId = startNode?.id;

      visibleHistory.forEach(h => {
          const currentStepId = stepIdByName.get(h.stepName);
          if (previousStepId && currentStepId) {
              const link = process.links?.find(l => l.sourceId === previousStepId && l.targetId === currentStepId);
              if (link) takenPaths.add(link.id);
              previousStepId = currentStepId;
          }
      });

      return Array.from(takenPaths);
  }, [instance, process, playbackIndex]);

  // Determine Active Steps based on Playback
  // If playing back, the "active" step is the one in the current history item
  const displayActiveStepIds = useMemo(() => {
      if (!instance || !process) return [];
      if (playbackIndex === -1 || playbackIndex === instance.history.length - 1) return instance.activeStepIds;
      
      // Find the step ID corresponding to the current history item
      if (currentHistoryItem) {
          const step = process.steps.find(s => s.name === currentHistoryItem.stepName);
          return step ? [step.id] : [];
      }
      return [];
  }, [instance, process, playbackIndex, currentHistoryItem]);


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

  // Health Logic
  const isHealthy = instance.status === 'Active' || instance.status === 'Completed';
  
  const handleAddComment = () => {
      if(!newComment.trim()) return;
      if (addInstanceComment) {
          addInstanceComment(instance.id, newComment);
      }
      setNewComment('');
  };

  const adminPanelWidth = rightPanelTab === 'variables' ? 'w-[500px]' : 'w-[320px]';

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
        <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mr-4 cursor-pointer select-none">
                <input type="checkbox" checked={showMetrics} onChange={e => setShowMetrics(e.target.checked)} className="rounded-sm text-blue-600"/>
                Show Metrics
            </label>
            <button onClick={() => setShowAdminPanel(!showAdminPanel)} className={`p-1.5 rounded-sm ${showAdminPanel ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}><Activity size={18}/></button>
        </div>
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
                  const link = process.links?.find(l => l.sourceId === step.id && l.targetId === t?.id);
                  
                  if (!t || !step.position || !t.position) return null;
                  const x1=step.position.x+200; const y1=step.position.y+40;
                  const x2=t.position.x; const y2=t.position.y+40;
                  
                  const isTraversed = link && executedLinks.includes(link.id);
                  
                  return (
                      <g key={`${step.id}-${targetId}`}>
                          {/* Base Line */}
                          <path d={`M ${x1} ${y1} C ${x1+50} ${y1}, ${x2-50} ${y2}, ${x2} ${y2}`} stroke={isTraversed ? "#10b981" : "#cbd5e1"} strokeWidth={isTraversed ? 4 : 2} fill="none" className="transition-all duration-1000 ease-out"/>
                          {/* Animated Dash for Active Paths */}
                          {isTraversed && (
                              <path d={`M ${x1} ${y1} C ${x1+50} ${y1}, ${x2-50} ${y2}, ${x2} ${y2}`} stroke="#ffffff" strokeWidth="2" strokeDasharray="10,10" fill="none" className="animate-[dash_1s_linear_infinite] opacity-30"/>
                          )}
                      </g>
                  );
                }))}
             </svg>

             {process.steps.map(step => {
               const isActive = displayActiveStepIds.includes(step.id);
               // Visited if in history UP TO playback index
               const isVisited = instance.history.slice(0, playbackIndex + 1).some(h => h.stepName === step.name);
               
               // Mock Metrics
               const avgDuration = step.metrics?.avgDuration || (Math.floor(Math.random() * 120) + 10);
               const errorRate = step.metrics?.errorRate || Math.floor(Math.random() * 5);

               return (
               <div key={step.id} className={`absolute w-[200px] h-[80px] rounded-sm border flex flex-col p-3 transition-all ${isActive ? 'bg-white border-emerald-500 ring-4 ring-emerald-500/20 z-10 shadow-lg scale-105' : (isVisited ? 'bg-white border-emerald-200' : 'bg-white border-slate-300 opacity-60')}`} style={{ left: step.position?.x, top: step.position?.y }}>
                  <div className="text-[9px] font-bold uppercase text-slate-400 mb-1 flex justify-between">
                      {step.type}
                      {isActive && <span className="text-emerald-600 animate-pulse flex items-center gap-1"><PlayCircle size={10}/> LIVE</span>}
                  </div>
                  <div className="text-xs font-bold truncate text-slate-800">{step.name}</div>
                  
                  {showMetrics && (
                      <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between text-[9px] font-mono text-slate-500">
                          <span className="flex items-center gap-1" title="Avg Duration"><Clock size={10}/> {avgDuration}m</span>
                          <span className={`flex items-center gap-1 ${errorRate > 2 ? 'text-rose-600' : 'text-slate-500'}`} title="Error Rate"><AlertTriangle size={10}/> {errorRate}%</span>
                      </div>
                  )}
               </div>
             )})}
          </div>
        </div>

        {/* Time Travel Controls (Bottom Overlay) */}
        <div className="absolute bottom-6 left-6 right-6 lg:right-96 bg-white/90 backdrop-blur border border-slate-200 rounded-sm p-4 shadow-xl z-40 flex flex-col gap-2 animate-slide-up">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                <span className="flex items-center gap-2"><History size={14}/> Time Travel Debugger</span>
                <span>{currentHistoryItem ? new Date(currentHistoryItem.timestamp).toLocaleString() : 'Live'}</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-full text-white transition-all ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
                </button>
                <div className="flex-1 relative h-8 flex items-center">
                    <div className="absolute left-0 right-0 h-1.5 bg-slate-200 rounded-full"></div>
                    <div className="absolute left-0 h-1.5 bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${((playbackIndex + 1) / instance.history.length) * 100}%` }}></div>
                    <input 
                        type="range" 
                        min={-1} 
                        max={instance.history.length - 1} 
                        value={playbackIndex} 
                        onChange={(e) => { setPlaybackIndex(parseInt(e.target.value)); setIsPlaying(false); }}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    {instance.history.map((h, i) => (
                        <div key={i} className="absolute w-2 h-2 rounded-full bg-white border-2 border-slate-300 top-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${((i + 1) / instance.history.length) * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }} title={h.stepName}></div>
                    ))}
                </div>
                <button onClick={() => setPlaybackIndex(-1)} className="p-2 text-slate-500 hover:text-blue-600" title="Jump to Live"><FastForward size={16}/></button>
            </div>
            <div className="text-center text-[10px] text-slate-400 font-mono">
                {currentHistoryItem ? `Step ${playbackIndex + 1}/${instance.history.length}: ${currentHistoryItem.action} @ ${currentHistoryItem.stepName}` : 'Viewing Latest State'}
            </div>
        </div>

        {showAdminPanel && (
          <aside className={`${adminPanelWidth} bg-white border-l border-slate-300 flex flex-col shadow-xl z-20 transition-all duration-300 ease-in-out`}>
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
                     <div className={`p-3 border rounded-sm ${isHealthy ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                        <h4 className={`text-[10px] font-bold uppercase mb-1 ${isHealthy ? 'text-emerald-700' : 'text-rose-700'}`}>Health Check</h4>
                        <div className="flex justify-between items-center">
                           <span className={`text-xl font-black ${isHealthy ? 'text-emerald-900' : 'text-rose-900'}`}>{isHealthy ? 'Optimal' : 'Attention'}</span>
                           {isHealthy ? <CheckCircle size={20} className="text-emerald-500"/> : <AlertTriangle size={20} className="text-rose-500"/>}
                        </div>
                     </div>
                     
                     <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1">Audit Trail</h4>
                        {instance.history.map((h, i) => (
                          <div 
                            key={i} 
                            onClick={() => { setPlaybackIndex(i); setIsPlaying(false); }}
                            className={`flex gap-3 items-start p-2 rounded-sm transition-colors border cursor-pointer ${playbackIndex === i ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}`}
                          >
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

                {rightPanelTab === 'comments' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-4 mb-4">
                            {(!instance.comments || instance.comments.length === 0) && (
                                <div className="text-center py-8 text-slate-400 italic text-xs">No comments recorded.</div>
                            )}
                            {(instance.comments || []).map((c, i) => (
                                <div key={i} className="bg-slate-50 p-2 rounded-sm border border-slate-200">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-slate-700">{c.userName}</span>
                                        <span className="text-[9px] text-slate-400">{new Date(c.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-600">{c.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex gap-2">
                            <input 
                                className="prop-input" 
                                placeholder="Add note..." 
                                value={newComment} 
                                onChange={e => setNewComment(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                            />
                            <NexButton size="sm" icon={Send} onClick={handleAddComment}>Post</NexButton>
                        </div>
                    </div>
                )}
             </div>
          </aside>
        )}
      </div>
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
};
