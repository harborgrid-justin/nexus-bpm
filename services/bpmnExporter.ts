
import { Node, Edge } from 'reactflow';
import { ProcessDefinition } from '../types';

export const generateBPMNXml = (meta: Partial<ProcessDefinition>, nodes: Node[], edges: Edge[]): string => {
  const processId = meta.id || `proc_${Date.now()}`;
  const processName = meta.name || 'Process';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  id="Definitions_${Date.now()}" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="${processId}" name="${processName}" isExecutable="true">
`;

  // Nodes
  nodes.forEach(n => {
    const step = n.data.step;
    const safeName = (step.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    let tag = 'task';
    if (step.type === 'start') tag = 'startEvent';
    else if (step.type === 'end') tag = 'endEvent';
    else if (step.type === 'user-task') tag = 'userTask';
    else if (step.type === 'service-task') tag = 'serviceTask';
    else if (step.type.includes('gateway')) tag = step.type.includes('exclusive') ? 'exclusiveGateway' : 'parallelGateway';

    xml += `    <bpmn:${tag} id="${n.id}" name="${safeName}">\n`;
    
    // Incoming flows
    edges.filter(e => e.target === n.id).forEach(e => {
        xml += `      <bpmn:incoming>${e.id}</bpmn:incoming>\n`;
    });
    // Outgoing flows
    edges.filter(e => e.source === n.id).forEach(e => {
        xml += `      <bpmn:outgoing>${e.id}</bpmn:outgoing>\n`;
    });
    
    xml += `    </bpmn:${tag}>\n`;
  });

  // Edges
  edges.forEach(e => {
    xml += `    <bpmn:sequenceFlow id="${e.id}" sourceRef="${e.source}" targetRef="${e.target}" />\n`;
  });

  xml += `  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
`;

  // DI (Positions)
  nodes.forEach(n => {
      xml += `      <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}">
        <dc:Bounds x="${n.position.x}" y="${n.position.y}" width="100" height="80" />
      </bpmndi:BPMNShape>\n`;
  });

  edges.forEach(e => {
      xml += `      <bpmndi:BPMNEdge id="${e.id}_di" bpmnElement="${e.id}">
        <di:waypoint x="0" y="0" />
        <di:waypoint x="0" y="0" />
      </bpmndi:BPMNEdge>\n`;
  });

  xml += `    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  return xml;
};
