
import React, { useState, useRef, useMemo } from 'react';
import { ProcessStep, ProcessLink, ProcessStepType } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Save, ZoomIn, ZoomOut, Sparkles, Cpu, PenTool, PlayCircle, X, LayoutPanelLeft
} from 'lucide-react';
import { PaletteSidebar } from './designer/PaletteSidebar';
import { NodeComponent } from './designer/NodeComponent';
import { PropertiesPanel } from './designer/PropertiesPanel';
import { getStepTypeMetadata } from './designer/designerUtils';
import { generateProcessWorkflow, runWorkflowSimulation, SimulationResult } from '../services/geminiService';

const GRID_SIZE = 20;

export const ProcessDesigner: React.FC = () => {
  const { deployProcess, roles, addNotification } = useBPM();
  const [processName, setProcessName] = useState('Strategic Workflow');
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [links, setLinks] = useState<ProcessLink[]>([]);
  const [viewport, setViewport] = useState({ x: 50, y: 50, zoom: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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
    // CRITICAL FIX: Map visual links to logical nextStepIds before saving
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

  // ... Pointer handlers (simplified for brevity, logic same as before but grid size changed) ...
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-node-id]');
    const handleEl = target.closest('[data-handle-id]');
    dragStart.current = { x: e.clientX, y: e.clientY };
    isDragging.current = true;
    if (handleEl) { dragTarget.current = 'link'; activeId.current = handleEl.getAttribute('data-handle-id'); e.stopPropagation(); } 
    else if (nodeEl) { dragTarget.current = 'node'; activeId.current = nodeEl.getAttribute('data-node-id'); setSelectedId(activeId.current); e.stopPropagation(); } 
    else { dragTarget.current = 'viewport'; setSelectedId(null); }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (dragTarget.current === 'viewport') { setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy })); } 
    else if (dragTarget.current === 'node' && activeId.current) {
      setSteps(prev => prev.map(s => s.id === activeId.current ? { ...s, position: { x: (s.position?.x || 0) + dx / viewport.zoom, y: (s.position?.y || 0) + dy / viewport.zoom } } : s));
    } else if (dragTarget.current === 'link' && activeId.current) {
      const sNode = steps.find(s => s.id === activeId.current);
      if (sNode && sNode.position) {
        const world = screenToWorld(e.clientX, e.clientY);
        ghostLink.current = { x1: sNode.position.x + 200, y1: sNode.position.y + 40, x2: world.x, y2: world.y };
        setViewport(v => ({...v}));
      }
    }
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragTarget.current === 'link' && activeId.current) {
      const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-node-id]');
      const tId = targetEl?.getAttribute('data-node-id');
      if (tId && tId !== activeId.current) setLinks(prev => [...prev, { id: `link-${Date.now()}`, sourceId: activeId.current!, targetId: tId }]);
    } else if (dragTarget.current === 'node' && activeId.current) {
       setSteps(prev => prev.map(s => s.id === activeId.current ? { ...s, position: { x: snapToGrid(s.position?.x || 0), y: snapToGrid(s.position?.y || 0) } } : s));
    }
    isDragging.current = false; ghostLink.current = null; activeId.current = null; setViewport(v => ({...v}));
  };

  const selectedStep = useMemo(() => steps.find(s => s.id === selectedId), [selectedId, steps]);
  const updateStep = (updatedStep: ProcessStep) => setSteps(prev => prev.map(s => s.id === updatedStep.id ? updatedStep : s));
  const deleteStep = (id: string) => { setSteps(prev => prev.filter(s => s.id !== id)); setLinks(prev => prev.filter(l => l.sourceId !== id && l.targetId !== id)); setSelectedId(null); };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
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
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            <button onClick={handleDeploy} className="flex items-center gap-1 px-3 py-1 bg-slate-800 text-white rounded-sm text-xs hover:bg-slate-900"><Save size={14}/> Save</button>
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
              <svg className="overflow-visible absolute top-0 left-0 pointer-events-none">
                <defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/></marker></defs>
                {links.map(l => {
                  const s = steps.find(n => n.id === l.sourceId); const t = steps.find(n => n.id === l.targetId);
                  if (!s || !t) return null;
                  const x1=s.position!.x+200; const y1=s.position!.y+40; const x2=t.position!.x; const y2=t.position!.y+40;
                  return <path key={l.id} d={`M ${x1} ${y1} C ${x1+50} ${y1}, ${x2-50} ${y2}, ${x2} ${y2}`} stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrow)"/>;
                })}
                {ghostLink.current && <path d={`M ${ghostLink.current.x1} ${ghostLink.current.y1} L ${ghostLink.current.x2} ${ghostLink.current.y2}`} stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" fill="none"/>}
              </svg>
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
