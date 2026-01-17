
import React, { useState, useCallback, ChangeEvent, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { BusinessRule, RuleCondition, RuleAction, DecisionTable, Condition, ConditionGroup } from '../types';
import { 
  FunctionSquare, Plus, BrainCircuit, Table, TestTube, Trash2, Save, 
  Upload, Play, GitMerge, MoreVertical, X, FileJson, Copy, 
  ChevronRight, List, PenTool, Database, Code, Sparkles, PlusCircle
} from 'lucide-react';
import { produce } from 'immer';

// --- Reusable UI Components ---
const RuleInput = ({ value, onChange, ...props }: any) => (
  <input 
    value={value} 
    onChange={e => onChange(e.target.value)} 
    className="prop-input text-[13px] py-2.5 px-4" 
    {...props} 
  />
);

const RuleSelect = ({ value, onChange, children }: any) => (
  <select 
    value={value} 
    onChange={e => onChange(e.target.value)} 
    className="prop-input text-[13px] py-2.5 px-4 appearance-none"
  >
    {children}
  </select>
);

const IconButton = ({ icon: Icon, onClick, tooltip, className }: any) => (
    <button 
      onClick={onClick} 
      title={tooltip} 
      className={`p-3 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-2xl transition-all active:scale-90 border border-transparent ${className}`}
    >
        <Icon size={20} />
    </button>
);

// --- Natural Language Generator ---
const operatorToText = (op: RuleCondition['operator']) => ({
    'eq': 'equals', 'neq': 'does not equal', 'gt': 'is greater than', 'lt': 'is less than', 'contains': 'contains'
}[op]);

const generateConditionSummary = (condition: Condition): string => {
    if ('children' in condition) { // It's a group
        if (condition.children.length === 0) return '(Empty Group)';
        return `(${condition.children.map(generateConditionSummary).join(` ${condition.type} `)})`;
    }
    return `"${condition.fact}" ${operatorToText(condition.operator)} "${condition.value}"`;
};

// --- Empty State Component ---
const EmptyAssetSlot = ({ label, icon: Icon, onAdd }: { label: string, icon: React.ElementType, onAdd: () => void }) => (
  <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30 flex flex-col items-center justify-center text-center group hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer" onClick={onAdd}>
    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-4 group-hover:scale-110 group-hover:text-blue-500 transition-all">
      <Icon size={24} strokeWidth={1.5} />
    </div>
    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">{label}</p>
    <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 group-hover:bg-slate-900 group-hover:text-white transition-all">
      <Plus size={14} strokeWidth={3}/> Initialize
    </button>
  </div>
);

// --- Live Test Panel Component ---
const LiveTestPanel = ({ ruleId, rules, decisionTables }: { ruleId: string | null, rules: BusinessRule[], decisionTables: DecisionTable[] }) => {
    const { executeRules } = useBPM();
    const [inputData, setInputData] = useState('{\n  "invoice": {\n    "amount": 7500,\n    "region": "EMEA"\n  }\n}');
    const [output, setOutput] = useState<any>(null);
    const [isRunning, setIsRunning] = useState(false);

    const handleSimulate = async () => {
        if (!ruleId) return;
        setIsRunning(true);
        try {
            const data = JSON.parse(inputData);
            const result = await executeRules(ruleId, data);
            setOutput(result);
        } catch (e) {
            setOutput({ error: (e as Error).message });
        } finally {
            setIsRunning(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-slate-50 md:bg-transparent">
            <div className="p-6 md:p-4 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Execution Sandbox</h3>
            </div>
            <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
                <div className="space-y-3 flex-1 flex flex-col">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Code size={12}/> Input Vector (JSON)
                      </label>
                      <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Format</button>
                    </div>
                    <textarea 
                      value={inputData} 
                      onChange={e => setInputData(e.target.value)} 
                      className="flex-1 w-full bg-slate-900 text-green-400 p-5 rounded-2xl font-mono text-[12px] border border-slate-800 shadow-2xl focus:ring-4 ring-blue-500/10 outline-none transition-all resize-none" 
                    />
                </div>
                <div className="space-y-3 flex-1 flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Verification Result</label>
                    <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 font-mono text-[12px] overflow-auto shadow-inner relative group">
                        {output ? (
                          <pre className="text-slate-700">{JSON.stringify(output, null, 2)}</pre>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                            <Database size={32} strokeWidth={1} />
                            <span className="font-medium">Awaiting Execution...</span>
                          </div>
                        )}
                        {output && (
                          <button 
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(output, null, 2))}
                            className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy size={14}/>
                          </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-6 md:p-4 border-t border-slate-100 bg-white/50 backdrop-blur">
                <button 
                  onClick={handleSimulate} 
                  disabled={!ruleId || isRunning} 
                  className="w-full py-4 bg-slate-900 text-white font-black text-[12px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 disabled:opacity-30 transition-all shadow-xl active:scale-95 btn-hover-scale"
                >
                    {isRunning ? <Play size={16} className="animate-spin" /> : <Play size={16} fill="currentColor"/>}
                    {isRunning ? 'Processing...' : 'Run Simulation'}
                </button>
            </div>
        </div>
    );
};

// --- Condition Components ---
const ConditionEditor = ({ condition, onUpdate, onDelete }: { condition: RuleCondition, onUpdate: (c: RuleCondition) => void, onDelete: () => void }) => (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group">
        <div className="flex-1">
          <RuleInput placeholder="fact (invoice.amount)" value={condition.fact} onChange={(val: string) => onUpdate({ ...condition, fact: val })} />
        </div>
        <div className="w-full sm:w-48">
          <RuleSelect value={condition.operator} onChange={(val: string) => onUpdate({ ...condition, operator: val as RuleCondition['operator'] })}>
              <option value="eq">is equal to</option><option value="neq">is not equal to</option><option value="gt">is greater than</option><option value="lt">is less than</option><option value="contains">contains</option>
          </RuleSelect>
        </div>
        <div className="flex-1 flex gap-2">
          <RuleInput placeholder="target value" value={condition.value} onChange={(val: string) => onUpdate({ ...condition, value: val })} />
          <IconButton icon={X} onClick={onDelete} className="bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white" />
        </div>
    </div>
);

const ConditionGroupEditor = ({ group, onUpdate, path }: { group: ConditionGroup, onUpdate: (path: string, group: ConditionGroup) => void, path: string }) => {
    const updateGroup = (updater: (draft: ConditionGroup) => void) => {
        onUpdate(path, produce(group, updater));
    };

    const handleChildUpdate = (childPath: string, updatedChild: Condition) => {
        const childIndex = parseInt(childPath.split('.').pop() || '0');
        updateGroup(draft => {
            draft.children[childIndex] = updatedChild;
        });
    };

    const addCondition = () => updateGroup(draft => {
        draft.children.push({ id: `cond-${Date.now()}`, fact: '', operator: 'eq', value: '' });
    });
    
    const addGroup = () => updateGroup(draft => {
        draft.children.push({ id: `group-${Date.now()}`, type: 'AND', children: [] });
    });
    
    const deleteChild = (index: number) => updateGroup(draft => {
        draft.children.splice(index, 1);
    });

    const toggleType = () => updateGroup(draft => {
        draft.type = draft.type === 'AND' ? 'OR' : 'AND';
    });

    return (
        <div className={`p-4 md:p-6 rounded-[2rem] space-y-4 relative border-2 ${group.type === 'AND' ? 'bg-blue-50/20 border-blue-100' : 'bg-amber-50/20 border-amber-100'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                      onClick={toggleType} 
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${group.type === 'AND' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'}`}
                    >
                      {group.type}
                    </button>
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">Operator</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={addCondition} className="text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
                      <Plus size={12} strokeWidth={3}/> Statement
                    </button>
                    <button onClick={addGroup} className="text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
                      <GitMerge size={12} strokeWidth={3}/> Sub-Group
                    </button>
                </div>
            </div>
            <div className="pl-4 md:pl-8 space-y-3 border-l-2 border-slate-200/50">
                {group.children.map((child, i) => (
                    <div key={child.id} className="animate-fade-in">
                        {'children' in child 
                            ? <ConditionGroupEditor group={child as ConditionGroup} onUpdate={handleChildUpdate} path={`children.${i}`} />
                            : <ConditionEditor condition={child as RuleCondition} onUpdate={c => handleChildUpdate(`children.${i}`, c)} onDelete={() => deleteChild(i)} />
                        }
                    </div>
                ))}
                {group.children.length === 0 && (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium italic">Empty logic branch. Define conditions above.</div>
                )}
            </div>
        </div>
    );
};

// --- Visual Rule Builder ---
const RuleBuilder = ({ rule, onSave, onDelete }: { rule: BusinessRule, onSave: (r: BusinessRule) => void, onDelete: (id: string) => void }) => {
    const [localRule, setLocalRule] = useState<BusinessRule>(rule);
    const summary = useMemo(() => generateConditionSummary(localRule.conditions), [localRule.conditions]);

    const updateRule = (updater: (draft: BusinessRule) => void) => {
        const nextState = produce(localRule, updater);
        setLocalRule(nextState);
    };

    const handleConditionsUpdate = (path: string, updatedGroup: ConditionGroup) => {
       updateRule(draft => { draft.conditions = updatedGroup });
    };

    const updateActionParam = (key: string, value: any) => updateRule(draft => {
        draft.action.params[key] = value;
    });

    const handleSave = () => onSave(localRule);

    return (
        <div className="p-6 md:p-10 space-y-12 animate-fade-in pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1 w-full space-y-2">
                    <input 
                      value={localRule.name} 
                      onChange={e => updateRule(draft => { draft.name = e.target.value })} 
                      className="text-2xl md:text-3xl font-black text-slate-900 bg-transparent focus:bg-white rounded-2xl px-4 -ml-4 py-2 outline-none focus:ring-4 ring-blue-500/5 transition-all w-full" 
                    />
                    <textarea 
                      value={localRule.description} 
                      onChange={e => updateRule(draft => { draft.description = e.target.value })} 
                      className="prop-input text-[14px] font-medium text-slate-500 w-full mt-1 min-h-[80px] bg-transparent hover:bg-slate-50" 
                      placeholder="Declare rule objective..."
                    />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <IconButton icon={Trash2} onClick={() => onDelete(rule.id)} tooltip="Discard Asset" className="text-rose-400 hover:bg-rose-50 hover:text-rose-600"/>
                    <button 
                      onClick={handleSave} 
                      className="px-8 py-4 bg-slate-900 text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 shadow-2xl active:scale-95 transition-all"
                    >
                      <Save size={18} /> Deploy Changes
                    </button>
                </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3">
                <Code size={16} className="text-blue-600"/>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Narrative</h4>
              </div>
              <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl font-mono text-[12px] leading-relaxed shadow-inner">
                  <span className="text-blue-400 font-bold">DETERMINE</span> IF {summary} <span className="text-blue-400 font-bold">THEN EXECUTE</span> {localRule.action.type.replace('_', ' ')}
              </div>
            </div>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Condition Topology</h4>
              </div>
              <ConditionGroupEditor group={localRule.conditions} onUpdate={handleConditionsUpdate} path="conditions" />
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Resolution Action</h4>
              </div>
              <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-6 max-w-xl shadow-3xl">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Execution Logic</label>
                    <select 
                      value={localRule.action.type} 
                      onChange={(val: string) => updateRule(draft => { draft.action.type = val as RuleAction['type']})}
                      className="w-full bg-slate-800 border-none text-white p-4 rounded-2xl text-sm font-bold focus:ring-4 ring-blue-500/20 transition-all outline-none"
                    >
                      <option value="SET_VARIABLE">Set Process Variable</option>
                      <option value="ROUTE_TO">Route to User/Group</option>
                      <option value="SEND_NOTIFICATION">Send Notification</option>
                    </select>
                  </div>
                  {localRule.action.type === 'SET_VARIABLE' && (
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Target Pointer</label>
                        <input placeholder="Variable Name" value={localRule.action.params.variableName || ''} onChange={(e) => updateActionParam('variableName', e.target.value)} className="w-full bg-slate-800 border-none text-white p-4 rounded-2xl text-sm font-medium outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Allocation Value</label>
                        <input placeholder="Value" value={localRule.action.params.value || ''} onChange={(e) => updateActionParam('value', e.target.value)} className="w-full bg-slate-800 border-none text-white p-4 rounded-2xl text-sm font-medium outline-none" />
                      </div>
                    </div>
                  )}
              </div>
            </section>
        </div>
    );
};

// --- Main View ---
export const RulesEngineView: React.FC = () => {
    const { rules, decisionTables, saveRule, deleteRule, saveDecisionTable, deleteDecisionTable } = useBPM();
    const [selectedAsset, setSelectedAsset] = useState<{type: 'rule' | 'table', id: string} | null>(null);
    const [activeMobileTab, setActiveMobileTab] = useState<'assets' | 'builder' | 'test'>('assets');

    const createNew = (type: 'rule' | 'table') => {
        if (type === 'rule') {
            const newRule: BusinessRule = {
                id: `rule-${Date.now()}`, name: 'New Asset Rule', description: '',
                conditions: { id: `group-${Date.now()}`, type: 'AND', children: [] },
                action: { type: 'SET_VARIABLE', params: {} }, priority: 1
            };
            saveRule(newRule);
            setSelectedAsset({type: 'rule', id: newRule.id});
            if (window.innerWidth < 768) setActiveMobileTab('builder');
        } else {
            const newTable: DecisionTable = { id: `tbl-${Date.now()}`, name: 'New Logic Table', inputs: [], outputs: [], rules: []};
            saveDecisionTable(newTable);
            setSelectedAsset({type: 'table', id: newTable.id});
            if (window.innerWidth < 768) setActiveMobileTab('builder');
        }
    };
    
    const handleDelete = (id: string) => {
        if (selectedAsset?.type === 'rule') deleteRule(id);
        else deleteDecisionTable(id);
        setSelectedAsset(null);
        if (window.innerWidth < 768) setActiveMobileTab('assets');
    }

    const currentAsset = selectedAsset?.type === 'rule' 
        ? rules.find(r => r.id === selectedAsset.id) 
        : decisionTables.find(t => t.id === selectedAsset.id);

    const renderMainPanel = () => {
        if (!selectedAsset || !currentAsset) {
          return (
            <div className="p-10 text-center text-slate-300 h-full flex flex-col items-center justify-center bg-white">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 animate-float">
                <BrainCircuit size={48} strokeWidth={1} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tightest mb-4">Declarative Reasoning</h3>
              <p className="text-[15px] font-medium text-slate-400 max-w-xs leading-relaxed">Select an operational rule set or logic table from the asset library to modify execution flows.</p>
            </div>
          );
        }
        if (selectedAsset.type === 'rule') return <RuleBuilder rule={currentAsset as BusinessRule} onSave={saveRule} onDelete={handleDelete} />;
        return <div className="p-20 text-center italic text-slate-400">Advanced Decision Table Editor Coming Soon</div>;
    };

    return (
        <div className="h-[calc(100vh-144px)] flex flex-col md:flex-row bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-fade-in">
            
            {/* Mobile Tab Control */}
            <div className="md:hidden flex border-b border-slate-100 bg-slate-50/50 p-2">
               {[
                 { id: 'assets', label: 'Library', icon: List },
                 { id: 'builder', label: 'Editor', icon: PenTool },
                 { id: 'test', label: 'Sandbox', icon: TestTube }
               ].map(tab => (
                 <button 
                  key={tab.id}
                  onClick={() => setActiveMobileTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMobileTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}
                 >
                   <tab.icon size={16}/> {tab.label}
                 </button>
               ))}
            </div>

            {/* Assets Sidebar */}
            <aside className={`w-full md:w-[320px] bg-white border-r border-slate-100 flex flex-col shrink-0 ${activeMobileTab === 'assets' ? 'flex' : 'hidden md:flex'}`}>
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                      <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.25em]">Inventory</h3>
                    </div>
                    <div className="flex gap-2">
                        <IconButton icon={BrainCircuit} onClick={() => createNew('rule')} tooltip="New Logic Set" className="bg-white shadow-sm border border-slate-200" />
                        <IconButton icon={Table} onClick={() => createNew('table')} tooltip="New Matrix" className="bg-white shadow-sm border border-slate-200" />
                    </div>
                </div>
                <div className="overflow-y-auto no-scrollbar flex-1 p-6 space-y-10 pb-20">
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-2 flex items-center justify-between">
                        Reasoning Assets
                        <Sparkles size={14} className="text-blue-400"/>
                      </h4>
                      <div className="space-y-3">
                        {rules.map(r => (
                          <button 
                            key={r.id} 
                            onClick={() => { setSelectedAsset({type: 'rule', id: r.id}); setActiveMobileTab('builder'); }} 
                            className={`w-full text-left px-5 py-5 rounded-[24px] flex items-center gap-4 transition-all group border ${selectedAsset?.id === r.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 hover:border-blue-200 text-slate-600'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedAsset?.id === r.id ? 'bg-white/10 text-blue-400' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                              <BrainCircuit size={18} />
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-[14px] font-black truncate tracking-tight">{r.name}</p>
                              <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${selectedAsset?.id === r.id ? 'text-slate-400' : 'text-slate-300'}`}>Logic Protocol</p>
                            </div>
                            <ChevronRight size={14} className={selectedAsset?.id === r.id ? 'text-white' : 'text-slate-300'} />
                          </button>
                        ))}
                        {rules.length === 0 && (
                          <EmptyAssetSlot label="No Reasoning Assets" icon={BrainCircuit} onAdd={() => createNew('rule')} />
                        )}
                      </div>
                    </section>
                    
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-2 flex items-center justify-between">
                        Decision Matrices
                        <Database size={14} className="text-slate-300"/>
                      </h4>
                      <div className="space-y-3">
                        {decisionTables.map(t => (
                          <button 
                            key={t.id} 
                            onClick={() => { setSelectedAsset({type: 'table', id: t.id}); setActiveMobileTab('builder'); }} 
                            className={`w-full text-left px-5 py-5 rounded-[24px] flex items-center gap-4 transition-all group border ${selectedAsset?.id === t.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 hover:border-blue-200 text-slate-600'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedAsset?.id === t.id ? 'bg-white/10 text-blue-400' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                              <Table size={18} />
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-[14px] font-black truncate tracking-tight">{t.name}</p>
                              <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${selectedAsset?.id === t.id ? 'text-slate-400' : 'text-slate-300'}`}>Evaluation Table</p>
                            </div>
                            <ChevronRight size={14} className={selectedAsset?.id === t.id ? 'text-white' : 'text-slate-300'} />
                          </button>
                        ))}
                        {decisionTables.length === 0 && (
                          <EmptyAssetSlot label="No Decision Matrices" icon={Table} onAdd={() => createNew('table')} />
                        )}
                      </div>
                    </section>
                </div>
            </aside>

            {/* Main Builder Area */}
            <main className={`flex-1 flex flex-col min-w-0 bg-white border-r border-slate-100 ${activeMobileTab === 'builder' ? 'flex' : 'hidden md:flex'}`}>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {renderMainPanel()}
                </div>
            </main>

            {/* Test Sidebar */}
            <aside className={`w-full md:w-[420px] bg-slate-50/50 backdrop-blur shrink-0 ${activeMobileTab === 'test' ? 'flex' : 'hidden md:flex'}`}>
                <LiveTestPanel ruleId={selectedAsset?.id || null} rules={rules} decisionTables={decisionTables} />
            </aside>
        </div>
    );
};
