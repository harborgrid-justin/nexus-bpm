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
import { ProcessStep, ProcessLink, ProcessStepType, ProcessDefinition, Swimlane } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Save, Sparkles, Cpu, LayoutPanelLeft, Trash2, Thermometer, Layout, Settings, FileText, Globe, AlertTriangle, PanelRight, X, Wand2, ListTree, Grid, Layers, Plus
} from 'lucide-react';
import { PaletteSidebar } from './designer/PaletteSidebar';
import { NodeComponent } from './designer/NodeComponent';
import { CustomEdge } from './designer/CustomEdge';
import { PropertiesPanel } from './designer/PropertiesPanel';
import { CanvasContextMenu } from './designer/CanvasContextMenu';
import { HierarchyView } from './designer/HierarchyView';
import { SwimlaneRenderer } from './designer/SwimlaneRenderer';
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
const ProcessSettingsPanel = ({ meta, onChange, onClose, roles }: { meta: Partial<ProcessDefinition>, onChange: (upd: Partial<ProcessDefinition>) => void, onClose: () => void, roles: any[] }) => {
    
    const addLane = () => {
        const newLane: Swimlane = { id: `lane-${Date.now()}`, name: 'New Lane', height: 300, color: 'slate' };
        onChange({ lanes: [...(meta.lanes || []), newLane] });
    };

    const updateLane = (id: string, updates: Partial<Swimlane>) => {
        onChange({ lanes: (meta.lanes || []).map(l => l.id === id ? { ...l, ...updates } : l) });
    };

    const removeLane = (id: string) => {
        onChange({ lanes: (meta.lanes || []).filter(l => l.id !== id) });
    };

    return (
        <aside className="w-[320px] h-full bg-white border-l border-slate-300 flex flex-col shadow-xl z-20">
            <div 
              className="flex items-center justify-between border-b border-slate-300 bg-slate-50"
              style={{ height: 'var(--header-height)', paddingLeft: 'var(--space-base)', paddingRight: 'var(--space-base)' }}
            >
                <div className="flex items-center gap-2">
                    <Settings size={14} className="text-slate-500"/>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Process Settings</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>
            <div 
              className="overflow-y-auto flex-1"
              style={{ padding: 'var(--card-padding)', display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}
            >
                <NexFormGroup label="Process Name">
                    <input className="prop-input font-bold" value={meta.name || ''} onChange={e => onChange({ name: e.target.value })} />
                </NexFormGroup>
                <NexFormGroup label="Description">
                    <textarea className="prop-input h-24 resize-none" value={meta.description || ''} onChange={e => onChange({ description: e.target.value })} />
                </NexFormGroup>
                
                <div className="h-px bg-slate-200"></div>
                
                {/* SWIMLANES CONFIG */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Layers size={14}/> Swimlanes</h4>
                        <button onClick={addLane} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Plus size={14}/></button>
                    </div>
                    <div className="space-y-3">
                        {(meta.lanes || []).map((lane, idx) => (
                            <div key={lane.id} className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-2 relative group">
                                <button onClick={() => removeLane(lane.id)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                <input className="prop-input text-xs font-bold" value={lane.name} onChange={e => updateLane(lane.id, { name: e.target.value })} placeholder="Lane Name" />
                                <div className="grid grid-cols-2 gap-2">
                                    <select className="prop-input text-xs" value={lane.roleId || ''} onChange={e => updateLane(lane.id, { roleId: e.target.value })}>
                                        <option value="">No Role</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    <select className="prop-input text-xs" value={lane.color} onChange={e => updateLane(lane.id, { color: e.target.value as any })}>
                                        <option value="slate">Slate</option>
                                        <option value="blue">Blue</option>
                                        <option value="emerald">Emerald</option>
                                        <option value="amber">Amber</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 w-12">Height:</span>
                                    <input type="range" min="200" max="800" step="50" value={lane.height} onChange={e => updateLane(lane.id, { height: parseInt(e.target.value) })} className="flex-1 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer" />
                                    <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{lane.height}px</span>
                                </div>
                            </div>
                        ))}
                        {(meta.lanes || []).length === 0 && <div className="text-[10px] text-slate-400 italic text-center py-2">No lanes defined. Steps float freely.</div>}
                    </div>
                </div>

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
  isValidConnection,
  lanes
}: any) => {
  return (
    <div className="h-full w-full relative" onDrop={onDrop} onDragOver={onDragOver}>
      {/* Swimlane Layer */}
      {lanes && lanes.length > 0 && <SwimlaneRenderer lanes={lanes} width={3000} />}
      
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
        <Background color="#cbd5e1" gap={GRID_SIZE} variant={BackgroundVariant.Dots} style={{ opacity: 0.3 }} />
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

// Main Content Component (Separated to allow ReactFlowProvider wrap)
const ProcessDesignerContent: React.FC = () => {
  const { deployProcess, roles, addNotification, designerDraft, setDesignerDraft, navigateTo, processes, nav, currentUser } = useBPM();
  
  // React Flow State (Safe to use here as this component is wrapped in ReactFlowProvider)
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
      domainId: currentUser?.domainId || 'GLOBAL',
      lanes: []
  });
  
  // UI State
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'canvas' | 'hierarchy'>('canvas');
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
                  domainId: existing.domainId,
                  lanes: existing.lanes || []
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

  // Auto-Fix Feature
  const handleAutoFix = useCallback(() => {
      let fixesApplied = 0;
      let newNodes = [...nodes];
      let newEdges = [...edges];

      // 1. Ensure Start Node
      if (!newNodes.some(n => n.data.step.type === 'start')) {
          const startId = `node-start-${Date.now()}`;
          const startNode: Node = {
              id: startId,
              type: 'custom',
              position: { x: 50, y: 150 },
              data: { step: { id: startId, name: 'Start', type: 'start', description: 'Auto-added start' } }
          };
          newNodes = [startNode, ...newNodes];
          fixesApplied++;
          
          // Connect start to first node if exists
          if (newNodes.length > 1) {
              const target = newNodes[1];
              newEdges.push({ id: `edge-fix-${Date.now()}`, source: startId, target: target.id, type: 'custom' });
          }
      }

      // 2. Ensure End Node
      if (!newNodes.some(n => n.data.step.type === 'end')) {
          // Find node with no outgoing edges
          const sources = new Set(newEdges.map(e => e.source));
          const leafNodes = newNodes.filter(n => !sources.has(n.id) && n.data.step.type !== 'start');
          
          const endId = `node-end-${Date.now()}`;
          const endNode: Node = {
              id: endId,
              type: 'custom',
              position: { x: 800, y: 150 }, // Default position, layout will fix
              data: { step: { id: endId, name: 'End', type: 'end', description: 'Auto-added end' } }
          };
          newNodes.push(endNode);
          fixesApplied++;

          // Connect leaves to End
          leafNodes.forEach((leaf, idx) => {
              newEdges.push({ id: `edge-fix-end-${idx}-${Date.now()}`, source: leaf.id, target: endId, type: 'custom' });
          });
      }

      if (fixesApplied > 0) {
          // Apply layout to cleanup the mess
          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, 'LR');
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          addNotification('success', `Auto-fix applied: Added ${fixesApplied} missing elements and reorganized.`);
      } else {
          addNotification('info', 'Structure appears valid. Re-running layout.');
          onLayout('LR');
      }
  }, [nodes, edges, setNodes, setEdges, addNotification, onLayout]);

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
    if (!rightOpen) setRightOpen(true);
  }, [setNodes, rightOpen]);

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
        setRightOpen(true);
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

  // When node selected, ensure right panel is open
  useEffect(() => {
      if (selectedNodeId && !rightOpen) {
          setRightOpen(true);
      }
  }, [selectedNodeId]);

  return (
      <div 
        className="flex flex-col bg-panel border border-default rounded-base shadow-sm overflow-hidden"
        style={{ 
          height: 'calc(100vh - 100px)',
          borderRadius: 'var(--radius-base)' 
        }}
      >
        {/* 1. Rigid Toolbar */}
        <div 
          className="bg-subtle border-b border-default flex items-center justify-between shrink-0"
          style={{ 
            height: 'var(--header-height)', 
            paddingLeft: 'var(--layout-padding)', 
            paddingRight: 'var(--layout-padding)' 
          }}
        >
           <div className="flex items-center" style={{ gap: 'var(--space-base)' }}>
              <button 
                onClick={() => setLeftOpen(!leftOpen)} 
                className={`p-1 rounded-base hover:bg-white border border-transparent hover:border-subtle ${leftOpen ? 'text-blue-600' : 'text-secondary'}`}
                title="Toggle Library"
              >
                <LayoutPanelLeft size={16}/>
              </button>
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
           
           {/* Center Controls */}
           <div className="flex items-center p-0.5 rounded-base border border-default bg-slate-200/50" style={{ gap: 'calc(var(--space-base) * 0.5)' }}>
              <button 
                onClick={() => setViewMode('canvas')}
                className={`flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-medium transition-all ${viewMode === 'canvas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Grid size={14}/> Canvas
              </button>
              <button 
                onClick={() => setViewMode('hierarchy')}
                className={`flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-medium transition-all ${viewMode === 'hierarchy' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ListTree size={14}/> Hierarchy
              </button>
           </div>

           <div className="flex items-center" style={{ gap: 'var(--space-base)' }}>
              <input className="h-7 w-48 bg-panel border border-default rounded-base px-2 text-xs hidden lg:block" placeholder="Describe workflow for AI generation..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiGenerate(e)} disabled={isGenerating}/>
              
              <button 
                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-base border border-transparent hover:border-amber-200 transition-all" 
                onClick={handleAutoFix} 
                title="Auto-Fix Structure"
              >
                <Wand2 size={16}/>
              </button>

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
              
              <div className="h-4 w-px bg-default mx-1"></div>
              
              <button 
                onClick={() => setRightOpen(!rightOpen)} 
                className={`p-1 rounded-base hover:bg-white border border-transparent hover:border-subtle ${rightOpen ? 'text-blue-600' : 'text-secondary'}`}
                title="Toggle Properties"
              >
                <PanelRight size={16}/>
              </button>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 2. Palette (Standard Sidebar) - Collapsible */}
          <div className={`border-r border-default bg-subtle overflow-y-auto z-10 transition-all duration-300 ${leftOpen ? 'w-56' : 'w-0 border-none'}`}>
             <PaletteSidebar onAddNode={(type) => addNode(type)} />
          </div>

          {/* 3. Main View Area (Canvas OR Hierarchy) */}
          <div className="flex-1 h-full bg-canvas relative">
             {viewMode === 'canvas' ? (
                 <DesignerFlow 
                    nodes={nodes}
                    edges={edges}
                    lanes={processMeta.lanes}
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
             ) : (
                 <HierarchyView 
                    nodes={nodes} 
                    edges={edges} 
                    onSelectNode={setSelectedNodeId}
                    selectedNodeId={selectedNodeId}
                 />
             )}
          </div>

          {/* 4. Properties (Flexible Right Panel) - Collapsible */}
          <div className={`flex-none border-l border-default bg-panel overflow-hidden shadow-xl z-20 transition-all duration-300 ease-in-out ${rightOpen ? '' : '!w-0 !border-l-0'}`}>
             {selectedStep ? (
               <PropertiesPanel step={selectedStep} onUpdate={updateSelectedStep} onDelete={deleteNode} roles={roles} onClose={() => setRightOpen(false)} />
             ) : (
               <ProcessSettingsPanel meta={processMeta} onChange={upd => setProcessMeta(prev => ({ ...prev, ...upd }))} onClose={() => setRightOpen(false)} roles={roles} />
             )}
          </div>
        </div>

        {/* Context Menu Overlay (Only on Canvas mode effectively) */}
        {contextMenu && viewMode === 'canvas' && (
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

// Export the Wrapped Component
export const ProcessDesigner: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ProcessDesignerContent />
    </ReactFlowProvider>
  );
};