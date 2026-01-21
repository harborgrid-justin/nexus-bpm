
import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, MarkerType } from 'reactflow';
import { ProcessDefinition } from '../../types';
import { useBPM } from '../../contexts/BPMContext';
import { interpolateColor } from '../../utils';
import { getStepTypeMetadata } from '../designer/designerUtils';

const HeatmapNode = ({ data }: any) => {
    const { icon: Icon } = getStepTypeMetadata(data.step.type);
    const intensity = data.intensity || 0; // 0 to 1
    
    // Interpolate color from white to hot red/orange based on traffic
    const bg = interpolateColor(intensity, 0, 1, [255, 255, 255], [254, 202, 202]); // White to Red-200
    const border = interpolateColor(intensity, 0, 1, [226, 232, 240], [239, 68, 68]); // Slate-200 to Red-500

    return (
        <div 
            className="w-[180px] p-2 rounded-sm border shadow-sm flex items-center gap-2 relative transition-colors duration-500"
            style={{ backgroundColor: bg, borderColor: border, borderWidth: intensity > 0.5 ? 2 : 1 }}
        >
            <div className="p-1.5 bg-white/50 rounded-sm">
                <Icon size={16} className="text-slate-700"/>
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-800 truncate">{data.step.name}</div>
                <div className="text-[9px] text-slate-500 flex justify-between">
                    <span>{data.stats.totalExecutions} hits</span>
                    {data.stats.errorRate > 0 && <span className="text-rose-600 font-bold">{data.stats.errorRate}% Err</span>}
                </div>
            </div>
            {intensity > 0.8 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse border border-white"></div>
            )}
        </div>
    );
};

const nodeTypes = { custom: HeatmapNode };

export const ProcessHeatmap: React.FC<{ process: ProcessDefinition; mode: 'traffic' | 'errors' }> = ({ process, mode }) => {
    const { getStepStatistics } = useBPM();

    const { nodes, edges } = useMemo(() => {
        // Calculate stats for all steps to normalize
        const stepStats = process.steps.map(s => {
            const stats = getStepStatistics(process.id, s.name);
            return { id: s.id, stats };
        });

        const maxVal = Math.max(...stepStats.map(s => mode === 'traffic' ? s.stats.totalExecutions : s.stats.errorRate), 1);

        const flowNodes: Node[] = process.steps.map(step => {
            const stats = stepStats.find(s => s.id === step.id)?.stats || { totalExecutions: 0, errorRate: 0, avgDuration: 0 };
            const value = mode === 'traffic' ? stats.totalExecutions : stats.errorRate;
            const intensity = Math.min(value / maxVal, 1);

            return {
                id: step.id,
                type: 'custom',
                position: step.position || { x: 0, y: 0 },
                data: { step, stats, intensity, mode }
            };
        });

        const flowEdges: Edge[] = (process.links || []).map(link => ({
            id: link.id,
            source: link.sourceId,
            target: link.targetId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#94a3b8', strokeWidth: 1.5 }
        }));

        return { nodes: flowNodes, edges: flowEdges };
    }, [process, mode, getStepStatistics]);

    return (
        <div className="h-full w-full bg-slate-50 relative">
            <ReactFlow 
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
            >
                <Background color="#cbd5e1" gap={20} />
                <Controls />
            </ReactFlow>
            
            <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded-sm border border-slate-200 shadow-sm text-[10px] flex items-center gap-2">
                <span>Low</span>
                <div className="w-24 h-2 bg-gradient-to-r from-white to-rose-300 rounded-sm border border-slate-100"></div>
                <span>High ({mode === 'traffic' ? 'Volume' : 'Errors'})</span>
            </div>
        </div>
    );
};
