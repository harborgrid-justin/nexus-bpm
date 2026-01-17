
import React, { useState } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { FormPageLayout } from '../shared/PageTemplates';
import { generateRuleFromText } from '../../services/geminiService';
import { BusinessRule, ConditionGroup, RuleAction } from '../../types';
import { Sparkles } from 'lucide-react';
import { NexButton } from '../shared/NexUI';

export const RuleGenPage = () => {
  const { navigateTo, saveRule } = useBPM();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
        const rulePart = await generateRuleFromText(prompt);
        const newRule: BusinessRule = {
            id: `rule-${Date.now()}`,
            name: rulePart.name || 'AI Generated Rule',
            description: rulePart.description || prompt,
            conditions: (rulePart.conditions as ConditionGroup) || { id: `g-${Date.now()}`, type: 'AND', children: [] },
            action: (rulePart.action as RuleAction) || { type: 'SET_VARIABLE', params: {} },
            priority: rulePart.priority || 1,
            version: 1, status: 'Draft', tags: ['AI-Generated'], lastModified: new Date().toISOString()
        };
        await saveRule(newRule);
        navigateTo('rules', newRule.id);
    } catch (e) {
        alert('Generation failed.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <FormPageLayout title="AI Logic Synthesizer" subtitle="Describe business logic in natural language." onBack={() => navigateTo('rules')}>
       <div className="space-y-6">
          <textarea 
            className="w-full h-64 p-4 border border-slate-300 rounded-sm text-sm focus:border-blue-500 outline-none resize-none"
            placeholder="e.g., If the invoice amount is greater than 50,000 and the vendor is new, route to the CFO for approval."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
          <div className="flex justify-end">
             <NexButton variant="primary" onClick={handleGenerate} disabled={loading} icon={Sparkles}>
                {loading ? 'Synthesizing...' : 'Generate Rule'}
             </NexButton>
          </div>
       </div>
    </FormPageLayout>
  );
};
