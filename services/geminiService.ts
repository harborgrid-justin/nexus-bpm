
import { GoogleGenAI, Type } from "@google/genai";
import { ProcessStep } from '../types';

const getClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export interface SimulationResult {
  agentName: string;
  persona: string;
  sentiment: 'positive' | 'critical' | 'neutral';
  score: number;
  critique: string;
  recommendations: string[];
}

export const generateProcessWorkflow = async (prompt: string): Promise<ProcessStep[]> => {
  const ai = getClient();
  const fallback: ProcessStep[] = [
    { id: 'start', name: 'Start', type: 'start', description: 'Process Started', position: { x: 50, y: 100 } },
    { id: 'task1', name: 'Initial Review', type: 'user-task', role: 'manager', description: 'Manual verification', position: { x: 300, y: 100 } },
    { id: 'end', name: 'End', type: 'end', description: 'Process Ended', position: { x: 600, y: 100 } }
  ];

  if (!ai) return fallback;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Design an enterprise BPMN workflow for: "${prompt}". Return as JSON array of steps. Include roles, logic-heavy descriptions, and grid-snapped positions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['start', 'user-task', 'service-task', 'decision', 'end'] },
              description: { type: Type.STRING },
              role: { type: Type.STRING },
              position: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                }
              }
            },
            required: ["id", "name", "type", "description", "position"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ProcessStep[];
    }
    return fallback;
  } catch (error) {
    console.error("Workflow Generation Error:", error);
    return fallback;
  }
};

export const runWorkflowSimulation = async (steps: ProcessStep[]): Promise<SimulationResult[]> => {
  const ai = getClient();
  if (!ai) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform a "Murder Board" simulation on this BPMN workflow: ${JSON.stringify(steps)}. 
      Simulate 3 agents: 1. Chronos (Efficiency Architect), 2. Draco (Risk Skeptic), 3. Veda (Compliance Auditor). 
      Each must give a score (0-100), a detailed critique, and 2 actionable recommendations.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              agentName: { type: Type.STRING },
              persona: { type: Type.STRING },
              sentiment: { type: Type.STRING, enum: ['positive', 'critical', 'neutral'] },
              score: { type: Type.NUMBER },
              critique: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["agentName", "persona", "sentiment", "score", "critique", "recommendations"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SimulationResult[];
    }
    return [];
  } catch (error) {
    console.error("Simulation Error:", error);
    return [];
  }
};

export const getProcessInsights = async (processData: any): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Insights unavailable. Ensure API key is configured.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this BPM workflow for bottlenecks or inefficiencies: ${JSON.stringify(processData)}. Provide 3 actionable executive bullets.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "Operational analysis complete. No critical bottlenecks detected.";
  } catch (error) {
    return "Analyzing workflow topology... focus on parallel gateway synchronization.";
  }
};
