
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ProcessStep, ProcessLink, ProcessStepType } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Save, ZoomIn, ZoomOut, Sparkles, Cpu, LayoutPanelLeft, Trash2,
} from 'lucide-react';
import { PaletteSidebar } from './designer/PaletteSidebar';
import { NodeComponent } from './designer/NodeComponent';
import { PropertiesPanel } from './designer/PropertiesPanel';
import { CanvasContextMenu } from './designer/CanvasContextMenu'; // Imported
import { getStepTypeMetadata } from './designer/designerUtils';
import { generateProcessWorkflow } from '../services/geminiService';

const GRID_SIZE = 20;

export const ProcessDesigner: React.FC = () => {
  const { deployProcess, roles, addNotification, designerDraft, setDesignerDraft, navigateTo } = useBPM();
  const [processName, setProcessName] = useState('Strategic Workflow');
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [links, setLinks] = useState<ProcessLink[]>([]);
  const [viewport, setViewport] = useState({ x: 50, y: 50, zoom: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Context Menu & Clipboard State
  const [contextMenu, setContextMenu] = useState<{ position: { x: number; y: number }, targetId: string | null } | null>(null);
  const [clipboard, setClipboard] = useState<ProcessStep | null>(null);

  // AI States
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [paletteOpen, setPaletteOpen] = useState(true);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragTarget = useRef<'viewport' | 'node' | 'link'>('viewport');
  const activeId = useRef<string | null>(null);
  const ghostLink = useRef<{x1: number, y1: number, x2: number, y2: number} | null>(null);

  // Restore state from context if available
  useEffect(() => {
    if (designerDraft) {
        setSteps(designerDraft.steps);
        setLinks(designerDraft.links);
    }
  }, []);

  // Persist state to context on change
  useEffect(() => {
    setDesignerDraft({ steps, links });
  }, [steps, links, setDesignerDraft]);

  const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;
  
  const screenToWorld = (sx: number, sy: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { 
      x: (sx - rect.left - viewport.x) / viewport.zoom, 
      y: (sy - rect.top - viewport.y) / viewport.zoom 
    };
  };

  // --- Actions ---

  const handleDeploy = async () => {
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
    navigateTo('simulation-report');
  };

  const addNode = (type: ProcessStepType, position?: { x: number, y: number }) => {
    const world = position || screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const metadata = getStepTypeMetadata(type);
    const newNode: ProcessStep = {
      id: `node-${Date.now()}`, name: metadata.defaultName, type, description: '',
      position: { x: snapToGrid(world.x - (position ? 0 : 100)), y: snapToGrid(world.y - (position ? 0 : 40)) },
      requiredSkills: metadata.defaultSkills || [], data: {}
    };
    setSteps(prev => [...prev, newNode]);
    setSelectedId(newNode.id);
  };

  // --- Context Menu Handlers ---

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-node-id]');
    const targetId = nodeEl ? nodeEl.getAttribute('data-node-id') : null;
    
    // Select the node immediately if right-clicked
    if (targetId) setSelectedId(targetId);

    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      targetId
    });
  };

  const handleMenuAction = (action: string, payload?: any) => {
    if (!contextMenu) return;
    const { targetId, position } = contextMenu;

    switch (action) {
      case 'delete':
        if (targetId) deleteStep(targetId);
        break;
        
      case 'duplicate':
        if (targetId) {
          const original = steps.find(s => s.id === targetId);
          if (original) {
            const newNode = {
              ...original,
              id: `node-${Date.now()}`,
              name: `${original.name} (Copy)`,
              position: { x: (original.position?.x || 0) + 20, y: (original.position?.y || 0) + 20 }
            };
            setSteps(prev => [...prev, newNode]);
            setSelectedId(newNode.id);
          }
        }
        break;

      case 'copy':
        if (targetId) {
          const node = steps.find(s => s.id === targetId);
          if (node) {
            setClipboard(node);
            addNotification('info', 'Copied to clipboard');
          }
        }
        break;

      case 'paste':
        if (clipboard) {
          const world = screenToWorld(position.x, position.y);
          const newNode = {
            ...clipboard,
            id: `node-${Date.now()}`,
            name: clipboard.name, 
            position: { x: snapToGrid(world.x), y: snapToGrid(world.y) }
          };
          setSteps(prev => [...prev, newNode]);
          setSelectedId(newNode.id);
          addNotification('success', 'Pasted component');
        } else {
          addNotification('info', 'Clipboard is empty');
        }
        break;

      case 'disconnect':
        if (targetId) {
          setLinks(prev => prev.filter(l => l.sourceId !== targetId && l.targetId !== targetId));
          addNotification('info', 'Links removed.');
        }
        break;

      case 'edit':
        // Already selected by context menu open logic, panel is open
        break;

      case 'add-node':
        // Calculate world coordinates for the click position
        const world = screenToWorld(position.x, position.y);
        addNode(payload, { x: world.x, y: world.y });
        break;

      case 'reset-view':
        setViewport({ x: 50, y: 50, zoom: 1 });
        break;

      case 'clear-canvas':
        handleClear();
        break;
    }
    setContextMenu(null);
  };

  // --- Pointer Events ---

  const handlePointerDown = (e: React.PointerEvent) => {
    // Hide context menu on left click
    if (contextMenu) setContextMenu(null);

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
            // 200/80 should be tokens, but for JS logic keeping consistent with node dimensions
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
    <div className="h-[calc(100vh-100px)] flex flex-col bg-panel border border-default rounded-base shadow-sm overflow-hidden">
      {/* 1. Rigid Toolbar */}
      <div className="h-header bg-subtle border-b border-default flex items-center justify-between px-3 shrink-0">
         <div className="flex items-center gap-3">
            <button onClick={() => setPaletteOpen(!paletteOpen)} className={`p-1 rounded-base hover:bg-white border border-transparent hover:border-subtle ${paletteOpen ? 'text-blue-600' : 'text-secondary'}`}><LayoutPanelLeft size={16}/></button>
            <div className="h-4 w-px bg-default"></div>
            <input className="bg-transparent text-sm font-bold text-primary w-48 outline-none" value={processName} onChange={e => setProcessName(e.target.value)} />
         </div>
         <div className="flex items-center gap-2">
            <input className="h-7 w-64 bg-panel border border-default rounded-base px-2 text-xs" placeholder="Describe workflow for AI generation..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiGenerate(e)} disabled={isGenerating}/>
            <button className="p-1 text-secondary hover:text-primary" onClick={() => setViewport(v => ({...v, zoom: v.zoom * 1.1}))}><ZoomIn size={16}/></button>
            <button className="p-1 text-secondary hover:text-primary" onClick={() => setViewport(v => ({...v, zoom: v.zoom / 1.1}))}><ZoomOut size={16}/></button>
            <button className="p-1 text-secondary hover:text-rose-600" onClick={handleClear} title="Clear Canvas"><Trash2 size={16}/></button>
            <div className="h-4 w-px bg-default mx-1"></div>
            <button onClick={handleSimulation} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-base text-xs hover:bg-indigo-700 shadow-sm"><Cpu size={14}/> Simulate</button>
            <button onClick={handleDeploy} className="flex items-center gap-1 px-3 py-1 bg-brand-slate text-white rounded-base text-xs hover:bg-slate-900 shadow-sm"><Save size={14}/> Save</button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Palette (Standard Sidebar) */}
        {paletteOpen && (
          <div className="w-56 border-r border-default bg-subtle overflow-y-auto">
             <PaletteSidebar onAddNode={addNode} />
          </div>
        )}

        {/* 3. Canvas (Grid) */}
        <div className="flex-1 relative bg-canvas overflow-hidden cursor-grab active:cursor-grabbing designer-grid"
             ref={canvasRef} 
             onPointerDown={handlePointerDown} 
             onPointerMove={handlePointerMove} 
             onPointerUp={handlePointerUp}
             onContextMenu={handleContextMenu}
        >
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
          <div className="w-72 border-l border-default bg-panel overflow-y-auto shadow-xl z-20">
             <PropertiesPanel step={selectedStep} onUpdate={updateStep} onDelete={deleteStep} roles={roles} />
          </div>
        )}
      </div>

      {/* Context Menu Overlay */}
      {contextMenu && (
        <CanvasContextMenu 
          position={contextMenu.position} 
          targetId={contextMenu.targetId} 
          onClose={() => setContextMenu(null)}
          onAction={handleMenuAction}
        />
      )}
    </div>
  );
};
