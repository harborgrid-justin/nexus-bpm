
import React, { useState, useMemo } from 'react';
import { ProcessStep, UserRole } from '../../types';
import { useBPM } from '../../contexts/BPMContext';
import { Trash2, Compass, X, Settings, Database, FunctionSquare, ShieldAlert, Code, StickyNote, Image as ImageIcon } from 'lucide-react';
import { NexFormGroup, NexSearchSelect } from '../shared/NexUI';
import { getStepTypeMetadata } from './designerUtils';
import { DataMapper } from '../shared/DataMapper';
import { STEP_SCHEMAS } from './stepSchemas';

const PROCESS_VARS = ['request.id', 'request.amount', 'request.requester', 'request.date', 'approval.status', 'approval.comment', 'user.email', 'user.department', 'system.timestamp', 'case.id'];

// Mock Smart Script Editor
const SmartScriptEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    return (
        <div className="relative border border-slate-300 rounded-sm overflow-hidden h-40 bg-[#1e1e1e] font-mono text-xs">
            <div className="absolute top-0 left-0 right-0 bg-[#2d2d2d] text-slate-400 px-2 py-1 text-[10px] flex justify-between">
                <span>JS Expression</span>
                <span>Context: execution</span>
            </div>
            <textarea 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                className="w-full h-full pt-8 p-2 bg-transparent text-emerald-400 outline-none resize-none"
                spellCheck={false}
                placeholder="// Enter logic..."
            />
        </div>
    )
}

export const PropertiesPanel = ({ step, onUpdate, onDelete, roles, onClose }: { step: ProcessStep | undefined; onUpdate: (step: ProcessStep) => void; onDelete: (id: string) => void; roles: UserRole[]; onClose?: () => void; }) => {
    const { forms } = useBPM();
    const [activeTab, setActiveTab] = useState<'config' | 'data' | 'logic' | 'policy'>('config');
    const meta = step ? getStepTypeMetadata(step.type) : { icon: Compass, color: 'text-slate-400', defaultName: '', category: '' };
    const schema = step ? (STEP_SCHEMAS[step.type] || []) : [];
    
    const panelWidthClass = useMemo(() => {
        if (!step) return 'w-[320px]';
        if (activeTab === 'data') return 'w-[600px]'; // Expand for Mapper
        return 'w-[320px]'; // Normal
    }, [step, activeTab]);

    const updateField = (field: keyof ProcessStep, value: any) => { if (step) onUpdate({ ...step, [field]: value }); };
    const updateDataField = (key: string, value: any) => { if (step) onUpdate({ ...step, data: { ...step.data, [key]: value } }); };

    if (!step) return null;

    if (step.type === 'note' as any) {
        return (
            <aside className="w-[320px] h-full bg-yellow-50 border-l border-yellow-200 flex flex-col shadow-xl z-20">
                <div className="p-4 border-b border-yellow-200 flex justify-between items-center text-yellow-800">
                    <h3 className="font-bold flex items-center gap-2"><StickyNote size={16}/> Annotation</h3>
                    <button onClick={onClose}><X size={16}/></button>
                </div>
                <div className="p-4 flex-1">
                    <textarea 
                        className="w-full h-full bg-transparent outline-none resize-none text-sm text-yellow-900 placeholder:text-yellow-700/50 font-handwriting"
                        value={step.description}
                        onChange={e => updateField('description', e.target.value)}
                        placeholder="Type note here..."
                    />
                </div>
                <div className="p-4 border-t border-yellow-200">
                    <button onClick={() => onDelete(step.id)} className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-2"><Trash2 size={12}/> Delete Note</button>
                </div>
            </aside>
        )
    }

    return (
      <aside className={`${panelWidthClass} h-full bg-white border-l border-slate-300 flex flex-col shadow-xl z-20 transition-all duration-300 ease-in-out`}>
            <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50" style={{ height: 'var(--header-height)', padding: '0 var(--space-base)' }}>
                <div className="flex items-center gap-2"><meta.icon size={14} className={meta.color} /><h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{meta.category}</h3></div>
                <div className="flex items-center gap-2"><button onClick={onClose} className="text-slate-400 hover:text-slate-800"><X size={14}/></button></div>
            </div>
            <div className="border-b border-slate-100 bg-white" style={{ padding: 'var(--card-padding)' }}>
                <input type="text" className="text-sm font-bold text-slate-900 w-full outline-none border-b border-transparent focus:border-blue-500 placeholder:text-slate-300 transition-all mb-1" value={step.name} onChange={e => updateField('name', e.target.value)} placeholder="Step Name" />
                <input type="text" className="text-xs text-slate-500 w-full outline-none bg-transparent" value={step.description || ''} onChange={e => updateField('description', e.target.value)} placeholder="Add technical description..." />
            </div>
            <div className="flex border-b border-slate-200 bg-slate-50/50">
                {[ { id: 'config', icon: Settings, label: 'Config' }, { id: 'data', icon: Database, label: 'Wiring' }, { id: 'logic', icon: FunctionSquare, label: 'Logic' }, { id: 'policy', icon: ShieldAlert, label: 'Policy' } ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:bg-white hover:text-slate-700'}`}>
                        <tab.icon size={12}/> {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/30" style={{ padding: 'var(--card-padding)' }}>
                {activeTab === 'config' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}>
                        <div className="p-3 bg-white border border-slate-200 rounded-sm">
                            <NexFormGroup label="Custom Icon URL" icon={ImageIcon}>
                                <input className="prop-input text-xs" placeholder="https://..." value={step.data?.iconUrl || ''} onChange={e => updateDataField('iconUrl', e.target.value)} />
                            </NexFormGroup>
                        </div>

                        {step.type === 'user-task' && (
                            <>
                                <NexFormGroup label="Assignee Role">
                                    <NexSearchSelect 
                                        value={step.role || ''} 
                                        onChange={v => updateField('role', v)}
                                        options={[{label: '-- Dynamic / Unassigned --', value: ''}, ...roles.map(r => ({ label: r.name, value: r.id }))]}
                                        placeholder="Search Roles..."
                                    />
                                </NexFormGroup>
                                <NexFormGroup label="Attach Form">
                                    <NexSearchSelect 
                                        value={step.formId || ''} 
                                        onChange={v => updateField('formId', v)}
                                        options={[{label: '-- No Form --', value: ''}, ...forms.map(f => ({ label: f.name, value: f.id }))]}
                                        placeholder="Search Forms..."
                                    />
                                </NexFormGroup>
                            </>
                        )}
                        {schema.map(field => (
                            <NexFormGroup key={field.key} label={field.label} helpText={field.helpText}>
                                {field.type === 'code' ? (
                                    <SmartScriptEditor value={step.data?.[field.key] || ''} onChange={v => updateDataField(field.key, v)} />
                                ) : field.type === 'select' ? (
                                    <select className="prop-input" value={step.data?.[field.key] || ''} onChange={e => updateDataField(field.key, e.target.value)}>
                                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input className="prop-input" type={field.type === 'number' ? 'number' : 'text'} value={step.data?.[field.key] || ''} onChange={e => updateDataField(field.key, e.target.value)} placeholder={field.placeholder} />
                                )}
                            </NexFormGroup>
                        ))}
                    </div>
                )}

                {activeTab === 'data' && (
                    <DataMapper 
                        mappings={step.inputs || []} 
                        onChange={m => updateField('inputs', m)} 
                        sourceSchema={PROCESS_VARS}
                        targetSchema={schema.map(f => f.key)} 
                    />
                )}

                {activeTab === 'logic' && (
                    <div className="space-y-4">
                        <NexFormGroup label="Entry Script" icon={Code}>
                            <SmartScriptEditor value={step.onEntryAction || ''} onChange={v => updateField('onEntryAction', v)} />
                        </NexFormGroup>
                        <NexFormGroup label="Exit Script" icon={Code}>
                            <SmartScriptEditor value={step.onExitAction || ''} onChange={v => updateField('onExitAction', v)} />
                        </NexFormGroup>
                    </div>
                )}
            </div>
            <div className="border-t border-slate-200 bg-slate-50 flex justify-between items-center" style={{ padding: 'var(--space-base)' }}>
                <button onClick={() => onDelete(step.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-sm transition-colors" title="Delete Step"><Trash2 size={16}/></button>
                <div className="text-[9px] text-slate-400 font-mono">ID: {step.id}</div>
            </div>
      </aside>
    );
};
