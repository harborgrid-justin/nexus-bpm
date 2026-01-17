
import React, { useState } from 'react';
import { ProcessStep, UserRole } from '../../types';
import { useBPM } from '../../contexts/BPMContext';
import { MousePointer2, Trash2, Info, UserCheck, Cpu, Compass, X, ChevronDown, FunctionSquare, ExternalLink, Globe, Key, Clock, Code, Database, Mail, Terminal } from 'lucide-react';
import { NexButton, NexFormGroup } from '../shared/NexUI';
import { getStepTypeMetadata } from './designerUtils';

export const PropertiesPanel = ({ 
  step, 
  onUpdate, 
  onDelete, 
  roles 
}: { 
  step: ProcessStep | undefined; 
  onUpdate: (step: ProcessStep) => void; 
  onDelete: (id: string) => void; 
  roles: UserRole[]; 
}) => {
    const { rules, decisionTables, navigateTo } = useBPM();
    
    if (!step) {
      return (
        <aside className="hidden md:flex w-full h-full flex-col items-center justify-center text-center p-8 bg-white border-l border-slate-300">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
            <Compass size={32} strokeWidth={1} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Inspector</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-[200px]">Select a component to configure properties.</p>
        </aside>
      );
    }
  
    const meta = getStepTypeMetadata(step.type);
    const updateField = (field: keyof ProcessStep, value: any) => { onUpdate({ ...step, [field]: value }); };
    const updateDataField = (key: string, value: any) => { onUpdate({ ...step, data: { ...step.data, [key]: value } }); };
    const toggleSkill = (skill: string) => {
        const skills = step.requiredSkills || [];
        const newSkills = skills.includes(skill) ? skills.filter(sk => sk !== skill) : [...skills, skill];
        onUpdate({ ...step, requiredSkills: newSkills });
    };
  
    return (
      <aside className="w-full h-full bg-white border-l border-slate-300 flex flex-col shadow-xl z-20">
        <div className="h-10 flex items-center justify-between px-4 border-b border-slate-300 bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Properties</h3>
            <span className="text-[10px] text-slate-400 font-mono">| {step.type}</span>
          </div>
          <button onClick={() => onUpdate({ ...step, id: step.id } as any)} className="text-slate-400 hover:text-slate-800"><X size={16}/></button>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar">
          
          {/* General Metadata Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
               <meta.icon size={14} className={meta.color} />
               <h4 className="text-xs font-bold text-slate-800">{meta.category} Config</h4>
            </div>
            <NexFormGroup label="Identity">
              <input 
                type="text" 
                className="prop-input" 
                value={step.name} 
                onChange={e => updateField('name', e.target.value)} 
              />
            </NexFormGroup>
            <NexFormGroup label="Documentation">
              <textarea 
                className="prop-input h-20 resize-none"
                value={step.description} 
                onChange={e => updateField('description', e.target.value)} 
              />
            </NexFormGroup>
          </section>

          {/* DYNAMIC CONFIGURATION LOGIC */}
          
          {/* COMMUNICATION CATEGORY */}
          {meta.category === 'Communication' && (
              <section className="space-y-4">
                  <NexFormGroup label="Recipient">
                      <input className="prop-input" placeholder="email@example.com or ${var}" value={step.data?.to || ''} onChange={e => updateDataField('to', e.target.value)} />
                  </NexFormGroup>
                  <NexFormGroup label="Subject / Topic">
                      <input className="prop-input" placeholder="Notification Subject" value={step.data?.subject || ''} onChange={e => updateDataField('subject', e.target.value)} />
                  </NexFormGroup>
                  <NexFormGroup label="Message Template">
                      <textarea className="prop-input h-24 font-mono text-xs" placeholder="Hello ${userName}..." value={step.data?.body || ''} onChange={e => updateDataField('body', e.target.value)} />
                  </NexFormGroup>
              </section>
          )}

          {/* AI & ML CATEGORY */}
          {meta.category === 'AI & ML' && (
              <section className="space-y-4">
                  <NexFormGroup label="Model Selection">
                      <select className="prop-input" value={step.data?.model || 'gpt-4o'} onChange={e => updateDataField('model', e.target.value)}>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="claude-3-5">Claude 3.5 Sonnet</option>
                          <option value="gemini-1-5">Gemini 1.5 Pro</option>
                      </select>
                  </NexFormGroup>
                  <NexFormGroup label="System Prompt">
                      <textarea className="prop-input h-20 resize-none" placeholder="You are a helpful assistant..." value={step.data?.systemPrompt || ''} onChange={e => updateDataField('systemPrompt', e.target.value)} />
                  </NexFormGroup>
                  <NexFormGroup label="Temperature">
                      <div className="flex items-center gap-2">
                          <input type="range" min="0" max="1" step="0.1" className="flex-1" value={step.data?.temp || 0.7} onChange={e => updateDataField('temp', parseFloat(e.target.value))} />
                          <span className="text-xs font-mono w-8">{step.data?.temp || 0.7}</span>
                      </div>
                  </NexFormGroup>
              </section>
          )}

          {/* DATA & INTEGRATION */}
          {(step.type === 'sql-query' || step.type === 'db-provision') && (
              <section className="space-y-4">
                  <NexFormGroup label="Connection String">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-sm px-2">
                          <Database size={14} className="text-slate-400"/>
                          <input className="bg-transparent w-full py-2 outline-none text-xs font-mono" type="password" placeholder="postgres://user:pass@host..." value={step.data?.conn || ''} onChange={e => updateDataField('conn', e.target.value)} />
                      </div>
                  </NexFormGroup>
                  <NexFormGroup label="SQL Query">
                      <textarea className="prop-input h-32 font-mono text-xs bg-slate-800 text-green-400" placeholder="SELECT * FROM orders WHERE..." value={step.data?.query || ''} onChange={e => updateDataField('query', e.target.value)} />
                  </NexFormGroup>
              </section>
          )}

          {step.type === 'rest-api' && (
              <section className="space-y-4">
                  <NexFormGroup label="Endpoint URL">
                      <input className="prop-input font-mono" placeholder="https://api.stripe.com/v1/..." value={step.data?.url || ''} onChange={e => updateDataField('url', e.target.value)} />
                  </NexFormGroup>
                  <div className="grid grid-cols-2 gap-4">
                      <NexFormGroup label="Method">
                          <select className="prop-input" value={step.data?.method || 'GET'} onChange={e => updateDataField('method', e.target.value)}>
                              <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                          </select>
                      </NexFormGroup>
                      <NexFormGroup label="Auth">
                          <select className="prop-input" value={step.data?.auth || 'None'} onChange={e => updateDataField('auth', e.target.value)}>
                              <option>None</option><option>Bearer</option><option>Basic</option><option>API Key</option>
                          </select>
                      </NexFormGroup>
                  </div>
              </section>
          )}

          {/* FINANCE */}
          {meta.category === 'Finance' && (
              <section className="space-y-4">
                  <NexFormGroup label="Amount">
                      <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs font-bold">$</span>
                          <input className="prop-input" type="number" placeholder="0.00" value={step.data?.amount || ''} onChange={e => updateDataField('amount', e.target.value)} />
                      </div>
                  </NexFormGroup>
                  <NexFormGroup label="Currency">
                      <select className="prop-input" value={step.data?.currency || 'USD'} onChange={e => updateDataField('currency', e.target.value)}>
                          <option>USD</option><option>EUR</option><option>GBP</option><option>JPY</option>
                      </select>
                  </NexFormGroup>
              </section>
          )}

          {/* LOGIC & RULES */}
          {(step.type === 'business-rule' || step.type === 'decision-table') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2"><FunctionSquare size={12}/> Logic Binding</h4>
                   {step.data?.ruleId && (
                    <button onClick={() => navigateTo('rules', step.data.ruleId)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">Open <ExternalLink size={10}/></button>
                   )}
                </div>
                <NexFormGroup label="Rule Set">
                  <select 
                    className="prop-input appearance-none" 
                    value={step.data?.ruleId || ''} 
                    onChange={e => updateDataField('ruleId', e.target.value)}
                  >
                    <option value="">Select Asset...</option>
                    <optgroup label="Rules">
                        {rules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </optgroup>
                    <optgroup label="Tables">
                        {decisionTables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                  </select>
                </NexFormGroup>
              </section>
          )}

          {/* USER TASKS (LEGACY SUPPORT) */}
          {step.type === 'user-task' && (
              <section className="space-y-4">
                  <NexFormGroup label="Role Assignment">
                    <select 
                      className="prop-input appearance-none" 
                      value={step.role || ''} 
                      onChange={e => updateField('role', e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </NexFormGroup>
                  <NexFormGroup label="SLA Deadline">
                      <div className="flex gap-2">
                          <input type="number" className="prop-input w-20" value={step.data?.slaValue || 2} onChange={e => updateDataField('slaValue', e.target.value)} />
                          <select className="prop-input flex-1" value={step.data?.slaUnit || 'Days'} onChange={e => updateDataField('slaUnit', e.target.value)}>
                              <option>Hours</option><option>Days</option><option>Weeks</option>
                          </select>
                      </div>
                  </NexFormGroup>
              </section>
          )}

        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <NexButton variant="danger" onClick={() => onDelete(step.id)} className="w-full" icon={Trash2}>Delete Component</NexButton>
        </div>
      </aside>
    );
};
