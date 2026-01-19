
import React, { useMemo } from 'react';
import { Node, Edge } from 'reactflow';
import { ProcessStepType } from '../../types';
import { getStepTypeMetadata } from './designerUtils';
import { ChevronRight, AlertCircle, CornerDownRight } from 'lucide-react';

interface HierarchyViewProps {
  nodes: Node[];
  edges: Edge[];
  onSelectNode: (id: string) => void;
  selectedNodeId: string | null;
}

export const HierarchyView: React.FC<HierarchyViewProps> = ({ nodes, edges, onSelectNode, selectedNodeId }) => {
  
  // Build a graph adjacency list for traversal
  const graph = useMemo(() => {
    const adj: Record<string, string[]> = {};
    const incoming: Record<string, number> = {};
    
    nodes.forEach(n => {
      adj[n.id] = [];
      incoming[n.id] = 0;
    });

    edges.forEach(e => {
      if (adj[e.source]) adj[e.source].push(e.target);
      if (incoming[e.target] !== undefined) incoming[e.target]++;
    });

    return { adj, incoming };
  }, [nodes, edges]);

  // Find root nodes (Start events or nodes with no incoming edges)
  const roots = useMemo(() => {
    const startNodes = nodes.filter(n => n.data.step.type === 'start');
    if (startNodes.length > 0) return startNodes;
    
    // Fallback: Return nodes with 0 incoming edges
    return nodes.filter(n => graph.incoming[n.id] === 0);
  }, [nodes, graph]);

  // Recursive Tree Renderer
  const renderTree = (nodeId: string, depth: number = 0, visited: Set<string> = new Set()) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const { icon: Icon, color } = getStepTypeMetadata(node.data.step.type);
    const isSelected = selectedNodeId === nodeId;
    const hasChildren = graph.adj[nodeId] && graph.adj[nodeId].length > 0;
    
    // Cycle detection
    if (visited.has(nodeId)) {
      return (
        <div key={`${nodeId}-cycle-${depth}`} style={{ marginLeft: depth * 24 }} className="flex items-center gap-2 p-2 text-xs text-slate-400 italic">
           <CornerDownRight size={12} />
           <span>Link back to {node.data.step.name} (Loop)</span>
        </div>
      );
    }

    const newVisited = new Set(visited).add(nodeId);

    return (
      <div key={nodeId} className="flex flex-col">
        <div 
          onClick={() => onSelectNode(nodeId)}
          className={`flex items-center gap-3 p-2 rounded-sm border mb-1 cursor-pointer transition-all ${
            isSelected 
              ? 'bg-blue-50 border-blue-300 shadow-sm' 
              : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
          }`}
          style={{ marginLeft: depth * 24 }}
        >
          {depth > 0 && <CornerDownRight size={14} className="text-slate-300" />}
          <div className={`p-1.5 rounded-sm ${isSelected ? 'bg-white' : 'bg-slate-100'} border border-slate-200`}>
             <Icon size={14} className={color} />
          </div>
          <div className="flex-1 min-w-0">
             <div className={`text-xs font-bold truncate ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
               {node.data.step.name}
             </div>
             <div className="text-[10px] text-slate-400 font-mono flex gap-2">
                <span>{node.data.step.type}</span>
                {node.data.step.id && <span>#{node.data.step.id.slice(-4)}</span>}
             </div>
          </div>
          <ChevronRight size={14} className={`text-slate-300 transition-transform ${hasChildren ? '' : 'opacity-0'}`} />
        </div>
        
        {graph.adj[nodeId]?.map(childId => renderTree(childId, depth + 1, newVisited))}
      </div>
    );
  };

  // Identify detached nodes (Islands)
  const renderedIds = new Set<string>();
  const traverseMark = (id: string) => {
      if(renderedIds.has(id)) return;
      renderedIds.add(id);
      graph.adj[id]?.forEach(traverseMark);
  }
  roots.forEach(r => traverseMark(r.id));
  
  const detachedNodes = nodes.filter(n => !renderedIds.has(n.id));

  return (
    <div className="h-full overflow-y-auto p-4 bg-slate-50/50">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Main Flow */}
        <section>
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Main Sequence</h3>
           <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm min-h-[100px]">
              {roots.length === 0 ? (
                <div className="text-center text-slate-400 text-xs italic py-8">Canvas is empty.</div>
              ) : (
                roots.map(r => renderTree(r.id))
              )}
           </div>
        </section>

        {/* Detached / Orphan Nodes */}
        {detachedNodes.length > 0 && (
          <section>
             <div className="flex items-center gap-2 mb-3">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Disconnected Elements</h3>
               <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{detachedNodes.length}</span>
             </div>
             <div className="bg-amber-50/50 border border-amber-200 border-dashed rounded-sm p-4">
                {detachedNodes.map(node => {
                   const { icon: Icon, color } = getStepTypeMetadata(node.data.step.type);
                   return (
                     <div 
                        key={node.id}
                        onClick={() => onSelectNode(node.id)}
                        className={`flex items-center gap-3 p-2 rounded-sm border mb-1 cursor-pointer bg-white ${selectedNodeId === node.id ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                     >
                        <AlertCircle size={14} className="text-amber-500" />
                        <div className="p-1 rounded-sm bg-slate-50">
                           <Icon size={14} className={color} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{node.data.step.name}</span>
                     </div>
                   );
                })}
             </div>
          </section>
        )}
      </div>
    </div>
  );
};
