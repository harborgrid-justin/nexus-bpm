
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
  useReactFlow,
  Panel
} from 'reactflow';
import dagre from 'dagre';
import { ProcessStep, ProcessLink, ProcessStepType } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Save, Sparkles, Cpu, LayoutPanelLeft, Trash2, Thermometer, Layout, Move
} from 'lucide-react';
import { PaletteSidebar } from './designer/PaletteSidebar';
import { NodeComponent } from './designer/NodeComponent';
import { CustomEdge } from './designer/CustomEdge';
import { PropertiesPanel } from './designer/PropertiesPanel';
import { CanvasContextMenu } from './designer/CanvasContextMenu';
import { getStepTypeMetadata } from './designer/designerUtils';
import { generateProcessWorkflow } from '../services/geminiService';

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
    // Dagre returns center point, React Flow needs top-left
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
          type: 'custom', // Use our smart edge
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
  const { deployProcess, roles, addNotification, designerDraft, setDesignerDraft, navigateTo } = useBPM();
  const [processName, setProcessName] = useState('Strategic Workflow');
  
  // React Flow State
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ position: { x: number; y: number }, targetId: string | null } | null>(null);
  
  // UI State
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Sync Draft -> Flow State (Initial Load)
  useEffect(() => {
    if (designerDraft) {
      const initialNodes: Node[] = designerDraft.steps.map(s => ({
        id: s.id,
        type: 'custom',
        position: s.position || { x: 0, y: 0 },
        data: { step: s }
      }));
      
      const initialEdges: Edge[] = designerDraft.links.map(l => ({
        id: l.id,
        source: l.sourceId,
        target: l.targetId,
        type: 'custom',
        label: l.label // support edge labels
      }));

      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, []); // Only runs once on mount

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

  // --- Advanced Handlers ---

  // Connection Validation: Enforce BPMN Rules
  const isValidConnection = useCallback((connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (!sourceNode || !targetNode) return false;

      // Rule 1: Cannot connect FROM an End Event
      if (sourceNode.data.step.type === 'end') return false;

      // Rule 2: Cannot connect TO a Start Event
      if (targetNode.data.step.type === 'start') return false;

      // Rule 3: No self-loops (usually)
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
      if (typeof type === 'undefined' || !type) return;

      // We need to project from screen pixels to React Flow coordinate system
      // Since we are inside the component, we can use simple math or the useReactFlow hook if wrapped properly.
      // For this implementation, we use a basic offset assuming full screen.
      // Ideally use project() from useReactFlow instance.
      const position = {
        x: event.clientX - 300, // Approximate offset for sidebar
        y: event.clientY - 100, // Approximate offset for header
      };
      
      addNode(type as ProcessStepType, position);
    },
    [nodes] // dep
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
        name: processName, 
        steps, 
        links, 
        isActive: true, 
        version: 1 
    });
    addNotification('success', 'Process definition deployed successfully.');
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
        // Convert to Nodes/Edges
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
        
        // Apply Auto Layout immediately after generation for best results
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
        // Payload contains the type string
        // If adding via context menu, use context menu position projected to world
        addNode(payload, { x: 250, y: 250 }); // Simplified placement for context menu add
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
              <input className="bg-transparent text-sm font-bold text-primary w-48 outline-none" value={processName} onChange={e => setProcessName(e.target.value)} />
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
          {selectedStep && (
            <div className="w-72 border-l border-default bg-panel overflow-y-auto shadow-xl z-20">
               <PropertiesPanel step={selectedStep} onUpdate={updateSelectedStep} onDelete={deleteNode} roles={roles} />
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
    </ReactFlowProvider>
  );
};
