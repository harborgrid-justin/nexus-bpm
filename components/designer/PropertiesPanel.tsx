
import React, { useState, useMemo } from 'react';
import { ProcessStep, UserRole, IOMapping, RetryPolicy, EscalationRule } from '../../types';
import { useBPM } from '../../contexts/BPMContext';
import { Trash2, Compass, X, ExternalLink, Settings, Database, RefreshCw, ArrowRightLeft, Braces, ShieldAlert, Plus, Minimize2, Key, Sparkles, FunctionSquare, Layout, Clock, AlertCircle } from 'lucide-react';
import { NexFormGroup } from '../shared/NexUI';
import { getStepTypeMetadata } from './designerUtils';
import { DataMapper } from '../shared/DataMapper';
import { STEP_SCHEMAS, ConfigField } from './stepSchemas';

const PROCESS_VARS = ['request.id', 'request.amount', 'request.requester', 'request.date', 'approval.status', 'approval.comment', 'user.email', 'user.department', 'system.timestamp', 'case.id'];
const GET_TARGET_SCHEMA = (type: string): string[] => { const schema = STEP_SCHEMAS[type as any]; return schema ? schema.map(f => f.key) : ['config', 'input']; };

export const PropertiesPanel = ({ step, onUpdate, onDelete, roles, onClose }: { step: ProcessStep | undefined; onUpdate: (step: ProcessStep) => void; onDelete: (id: string) => void; roles: UserRole[]; onClose?: () => void; }) => {
    const { rules, forms, navigateTo } = useBPM();
    const [activeTab, setActiveTab] = useState<'config' | 'data' | 'logic' | 'policy'>('config');
    const meta = step ? getStepTypeMetadata(step.type) : { icon: Compass, color: 'text-slate-400', defaultName: '', category: '' };
    const schema = step ? (STEP_SCHEMAS[step.type] || []) : [];
    
    const panelWidthClass = useMemo(() => {
        if (!step) return 'w-[320px]';
        if (activeTab === 'data') return 'w-[600px]';
        if (activeTab === 'logic') return 'w-[450px]';
        return 'w-[320px]';
    }, [step, activeTab]);

    const updateField = (field: keyof ProcessStep, value: any) => { if (step) onUpdate({ ...step, [field]: value }); };
    const updateDataField = (key: string, value: any) => { if (step) onUpdate({ ...step, data: { ...step.data, [key]: value } }); };

    return (
      <aside className={`${panelWidthClass} h-full bg-white border-l border-slate-300 flex flex-col shadow-xl z-20 transition-all duration-300 ease-in-out`}>
        {!step ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200"><Compass size={32} strokeWidth={1} className="text-slate-300" /></div>
                <h3 className="text-sm font-bold text-slate-800">Inspector</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-[200px]">Select a component to configure properties.</p>
            </div>
        ) : (
            <>
            <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50" style={{ height: 'var(--header-height)', padding: '0 var(--space-base)' }}>
                <div className="flex items-center gap-2"><meta.icon size={14} className={meta.color} /><h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{meta.category}</h3></div>
                <div className="flex items-center gap-2"><button onClick={onClose} className="text-slate-400 hover:text-slate-800"><X size={14}/></button></div>
            </div>
            <div className="border-b border-slate-100 bg-white" style={{ padding: 'var(--card-padding)' }}>
                <input type="text" className="text-sm font-bold text-slate-900 w-full outline-none border-b border-transparent focus:border-blue-500 placeholder:text-slate-300 transition-all mb-1" value={step.name} onChange={e => updateField('name', e.target.value)} placeholder="Step Name" />
                <input type="text" className="text-xs text-slate-500 w-full outline-none bg-transparent" value={step.description || ''} onChange={e => updateField('description', e.target.value)} placeholder="Add technical description..." />
            </div>
            <div className="flex border-b border-slate-200 bg-slate-50/50">
                {[ { id: 'config', icon: Settings, label: 'Config' }, { id: 'data', icon: Database, label: 'Wiring' }, { id: 'logic', icon: FunctionSquare, label: 'Rules' }, { id: 'policy', icon: ShieldAlert, label: 'Policy' } ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:bg-white hover:text-slate-700'}`}>
                        <tab.icon size={12}/> {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/30" style={{ padding: 'var(--card-padding)' }}>
                {activeTab === 'config' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}>
                        {schema.map(field => (
                            <NexFormGroup key={field.key} label={field.label} helpText={field.helpText}>
                                <input className="prop-input" value={step.data?.[field.key] || ''} onChange={e => updateDataField(field.key, e.target.value)} placeholder={field.placeholder} />
                            </NexFormGroup>
                        ))}
                    </div>
                )}
            </div>
            <div className="border-t border-slate-200 bg-slate-50 flex justify-between items-center" style={{ padding: 'var(--space-base)' }}>
                <button onClick={() => onDelete(step.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-sm transition-colors" title="Delete Step"><Trash2 size={16}/></button>
                <div className="text-[9px] text-slate-400 font-mono">ID: {step.id}</div>
            </div>
            </>
        )}
      </aside>
    );
};
