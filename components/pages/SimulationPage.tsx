
import React, { useState, useEffect } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { FormPageLayout } from '../shared/PageTemplates';
import { Cpu, ThumbsUp, ThumbsDown, Bot } from 'lucide-react';
import { runWorkflowSimulation, SimulationResult } from '../../services/geminiService';

export const SimulationPage = () => {
  const { navigateTo, designerDraft } = useBPM();
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (designerDraft?.steps) {
        try {
          const res = await runWorkflowSimulation(designerDraft.steps);
          setResults(res);
        } catch(e) {
          console.error(e);
        }
      }
      setLoading(false);
    };
    run();
  }, [designerDraft]);

  return (
    <FormPageLayout title="Simulation Report" subtitle="AI Agent 'Murder Board' Analysis" onBack={() => navigateTo('designer')}>
       {loading ? (
         <div className="flex flex-col items-center justify-center py-20">
            <Cpu size={48} className="text-blue-500 animate-pulse mb-4"/>
            <p className="text-slate-600 font-bold">Agents are analyzing workflow topology...</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((agent, i) => (
                 <div key={i} className={`p-6 border rounded-sm flex flex-col ${agent.sentiment === 'critical' ? 'bg-rose-50 border-rose-200' : agent.sentiment === 'positive' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-black/5">
                       <div className="w-12 h-12 rounded-sm bg-white flex items-center justify-center text-2xl shadow-sm">
                         {agent.agentName[0]}
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-900">{agent.agentName}</h4>
                         <p className="text-xs text-slate-500 uppercase font-bold">{agent.persona}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-3xl font-black text-slate-800">{agent.score}/100</div>
                      {agent.score > 80 ? <ThumbsUp size={20} className="text-emerald-600"/> : <ThumbsDown size={20} className="text-rose-600"/>}
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed mb-6 flex-1">
                      "{agent.critique}"
                    </p>

                    <div className="space-y-2">
                       {agent.recommendations.map((rec, idx) => (
                         <div key={idx} className="flex gap-2 items-start bg-white/60 p-3 rounded-sm text-xs font-medium text-slate-800">
                            <Bot size={14} className="shrink-0 mt-0.5 text-blue-600"/>
                            {rec}
                         </div>
                       ))}
                    </div>
                 </div>
            ))}
            {results.length === 0 && <div className="col-span-full text-center py-10 text-slate-500">No simulation data available. Ensure the designer has steps.</div>}
         </div>
       )}
    </FormPageLayout>
  );
};
