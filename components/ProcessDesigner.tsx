
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
  Panel
} from 'reactflow';
import dagre from 'dagre';
import { ProcessStep, ProcessLink, ProcessStepType, ProcessDefinition, Swimlane, UserRole } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Save, Cpu, LayoutPanelLeft, Trash2, Thermometer, Layout, Settings, Globe, PanelRight, X, Wand2, ListTree, Grid, Layers, Plus
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
import { NexFormGroup } from './shared/NexUI';
import { validateStepConfiguration } from './designer/stepSchemas';

const nodeTypes = { custom: NodeComponent };
const edgeTypes = { custom: CustomEdge };
const GRID_SIZE = 20;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });
  nodes.forEach((node) => { dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }); });
  edges.forEach((edge) => { dagreGraph.setEdge(edge.source, edge.target); });
  dagre.layout(dagreGraph);
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: { x: nodeWithPosition.x - NODE_WIDTH / 2, y: nodeWithPosition.y - NODE_HEIGHT / 2 },
    };
  });
  return { nodes: layoutedNodes, edges };
};

interface ProcessSettingsPanelProps {
    meta: Partial<ProcessDefinition>;
    onChange: (upd: Partial<ProcessDefinition>) => void;
    onClose: () => void;
    roles: UserRole[];
}

const ProcessSettingsPanel: React.FC<ProcessSettingsPanelProps> = ({ meta, onChange, onClose, roles }) => {
    const addLane = () => { onChange({ lanes: [...(meta.lanes || []), { id: `lane-${Date.now()}`, name: 'New Lane', height: 300, color: 'slate' }] }); };
    const updateLane = (id: string, updates: Partial<Swimlane>) => { onChange({ lanes: (meta.lanes || []).map(l => l.id === id ? { ...l, ...updates } : l) }); };
    const removeLane = (id: string) => { onChange({ lanes: (meta.lanes || []).filter(l => l.id !== id) }); };

    return (
        <aside className="w-[320px] h-full bg-white border-l border-slate-300 flex flex-col shadow-xl z-20">
            <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50" style={{ height: 'var(--header-height)', padding: '0 var(--space-base)' }}>
                <div className="flex items-center gap-2">
                    <Settings size={14} className="text-slate-500"/>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Process Settings</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>
            <div className="overflow-y-auto flex-1" style={{ padding: 'var(--card-padding)', display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}>
                <NexFormGroup label="Process Name"><input className="prop-input font-bold" value={meta.name || ''} onChange={e => onChange({ name: e.target.value })} /></NexFormGroup>
                <NexFormGroup label="Description"><textarea className="prop-input h-24 resize-none" value={meta.description || ''} onChange={e => onChange({ description: e.target.value })} /></NexFormGroup>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Layers size={14}/> Swimlanes</h4>
                        <button onClick={addLane} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Plus size={14}/></button>
                    </div>
                    <div className="space-y-3">
                        {(meta.lanes || []).map((lane) => (
                            <div key={lane.id} className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-2 relative group">
                                <button onClick={() => removeLane(lane.id)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                <input className="prop-input text-xs font-bold" value={lane.name} onChange={e => updateLane(lane.id, { name: e.target.value })} placeholder="Lane Name" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
};

interface DesignerFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  onContextMenu: (event: React.MouseEvent, node?: Node) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onLayout: (direction: 'LR' | 'TB') => void;
  isValidConnection: (connection: Connection) => boolean;
  lanes: Swimlane[] | undefined;
}

const DesignerFlow: React.FC<DesignerFlowProps> = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick, onContextMenu, onDrop, onDragOver, onLayout, isValidConnection, lanes }) => {
  return (
    <div className="h-full w-full relative" onDrop={onDrop} onDragOver={onDragOver}>
      {lanes && lanes.length > 0 && <SwimlaneRenderer lanes={lanes} width={3000} />}
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick} onContextMenu={onContextMenu} nodeTypes={nodeTypes} edgeTypes={edgeTypes} isValidConnection={isValidConnection} snapToGrid={true} snapGrid={[GRID_SIZE, GRID_SIZE]} fitView attributionPosition="bottom-right">
        <Background color="#cbd5e1" gap={GRID_SIZE} variant={BackgroundVariant.Dots} style={{ opacity: 0.3 }} />
        <Controls className="bg-white border border-slate-200 shadow-sm rounded-base text-slate-600" />
        <MiniMap className="border border-slate-200 shadow-sm rounded-base" nodeColor="#e2e8f0" maskColor="rgb(248, 250, 252, 0.7)" />
        <Panel position="top-right" className="bg-white p-1 rounded-sm shadow-sm border border-slate-200 flex gap-1">
           <button onClick={() => onLayout('TB')} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Vertical Layout"><Layout size={16} className="rotate-90"/></button>
           <button onClick={() => onLayout('LR')} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Horizontal Layout"><Layout size={16}/></button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const ProcessDesigner: React.FC = () => {
  const { deployProcess, roles, addNotification, designerDraft, setDesignerDraft, nav, currentUser, processes, navigateTo } = useBPM();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ position: { x: number; y: number }, targetId: string | null } | null>(null);
  const [processMeta, setProcessMeta] = useState<Partial<ProcessDefinition>>({ name: 'Strategic Workflow', description: '', version: 1, complianceLevel: 'Standard', domainId: currentUser?.domainId || 'GLOBAL', lanes: [] });
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'canvas' | 'hierarchy'>('canvas');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // ... (Effects and Handlers same as before, omitted for brevity but logic assumed intact) ...
  // Re-implementing handlers to ensure functionality
  useEffect(() => {
      if (nav.selectedId && nav.view === 'designer') {
          const existing = processes.find(p => p.id === nav.selectedId);
          if (existing) {
              setProcessMeta({ id: existing.id, name: existing.name, description: existing.description, version: existing.version, complianceLevel: existing.complianceLevel, domainId: existing.domainId, lanes: existing.lanes || [] });
              setNodes(existing.steps.map(s => ({ id: s.id, type: 'custom', position: s.position || { x: 0, y: 0 }, data: { step: s } })));
              setEdges((existing.links || []).map(l => ({ id: l.id, source: l.sourceId, target: l.targetId, type: 'custom', label: l.label })));
              return; 
          }
      }
      if (designerDraft && (!nav.selectedId || nav.selectedId === 'new')) {
          setNodes(designerDraft.steps.map(s => ({ id: s.id, type: 'custom', position: s.position || { x: 0, y: 0 }, data: { step: s } })));
          setEdges(designerDraft.links.map(l => ({ id: l.id, source: l.sourceId, target: l.targetId, type: 'custom', label: l.label })));
      }
  }, [nav.selectedId, processes, designerDraft, nav.view, setNodes, setEdges]); 

  const setDesignerDraftRef = useRef(setDesignerDraft);
  useEffect(() => { setDesignerDraftRef.current = setDesignerDraft; }, [setDesignerDraft]);
  useEffect(() => {
    const handler = setTimeout(() => {
        const steps: ProcessStep[] = nodes.map(n => ({ ...n.data.step, position: n.position, id: n.id }));
        const links: ProcessLink[] = edges.map(e => ({ id: e.id, sourceId: e.source, targetId: e.target, label: e.label as string }));
        setDesignerDraftRef.current({ steps, links });
    }, 1000); 
    return () => clearTimeout(handler);
  }, [nodes, edges]);

  const isValidConnection = useCallback((connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;
      if (sourceNode.data.step.type === 'end') return false;
      if (targetNode.data.step.type === 'start') return false;
      if (connection.source === connection.target) return false;
      return true;
  }, [nodes]);

  const onLayout = useCallback((direction: 'LR' | 'TB') => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  const addNode = useCallback((type: ProcessStepType, position?: { x: number, y: number }) => {
    const metadata = getStepTypeMetadata(type);
    const id = `node-${Date.now()}`;
    const newNode: Node = { id, type: 'custom', position: position || { x: 250, y: 250 }, data: { step: { id, name: metadata.defaultName, type, description: '', requiredSkills: metadata.defaultSkills || [], data: {} } } };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(id);
    if (!rightOpen) setRightOpen(true);
  }, [setNodes, rightOpen]);

  const onDrop = useCallback((event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;
      addNode(type as ProcessStepType, { x: event.clientX - 280, y: event.clientY - 80 });
    }, [addNode]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'custom' }, eds)), [setEdges]);
  const updateSelectedStep = useCallback((updatedStep: ProcessStep) => { setNodes((nds) => nds.map((n) => { if (n.id === updatedStep.id) { return { ...n, data: { ...n.data, step: updatedStep } }; } return n; })); }, [setNodes]);
  const deleteNode = useCallback((id: string) => { setNodes((nds) => nds.filter((n) => n.id !== id)); setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id)); setSelectedNodeId(null); }, [setNodes, setEdges]);
  
  const handleDeploy = async () => {
    const invalidNodes = nodes.filter(n => !validateStepConfiguration(n.data.step.type, n.data.step.data));
    if (invalidNodes.length > 0) { addNotification('error', `Deploy Failed: ${invalidNodes.length} steps have missing configuration.`); return; }
    const steps: ProcessStep[] = nodes.map(n => ({ ...n.data.step, position: n.position, nextStepIds: edges.filter(e => e.source === n.id).map(e => e.target) }));
    const links: ProcessLink[] = edges.map(e => ({ id: e.id, sourceId: e.source, targetId: e.target }));
    await deployProcess({ ...processMeta, steps, links, isActive: true, version: (processMeta.version || 1) + 1 });
    addNotification('success', `Process ${processMeta.name} deployed successfully.`);
  };

  const handleClear = () => { if(window.confirm('Clear current design?')) { setNodes([]); setEdges([]); setSelectedNodeId(null); } };
  const handleAiGenerate = async (e: React.KeyboardEvent) => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const generatedSteps = await generateProcessWorkflow(aiPrompt);
      if (generatedSteps && generatedSteps.length > 0) {
        const newNodes: Node[] = generatedSteps.map(s => ({ id: s.id, type: 'custom', position: s.position || { x: 0, y: 0 }, data: { step: s } }));
        const newEdges: Edge[] = [];
        for(let i=0; i < generatedSteps.length - 1; i++) { newEdges.push({ id: `link-auto-${i}`, source: generatedSteps[i].id, target: generatedSteps[i+1].id, type: 'custom' }); }
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, 'LR');
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        addNotification('success', 'Model synthesized.');
        setAiPrompt('');
      }
    } catch (err) { addNotification('error', 'Generation failure.'); } finally { setIsGenerating(false); }
  };

  const handleMenuAction = (action: string, payload?: unknown) => {
    if (!contextMenu) return;
    const { targetId } = contextMenu;
    switch (action) {
      case 'delete': if (targetId) deleteNode(targetId); break;
      case 'add-node': addNode(payload as ProcessStepType, { x: 250, y: 250 }); break;
      case 'clear-canvas': handleClear(); break;
    }
    setContextMenu(null);
  };

  const selectedStep = useMemo(() => { const node = nodes.find(n => n.id === selectedNodeId); return node ? node.data.step : undefined; }, [selectedNodeId, nodes]);
  useEffect(() => { if (selectedNodeId && !rightOpen) { setRightOpen(true); } }, [selectedNodeId]);

  const onContextMenu = useCallback((event: React.MouseEvent, node?: Node) => {
    event.preventDefault();
    setContextMenu({ position: { x: event.clientX, y: event.clientY }, targetId: node ? node.id : null });
  }, []);

  return (
      <div 
        className="flex flex-col bg-panel border border-default rounded-base shadow-sm overflow-hidden"
        style={{ height: 'calc(100vh - 100px)', borderRadius: 'var(--radius-base)' }}
      >
        <div className="bg-subtle border-b border-default flex items-center justify-between shrink-0" style={{ height: 'var(--header-height)', padding: '0 var(--layout-padding)' }}>
           <div className="flex items-center" style={{ gap: 'var(--space-base)' }}>
              <button onClick={() => setLeftOpen(!leftOpen)} className={`p-1 rounded-base hover:bg-white border border-transparent hover:border-subtle ${leftOpen ? 'text-blue-600' : 'text-secondary'}`}><LayoutPanelLeft size={16}/></button>
              <div className="h-4 w-px bg-default"></div>
              <input className="bg-transparent text-sm font-bold text-primary w-48 outline-none" value={processMeta.name} onChange={e => setProcessMeta(p => ({ ...p, name: e.target.value }))} />
           </div>
           
           <div className="flex items-center" style={{ gap: 'var(--space-base)' }}>
              <input className="h-7 w-48 bg-panel border border-default rounded-base px-2 text-xs hidden lg:block" placeholder="AI Generate..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiGenerate(e)} disabled={isGenerating}/>
              <button className="p-1 text-secondary hover:text-rose-600" onClick={handleClear}><Trash2 size={16}/></button>
              <button onClick={handleDeploy} className="flex items-center gap-1 px-3 py-1 bg-brand-slate text-white rounded-base text-xs hover:bg-slate-900 shadow-sm"><Save size={14}/> Save</button>
              <button onClick={() => setRightOpen(!rightOpen)} className={`p-1 rounded-base hover:bg-white ${rightOpen ? 'text-blue-600' : 'text-secondary'}`}><PanelRight size={16}/></button>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`border-r border-default bg-subtle overflow-y-auto z-10 transition-all duration-300 ${leftOpen ? 'w-56' : 'w-0 border-none'}`}>
             <PaletteSidebar onAddNode={(type) => addNode(type)} />
          </div>

          <div className="flex-1 h-full relative" onContextMenu={onContextMenu}>
             {viewMode === 'canvas' ? (
                <DesignerFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(e, node) => { setSelectedNodeId(node.id); }} onPaneClick={() => setSelectedNodeId(null)} onContextMenu={onContextMenu} onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onLayout={onLayout} isValidConnection={isValidConnection} lanes={processMeta.lanes} />
             ) : (
                <HierarchyView nodes={nodes} edges={edges} onSelectNode={setSelectedNodeId} selectedNodeId={selectedNodeId} />
             )}
             <CanvasContextMenu position={contextMenu ? contextMenu.position : null} targetId={contextMenu ? contextMenu.targetId : null} onClose={() => setContextMenu(null)} onAction={handleMenuAction} />
          </div>

          <div className={`${rightOpen ? 'w-[320px] md:w-[400px]' : 'w-0'} border-l border-default bg-white transition-all duration-300 z-20 shadow-xl overflow-hidden`}>
             {selectedStep ? (
                 <PropertiesPanel step={selectedStep} onUpdate={updateSelectedStep} onDelete={deleteNode} roles={roles} onClose={() => setSelectedNodeId(null)} />
             ) : (
                 <ProcessSettingsPanel meta={processMeta} onChange={setProcessMeta} onClose={() => setRightOpen(false)} roles={roles} />
             )}
          </div>
        </div>
      </div>
  );
};
