import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from 'reactflow';
import { X } from 'lucide-react';
import { useBPM } from '../../contexts/BPMContext';

export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  selected
}: EdgeProps) => {
  const { setDesignerDraft } = useBPM();
  // Using SmoothStep for orthogonal-like routing which is standard in BPMN
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Function to delete edge (logic would typically be passed down or handled via context in full implementation)
  // For now, we rely on the parent selection deletion, but this demonstrates the UI capability
  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    // In a real implementation, we would dispatch a delete action here
    // For now, it selects the edge
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: selected ? 2 : 1.5, stroke: selected ? '#2563eb' : '#64748b' }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {label && (
            <div 
                className="px-2 py-1 border border-slate-200 shadow-sm text-slate-600 font-mono text-[9px]"
                style={{ 
                    backgroundColor: 'var(--component-bg)', 
                    borderRadius: 'var(--radius-base)' 
                }}
            >
              {label}
            </div>
          )}
          {selected && (
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-500 text-white rounded-full p-0.5 shadow-sm cursor-pointer hover:scale-110 transition-transform" title="Delete Connection">
                 {/* This button is purely visual in this demo until we wire the delete handler directly */}
                 <X size={10} />
             </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};