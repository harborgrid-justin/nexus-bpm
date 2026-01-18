
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  Controls, 
  Background, 
  MiniMap,
  Connection,
  addEdge,
  MarkerType,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import dagre from 'dagre';
import { ProcessStep, ProcessLink, ProcessStepType, ProcessDefinition } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Save, Sparkles, Cpu, LayoutPanelLeft, Trash2, Thermometer, Layout, Settings, FileText, Globe, AlertTriangle
} from 'lucide-react';
import { PaletteSidebar } from './designer/PaletteSidebar';
import { NodeComponent } from './designer/NodeComponent';
import { CustomEdge } from './designer/CustomEdge';
import { PropertiesPanel } from './designer/PropertiesPanel';
import { CanvasContextMenu } from './designer/CanvasContextMenu';
import { getStepTypeMetadata } from './designer/designerUtils';
import { generateProcessWorkflow } from '../services/geminiService';
import { NexFormGroup, NexButton } from './shared/NexUI';
import { validateStepConfiguration } from './designer/stepSchemas';

// Define the Node & Edge Types for React Flow
const nodeTypes = {
  custom: NodeComponent
};

const edgeTypes = {
  custom: CustomEdge
};

const GRID_SIZE = 20;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

// --- AUTO LAYOUT ENGINE ---
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// --- Process Properties Panel ---
const ProcessSettingsPanel = ({ meta, onChange }: { meta: Partial<ProcessDefinition>, onChange: (upd: Partial<ProcessDefinition>) => void }) => {
    return (
        <aside className="w-full h-full bg-white border-l border-slate-300 flex flex-col shadow-xl z-20">
            <div className="h-10 flex items-center px-4 border-b border-slate-300 bg-slate-50 gap-2">
                <Settings size={14} className="text-slate-500"/>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Process Settings</h3>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <NexFormGroup label="Process Name">
                    <input className="prop-input font-bold" value={meta.name || ''} onChange={e => onChange({ name: e.target.value })} />
                </NexFormGroup>
                <NexFormGroup label="Description">
                    <textarea className="prop-input h-24 resize-none" value={meta.description || ''} onChange={e => onChange({ description: e.target.value })} />
                </NexFormGroup>
                
                <div className="h-px bg-slate-200"></div>
                
                <NexFormGroup label="Compliance Level">
                    <select className="prop-input" value={meta.complianceLevel || 'Standard'} onChange={e => onChange({ complianceLevel: e.target.value as any })}>
                        <option value="Standard">Standard</option>
                        <option value="Strict">Strict (Audit Locked)</option>
                        <option value="Critical">Critical (2-Man Rule)</option>
                    </select>
                </NexFormGroup>
                
                <NexFormGroup label="Version Control">
                    <div className="flex gap-2 items-center">
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded border">v{meta.version || 1}.0</span>
                        <span className="text-[10px] text-slate-400">Auto-increments on deploy</span>
                    </div>
                </NexFormGroup>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm text-xs text-blue-800">
                    <h4 className="font-bold flex items-center gap-1 mb-1"><Globe size={12}/> Global Scope</h4>
                    <p>This process definition is accessible to all users in the {meta.domainId || 'GLOBAL'} domain.</p>
                </div>
            </div>
        </aside>
    );
};

// Internal wrapper to use React Flow Hooks
const DesignerFlow = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect, 
  onNodeClick, 
  onPaneClick,
  onContextMenu,
  onDrop,
  onDragOver,
  onLayout,
  isValidConnection
}: any) => {
  return (
    <div className="h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onContextMenu={onContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        isValidConnection={isValidConnection}
        snapToGrid={true}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        fitView
        attributionPosition="bottom-right"
        defaultEdgeOptions={{
          type: 'custom', 
          animated: false,
          style: { stroke: '#64748b', strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#64748b',
          },
        }}
      >
        <Background color="#cbd5e1" gap={GRID_SIZE} variant={BackgroundVariant.Dots} />
        <Controls className="bg-white border border-slate-200 shadow-sm rounded-base text-slate-600" />
        <MiniMap 
          className="border border-slate-200 shadow-sm rounded-base" 
          nodeColor="#e2e8f0" 
          maskColor="rgb(248, 250, 252, 0.7)"
        />
        <Panel position="top-right" className="bg-white p-1 rounded-sm shadow-sm border border-slate-200 flex gap-1">
           <button onClick={() => onLayout('TB')} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Vertical Layout"><Layout size={16} className="rotate-90"/></button>
           <button onClick={() => onLayout('LR')} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Horizontal Layout"><Layout size={16}/></button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const ProcessDesigner: React.FC = () => {
  const { deployProcess, roles, addNotification, designerDraft, setDesignerDraft, navigateTo, processes, nav, currentUser } = useBPM();
  
  // React Flow State
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ position: { x: number; y: number }, targetId: string | null } | null>(null);
  
  // Process Metadata State
  const [processMeta, setProcessMeta] = useState<Partial<ProcessDefinition>>({ 
      name: 'Strategic Workflow', 
      description: '', 
      version: 1, 
      complianceLevel: 'Standard',
      domainId: currentUser?.domainId || 'GLOBAL'
  });
  
  // UI State
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // --- LOADER: Load from DB if ID present, else Draft ---
  useEffect(() => {
      if (nav.selectedId && nav.view === 'designer') {
          const existing = processes.find(p => p.id === nav.selectedId);
          if (existing) {
              setProcessMeta({
                  id: existing.id,
                  name: existing.name,
                  description: existing.description,
                  version: existing.version,
                  complianceLevel: existing.complianceLevel,
                  domainId: existing.domainId
              });
              
              // Hydrate Nodes
              const dbNodes: Node[] = existing.steps.map(s => ({
                  id: s.id,
                  type: 'custom',
                  position: s.position || { x: 0, y: 0 },
                  data: { step: s }
              }));
              
              // Hydrate Edges
              const dbEdges: Edge[] = (existing.links || []).map(l => ({
                  id: l.id,
                  source: l.sourceId,
                  target: l.targetId,
                  type: 'custom',
                  label: l.label
              }));
              
              setNodes(dbNodes);
              setEdges(dbEdges);
              return; // Skip draft load
          }
      }
      
      // Fallback to Draft
      if (designerDraft && (!nav.selectedId || nav.selectedId === 'new')) {
          const draftNodes: Node[] = designerDraft.steps.map(s => ({
            id: s.id,
            type: 'custom',
            position: s.position || { x: 0, y: 0 },
            data: { step: s }
          }));
          const draftEdges: Edge[] = designerDraft.links.map(l => ({
            id: l.id,
            source: l.sourceId,
            target: l.targetId,
            type: 'custom',
            label: l.label
          }));
          setNodes(draftNodes);
          setEdges(draftEdges);
      }
  }, [nav.selectedId]); // Run when ID changes

  // Ref for stable callback access to avoid infinite loop in useEffect
  const setDesignerDraftRef = useRef(setDesignerDraft);
  useEffect(() => {
      setDesignerDraftRef.current = setDesignerDraft;
  }, [setDesignerDraft]);

  // Sync Flow State -> Draft (Persistence) with Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
        const steps: ProcessStep[] = nodes.map(n => ({
          ...n.data.step,
          position: n.position,
          id: n.id // Ensure ID sync
        }));
        
        const links: ProcessLink[] = edges.map(e => ({
          id: e.id,
          sourceId: e.source,
          targetId: e.target,
          label: e.label as string
        }));

        setDesignerDraftRef.current({ steps, links });
    }, 1000); // 1s debounce

    return () => clearTimeout(handler);
  }, [nodes, edges]);

  // --- Handlers ---

  // Connection Validation: Enforce BPMN Rules
  const isValidConnection = useCallback((connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (!sourceNode || !targetNode) return false;
      if (sourceNode.data.step.type === 'end') return false;
      if (targetNode.data.step.type === 'start') return false;
      if (connection.source === connection.target) return false;

      return true;
  }, [nodes]);

  // Auto Layout
  const onLayout = useCallback((direction: 'LR' | 'TB') => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  // DnD Handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // Simple screen-to-flow projection (approximate)
      const position = {
        x: event.clientX - 280, 
        y: event.clientY - 80, 
      };
      
      addNode(type as ProcessStepType, position);
    },
    [nodes] 
  );

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'custom' }, eds)), [setEdges]);

  const addNode = useCallback((type: ProcessStepType, position?: { x: number, y: number }) => {
    const metadata = getStepTypeMetadata(type);
    const id = `node-${Date.now()}`;
    
    const newStep: ProcessStep = {
      id,
      name: metadata.defaultName,
      type,
      description: '',
      requiredSkills: metadata.defaultSkills || [],
      data: {}
    };

    const newNode: Node = {
      id,
      type: 'custom',
      position: position || { x: 250, y: 250 }, 
      data: { step: newStep }
    };

    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(id);
  }, [setNodes]);

  const updateSelectedStep = useCallback((updatedStep: ProcessStep) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === updatedStep.id) {
        return { ...n, data: { ...n.data, step: updatedStep } };
      }
      return n;
    }));
  }, [setNodes]);

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const handleDeploy = async () => {
    // PRE-FLIGHT CHECK
    const invalidNodes = nodes.filter(n => !validateStepConfiguration(n.data.step.type, n.data.step.data));
    if (invalidNodes.length > 0) {
        addNotification('error', `Deploy Failed: ${invalidNodes.length} steps have missing configuration. Check indicators.`);
        // Optionally select the first invalid node
        setSelectedNodeId(invalidNodes[0].id);
        return;
    }

    const steps: ProcessStep[] = nodes.map(n => ({
        ...n.data.step,
        position: n.position,
        nextStepIds: edges.filter(e => e.source === n.id).map(e => e.target)
    }));
    
    const links: ProcessLink[] = edges.map(e => ({
        id: e.id,
        sourceId: e.source,
        targetId: e.target
    }));

    await deployProcess({ 
        ...processMeta,
        steps, 
        links, 
        isActive: true, 
        // Increment version if updating existing
        version: (processMeta.version || 1) + 1 
    });
    addNotification('success', `Process ${processMeta.name} deployed successfully.`);
  };

  const handleClear = () => {
    if(window.confirm('Clear current design?')) {
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);
    }
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const generatedSteps = await generateProcessWorkflow(aiPrompt);
      if (generatedSteps && generatedSteps.length > 0) {
        const newNodes: Node[] = generatedSteps.map(s => ({
            id: s.id,
            type: 'custom',
            position: s.position || { x: 0, y: 0 },
            data: { step: s }
        }));
        
        const newEdges: Edge[] = [];
        for(let i=0; i < generatedSteps.length - 1; i++) {
            newEdges.push({ 
                id: `link-auto-${i}`, 
                source: generatedSteps[i].id, 
                target: generatedSteps[i+1].id,
                type: 'custom'
            });
        }
        
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, 'LR');
        
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        addNotification('success', 'Model synthesized and auto-layout applied.');
        setAiPrompt('');
      }
    } catch (err) { addNotification('error', 'Generation failure.'); } finally { setIsGenerating(false); }
  };

  const handleSimulation = () => {
    if (nodes.length === 0) {
      addNotification('error', 'Canvas is empty. Add steps to simulate.');
      return;
    }
    navigateTo('simulation-report');
  };

  // --- Context Menu ---
  const onContextMenu = useCallback((event: React.MouseEvent, node?: Node) => {
    event.preventDefault();
    setContextMenu({
      position: { x: event.clientX, y: event.clientY },
      targetId: node ? node.id : null,
    });
  }, []);

  const handleMenuAction = (action: string, payload?: any) => {
    if (!contextMenu) return;
    const { targetId, position } = contextMenu;

    switch (action) {
      case 'delete':
        if (targetId) deleteNode(targetId);
        break;
      case 'duplicate':
        if (targetId) {
          const original = nodes.find(n => n.id === targetId);
          if (original) {
            const id = `node-${Date.now()}`;
            const newNode = {
              ...original,
              id,
              position: { x: original.position.x + 50, y: original.position.y + 50 },
              data: { step: { ...original.data.step, id, name: `${original.data.step.name} (Copy)` } },
              selected: true
            };
            setNodes(nds => nds.map(n => ({...n, selected: false})).concat(newNode));
            setSelectedNodeId(id);
          }
        }
        break;
      case 'add-node':
        addNode(payload, { x: 250, y: 250 });
        break;
      case 'clear-canvas':
        handleClear();
        break;
    }
    setContextMenu(null);
  };

  // derived selected step
  const selectedStep = useMemo(() => {
    const node = nodes.find(n => n.id === selectedNodeId);
    return node ? node.data.step : undefined;
  }, [selectedNodeId, nodes]);

  return (
    <ReactFlowProvider>
      <div className="h-[calc(100vh-100px)] flex flex-col bg-panel border border-default rounded-base shadow-sm overflow-hidden">
        {/* 1. Rigid Toolbar */}
        <div className="h-header bg-subtle border-b border-default flex items-center justify-between px-3 shrink-0">
           <div className="flex items-center gap-3">
              <button onClick={() => setPaletteOpen(!paletteOpen)} className={`p-1 rounded-base hover:bg-white border border-transparent hover:border-subtle ${paletteOpen ? 'text-blue-600' : 'text-secondary'}`}><LayoutPanelLeft size={16}/></button>
              <div className="h-4 w-px bg-default"></div>
              {/* Process Name Input */}
              <div className="flex flex-col justify-center">
                  <input 
                    className="bg-transparent text-sm font-bold text-primary w-48 outline-none" 
                    value={processMeta.name} 
                    onChange={e => setProcessMeta(p => ({ ...p, name: e.target.value }))} 
                  />
                  {processMeta.id && <span className="text-[9px] text-slate-400 font-mono leading-none">ID: {processMeta.id}</span>}
              </div>
           </div>
           <div className="flex items-center gap-2">
              <input className="h-7 w-64 bg-panel border border-default rounded-base px-2 text-xs" placeholder="Describe workflow for AI generation..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiGenerate(e)} disabled={isGenerating}/>
              <button className="p-1 text-secondary hover:text-rose-600" onClick={handleClear} title="Clear Canvas"><Trash2 size={16}/></button>
              
              <div className="h-4 w-px bg-default mx-1"></div>
              
              <button 
                  onClick={() => setShowHeatmap(!showHeatmap)} 
                  className={`p-1 rounded-base transition-colors ${showHeatmap ? 'bg-rose-100 text-rose-600' : 'text-secondary hover:text-primary'}`} 
                  title="Toggle Heatmap"
              >
                  <Thermometer size={16}/>
              </button>

              <button onClick={handleSimulation} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-base text-xs hover:bg-indigo-700 shadow-sm"><Cpu size={14}/> Simulate</button>
              <button onClick={handleDeploy} className="flex items-center gap-1 px-3 py-1 bg-brand-slate text-white rounded-base text-xs hover:bg-slate-900 shadow-sm"><Save size={14}/> Save</button>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 2. Palette (Standard Sidebar) */}
          {paletteOpen && (
            <div className="w-56 border-r border-default bg-subtle overflow-y-auto z-10">
               <PaletteSidebar onAddNode={(type) => addNode(type)} />
            </div>
          )}

          {/* 3. React Flow Canvas */}
          <div className="flex-1 h-full bg-canvas relative">
             <DesignerFlow 
                nodes={nodes}
                edges={edges}
                onNodesChange={useCallback((changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)), [setNodes])}
                onEdgesChange={useCallback((changes: EdgeChange[]) => setEdges(eds => applyEdgeChanges(changes, eds)), [setEdges])}
                onConnect={onConnect}
                onNodeClick={(_: any, node: Node) => setSelectedNodeId(node.id)}
                onPaneClick={() => setSelectedNodeId(null)}
                onContextMenu={onContextMenu}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onLayout={onLayout}
                isValidConnection={isValidConnection}
             />
          </div>

          {/* 4. Properties (Rigid Right Panel) */}
          <div className="w-72 border-l border-default bg-panel overflow-y-auto shadow-xl z-20">
             {selectedStep ? (
               <PropertiesPanel step={selectedStep} onUpdate={updateSelectedStep} onDelete={deleteNode} roles={roles} />
             ) : (
               <ProcessSettingsPanel meta={processMeta} onChange={upd => setProcessMeta(prev => ({ ...prev, ...upd }))} />
             )}
          </div>
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
    </ReactFlowProvider>
  );
};
