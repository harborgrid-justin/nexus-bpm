
import React, { useState, useRef, useMemo } from 'react';
import { ProcessStep, ProcessLink, ProcessStepType } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Save, ZoomIn, ZoomOut, Sparkles, Cpu, PenTool, PlayCircle, X, LayoutPanelLeft, Trash2, Bot,
  MessageSquare, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { PaletteSidebar } from './designer/PaletteSidebar';
import { NodeComponent } from './designer/NodeComponent';
import { PropertiesPanel } from './designer/PropertiesPanel';
import { getStepTypeMetadata } from './designer/designerUtils';
import { generateProcessWorkflow, runWorkflowSimulation, SimulationResult } from '../services/geminiService';
import { NexButton, NexModal } from './shared/NexUI';

const GRID_SIZE = 20;

export const ProcessDesigner: React.FC = () => {
  const { deployProcess, roles, addNotification } = useBPM();
  const [processName, setProcessName] = useState('Strategic Workflow');
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [links, setLinks] = useState<ProcessLink[]>([]);
  const [viewport, setViewport] = useState({ x: 50, y: 50, zoom: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // AI States
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [showSimModal, setShowSimModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const [paletteOpen, setPaletteOpen] = useState(true);
  
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

  const handleDeploy = async () => {
    // CRITICAL: Map visual links to logical nextStepIds before saving
    const connectedSteps = steps.map(step => {
        const outgoingLinks = links.filter(l => l.sourceId === step.id);
        return {
            ...step,
            nextStepIds: outgoingLinks.map(l => l.targetId)
        };
    });

    await deployProcess({ 
        name: processName, 
        steps: connectedSteps, 
        links, 
        isActive: true, 
        version: 1 
    });
    addNotification('success', 'Process definition deployed successfully.');
  };

  const handleClear = () => {
    if(window.confirm('Clear current design?')) {
        setSteps([]);
        setLinks([]);
        setSelectedId(null);
    }
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const generatedSteps = await generateProcessWorkflow(aiPrompt);
      if (generatedSteps && generatedSteps.length > 0) {
        setSteps(generatedSteps);
        // Simple auto-link logic
        const newLinks: ProcessLink[] = [];
        for(let i=0; i < generatedSteps.length - 1; i++) {
          newLinks.push({ id: `link-auto-${i}`, sourceId: generatedSteps[i].id, targetId: generatedSteps[i+1].id });
        }
        setLinks(newLinks);
        addNotification('success', 'Model synthesized.');
        setAiPrompt('');
      }
    } catch (err) { addNotification('error', 'Generation failure.'); } finally { setIsGenerating(false); }
  };

  const handleSimulation = async () => {
    if (steps.length === 0) {
      addNotification('error', 'Canvas is empty. Add steps to simulate.');
      return;
    }
    setIsSimulating(true);
    setShowSimModal(true);
    try {
      const results = await runWorkflowSimulation(steps);
      setSimulationResults(results);
    } catch (e) {
      addNotification('error', 'Simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const addNode = (type: ProcessStepType) => {
    const world = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const metadata = getStepTypeMetadata(type);
    const newNode: ProcessStep = {
      id: `node-${Date.now()}`, name: metadata.defaultName, type, description: '',
      position: { x: snapToGrid(world.x - 100), y: snapToGrid(world.y - 40) },
      requiredSkills: metadata.defaultSkills || [], data: {}
    };
    setSteps(prev => [...prev, newNode]);
    setSelectedId(newNode.id);
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
        setSteps(prev => prev.map(s => s.id === activeId.current ? { ...s, position: { x: (s.position?.x || 0) + dx / viewport.zoom, y: (s.position?.y || 0) + dy / viewport.zoom } } : s));
    } else if (dragTarget.current === 'link' && activeId.current) {
        const sNode = steps.find(s => s.id === activeId.current);
        if (sNode && sNode.position) {
            const world = screenToWorld(e.clientX, e.clientY);
            ghostLink.current = { x1: sNode.position.x + 200, y1: sNode.position.y + 40, x2: world.x, y2: world.y };
            setViewport(v => ({...v})); // Force re-render for ghost link
        }
    }
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragTarget.current === 'link' && activeId.current) {
      const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-node-id]');
      const tId = targetEl?.getAttribute('data-node-id');
      
      const sourceId = activeId.current;
      
      if (tId && sourceId && tId !== sourceId) {
        setLinks(prev => {
            if (prev.some(l => l.sourceId === sourceId && l.targetId === tId)) return prev;
            return [...prev, { id: `link-${Date.now()}`, sourceId, targetId: tId }];
        });
      }
    } else if (dragTarget.current === 'node' && activeId.current) {
       setSteps(prev => prev.map(s => s.id === activeId.current ? { ...s, position: { x: snapToGrid(s.position?.x || 0), y: snapToGrid(s.position?.y || 0) } } : s));
    }
    
    isDragging.current = false; 
    ghostLink.current = null; 
    activeId.current = null; 
    setViewport(v => ({...v}));
  };

  const selectedStep = useMemo(() => steps.find(s => s.id === selectedId), [selectedId, steps]);
  const updateStep = (updatedStep: ProcessStep) => setSteps(prev => prev.map(s => s.id === updatedStep.id ? updatedStep : s));
  const deleteStep = (id: string) => { 
      setSteps(prev => prev.filter(s => s.id !== id)); 
      setLinks(prev => prev.filter(l => l.sourceId !== id && l.targetId !== id)); 
      setSelectedId(null); 
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
      
      {/* Simulation Modal */}
      <NexModal isOpen={showSimModal} onClose={() => setShowSimModal(false)} title="Murder Board Simulation" size="xl">
        <div className="space-y-6">
           {isSimulating ? (
             <div className="flex flex-col items-center justify-center py-12">
               <Cpu size={48} className="text-blue-500 animate-pulse mb-4"/>
               <p className="text-slate-600 font-bold">Agents are analyzing workflow topology...</p>
               <p className="text-slate-400 text-xs mt-2">Running risk heuristics and compliance checks</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {simulationResults.map((agent, i) => (
                 <div key={i} className={`p-4 border rounded-sm flex flex-col ${agent.sentiment === 'critical' ? 'bg-rose-50 border-rose-200' : agent.sentiment === 'positive' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-black/5">
                       <div className="w-10 h-10 rounded-sm bg-white flex items-center justify-center text-xl shadow-sm">
                         {agent.agentName[0]}
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-900 text-sm">{agent.agentName}</h4>
                         <p className="text-[10px] text-slate-500 uppercase font-bold">{agent.persona}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-2xl font-black text-slate-800">{agent.score}/100</div>
                      {agent.score > 80 ? <ThumbsUp size={16} className="text-emerald-600"/> : <ThumbsDown size={16} className="text-rose-600"/>}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed mb-4 flex-1">
                      "{agent.critique}"
                    </p>

                    <div className="space-y-2">
                       {agent.recommendations.map((rec, idx) => (
                         <div key={idx} className="flex gap-2 items-start bg-white/50 p-2 rounded-sm text-[10px] font-medium text-slate-800">
                            <Bot size={12} className="shrink-0 mt-0.5 text-blue-600"/>
                            {rec}
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
               {simulationResults.length === 0 && !isSimulating && (
                 <div className="col-span-3 text-center py-8 text-slate-500">No simulation data available.</div>
               )}
             </div>
           )}
           <div className="flex justify-end pt-4 border-t border-slate-100">
             <NexButton variant="primary" onClick={() => setShowSimModal(false)}>Return to Editor</NexButton>
           </div>
        </div>
      </NexModal>

      {/* 1. Rigid Toolbar */}
      <div className="h-10 bg-slate-100 border-b border-slate-300 flex items-center justify-between px-3 shrink-0">
         <div className="flex items-center gap-3">
            <button onClick={() => setPaletteOpen(!paletteOpen)} className={`p-1 rounded hover:bg-slate-200 ${paletteOpen ? 'text-blue-600' : 'text-slate-500'}`}><LayoutPanelLeft size={16}/></button>
            <div className="h-4 w-px bg-slate-300"></div>
            <input className="bg-transparent text-sm font-bold text-slate-800 w-48 outline-none" value={processName} onChange={e => setProcessName(e.target.value)} />
         </div>
         <div className="flex items-center gap-2">
            <input className="h-7 w-64 bg-white border border-slate-300 rounded-sm px-2 text-xs" placeholder="Describe workflow for AI generation..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiGenerate(e)} disabled={isGenerating}/>
            <button className="p-1 text-slate-500 hover:text-slate-900" onClick={() => setViewport(v => ({...v, zoom: v.zoom * 1.1}))}><ZoomIn size={16}/></button>
            <button className="p-1 text-slate-500 hover:text-slate-900" onClick={() => setViewport(v => ({...v, zoom: v.zoom / 1.1}))}><ZoomOut size={16}/></button>
            <button className="p-1 text-slate-500 hover:text-rose-600" onClick={handleClear} title="Clear Canvas"><Trash2 size={16}/></button>
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            <button onClick={handleSimulation} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-sm text-xs hover:bg-indigo-700 shadow-sm"><Cpu size={14}/> Simulate</button>
            <button onClick={handleDeploy} className="flex items-center gap-1 px-3 py-1 bg-slate-800 text-white rounded-sm text-xs hover:bg-slate-900 shadow-sm"><Save size={14}/> Save</button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Palette (Standard Sidebar) */}
        {paletteOpen && (
          <div className="w-56 border-r border-slate-300 bg-slate-50 overflow-y-auto">
             <PaletteSidebar onAddNode={addNode} />
          </div>
        )}

        {/* 3. Canvas (Grid) */}
        <div className="flex-1 relative bg-[#f0f2f5] overflow-hidden cursor-grab active:cursor-grabbing designer-grid"
             ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
           <div style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0' }}>
              {/* SVG Overlay for Links - MUST be pointer-events-none to allow clicking nodes through it */}
              <svg className="overflow-visible absolute top-0 left-0 pointer-events-none">
                <defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/></marker></defs>
                {links.map(l => {
                  const s = steps.find(n => n.id === l.sourceId); 
                  const t = steps.find(n => n.id === l.targetId);
                  if (!s || !t || !s.position || !t.position) return null;
                  
                  // Calculate link coordinates based on node dimensions (200x80)
                  const x1 = s.position.x + 200; 
                  const y1 = s.position.y + 40; 
                  const x2 = t.position.x; 
                  const y2 = t.position.y + 40;
                  
                  return <path key={l.id} d={`M ${x1} ${y1} C ${x1+50} ${y1}, ${x2-50} ${y2}, ${x2} ${y2}`} stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrow)"/>;
                })}
                {ghostLink.current && <path d={`M ${ghostLink.current.x1} ${ghostLink.current.y1} L ${ghostLink.current.x2} ${ghostLink.current.y2}`} stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" fill="none"/>}
              </svg>
              
              {/* Nodes Layer */}
              {steps.map(step => <NodeComponent key={step.id} step={step} isSelected={selectedId === step.id} />)}
           </div>
        </div>

        {/* 4. Properties (Rigid Right Panel) */}
        {selectedStep && (
          <div className="w-72 border-l border-slate-300 bg-white overflow-y-auto shadow-xl z-20">
             <PropertiesPanel step={selectedStep} onUpdate={updateStep} onDelete={deleteStep} roles={roles} />
          </div>
        )}
      </div>
    </div>
  );
};
