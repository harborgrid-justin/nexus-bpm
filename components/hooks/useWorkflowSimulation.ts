
import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { STEP_TYPES } from '../../constants';

export const useWorkflowSimulation = (nodes: Node[], edges: Edge[], onNotify: (msg: string, type: 'info' | 'error') => void) => {
  const [active, setActive] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);

  const start = useCallback(() => {
    const startNode = nodes.find(n => n.data.step.type === STEP_TYPES.START);
    if (startNode) {
        setCurrentStepId(startNode.id);
        setActive(true);
    } else {
        onNotify('No Start Node found.', 'error');
    }
  }, [nodes, onNotify]);

  const stop = useCallback(() => {
    setActive(false);
    setCurrentStepId(null);
  }, []);

  const step = useCallback(() => {
    if (!currentStepId) return;
    
    // Find outgoing edges
    const outgoing = edges.filter(e => e.source === currentStepId);
    
    if (outgoing.length === 0) {
        onNotify('Simulation End Reached', 'info');
        stop();
    } else {
        // Simple random path selection for gateways
        const nextEdge = outgoing[Math.floor(Math.random() * outgoing.length)];
        setCurrentStepId(nextEdge.target);
    }
  }, [currentStepId, edges, onNotify, stop]);

  return {
    active,
    currentStepId,
    start,
    stop,
    step
  };
};
