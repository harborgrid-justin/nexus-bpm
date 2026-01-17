
import React, { useState } from 'react';
import { ProcessStep, UserRole } from '../../types';
import { useBPM } from '../../contexts/BPMContext';
import { MousePointer2, Trash2, Info, UserCheck, Cpu, Compass, X, ChevronDown, FunctionSquare, ExternalLink, Globe, Key, Clock, Code, Database, Mail, Terminal, Shuffle, Server, Shield, Share2, FileText, HardDrive, Layout } from 'lucide-react';
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

          {/* GLOBAL LOGIC WIRING (For all steps) */}
          <section className="space-y-4 pt-4 border-t border-slate-200">
             <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2"><Shuffle size={14} className="text-slate-400"/> Event Triggers</h4>
             </div>
             <NexFormGroup label="Bind Business Rule" helpText="Executes before this step starts">
                 <select 
                   className="prop-input" 
                   value={step.businessRuleId || ''} 
                   onChange={e => updateField('businessRuleId', e.target.value)}
                 >
                   <option value="">No Rule Bound</option>
                   {rules.map(r => <option key={r.id} value={r.id}>[Rule] {r.name}</option>)}
                 </select>
             </NexFormGroup>
          </section>

          {/* --- DYNAMIC CONFIGURATION FOR 25+ WIRING OPPORTUNITIES --- */}
          
          {/* 1. CORE / GATEWAYS */}
          {meta.category === 'Gateways' && (
             <section className="space-y-4">
                <NexFormGroup label="Default Route">
                   <input className="prop-input" placeholder="Flow ID" value={step.data?.defaultFlow || ''} onChange={e => updateDataField('defaultFlow', e.target.value)} />
                </NexFormGroup>
                {step.type === 'exclusive-gateway' && (
                   <NexFormGroup label="Condition Expression (CEL)">
                      <textarea className="prop-input h-20 font-mono text-xs" placeholder="amount > 1000 && approved == true" value={step.data?.condition || ''} onChange={e => updateDataField('condition', e.target.value)} />
                   </NexFormGroup>
                )}
             </section>
          )}

          {/* 2. EVENTS (Timer) */}
          {step.type === 'timer-event' && (
             <section className="space-y-4">
                <NexFormGroup label="Schedule Type">
                   <select className="prop-input" value={step.data?.timerType || 'duration'} onChange={e => updateDataField('timerType', e.target.value)}>
                      <option value="duration">Duration (ISO 8601)</option>
                      <option value="date">Fixed Date</option>
                      <option value="cycle">Cycle (Cron)</option>
                   </select>
                </NexFormGroup>
                <NexFormGroup label="Expression">
                   <input className="prop-input font-mono" placeholder={step.data?.timerType === 'cycle' ? '0 0 * * *' : 'PT1H'} value={step.data?.expression || ''} onChange={e => updateDataField('expression', e.target.value)} />
                </NexFormGroup>
             </section>
          )}

          {/* 3. COMMUNICATION */}
          {meta.category === 'Communication' && (
              <section className="space-y-4">
                  {(step.type === 'email-send' || step.type === 'sendgrid-email') && (
                    <>
                      <NexFormGroup label="Recipient">
                          <input className="prop-input" placeholder="email@example.com or ${var}" value={step.data?.to || ''} onChange={e => updateDataField('to', e.target.value)} />
                      </NexFormGroup>
                      <NexFormGroup label="Template ID">
                          <input className="prop-input" placeholder="d-12345abc" value={step.data?.templateId || ''} onChange={e => updateDataField('templateId', e.target.value)} />
                      </NexFormGroup>
                    </>
                  )}
                  {step.type === 'slack-post' && (
                      <NexFormGroup label="Webhook URL / Channel">
                          <input className="prop-input" placeholder="https://hooks.slack.com/..." value={step.data?.webhookUrl || ''} onChange={e => updateDataField('webhookUrl', e.target.value)} />
                      </NexFormGroup>
                  )}
                  {step.type === 'sms-twilio' && (
                      <div className="grid grid-cols-2 gap-2">
                         <NexFormGroup label="From Number"><input className="prop-input" placeholder="+1..." value={step.data?.from || ''} onChange={e => updateDataField('from', e.target.value)} /></NexFormGroup>
                         <NexFormGroup label="To Number"><input className="prop-input" placeholder="${phone}" value={step.data?.to || ''} onChange={e => updateDataField('to', e.target.value)} /></NexFormGroup>
                      </div>
                  )}
                  <NexFormGroup label="Message Body">
                      <textarea className="prop-input h-24 font-mono text-xs" placeholder="Hello ${userName}..." value={step.data?.body || ''} onChange={e => updateDataField('body', e.target.value)} />
                  </NexFormGroup>
              </section>
          )}

          {/* 4. DOCUMENTS */}
          {meta.category === 'Documents' && (
             <section className="space-y-4">
                {step.type === 'pdf-generate' && (
                   <NexFormGroup label="HTML Template">
                      <textarea className="prop-input h-32 font-mono text-xs" placeholder="<html>...</html>" value={step.data?.html || ''} onChange={e => updateDataField('html', e.target.value)} />
                   </NexFormGroup>
                )}
                {(step.type === 's3-upload' || step.type === 'gdrive-save') && (
                   <>
                     <NexFormGroup label="Bucket / Folder">
                        <input className="prop-input" placeholder="my-corp-data" value={step.data?.bucket || ''} onChange={e => updateDataField('bucket', e.target.value)} />
                     </NexFormGroup>
                     <NexFormGroup label="File Key / Path">
                        <input className="prop-input" placeholder="/invoices/${id}.pdf" value={step.data?.key || ''} onChange={e => updateDataField('key', e.target.value)} />
                     </NexFormGroup>
                   </>
                )}
             </section>
          )}

          {/* 5. DATA & INTEGRATION */}
          {meta.category === 'Data & Integration' && (
             <section className="space-y-4">
                {step.type === 'rest-api' && (
                   <>
                     <NexFormGroup label="Method">
                        <select className="prop-input" value={step.data?.method || 'GET'} onChange={e => updateDataField('method', e.target.value)}>
                           <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                        </select>
                     </NexFormGroup>
                     <NexFormGroup label="Endpoint URL">
                        <input className="prop-input" placeholder="https://api.example.com/v1/..." value={step.data?.url || ''} onChange={e => updateDataField('url', e.target.value)} />
                     </NexFormGroup>
                     <NexFormGroup label="Headers (JSON)">
                        <textarea className="prop-input h-16 font-mono text-xs" placeholder='{"Authorization": "Bearer..."}' value={step.data?.headers || ''} onChange={e => updateDataField('headers', e.target.value)} />
                     </NexFormGroup>
                   </>
                )}
                {step.type === 'sql-query' && (
                   <>
                     <NexFormGroup label="Connection String">
                        <input type="password" class="prop-input" placeholder="postgres://user:pass@host..." value={step.data?.connection || ''} onChange={e => updateDataField('connection', e.target.value)} />
                     </NexFormGroup>
                     <NexFormGroup label="SQL Query">
                        <textarea className="prop-input h-24 font-mono text-xs" placeholder="SELECT * FROM users WHERE id = $1" value={step.data?.query || ''} onChange={e => updateDataField('query', e.target.value)} />
                     </NexFormGroup>
                   </>
                )}
                {step.type === 'graphql-query' && (
                   <NexFormGroup label="Query / Mutation">
                      <textarea className="prop-input h-32 font-mono text-xs" placeholder="query { user(id: 1) { name } }" value={step.data?.query || ''} onChange={e => updateDataField('query', e.target.value)} />
                   </NexFormGroup>
                )}
             </section>
          )}

          {/* 6. DEV TOOLS & CLOUD */}
          {(meta.category === 'Dev Tools' || meta.category === 'Cloud Infra') && (
             <section className="space-y-4">
                {(step.type === 'github-pr' || step.type === 'gitlab-merge') && (
                   <div className="grid grid-cols-2 gap-2">
                      <NexFormGroup label="Repo Owner"><input className="prop-input" value={step.data?.owner || ''} onChange={e => updateDataField('owner', e.target.value)}/></NexFormGroup>
                      <NexFormGroup label="Repo Name"><input className="prop-input" value={step.data?.repo || ''} onChange={e => updateDataField('repo', e.target.value)}/></NexFormGroup>
                   </div>
                )}
                {step.type === 'jira-issue' && (
                   <>
                     <NexFormGroup label="Project Key"><input className="prop-input" placeholder="PROJ" value={step.data?.projectKey || ''} onChange={e => updateDataField('projectKey', e.target.value)}/></NexFormGroup>
                     <NexFormGroup label="Issue Type"><select className="prop-input" value={step.data?.issueType || 'Task'} onChange={e => updateDataField('issueType', e.target.value)}><option>Bug</option><option>Task</option><option>Story</option></select></NexFormGroup>
                   </>
                )}
                {step.type === 'aws-lambda' && (
                   <NexFormGroup label="Function ARN">
                      <input className="prop-input font-mono" placeholder="arn:aws:lambda:us-east-1:..." value={step.data?.arn || ''} onChange={e => updateDataField('arn', e.target.value)} />
                   </NexFormGroup>
                )}
             </section>
          )}

          {/* 7. CRM & SALES */}
          {meta.category === 'CRM & Sales' && (
             <section className="space-y-4">
                <NexFormGroup label="Object Type">
                   <select className="prop-input" value={step.data?.objectType || 'Lead'} onChange={e => updateDataField('objectType', e.target.value)}>
                      <option>Lead</option><option>Contact</option><option>Opportunity</option><option>Account</option><option>Ticket</option>
                   </select>
                </NexFormGroup>
                <NexFormGroup label="Field Mapping (JSON)">
                   <textarea className="prop-input h-24 font-mono text-xs" placeholder='{"email": "${email}", "status": "New"}' value={step.data?.fields || ''} onChange={e => updateDataField('fields', e.target.value)} />
                </NexFormGroup>
             </section>
          )}

          {/* 8. AI & ML CATEGORY */}
          {meta.category === 'AI & ML' && (
              <section className="space-y-4">
                  <NexFormGroup label="Model Selection">
                      <select className="prop-input" value={step.data?.model || 'gpt-4o'} onChange={e => updateDataField('model', e.target.value)}>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="claude-3-5">Claude 3.5 Sonnet</option>
                          <option value="gemini-1-5">Gemini 1.5 Pro</option>
                      </select>
                  </NexFormGroup>
                  <NexFormGroup label="Input Context">
                      <textarea className="prop-input h-20 resize-none" placeholder="${documentText} or manual prompt" value={step.data?.systemPrompt || ''} onChange={e => updateDataField('systemPrompt', e.target.value)} />
                  </NexFormGroup>
                  {step.type === 'ai-sentiment' && (
                     <NexFormGroup label="Threshold Alert">
                        <input type="number" step="0.1" className="prop-input" placeholder="0.8" value={step.data?.threshold || ''} onChange={e => updateDataField('threshold', e.target.value)} />
                     </NexFormGroup>
                  )}
              </section>
          )}

          {/* 9. FINANCE */}
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
                  {step.type === 'stripe-charge' && (
                     <NexFormGroup label="Customer ID">
                        <input className="prop-input" placeholder="cus_..." value={step.data?.customerId || ''} onChange={e => updateDataField('customerId', e.target.value)} />
                     </NexFormGroup>
                  )}
              </section>
          )}

          {/* 10. LOGIC & RULES */}
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

          {/* 11. USER TASKS */}
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
                  <NexFormGroup label="Candidate Groups">
                      <input className="prop-input" placeholder="group1, group2" value={step.data?.candidateGroups || ''} onChange={e => updateDataField('candidateGroups', e.target.value)} />
                  </NexFormGroup>
                  <NexFormGroup label="Form Key">
                      <input className="prop-input" placeholder="form_registration_v1" value={step.data?.formKey || ''} onChange={e => updateDataField('formKey', e.target.value)} />
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
