import React, { useState, useMemo } from 'react';
import { ProcessStep, UserRole, IOMapping, RetryPolicy, EscalationRule } from '../../types';
import { useBPM } from '../../contexts/BPMContext';
import { 
  Trash2, Compass, X, ExternalLink, 
  Settings, Database, RefreshCw, ArrowRightLeft, 
  Braces, ShieldAlert, Plus, Minimize2, Key, Sparkles, FunctionSquare, Layout, Clock, AlertCircle
} from 'lucide-react';
import { NexFormGroup } from '../shared/NexUI';
import { getStepTypeMetadata } from './designerUtils';
import { DataMapper } from '../shared/DataMapper';
import { STEP_SCHEMAS, ConfigField } from './stepSchemas';

// Mock variables available in the process context
const PROCESS_VARS = [
    'request.id', 'request.amount', 'request.requester', 'request.date', 
    'approval.status', 'approval.comment', 
    'user.email', 'user.department',
    'system.timestamp', 'case.id'
];

// Mock inputs expected by various step types
const GET_TARGET_SCHEMA = (type: string): string[] => {
    // Generate target schema keys from the static schema definition
    const schema = STEP_SCHEMAS[type as any];
    if (schema) {
        return schema.map(f => f.key);
    }
    return ['config', 'input'];
};

export const PropertiesPanel = ({ 
  step, 
  onUpdate, 
  onDelete, 
  roles,
  onClose
}: { 
  step: ProcessStep | undefined; 
  onUpdate: (step: ProcessStep) => void; 
  onDelete: (id: string) => void; 
  roles: UserRole[]; 
  onClose?: () => void;
}) => {
    const { rules, forms, navigateTo } = useBPM();
    const [activeTab, setActiveTab] = useState<'config' | 'data' | 'logic' | 'policy'>('config');
    
    // Always call hooks regardless of step existence
    const panelWidthClass = useMemo(() => {
        if (!step) return 'w-[320px]';
        
        // Data Mapper needs wide view
        if (activeTab === 'data') return 'w-[600px]';
        
        // Logic with Scripts needs medium wide
        if (activeTab === 'logic' && (step.onEntryAction || step.onExitAction)) return 'w-[450px]';

        // Specific complex steps
        if (['script-task', 'pdf-generate', 'template-render', 'xml-transform', 'json-map', 'api-gateway', 'sql-query', 'graphql-query'].includes(step.type)) {
            return 'w-[480px]';
        }
        
        if (['sendgrid-email', 'email-send'].includes(step.type)) return 'w-[400px]';

        return 'w-[320px]';
    }, [step?.type, activeTab, step?.onEntryAction, step?.onExitAction]);

    if (!step) {
      return (
        <aside className={`${panelWidthClass} hidden md:flex h-full flex-col items-center justify-center text-center p-8 bg-white border-l border-slate-300 transition-all duration-300 ease-in-out`}>
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
            <Compass size={32} strokeWidth={1} className="text-slate-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Inspector</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-[200px]">Select a component to configure properties.</p>
        </aside>
      );
    }
  
    const meta = getStepTypeMetadata(step.type);
    const schema = STEP_SCHEMAS[step.type] || [];
    
    const updateField = (field: keyof ProcessStep, value: any) => { onUpdate({ ...step, [field]: value }); };
    const updateDataField = (key: string, value: any) => { onUpdate({ ...step, data: { ...step.data, [key]: value } }); };
    
    const updateEscalation = (field: keyof EscalationRule, value: any) => {
        const current = step.escalation || { enabled: false, daysAfterDue: 1, action: 'notify_manager' };
        onUpdate({ ...step, escalation: { ...current, [field]: value } });
    };

    const updateRetry = (field: keyof RetryPolicy, value: any) => {
        const current = step.retryPolicy || { enabled: false, maxAttempts: 3, strategy: 'fixed', delayMs: 1000 };
        onUpdate({ ...step, retryPolicy: { ...current, [field]: value } });
    };

    const renderDynamicField = (field: ConfigField) => {
        const value = step.data?.[field.key] ?? field.defaultValue ?? '';
        
        switch(field.type) {
            case 'select':
                return (
                    <NexFormGroup key={field.key} label={field.label} helpText={field.helpText}>
                        <select className="prop-input" value={value} onChange={e => updateDataField(field.key, e.target.value)}>
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </NexFormGroup>
                );
            case 'textarea':
            case 'json':
            case 'code':
                return (
                    <NexFormGroup key={field.key} label={field.label} helpText={field.helpText}>
                        <textarea 
                            className={`prop-input min-h-[100px] resize-y ${field.type === 'code' || field.type === 'json' ? 'font-mono text-[10px]' : ''}`}
                            value={value} 
                            onChange={e => updateDataField(field.key, e.target.value)} 
                            placeholder={field.placeholder}
                        />
                    </NexFormGroup>
                );
            case 'boolean':
                return (
                    <div key={field.key} className="mb-4 flex items-center justify-between">
                        <label className="prop-label mb-0">{field.label}</label>
                        <input type="checkbox" checked={!!value} onChange={e => updateDataField(field.key, e.target.checked)} className="rounded-sm text-blue-600 focus:ring-blue-500" />
                    </div>
                );
            default:
                return (
                    <NexFormGroup key={field.key} label={field.label} helpText={field.helpText}>
                        <input 
                            type={field.type === 'number' ? 'number' : 'text'}
                            className="prop-input" 
                            value={value} 
                            onChange={e => updateDataField(field.key, e.target.value)} 
                            placeholder={field.placeholder}
                        />
                    </NexFormGroup>
                );
        }
    };

    return (
      <aside className={`${panelWidthClass} h-full bg-white border-l border-slate-300 flex flex-col shadow-xl z-20 transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <div 
          className="flex items-center justify-between border-b border-slate-300 bg-slate-50"
          style={{ height: 'var(--header-height)', paddingLeft: 'var(--space-base)', paddingRight: 'var(--space-base)' }}
        >
          <div className="flex items-center gap-2">
            <meta.icon size={14} className={meta.color} />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{meta.category}</h3>
            <span className="text-[10px] text-slate-400 font-mono">| {step.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onUpdate({ ...step, id: step.id } as any)} className="text-slate-400 hover:text-slate-800" title="Minimize/Refresh"><Minimize2 size={14}/></button>
            {onClose && <button onClick={onClose} className="text-slate-400 hover:text-slate-800"><X size={14}/></button>}
          </div>
        </div>

        {/* Identity Block (Always Visible) */}
        <div className="border-b border-slate-100 bg-white" style={{ padding: 'var(--card-padding)' }}>
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

        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/30" style={{ padding: 'var(--card-padding)' }}>
          
          {/* TAB: CONFIGURATION (Dynamic based on type) */}
          {activeTab === 'config' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}>
                {/* User Task Specifics */}
                {step.type === 'user-task' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}>
                        <NexFormGroup label="User Interface">
                            <div className="flex items-center gap-2">
                                <Layout size={16} className="text-slate-400"/>
                                <select className="prop-input" value={step.formId || ''} onChange={e => updateField('formId', e.target.value)}>
                                    <option value="">Generic Task View</option>
                                    {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            {step.formId && <button onClick={() => navigateTo('form-designer', step.formId)} className="text-[10px] text-blue-600 hover:underline mt-1 ml-6">Edit Form Definition</button>}
                        </NexFormGroup>

                        <div className="h-px bg-slate-200"></div>

                        <NexFormGroup label="Role Assignment">
                            <select className="prop-input" value={step.role || ''} onChange={e => updateField('role', e.target.value)}>
                                <option value="">Unassigned</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </NexFormGroup>
                        <NexFormGroup label="Candidate Groups">
                            <input className="prop-input" placeholder="group1, group2" value={step.data?.candidateGroups || ''} onChange={e => updateDataField('candidateGroups', e.target.value)} />
                        </NexFormGroup>
                    </div>
                )}

                {/* Gateway Specifics */}
                {meta.category === 'Gateways' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}>
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

                {/* DYNAMIC SCHEMA RENDERING FOR ALL OTHER TYPES */}
                {schema.map(renderDynamicField)}
                
                {schema.length === 0 && step.type !== 'user-task' && meta.category !== 'Gateways' && (
                    <div className="text-center text-slate-400 italic text-xs">
                        No configuration required for this component.
                    </div>
                )}
             </div>
          )}

          {/* TAB: DATA WIRING (Visual Mapper) */}
          {activeTab === 'data' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}>
                  <div>
                      <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><ArrowRightLeft size={10}/> Input Transformation</h4>
                      </div>
                      <DataMapper 
                        mappings={step.inputs || []}
                        onChange={(m) => updateField('inputs', m)}
                        sourceSchema={PROCESS_VARS}
                        targetSchema={GET_TARGET_SCHEMA(step.type)}
                      />
                  </div>
              </div>
          )}

          {/* TAB: LOGIC (Rules & Triggers) */}
          {activeTab === 'logic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}>
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
                      <div className="relative">
                        <textarea className="prop-input h-20 font-mono text-[10px]" placeholder="console.log('Entering step');" value={step.onEntryAction || ''} onChange={e => updateField('onEntryAction', e.target.value)} />
                        {step.onEntryAction && <Sparkles size={12} className="absolute right-2 bottom-2 text-amber-500 animate-pulse"/>}
                      </div>
                  </NexFormGroup>

                  <NexFormGroup label="On Exit Script">
                      <textarea className="prop-input h-20 font-mono text-[10px]" placeholder="execution.setVariable('status', 'done');" value={step.onExitAction || ''} onChange={e => updateField('onExitAction', e.target.value)} />
                  </NexFormGroup>
              </div>
          )}

          {/* TAB: POLICY (Retry, Timeout, Escalation) */}
          {activeTab === 'policy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}>
                  {/* Retry Section */}
                  <div className="space-y-3">
                      <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2"><RefreshCw size={12}/> Retry Policy</h4>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={step.retryPolicy?.enabled || false} onChange={e => updateRetry('enabled', e.target.checked)} />
                            <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
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
                  </div>

                  <div className="h-px bg-slate-200"></div>

                  {/* Escalation Section */}
                  <div className="space-y-3">
                      <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2"><Clock size={12}/> SLA & Escalation</h4>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={step.escalation?.enabled || false} onChange={e => updateEscalation('enabled', e.target.checked)} />
                            <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-500"></div>
                          </label>
                      </div>

                      {step.escalation?.enabled && (
                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-sm space-y-3 animate-slide-up">
                              <NexFormGroup label="Trigger After (Days Overdue)">
                                  <input type="number" className="prop-input" value={step.escalation.daysAfterDue} onChange={e => updateEscalation('daysAfterDue', parseInt(e.target.value))} />
                              </NexFormGroup>
                              <NexFormGroup label="Escalation Action">
                                  <select className="prop-input" value={step.escalation.action} onChange={e => updateEscalation('action', e.target.value)}>
                                      <option value="notify_manager">Notify Manager</option>
                                      <option value="reassign">Auto-Reassign</option>
                                      <option value="auto_complete">Force Complete</option>
                                      <option value="trigger_bot">Trigger Remediation Bot</option>
                                  </select>
                              </NexFormGroup>
                              {step.escalation.action === 'reassign' && (
                                  <NexFormGroup label="Target Role ID">
                                      <input className="prop-input" value={step.escalation.targetId || ''} onChange={e => updateEscalation('targetId', e.target.value)} placeholder="e.g. manager" />
                                  </NexFormGroup>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 flex justify-between items-center" style={{ padding: 'var(--space-base)' }}>
          <button onClick={() => onDelete(step.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-sm transition-colors" title="Delete Step">
              <Trash2 size={16}/>
          </button>
          <div className="text-[9px] text-slate-400 font-mono">ID: {step.id}</div>
        </div>
      </aside>
    );
};