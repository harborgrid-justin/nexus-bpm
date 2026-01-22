
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Node, Edge, Controls, Background, MiniMap, Connection, addEdge, MarkerType, BackgroundVariant, NodeChange, EdgeChange, Panel, ReactFlowProvider, applyNodeChanges, applyEdgeChanges
} from 'reactflow';
import dagre from 'dagre';
import { ProcessStep, ProcessLink, ProcessStepType, ProcessDefinition, Swimlane, UserRole } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Save, LayoutPanelLeft, Trash2, Layout, Settings, PanelRight, X, Layers, Plus, AlertTriangle, ShieldAlert,
  Undo, Redo, PlayCircle, StopCircle, StickyNote, MousePointer, Hand, Code, Forward, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';
import { PaletteSidebar } from './designer/PaletteSidebar';
import { NodeComponent } from './designer/NodeComponent';
import { CustomEdge } from './designer/CustomEdge';
import { PropertiesPanel } from './designer/PropertiesPanel';
import { CanvasContextMenu } from './designer/CanvasContextMenu';
import { HierarchyView } from './designer/HierarchyView';
import { SwimlaneRenderer } from './designer/SwimlaneRenderer';
import { getStepTypeMetadata } from './designer/designerUtils';
import { NexFormGroup, NexModal, NexButton } from './shared/NexUI';
import { validateStepConfiguration } from './designer/stepSchemas';
import useUndoRedo from './hooks/useUndoRedo';
import { useMediaQuery, BREAKPOINTS } from './hooks/useMediaQuery';

const nodeTypes = { custom: NodeComponent };
const edgeTypes = { custom: CustomEdge };
const GRID_SIZE = 20;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

// --- Helper for Dagre Layout ---
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

// --- Process Settings Panel ---
const ProcessSettingsPanel: React.FC<{
    meta: Partial<ProcessDefinition>;
    onChange: (upd: Partial<ProcessDefinition>) => void;
    onClose: () => void;
    roles: UserRole[];
}> = ({ meta, onChange, onClose, roles }) => {
    const addLane = () => { onChange({ lanes: [...(meta.lanes || []), { id: `lane-${Date.now()}`, name: 'New Lane', height: 300, color: 'slate' }] }); };
    const updateLane = (id: string, updates: Partial<Swimlane>) => { onChange({ lanes: (meta.lanes || []).map(l => l.id === id ? { ...l, ...updates } : l) }); };
    const removeLane = (id: string) => { onChange({ lanes: (meta.lanes || []).filter(l => l.id !== id) }); };

    return (
        <aside className="w-full h-full bg-white flex flex-col">
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
                <NexFormGroup label="Compliance Level">
                    <select className="prop-input" value={meta.complianceLevel} onChange={e => onChange({ complianceLevel: e.target.value as any })}>
                        <option value="Standard">Standard</option>
                        <option value="Strict">Strict (Audit Log Enforced)</option>
                        <option value="Critical">Critical (Dual Approval)</option>
                    </select>
                </NexFormGroup>
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
                                <select className="prop-input text-xs" value={lane.color} onChange={e => updateLane(lane.id, { color: e.target.value as any })}>
                                    <option value="slate">Slate (Default)</option>
                                    <option value="blue">Blue (Core)</option>
                                    <option value="emerald">Emerald (Success)</option>
                                    <option value="amber">Amber (Warning)</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
};

const DesignerFlow = ({ 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick, onContextMenu, onDrop, onDragOver, onLayout, isValidConnection, lanes,
    simulationActive, activeSimNodeId, viewMode, setViewMode, selectionMode, setSelectionMode 
}: any) => {
    return (
        <div className="h-full w-full relative" onDrop={onDrop} onDragOver={onDragOver}>
            {lanes && lanes.length > 0 && <SwimlaneRenderer lanes={lanes} width={3000} />}
            <ReactFlow 
                nodes={simulationActive ? nodes.map((n: Node) => ({ ...n, data: { ...n.data, isSimulating: n.id === activeSimNodeId } })) : nodes} 
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
                panOnDrag={selectionMode === 'pan'}
                selectionOnDrag={selectionMode === 'select'}
                selectionMode={selectionMode === 'select' ? 1 : 0} 
                onlyRenderVisibleElements={true}
                attributionPosition="bottom-right"
            >
                <Background color="#cbd5e1" gap={GRID_SIZE} variant={BackgroundVariant.Dots} style={{ opacity: 0.3 }} />
                <Controls className="bg-white border border-slate-200 shadow-sm rounded-base text-slate-600" />
                <MiniMap 
                    className="border border-slate-200 shadow-sm rounded-base hidden sm:block" 
                    nodeColor={(n) => {
                        if (n.data?.step?.type === 'start') return '#10b981';
                        if (n.data?.step?.type === 'end') return '#ef4444';
                        return '#e2e8f0';
                    }} 
                    maskColor="rgb(248, 250, 252, 0.7)" 
                    zoomable
                    pannable
                />
                <Panel position="top-right" className="flex flex-col gap-2">
                    <div className="bg-white p-1 rounded-sm shadow-sm border border-slate-200 flex gap-1">
                        <button onClick={() => setSelectionMode('pan')} className={`p-1.5 rounded transition-colors ${selectionMode === 'pan' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-500'}`} title="Pan Tool (Space)"><Hand size={16}/></button>
                        <button onClick={() => setSelectionMode('select')} className={`p-1.5 rounded transition-colors ${selectionMode === 'select' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-500'}`} title="Selection Tool (V)"><MousePointer size={16}/></button>
                    </div>
                    <div className="bg-white p-1 rounded-sm shadow-sm border border-slate-200 flex gap-1">
                        <button onClick={() => onLayout('TB')} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Vertical Layout"><Layout size={16} className="rotate-90"/></button>
                        <button onClick={() => onLayout('LR')} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Horizontal Layout"><Layout size={16}/></button>
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
};

export const ProcessDesigner: React.FC = () => {
  const { deployProcess, roles, addNotification, designerDraft, setDesignerDraft, nav, currentUser, processes, setToolbarConfig } = useBPM();
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  
  const { state: flowState, set: setFlowState, undo, redo, canUndo, canRedo } = useUndoRedo({ nodes: [] as Node[], edges: [] as Edge[] });
  const { nodes, edges } = flowState;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ position: { x: number; y: number }, targetId: string | null } | null>(null);
  const [processMeta, setProcessMeta] = useState<Partial<ProcessDefinition>>({ name: 'Strategic Workflow', description: '', version: 1, complianceLevel: 'Standard', domainId: currentUser?.domainId || 'GLOBAL', lanes: [] });
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'canvas' | 'hierarchy'>('canvas');
  const [selectionMode, setSelectionMode] = useState<'pan' | 'select'>('pan');
  const [clipboard, setClipboard] = useState<ProcessStep | null>(null);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [bpmnXml, setBpmnXml] = useState('');
  
  // Validation State
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationPanel, setShowValidationPanel] = useState(true);
  
  // Simulation Controls
  const [simulationActive, setSimulationActive] = useState(false);
  const [simStepId, setSimStepId] = useState<string | null>(null);

  const flowStateRef = useRef(flowState);
  const processMetaRef = useRef(processMeta);
  const deployProcessRef = useRef(deployProcess);
  const addNotificationRef = useRef(addNotification);
  
  useEffect(() => {
      flowStateRef.current = flowState;
      processMetaRef.current = processMeta;
      deployProcessRef.current = deployProcess;
      addNotificationRef.current = addNotification;
  }, [flowState, processMeta, deployProcess, addNotification]);

  useEffect(() => {
      if (isMobile) { setLeftOpen(false); setRightOpen(false); }
  }, [isMobile]);

  useEffect(() => {
      const handler = setTimeout(() => {
          const { nodes: curNodes, edges: curEdges } = flowStateRef.current;
          const meta = processMetaRef.current;
          
          const steps: ProcessStep[] = curNodes.map(n => ({ ...n.data.step, position: n.position, id: n.id }));
          const links: ProcessLink[] = curEdges.map(e => ({ id: e.id, sourceId: e.source, targetId: e.target, label: e.label as string }));
          
          setDesignerDraft({ steps, links });
          localStorage.setItem('nexflow_draft', JSON.stringify({ steps, links, meta }));
      }, 2000);
      return () => clearTimeout(handler);
  }, [setDesignerDraft, nodes, edges, processMeta]);

  useEffect(() => {
      if (nav.selectedId && nav.view === 'designer') {
          const existing = processes.find(p => p.id === nav.selectedId);
          if (existing) {
              setProcessMeta({ id: existing.id, name: existing.name, description: existing.description, version: existing.version, complianceLevel: existing.complianceLevel, domainId: existing.domainId, lanes: existing.lanes || [] });
              setFlowState({
                  nodes: existing.steps.map(s => ({ id: s.id, type: 'custom', position: s.position || { x: 0, y: 0 }, data: { step: s } })),
                  edges: (existing.links || []).map(l => ({ id: l.id, source: l.sourceId, target: l.targetId, type: 'custom', label: l.label, markerEnd: { type: MarkerType.ArrowClosed } }))
              });
              return; 
          }
      }
      const saved = localStorage.getItem('nexflow_draft');
      if (saved && !nav.selectedId) {
          const parsed = JSON.parse(saved);
          setFlowState({
              nodes: parsed.steps.map((s: ProcessStep) => ({ id: s.id, type: 'custom', position: s.position, data: { step: s } })),
              edges: parsed.links.map((l: ProcessLink) => ({ id: l.id, source: l.sourceId, target: l.targetId, type: 'custom', label: l.label, markerEnd: { type: MarkerType.ArrowClosed } }))
          });
          setProcessMeta(parsed.meta);
      }
  }, [nav.selectedId, processes, setFlowState, nav.view]);

  // Real-time Validation
  useEffect(() => {
      const errors: string[] = [];
      const startNodes = nodes.filter(n => n.data.step.type === 'start');
      const endNodes = nodes.filter(n => n.data.step.type === 'end' || n.data.step.type === 'terminate-end');

      if (startNodes.length === 0) errors.push("Workflow must have at least one 'Start' event.");
      if (endNodes.length === 0) errors.push("Workflow must have at least one 'End' or 'Terminate' event.");

      const sourceIds = new Set(edges.map(e => e.source));
      const targetIds = new Set(edges.map(e => e.target));

      nodes.forEach(node => {
          const type = node.data.step.type;
          if (type === 'note') return; 
          
          if (type !== 'end' && type !== 'terminate-end' && !sourceIds.has(node.id)) {
              errors.push(`Step '${node.data.step.name}' has no outgoing connections (Dead End).`);
          }
          if (type !== 'start' && !targetIds.has(node.id)) {
              errors.push(`Step '${node.data.step.name}' is unreachable (Orphan).`);
          }
      });
      setValidationErrors(errors);
  }, [nodes, edges]);

  const handleDeploy = useCallback(async () => {
    if (validationErrors.length > 0) {
        addNotificationRef.current('error', 'Please resolve validation issues before deploying.');
        return;
    }
    const { nodes, edges } = flowStateRef.current;
    const meta = processMetaRef.current;

    const steps: ProcessStep[] = nodes.map(n => ({ ...n.data.step, position: n.position, nextStepIds: edges.filter(e => e.source === n.id).map(e => e.target) }));
    const links: ProcessLink[] = edges.map(e => ({ id: e.id, sourceId: e.source, targetId: e.target, label: e.label as string }));
    
    try {
        await deployProcessRef.current({ ...meta, steps, links, isActive: true, version: (meta.version || 1) + 1 });
        addNotificationRef.current('success', `Process ${meta.name} deployed successfully.`);
    } catch (e: any) {
        addNotificationRef.current('error', e.message || 'Deployment failed');
    }
  }, [validationErrors]);

  const handleClear = useCallback(() => { if(window.confirm('Clear canvas?')) { setFlowState({ nodes: [], edges: [] }); } }, [setFlowState]);
  const handleLayout = useCallback((direction: 'LR' | 'TB') => {
      const { nodes, edges } = flowStateRef.current;
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
      setFlowState({ nodes: layoutedNodes, edges: layoutedEdges });
  }, [setFlowState]);

  const handleSyncIDE = useCallback(() => {
      // Round-Trip Engineering Sim
      addNotification('info', 'Syncing from JDeveloper / Git...');
      setTimeout(() => {
          // Simulate slight change
          setProcessMeta(p => ({ ...p, version: (p.version || 1) + 0.1 }));
          addNotification('success', 'Changes pulled from IDE.');
      }, 1500);
  }, [addNotification]);

  const startSimulation = () => {
      const startNode = nodes.find(n => n.data.step.type === 'start');
      if (startNode) {
          setSimStepId(startNode.id);
          setSimulationActive(true);
      } else {
          addNotification('error', 'No Start Node found.');
      }
  };

  const stopSimulation = () => {
      setSimulationActive(false);
      setSimStepId(null);
  };

  const stepSimulation = () => {
      if (!simStepId) return;
      const outgoing = edges.filter(e => e.source === simStepId);
      if (outgoing.length === 0) {
          addNotification('info', 'Simulation End Reached');
          stopSimulation();
      } else {
          const next = outgoing[Math.floor(Math.random() * outgoing.length)].target;
          setSimStepId(next);
      }
  };

  const generateBPMN = () => {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions>\n  <bpmn:process id="${processMeta.id || 'proc_1'}" isExecutable="true">\n`;
      nodes.forEach(n => {
          xml += `    <bpmn:task id="${n.id}" name="${n.data.step.name}" />\n`;
      });
      edges.forEach(e => {
          xml += `    <bpmn:sequenceFlow id="${e.id}" sourceRef="${e.source}" targetRef="${e.target}" />\n`;
      });
      xml += `  </bpmn:process>\n</bpmn:definitions>`;
      setBpmnXml(xml);
      setShowXmlModal(true);
  };

  useEffect(() => {
      setToolbarConfig({
          file: [
              { label: 'Save Draft', action: () => addNotificationRef.current('info', 'Draft saved locally.') },
              { label: 'Sync from IDE', action: handleSyncIDE, icon: RefreshCw },
              { label: 'Deploy Process', action: handleDeploy, shortcut: 'Ctrl+S' },
              { label: 'Clear Canvas', action: handleClear, divider: true },
          ],
          edit: [
              { label: 'Undo', action: undo, disabled: !canUndo, shortcut: 'Ctrl+Z' },
              { label: 'Redo', action: redo, disabled: !canRedo, shortcut: 'Ctrl+Y' },
          ],
          view: [
              { label: 'Auto Layout (Horizontal)', action: () => handleLayout('LR') },
              { label: 'Auto Layout (Vertical)', action: () => handleLayout('TB') },
              { label: 'Toggle Hierarchy View', action: () => setViewMode(m => m === 'canvas' ? 'hierarchy' : 'canvas') },
              { label: 'View BPMN XML', action: generateBPMN }
          ],
          tools: [
              { label: 'Validate Integrity', action: () => setShowValidationPanel(true) }
          ]
      });
  }, [setToolbarConfig, handleDeploy, handleClear, handleLayout, undo, redo, canUndo, canRedo, handleSyncIDE]);

  // --- Node Operations ---
  const onNodesChange = useCallback((changes: NodeChange[]) => setFlowState({ nodes: applyNodeChanges(changes, nodes), edges }), [nodes, edges, setFlowState]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setFlowState({ nodes, edges: applyEdgeChanges(changes, edges) }), [nodes, edges, setFlowState]);
  const addNode = useCallback((type: ProcessStepType | 'note', position?: { x: number, y: number }) => {
    const metadata = getStepTypeMetadata(type);
    const id = `node-${Date.now()}`;
    const newNode: Node = { id, type: 'custom', position: position || { x: 250, y: 250 }, data: { step: { id, name: metadata.defaultName, type: type as ProcessStepType, description: '', requiredSkills: metadata.defaultSkills || [], data: {} } } };
    setFlowState({ nodes: [...nodes, newNode], edges });
    setSelectedNodeId(id);
    if (!rightOpen && type !== 'note') setRightOpen(true);
    if (isMobile) setLeftOpen(false);
  }, [nodes, edges, rightOpen, setFlowState, isMobile]);

  const deleteNode = useCallback((id: string) => { setFlowState({ nodes: nodes.filter((n) => n.id !== id), edges: edges.filter((e) => e.source !== id && e.target !== id) }); setSelectedNodeId(null); }, [nodes, edges, setFlowState]);
  const onConnect = useCallback((params: Connection) => { const newEdge = { ...params, id: `e-${Date.now()}`, type: 'custom', markerEnd: { type: MarkerType.ArrowClosed } }; setFlowState({ nodes, edges: addEdge(newEdge, edges) }); }, [nodes, edges, setFlowState]);

  const handleMenuAction = (action: string, payload?: unknown) => {
    if (!contextMenu) return;
    const { targetId } = contextMenu;
    switch (action) {
      case 'delete': if (targetId) deleteNode(targetId); break;
      case 'duplicate': 
        if (targetId) {
            const original = nodes.find(n => n.id === targetId);
            if (original) {
                const newStep = { ...original.data.step, id: `node-${Date.now()}`, name: `${original.data.step.name} (Copy)` };
                const newNode = { ...original, id: newStep.id, position: { x: original.position.x + 20, y: original.position.y + 20 }, data: { ...original.data, step: newStep } };
                setFlowState({ nodes: [...nodes, newNode], edges });
            }
        }
        break;
      case 'copy': if (targetId) { const node = nodes.find(n => n.id === targetId); if (node) { setClipboard(node.data.step); addNotification('info', 'Copied to clipboard'); } } break;
      case 'paste': if (clipboard) { const id = `node-${Date.now()}`; const newStep = { ...clipboard, id, name: `${clipboard.name} (Copy)` }; const newNode = { id, type: 'custom', position: { x: contextMenu.position.x, y: contextMenu.position.y }, data: { step: newStep } }; setFlowState({ nodes: [...nodes, newNode], edges }); } break;
      case 'disconnect': if (targetId) setFlowState({ nodes, edges: edges.filter(e => e.source !== targetId && e.target !== targetId) }); break;
      case 'add-node': addNode(payload as ProcessStepType, { x: contextMenu.position.x, y: contextMenu.position.y }); break;
      case 'clear-canvas': handleClear(); break;
    }
    setContextMenu(null);
  };

  const onDrop = useCallback((event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = { x: event.clientX - reactFlowBounds.left - 100, y: event.clientY - reactFlowBounds.top - 40 };
      addNode(type as ProcessStepType | 'note', position);
  }, [addNode]);

  const updateSelectedStep = useCallback((updatedStep: ProcessStep) => { setFlowState({ nodes: nodes.map((n) => { if (n.id === updatedStep.id) { return { ...n, data: { ...n.data, step: updatedStep } }; } return n; }), edges }); }, [nodes, edges, setFlowState]);
  const selectedStep = useMemo(() => { const node = nodes.find(n => n.id === selectedNodeId); return node ? node.data.step : undefined; }, [selectedNodeId, nodes]);

  return (
      <ReactFlowProvider>
      <div className="flex flex-col bg-panel border border-default rounded-base shadow-sm overflow-hidden h-full">
        <div className="bg-subtle border-b border-default flex items-center justify-between shrink-0" style={{ height: 'var(--header-height)', padding: '0 var(--layout-padding)' }}>
           <div className="flex items-center" style={{ gap: 'var(--space-base)' }}>
              <button onClick={() => setLeftOpen(!leftOpen)} className={`p-1 rounded-base hover:bg-white border border-transparent hover:border-subtle ${leftOpen ? 'text-blue-600' : 'text-secondary'}`}><LayoutPanelLeft size={16}/></button>
              <div className="h-4 w-px bg-default"></div>
              <input className="bg-transparent text-sm font-bold text-primary w-24 md:w-48 outline-none truncate" value={processMeta.name} onChange={e => setProcessMeta(p => ({ ...p, name: e.target.value }))} />
              
              <div className="hidden md:flex items-center gap-1 ml-4 bg-slate-100 p-1 rounded-sm">
                  <button onClick={undo} disabled={!canUndo} className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"><Undo size={14}/></button>
                  <button onClick={redo} disabled={!canRedo} className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"><Redo size={14}/></button>
              </div>
           </div>
           
           <div className="flex items-center" style={{ gap: 'var(--space-base)' }}>
              {!simulationActive ? (
                  <button onClick={startSimulation} className="hidden md:flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-bold border bg-white text-slate-600 border-slate-300 hover:bg-slate-50">
                      <PlayCircle size={14}/> Test Run
                  </button>
              ) : (
                  <div className="flex bg-slate-800 text-white rounded-sm p-1 gap-1">
                      <button onClick={stepSimulation} className="p-1 hover:bg-white/20 rounded" title="Step Forward"><Forward size={14}/></button>
                      <button onClick={stopSimulation} className="p-1 hover:bg-rose-500 rounded" title="Stop"><StopCircle size={14}/></button>
                  </div>
              )}
              <div className="h-4 w-px bg-default mx-1 hidden md:block"></div>
              <button onClick={generateBPMN} className="p-1 text-secondary hover:text-blue-600 hidden md:block" title="View XML"><Code size={16}/></button>
              <button onClick={handleSyncIDE} className="p-1 text-secondary hover:text-blue-600 hidden md:block" title="Sync IDE"><RefreshCw size={16}/></button>
              <button onClick={() => setFlowState({nodes:[], edges:[]})} className="p-1 text-secondary hover:text-rose-600 hidden md:block"><Trash2 size={16}/></button>
              <button onClick={handleDeploy} className="flex items-center gap-1 px-3 py-1 bg-brand-slate text-white rounded-base text-xs hover:bg-slate-900 shadow-sm"><Save size={14}/> <span className="hidden md:inline">Save</span></button>
              <button onClick={() => setRightOpen(!rightOpen)} className={`p-1 rounded-base hover:bg-white ${rightOpen ? 'text-blue-600' : 'text-secondary'}`}><PanelRight size={16}/></button>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          <div className={`border-r border-default bg-subtle overflow-y-auto z-30 transition-all duration-300 ${leftOpen ? 'w-56' : 'w-0 border-none'} ${isMobile ? 'absolute inset-y-0 left-0 shadow-2xl h-full' : ''}`}>
             <PaletteSidebar onAddNode={(type) => addNode(type)} />
          </div>

          <div className="flex-1 h-full relative z-0 flex flex-col" onContextMenu={(e) => { e.preventDefault(); setContextMenu({ position: { x: e.clientX, y: e.clientY }, targetId: null }); }}>
             <div className="flex-1 relative">
                {viewMode === 'canvas' ? (
                    <DesignerFlow 
                        nodes={nodes} 
                        edges={edges} 
                        onNodesChange={onNodesChange} 
                        onEdgesChange={onEdgesChange} 
                        onConnect={onConnect} 
                        onNodeClick={(e: any, node: Node) => { setSelectedNodeId(node.id); }} 
                        onPaneClick={() => setSelectedNodeId(null)} 
                        onContextMenu={(e: any, node?: Node) => { e.preventDefault(); setContextMenu({ position: { x: e.clientX, y: e.clientY }, targetId: node ? node.id : null }); }} 
                        onDrop={onDrop} 
                        onDragOver={(e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} 
                        onLayout={handleLayout} 
                        isValidConnection={(c: any) => true} 
                        lanes={processMeta.lanes}
                        simulationActive={simulationActive}
                        activeSimNodeId={simStepId} 
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        selectionMode={selectionMode}
                        setSelectionMode={setSelectionMode}
                    />
                ) : (
                    <HierarchyView nodes={nodes} edges={edges} onSelectNode={setSelectedNodeId} selectedNodeId={selectedNodeId} />
                )}
             </div>
             
             {/* --- Validation Footer --- */}
             {showValidationPanel && (
                 <div className="bg-white border-t border-slate-200 h-32 flex flex-col transition-all">
                     <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-200">
                         <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                             {validationErrors.length > 0 ? <AlertCircle size={12} className="text-rose-500"/> : <CheckCircle size={12} className="text-emerald-500"/>}
                             Validation Output
                         </div>
                         <button onClick={() => setShowValidationPanel(false)}><X size={12} className="text-slate-400 hover:text-slate-600"/></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2">
                         {validationErrors.length === 0 ? (
                             <div className="text-emerald-600 text-xs flex items-center gap-2 font-medium">
                                 <CheckCircle size={14}/> No issues detected. Model is compliant.
                             </div>
                         ) : (
                             <ul className="space-y-1">
                                 {validationErrors.map((err, i) => (
                                     <li key={i} className="text-xs text-rose-700 flex items-start gap-2 bg-rose-50/50 p-1 rounded-sm">
                                         <AlertTriangle size={12} className="shrink-0 mt-0.5"/> {err}
                                     </li>
                                 ))}
                             </ul>
                         )}
                     </div>
                 </div>
             )}

             <CanvasContextMenu position={contextMenu ? contextMenu.position : null} targetId={contextMenu ? contextMenu.targetId : null} onClose={() => setContextMenu(null)} onAction={handleMenuAction} />
          </div>

          <div className={`border-l border-default bg-white transition-all duration-300 z-30 shadow-xl overflow-hidden ${rightOpen ? 'w-[320px] md:w-[450px]' : 'w-0'} ${isMobile ? 'absolute inset-y-0 right-0 h-full' : ''}`}>
             {selectedStep ? (
                 <PropertiesPanel step={selectedStep} onUpdate={updateSelectedStep} onDelete={deleteNode} roles={roles} onClose={() => setSelectedNodeId(null)} />
             ) : (
                 <ProcessSettingsPanel meta={processMeta} onChange={setProcessMeta} onClose={() => setRightOpen(false)} roles={roles} />
             )}
          </div>
        </div>

        <NexModal isOpen={showXmlModal} onClose={() => setShowXmlModal(false)} title="BPMN 2.0 XML (Read-Only)" size="lg">
            <textarea className="w-full h-96 p-4 font-mono text-xs bg-slate-900 text-green-400 rounded" value={bpmnXml} readOnly />
        </NexModal>
      </div>
      </ReactFlowProvider>
  );
};
