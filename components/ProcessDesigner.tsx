
import React, { useState, useRef, useMemo } from 'react';
import { ProcessStep, ProcessLink, ProcessStepType } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Save, ZoomIn, ZoomOut, Sparkles, Cpu, Wand2, 
  PenTool, Loader2, PlayCircle, ShieldAlert, CheckCircle2,
  X, AlertTriangle, ArrowRight, Activity, Terminal, Eye, EyeOff, LayoutPanelLeft, Layers
} from 'lucide-react';
import { PaletteSidebar } from './designer/PaletteSidebar';
import { NodeComponent } from './designer/NodeComponent';
import { PropertiesPanel } from './designer/PropertiesPanel';
import { getStepTypeMetadata } from './designer/designerUtils';
import { generateProcessWorkflow, runWorkflowSimulation, SimulationResult } from '../services/geminiService';

const GRID_SIZE = 24;

export const ProcessDesigner: React.FC = () => {
  const { deployProcess, roles, addNotification } = useBPM();
  const [processName, setProcessName] = useState('Strategic Workflow');
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [links, setLinks] = useState<ProcessLink[]>([]);
  const [viewport, setViewport] = useState({ x: 50, y: 100, zoom: 0.85 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(window.innerWidth > 768);
  
  // Murder Board State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResults, setSimResults] = useState<SimulationResult[] | null>(null);
  const [showSimPanel, setShowSimPanel] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragTarget = useRef<'viewport' | 'node' | 'link'>('viewport');
  const activeId = useRef<string | null>(null);
  const ghostLink = useRef<{x1: number, y1: number, x2: number, y2: number} | null>(null);

  const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;
  
  const screenToWorld = (sx: number, sy: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { 
      x: (sx - rect.left - viewport.x) / viewport.zoom, 
      y: (sy - rect.top - viewport.y) / viewport.zoom 
    };
  };

  const handleRunSimulation = async () => {
    if (steps.length === 0) return;
    setIsSimulating(true);
    setShowSimPanel(true);
    setSimResults(null);
    addNotification('info', 'Murder Board assembled. Agents analyzing...');

    try {
      const results = await runWorkflowSimulation(steps);
      setSimResults(results);
    } catch (e) {
      addNotification('error', 'Simulation failure.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    addNotification('info', 'Synthesizing operational domain...');
    
    try {
      const generatedSteps = await generateProcessWorkflow(aiPrompt);
      if (generatedSteps && generatedSteps.length > 0) {
        setSteps(generatedSteps);
        const newLinks: ProcessLink[] = [];
        for(let i=0; i < generatedSteps.length - 1; i++) {
          newLinks.push({
            id: `link-auto-${i}`,
            sourceId: generatedSteps[i].id,
            targetId: generatedSteps[i+1].id
          });
        }
        setLinks(newLinks);
        addNotification('success', 'Model synthesized.');
        setAiPrompt('');
      }
    } catch (err) {
      addNotification('error', 'Cognitive node sync failure.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addNode = (type: ProcessStepType) => {
    const world = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const metadata = getStepTypeMetadata(type);
    const newNode: ProcessStep = {
      id: `node-${Date.now()}`,
      name: metadata.defaultName,
      type,
      description: '',
      position: { x: snapToGrid(world.x - 130), y: snapToGrid(world.y - 50) },
      requiredSkills: metadata.defaultSkills || [],
      data: {}
    };
    setSteps(prev => [...prev, newNode]);
    setSelectedId(newNode.id);
    if (window.innerWidth < 768) setPaletteOpen(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-node-id]');
    const handleEl = target.closest('[data-handle-id]');
    
    dragStart.current = { x: e.clientX, y: e.clientY };
    isDragging.current = true;
    
    if (handleEl) {
      dragTarget.current = 'link';
      activeId.current = handleEl.getAttribute('data-handle-id');
      e.stopPropagation();
    } else if (nodeEl) {
      dragTarget.current = 'node';
      activeId.current = nodeEl.getAttribute('data-node-id');
      setSelectedId(activeId.current);
      e.stopPropagation();
    } else {
      dragTarget.current = 'viewport';
      setSelectedId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    if (dragTarget.current === 'viewport') {
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    } else if (dragTarget.current === 'node' && activeId.current) {
      setSteps(prev => prev.map(s => s.id === activeId.current ? { 
        ...s, 
        position: { 
          x: (s.position?.x || 0) + dx / viewport.zoom, 
          y: (s.position?.y || 0) + dy / viewport.zoom 
        } 
      } : s));
    } else if (dragTarget.current === 'link' && activeId.current) {
      const sNode = steps.find(s => s.id === activeId.current);
      if (sNode && sNode.position) {
        const world = screenToWorld(e.clientX, e.clientY);
        ghostLink.current = { 
          x1: sNode.position.x + 260, 
          y1: sNode.position.y + 50, 
          x2: world.x, 
          y2: world.y 
        };
        setViewport(v => ({...v}));
      }
    }
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragTarget.current === 'link' && activeId.current) {
      const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-node-id]');
      const tId = targetEl?.getAttribute('data-node-id');
      if (tId && tId !== activeId.current) {
        setLinks(prev => [...prev, { id: `link-${Date.now()}`, sourceId: activeId.current!, targetId: tId }]);
      }
    } else if (dragTarget.current === 'node' && activeId.current) {
       setSteps(prev => prev.map(s => s.id === activeId.current ? { 
         ...s, 
         position: { 
           x: snapToGrid(s.position?.x || 0), 
           y: snapToGrid(s.position?.y || 0) 
         } 
       } : s));
    }
    isDragging.current = false;
    ghostLink.current = null;
    activeId.current = null;
    setViewport(v => ({...v}));
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = 1.05;
    const newZoom = e.deltaY > 0 ? viewport.zoom / zoomFactor : viewport.zoom * zoomFactor;
    setViewport(v => ({...v, zoom: Math.max(0.1, Math.min(3, newZoom))}));
  };

  const selectedStep = useMemo(() => steps.find(s => s.id === selectedId), [selectedId, steps]);
  const updateStep = (updatedStep: ProcessStep) => setSteps(prev => prev.map(s => s.id === updatedStep.id ? updatedStep : s));
  const deleteStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    setLinks(prev => prev.filter(l => l.sourceId !== id && l.targetId !== id));
    setSelectedId(null);
  };
  const handleDeploy = () => { 
    deployProcess({ 
      name: processName, 
      steps, 
      links, 
      isActive: true, 
      version: 1 
    }); 
  };

  return (
    <div className="h-full flex bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative selection:bg-blue-100">
      
      {/* Mobile Palette Toggle */}
      <button 
        onClick={() => setPaletteOpen(!paletteOpen)}
        className={`md:hidden absolute top-6 left-6 z-[60] w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all ${paletteOpen ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}
      >
        <LayoutPanelLeft size={20} />
      </button>

      {/* Main Designer Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 w-[calc(100%-8rem)] md:w-auto">
        <div className="h-14 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl flex items-center px-4 md:px-5 gap-3 shadow-xl w-full md:w-auto overflow-hidden">
           <div className="flex items-center gap-3 pr-4 md:pr-6 border-r border-slate-100 shrink-0">
              <div className="hidden sm:flex w-9 h-9 bg-slate-900 rounded-lg items-center justify-center text-white"><PenTool size={16}/></div>
              <input 
                className="font-black text-slate-900 text-[14px] bg-transparent focus:outline-none w-28 md:w-52 tracking-tightest placeholder:text-slate-300" 
                value={processName} 
                onChange={e => setProcessName(e.target.value)} 
                placeholder="Name..."
              />
           </div>
           <div className="hidden sm:flex items-center gap-1 shrink-0">
              <button onClick={() => setViewport(v => ({...v, zoom: v.zoom * 1.1}))} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><ZoomIn size={18}/></button>
              <button onClick={() => setViewport(v => ({...v, zoom: v.zoom / 1.1}))} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><ZoomOut size={18}/></button>
           </div>
           <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleDeploy} className="px-5 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                <Save size={14}/> <span className="hidden sm:inline">Deploy</span>
              </button>
              <button 
                onClick={handleRunSimulation} 
                className="p-2 md:px-4 md:py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2 group"
              >
                <PlayCircle size={16} /> <span className="hidden sm:inline">Test</span>
              </button>
           </div>
        </div>
      </div>

      {/* Floating AI Input */}
      <div className={`absolute bottom-28 md:bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-6 md:px-10 transition-all duration-500 ${selectedId ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <form onSubmit={handleAiGenerate} className="h-14 bg-white/80 backdrop-blur-md rounded-2xl flex items-center px-4 gap-3 shadow-2xl border border-slate-200/60">
           <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg">
             {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
           </div>
           <input 
              className="flex-1 bg-transparent border-none outline-none text-[14px] font-bold text-slate-800 placeholder:text-slate-400 tracking-tight"
              placeholder="Command AI to synthesize a flow..."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              disabled={isGenerating}
           />
           <button 
              type="submit"
              disabled={isGenerating || !aiPrompt.trim()}
              className="px-5 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-20 active:scale-95"
           >
             Synthesize
           </button>
        </form>
      </div>

      <div className={`fixed inset-y-0 left-0 z-[100] md:relative md:z-20 transition-all duration-500 flex-none h-full ${paletteOpen ? 'translate-x-0 w-[300px]' : '-translate-x-full md:w-0 md:opacity-0'}`}>
        <PaletteSidebar onAddNode={addNode} />
        <button onClick={() => setPaletteOpen(false)} className="md:hidden absolute top-6 right-6 p-3 bg-slate-100 rounded-xl text-slate-400"><X size={20}/></button>
      </div>

      <main 
        className="flex-1 relative overflow-hidden bg-[#F8FAFC] cursor-grab active:cursor-grabbing designer-grid" 
        ref={canvasRef} 
        onPointerDown={handlePointerDown} 
        onPointerMove={handlePointerMove} 
        onPointerUp={handlePointerUp} 
        onWheel={handleWheel}
        style={{ 
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`
        }}
      >
        <div 
          style={{ 
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, 
            transformOrigin: '0 0',
            transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <svg className="overflow-visible absolute top-0 left-0 pointer-events-none">
            <defs>
              <marker id="arrowhead-premium" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6"/>
              </marker>
            </defs>
            {links.map(l => {
              const s = steps.find(n => n.id === l.sourceId);
              const t = steps.find(n => n.id === l.targetId);
              if (!s || !t || !s.position || !t.position) return null;
              const x1 = s.position.x + 260; 
              const y1 = s.position.y + 50; 
              const x2 = t.position.x; 
              const y2 = t.position.y + 50;
              return (
                <path 
                  key={l.id} 
                  d={`M ${x1} ${y1} C ${x1 + 80} ${y1}, ${x2 - 80} ${y2}, ${x2} ${y2}`} 
                  stroke="#3B82F6" 
                  strokeWidth="2.5" 
                  strokeOpacity="0.3"
                  fill="none" 
                  markerEnd="url(#arrowhead-premium)"
                />
              );
            })}
            {ghostLink.current && (
              <path 
                d={`M ${ghostLink.current.x1} ${ghostLink.current.y1} C ${ghostLink.current.x1 + 80} ${ghostLink.current.y1}, ${ghostLink.current.x2 - 80} ${ghostLink.current.y2}, ${ghostLink.current.x2} ${ghostLink.current.y2}`} 
                stroke="#3B82F6" 
                strokeWidth="3" 
                strokeDasharray="12,12" 
                strokeOpacity="0.6"
                fill="none"
              />
            )}
          </svg>
          
          {steps.map(step => (
            <NodeComponent 
              key={step.id} 
              step={step} 
              isSelected={selectedId === step.id} 
            />
          ))}
        </div>

        {steps.length === 0 && !isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-12">
             <div className="w-20 h-20 bg-white rounded-3xl card-shadow flex items-center justify-center mb-8 border border-slate-100">
               <Cpu size={36} strokeWidth={1} className="text-slate-200" />
             </div>
             <h3 className="text-2xl font-black text-slate-900 tracking-tightest">Design Canvas</h3>
             <p className="text-[14px] font-medium text-slate-400 mt-4 max-w-xs leading-relaxed tracking-tight">
               Open the palette to deploy components or command the AI to synthesize a flow.
             </p>
          </div>
        )}
      </main>

      {/* Adaptive Sidebar/Bottom Sheet for Properties */}
      <div className={`transition-all duration-500 shrink-0 ${selectedId ? 'w-full md:w-[400px]' : 'w-0 opacity-0 overflow-hidden'}`}>
        <PropertiesPanel 
          step={selectedStep} 
          onUpdate={updateStep} 
          onDelete={deleteStep} 
          roles={roles} 
        />
      </div>

      {showSimPanel && (
        <aside className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-[500px] bg-slate-950 flex flex-col z-[200] text-white shadow-2xl animate-slide-in">
           <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                 <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Murder Board Simulation</h3>
              </div>
              <button onClick={() => setShowSimPanel(false)} className="p-3 hover:bg-white/5 rounded-xl transition-all"><X size={22}/></button>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
              {isSimulating ? (
                 <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Processing Cognitive Agents</p>
                 </div>
              ) : simResults?.map((res, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-7 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">{res.agentName[0]}</div>
                          <div>
                             <p className="text-[12px] font-black uppercase text-white tracking-widest">{res.agentName}</p>
                             <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{res.persona}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-2xl font-black text-white">{res.score}</div>
                          <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Trust</div>
                       </div>
                    </div>
                    <p className="text-[13px] text-slate-300 italic leading-relaxed">"{res.critique}"</p>
                    <div className="space-y-2">
                       {res.recommendations.map((rec, ri) => (
                          <div key={ri} className="flex gap-3 text-[12px] text-slate-400 bg-black/30 p-4 rounded-lg border border-white/5">
                             <ArrowRight size={14} className="mt-0.5 text-blue-500 shrink-0"/>
                             <span>{rec}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              ))}
           </div>
           <div className="p-6 border-t border-white/5 bg-black/40">
              <button onClick={handleRunSimulation} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[12px] uppercase tracking-widest transition-all">Re-Run Analysis</button>
           </div>
        </aside>
      )}
    </div>
  );
};
