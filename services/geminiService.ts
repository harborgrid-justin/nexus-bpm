
import { GoogleGenAI, Type } from "@google/genai";
import { ProcessStep, BusinessRule, Task } from '../types';

// --- Finding 12: Standardized AI Result Type ---
export interface AiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    model: string;
    latency?: number;
  }
}

const getClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Private helper for safe execution
async function safeExecute<T>(
  model: string, 
  prompt: string, 
  schemaType: any, // GenAI Type.OBJECT/ARRAY
  fallback: T
): Promise<T> {
  const ai = getClient();
  if (!ai) return fallback;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schemaType
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as T;
    }
    return fallback;
  } catch (error) {
    console.error(`AI Service Error (${model}):`, error);
    return fallback;
  }
}

export interface SimulationResult {
  agentName: string;
  persona: string;
  sentiment: 'positive' | 'critical' | 'neutral';
  score: number;
  critique: string;
  recommendations: string[];
}

export const generateProcessWorkflow = async (prompt: string): Promise<ProcessStep[]> => {
  const fallback: ProcessStep[] = [
    { id: 'start', name: 'Start', type: 'start', description: 'Process Started', position: { x: 50, y: 100 } },
    { id: 'task1', name: 'Initial Review', type: 'user-task', role: 'manager', description: 'Manual verification', position: { x: 300, y: 100 } },
    { id: 'end', name: 'End', type: 'end', description: 'Process Ended', position: { x: 600, y: 100 } }
  ];

  return safeExecute(
    "gemini-3-pro-preview",
    `Design an enterprise BPMN workflow for: "${prompt}". Return as JSON array of steps. Include roles, logic-heavy descriptions, and grid-snapped positions.`,
    {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['start', 'user-task', 'service-task', 'decision', 'end'] },
            description: { type: Type.STRING },
            role: { type: Type.STRING },
            position: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } }
          },
          required: ["id", "name", "type", "description", "position"]
        }
    },
    fallback
  );
};

export const runWorkflowSimulation = async (steps: ProcessStep[]): Promise<SimulationResult[]> => {
  return safeExecute(
    "gemini-3-pro-preview",
    `Perform a "Murder Board" simulation on this BPMN workflow: ${JSON.stringify(steps)}. 
    Simulate 3 agents: 1. Chronos (Efficiency Architect), 2. Draco (Risk Skeptic), 3. Veda (Compliance Auditor). 
    Each must give a score (0-100), a detailed critique, and 2 actionable recommendations.`,
    {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          agentName: { type: Type.STRING },
          persona: { type: Type.STRING },
          sentiment: { type: Type.STRING, enum: ['positive', 'critical', 'neutral'] },
          score: { type: Type.NUMBER },
          critique: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["agentName", "persona", "sentiment", "score", "critique", "recommendations"]
      }
    },
    []
  );
};

export const getProcessInsightsStream = async function* (processData: any): AsyncGenerator<string, void, unknown> {
  const ai = getClient();
  if (!ai) {
    yield "AI Insights unavailable. Ensure API key is configured.";
    return;
  }

  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Analyze this BPM workflow/task data for bottlenecks or inefficiencies: ${JSON.stringify(processData)}. Provide 3 actionable executive bullets. Keep it short.`,
    });
    for await (const chunk of response) {
      if (chunk.text) yield chunk.text;
    }
  } catch (error) {
    console.error(error);
    yield "Operational analysis unavailable.";
  }
};

export const generateRuleFromText = async (prompt: string): Promise<Partial<BusinessRule>> => {
  return safeExecute(
    "gemini-3-flash-preview",
    `Translate this natural language business rule into a structured JSON object compatible with a rules engine.
    User Input: "${prompt}"
    Structure:
    - Conditions: nested groups (AND/OR). Operators: eq, neq, gt, lt, contains.
    - Action: SET_VARIABLE, ROUTE_TO, or SEND_NOTIFICATION.`,
    {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            conditions: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, type: {type: Type.STRING}, children: {type: Type.ARRAY} } },
            action: { type: Type.OBJECT, properties: { type: {type: Type.STRING}, params: {type: Type.OBJECT} } },
            priority: { type: Type.NUMBER }
        }
    },
    {}
  );
};

export const summarizeTaskContext = async (task: Task): Promise<{ summary: string; sentiment: string; nextAction: string }> => {
  return safeExecute(
    "gemini-3-flash-preview",
    `Analyze this enterprise task context: ${JSON.stringify(task)}. Return JSON with summary, sentiment, and nextAction.`,
    {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        sentiment: { type: Type.STRING },
        nextAction: { type: Type.STRING }
      }
    },
    { summary: "Analysis unavailable.", sentiment: "Neutral", nextAction: "Review details manually." }
  );
};

export const generateProcessDocumentation = async (processDef: any): Promise<string> => {
  const ai = getClient();
  if (!ai) return "<h1>Documentation Unavailable</h1><p>API Key required for generation.</p>";

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Generate professional HTML documentation for this Business Process: ${JSON.stringify(processDef)}. Format: Pure HTML body content only.`
  });

  return response.text || "<p>Generation failed.</p>";
};
