
import React, { useState } from 'react';
import { ProcessStep, UserRole, IOMapping, RetryPolicy } from '../../types';
import { useBPM } from '../../contexts/BPMContext';
import { 
  Trash2, Compass, X, FunctionSquare, ExternalLink, 
  Settings, Database, Play, RefreshCw, Layers, ArrowRightLeft, 
  Braces, ShieldAlert, Plus, Minimize2, CheckSquare, Zap, Clock, Key
} from 'lucide-react';
import { NexButton, NexFormGroup, NexBadge } from '../shared/NexUI';
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
    const [activeTab, setActiveTab] = useState<'config' | 'data' | 'logic' | 'policy'>('config');
    
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
    
    // --- Data Mapping Helpers ---
    const addMapping = (type: 'inputs' | 'outputs') => {
        const newMap: IOMapping = { source: '', target: '' };
        onUpdate({ ...step, [type]: [...(step[type] || []), newMap] });
    };
    
    const updateMapping = (type: 'inputs' | 'outputs', index: number, field: keyof IOMapping, value: string) => {
        const list = [...(step[type] || [])];
        list[index] = { ...list[index], [field]: value };
        onUpdate({ ...step, [type]: list });
    };

    const removeMapping = (type: 'inputs' | 'outputs', index: number) => {
        const list = [...(step[type] || [])];
        list.splice(index, 1);
        onUpdate({ ...step, [type]: list });
    };

    // --- Retry Policy Helpers ---
    const updateRetry = (field: keyof RetryPolicy, value: any) => {
        const current = step.retryPolicy || { enabled: false, maxAttempts: 3, strategy: 'fixed', delayMs: 1000 };
        onUpdate({ ...step, retryPolicy: { ...current, [field]: value } });
    };

    return (
      <aside className="w-full h-full bg-white border-l border-slate-300 flex flex-col shadow-xl z-20">
        {/* Header */}
        <div className="h-10 flex items-center justify-between px-4 border-b border-slate-300 bg-slate-50">
          <div className="flex items-center gap-2">
            <meta.icon size={14} className={meta.color} />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{meta.category}</h3>
            <span className="text-[10px] text-slate-400 font-mono">| {step.type}</span>
          </div>
          <button onClick={() => onUpdate({ ...step, id: step.id } as any)} className="text-slate-400 hover:text-slate-800"><Minimize2 size={14}/></button>
        </div>

        {/* Identity Block (Always Visible) */}
        <div className="p-4 border-b border-slate-100 bg-white">
            <input 
              type="text" 
              className="text-sm font-bold text-slate-900 w-full outline-none border-b border-transparent focus:border-blue-500 placeholder:text-slate-300 transition-all mb-1" 
              value={step.name} 
              onChange={e => updateField('name', e.target.value)}
              placeholder="Step Name"
            />
            <input 
              type="text"
              className="text-xs text-slate-500 w-full outline-none bg-transparent"
              value={step.description || ''}
              onChange={e => updateField('description', e.target.value)}
              placeholder="Add technical description..."
            />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
            {[
                { id: 'config', icon: Settings, label: 'Config' },
                { id: 'data', icon: Database, label: 'Wiring' },
                { id: 'logic', icon: FunctionSquare, label: 'Rules' },
                { id: 'policy', icon: ShieldAlert, label: 'Policy' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:bg-white hover:text-slate-700'}`}
                >
                    <tab.icon size={12}/> {tab.label}
                </button>
            ))}
        </div>

        <div className="flex-1 p-4 overflow-y-auto no-scrollbar bg-slate-50/30">
          
          {/* TAB: CONFIGURATION (Dynamic based on type) */}
          {activeTab === 'config' && (
             <div className="space-y-4">
                {/* User Task Specifics */}
                {step.type === 'user-task' && (
                    <div className="space-y-4">
                        <NexFormGroup label="Role Assignment">
                            <select className="prop-input" value={step.role || ''} onChange={e => updateField('role', e.target.value)}>
                                <option value="">Unassigned</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </NexFormGroup>
                        <NexFormGroup label="Candidate Groups">
                            <input className="prop-input" placeholder="group1, group2" value={step.data?.candidateGroups || ''} onChange={e => updateDataField('candidateGroups', e.target.value)} />
                        </NexFormGroup>
                        <NexFormGroup label="SLA Deadline">
                            <div className="flex gap-2">
                                <input type="number" className="prop-input w-20" value={step.data?.slaValue || 2} onChange={e => updateDataField('slaValue', e.target.value)} />
                                <select className="prop-input flex-1" value={step.data?.slaUnit || 'Days'} onChange={e => updateDataField('slaUnit', e.target.value)}>
                                    <option>Hours</option><option>Days</option><option>Weeks</option>
                                </select>
                            </div>
                        </NexFormGroup>
                    </div>
                )}

                {/* Gateway Specifics */}
                {meta.category === 'Gateways' && (
                    <div className="space-y-4">
                        <NexFormGroup label="Default Route ID">
                            <input className="prop-input font-mono" placeholder="Flow ID" value={step.data?.defaultFlow || ''} onChange={e => updateDataField('defaultFlow', e.target.value)} />
                        </NexFormGroup>
                        {step.type === 'exclusive-gateway' && (
                            <NexFormGroup label="Condition Expression (CEL)">
                                <textarea className="prop-input h-24 font-mono text-xs" placeholder="amount > 1000 && approved == true" value={step.data?.condition || ''} onChange={e => updateDataField('condition', e.target.value)} />
                            </NexFormGroup>
                        )}
                    </div>
                )}

                {/* Service / Integration Specifics */}
                {(meta.category === 'Data & Integration' || meta.category === 'Cloud Infra' || step.type === 'service-task') && (
                    <div className="space-y-4">
                        <NexFormGroup label="Endpoint / Resource">
                            <input className="prop-input font-mono" placeholder="https://api..." value={step.data?.url || step.data?.arn || ''} onChange={e => updateDataField(step.data?.arn ? 'arn' : 'url', e.target.value)} />
                        </NexFormGroup>
                        <NexFormGroup label="Method / Action">
                            <select className="prop-input" value={step.data?.method || 'POST'} onChange={e => updateDataField('method', e.target.value)}>
                                <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                            </select>
                        </NexFormGroup>
                        <NexFormGroup label="Auth Header">
                            <div className="flex gap-2">
                                <Key size={16} className="mt-2 text-slate-400"/>
                                <select className="prop-input" value={step.data?.authProfile || ''} onChange={e => updateDataField('authProfile', e.target.value)}>
                                    <option value="">None</option>
                                    <option value="vault-stripe">Stripe Prod</option>
                                    <option value="vault-aws">AWS Main</option>
                                </select>
                            </div>
                        </NexFormGroup>
                    </div>
                )}
             </div>
          )}

          {/* TAB: DATA WIRING (IO Mapping) */}
          {activeTab === 'data' && (
              <div className="space-y-6">
                  {/* Inputs */}
                  <div>
                      <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><ArrowRightLeft size={10}/> Input Mapping</h4>
                          <button onClick={() => addMapping('inputs')} className="text-blue-600 hover:text-blue-800"><Plus size={14}/></button>
                      </div>
                      <div className="space-y-2">
                          {(!step.inputs || step.inputs.length === 0) && <div className="text-xs text-slate-400 italic p-2 border border-dashed rounded-sm">No input maps defined.</div>}
                          {step.inputs?.map((map, i) => (
                              <div key={i} className="flex gap-1 items-center">
                                  <input className="prop-input font-mono text-[10px] h-7" placeholder="Process Var" value={map.source} onChange={e => updateMapping('inputs', i, 'source', e.target.value)} />
                                  <span className="text-slate-400">→</span>
                                  <input className="prop-input font-mono text-[10px] h-7" placeholder="Task Param" value={map.target} onChange={e => updateMapping('inputs', i, 'target', e.target.value)} />
                                  <button onClick={() => removeMapping('inputs', i)} className="text-slate-400 hover:text-rose-500"><X size={12}/></button>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="h-px bg-slate-200"></div>

                  {/* Outputs */}
                  <div>
                      <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Braces size={10}/> Output Mapping</h4>
                          <button onClick={() => addMapping('outputs')} className="text-blue-600 hover:text-blue-800"><Plus size={14}/></button>
                      </div>
                      <div className="space-y-2">
                          {(!step.outputs || step.outputs.length === 0) && <div className="text-xs text-slate-400 italic p-2 border border-dashed rounded-sm">No output maps defined.</div>}
                          {step.outputs?.map((map, i) => (
                              <div key={i} className="flex gap-1 items-center">
                                  <input className="prop-input font-mono text-[10px] h-7" placeholder="Task Result" value={map.source} onChange={e => updateMapping('outputs', i, 'source', e.target.value)} />
                                  <span className="text-slate-400">→</span>
                                  <input className="prop-input font-mono text-[10px] h-7" placeholder="Process Var" value={map.target} onChange={e => updateMapping('outputs', i, 'target', e.target.value)} />
                                  <button onClick={() => removeMapping('outputs', i)} className="text-slate-400 hover:text-rose-500"><X size={12}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: LOGIC (Rules & Triggers) */}
          {activeTab === 'logic' && (
              <div className="space-y-4">
                  <NexFormGroup label="Pre-Flight Rule" helpText="Execute business rule before step starts">
                        <select className="prop-input" value={step.businessRuleId || ''} onChange={e => updateField('businessRuleId', e.target.value)}>
                            <option value="">None</option>
                            {rules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        {step.businessRuleId && (
                            <button onClick={() => navigateTo('rules', step.businessRuleId)} className="mt-1 text-[10px] text-blue-600 flex items-center gap-1 hover:underline">
                                Edit Rule <ExternalLink size={10}/>
                            </button>
                        )}
                  </NexFormGroup>

                  <NexFormGroup label="On Entry Script">
                      <textarea className="prop-input h-20 font-mono text-[10px]" placeholder="console.log('Entering step');" value={step.onEntryAction || ''} onChange={e => updateField('onEntryAction', e.target.value)} />
                  </NexFormGroup>

                  <NexFormGroup label="On Exit Script">
                      <textarea className="prop-input h-20 font-mono text-[10px]" placeholder="execution.setVariable('status', 'done');" value={step.onExitAction || ''} onChange={e => updateField('onExitAction', e.target.value)} />
                  </NexFormGroup>
              </div>
          )}

          {/* TAB: POLICY (Retry, Timeout) */}
          {activeTab === 'policy' && (
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700">Retry Policy</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={step.retryPolicy?.enabled || false} onChange={e => updateRetry('enabled', e.target.checked)} />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                  </div>
                  
                  {step.retryPolicy?.enabled && (
                      <div className="p-3 bg-white border border-slate-200 rounded-sm space-y-3 animate-slide-up">
                          <NexFormGroup label="Strategy">
                              <select className="prop-input" value={step.retryPolicy?.strategy || 'fixed'} onChange={e => updateRetry('strategy', e.target.value)}>
                                  <option value="fixed">Fixed Delay</option>
                                  <option value="exponential">Exponential Backoff</option>
                                  <option value="linear">Linear Backoff</option>
                              </select>
                          </NexFormGroup>
                          <div className="grid grid-cols-2 gap-2">
                              <NexFormGroup label="Max Attempts">
                                  <input type="number" className="prop-input" value={step.retryPolicy?.maxAttempts || 3} onChange={e => updateRetry('maxAttempts', parseInt(e.target.value))} />
                              </NexFormGroup>
                              <NexFormGroup label="Delay (ms)">
                                  <input type="number" className="prop-input" value={step.retryPolicy?.delayMs || 1000} onChange={e => updateRetry('delayMs', parseInt(e.target.value))} />
                              </NexFormGroup>
                          </div>
                      </div>
                  )}

                  <div className="pt-4 border-t border-slate-200">
                      <NexFormGroup label="Loop Characteristics">
                          <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-sm hover:bg-white cursor-pointer">
                              <input type="checkbox" checked={step.isMultiInstance || false} onChange={e => updateField('isMultiInstance', e.target.checked)} className="rounded-sm text-blue-600"/>
                              <div className="flex items-center gap-2">
                                  <RefreshCw size={14} className="text-slate-500"/>
                                  <span className="text-xs text-slate-700 font-medium">Multi-Instance (Parallel)</span>
                              </div>
                          </label>
                      </NexFormGroup>
                  </div>
              </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button onClick={() => onDelete(step.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-sm transition-colors" title="Delete Step">
              <Trash2 size={16}/>
          </button>
          <div className="text-[9px] text-slate-400 font-mono">ID: {step.id}</div>
        </div>
      </aside>
    );
};
