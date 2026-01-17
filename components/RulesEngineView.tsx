
import React, { useState, useCallback, ChangeEvent, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { BusinessRule, RuleCondition, RuleAction, DecisionTable, Condition, ConditionGroup } from '../types';
import { 
  FunctionSquare, Plus, BrainCircuit, Table, TestTube, Trash2, Save, 
  Upload, Play, GitMerge, MoreVertical, X, FileJson, Copy, 
  ChevronRight, List, PenTool, Database, Code, Sparkles, PlusCircle, Search,
  MessageSquare, Zap, Activity, Info, Tag, Layers, ArrowUp, ArrowDown, Download, CheckCircle, AlertTriangle, Maximize2, Minimize2
} from 'lucide-react';
import { produce } from 'immer';
import { NexButton, NexModal, NexFormGroup, NexBadge } from './shared/NexUI';
import { explainRuleLogic } from '../services/geminiService';

// --- Reusable UI Components ---
const RuleInput = ({ value, onChange, ...props }: any) => (
  <input 
    value={value} 
    onChange={e => onChange(e.target.value)} 
    className="prop-input text-xs" 
    {...props} 
  />
);

const RuleSelect = ({ value, onChange, children }: any) => (
  <select 
    value={value} 
    onChange={e => onChange(e.target.value)} 
    className="prop-input text-xs appearance-none"
  >
    {children}
  </select>
);

const IconButton = ({ icon: Icon, onClick, tooltip, className, disabled }: any) => (
    <button 
      onClick={onClick} 
      title={tooltip} 
      disabled={disabled}
      className={`p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-sm transition-all border border-transparent disabled:opacity-50 ${className}`}
    >
        <Icon size={16} />
    </button>
);

const operatorToText = (op: RuleCondition['operator']) => ({
    'eq': 'equals', 'neq': 'does not equal', 'gt': 'is greater than', 'lt': 'is less than', 'contains': 'contains'
}[op]);

const generateConditionSummary = (condition: Condition): string => {
    if ('children' in condition) {
        if (condition.children.length === 0) return '(Empty)';
        return `(${condition.children.map(generateConditionSummary).join(` ${condition.type} `)})`;
    }
    return `"${condition.fact}" ${operatorToText(condition.operator)} "${condition.value}"`;
};

// Calculate Complexity Score (Depth + Count)
const calculateComplexity = (condition: Condition, depth = 1): number => {
    if ('children' in condition) {
        return condition.children.reduce((acc, child) => acc + calculateComplexity(child, depth + 1), 0) + (depth > 3 ? 5 : 1);
    }
    return 1;
};

// --- Test Case Interface ---
interface TestCase {
    id: string;
    name: string;
    input: string; // JSON string
}

// --- Live Test Panel Component ---
const LiveTestPanel = ({ ruleId, rules, decisionTables }: { ruleId: string | null, rules: BusinessRule[], decisionTables: DecisionTable[] }) => {
    const { executeRules } = useBPM();
    const [inputData, setInputData] = useState('{\n  "invoice": {\n    "amount": 7500,\n    "region": "EMEA"\n  }\n}');
    const [output, setOutput] = useState<any>(null);
    const [isRunning, setIsRunning] = useState(false);
    
    // Saved Test Cases State
    const [testCases, setTestCases] = useState<TestCase[]>([
        { id: 'tc-1', name: 'Standard EMEA Invoice', input: '{\n  "invoice": {\n    "amount": 7500,\n    "region": "EMEA"\n  }\n}' },
        { id: 'tc-2', name: 'High Value Fraud Check', input: '{\n  "invoice": {\n    "amount": 99000,\n    "isNew": true\n  }\n}' }
    ]);
    const [saveName, setSaveName] = useState('');

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

    const loadTestCase = (tc: TestCase) => {
        setInputData(tc.input);
    };

    const saveTestCase = () => {
        if (!saveName) return;
        setTestCases([...testCases, { id: `tc-${Date.now()}`, name: saveName, input: inputData }]);
        setSaveName('');
    };
    
    return (
        <div className="flex flex-col h-full bg-slate-50 border-l border-slate-300">
            <div className="p-3 border-b border-slate-200 bg-white">
              <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><TestTube size={14}/> QA Laboratory</h3>
            </div>
            
            <div className="p-4 space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
                
                {/* Saved Tests */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase">Test Suite Library</h4>
                    <div className="space-y-1">
                        {testCases.map(tc => (
                            <div key={tc.id} onClick={() => loadTestCase(tc)} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-sm cursor-pointer hover:border-blue-400 group">
                                <span className="text-xs font-medium text-slate-700">{tc.name}</span>
                                <Play size={10} className="text-slate-300 group-hover:text-blue-600"/>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-1 mt-2">
                        <input className="prop-input py-1 text-[10px]" placeholder="New test name..." value={saveName} onChange={e => setSaveName(e.target.value)} />
                        <NexButton size="sm" onClick={saveTestCase} icon={Save} disabled={!saveName}></NexButton>
                    </div>
                </div>

                <div className="h-px bg-slate-200 w-full"></div>

                <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Live Input Vector (JSON)</label>
                    <textarea 
                      value={inputData} 
                      onChange={e => setInputData(e.target.value)} 
                      className="flex-1 w-full bg-white text-slate-700 p-3 rounded-sm font-mono text-xs border border-slate-300 outline-none focus:border-blue-500 transition-all resize-none min-h-[150px]" 
                    />
                </div>
                
                <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Result Output</label>
                    <div className={`flex-1 bg-white border rounded-sm p-3 font-mono text-xs overflow-auto relative ${output?.matched ? 'border-emerald-400 bg-emerald-50/10' : 'border-slate-300'}`}>
                        {output ? (
                          <pre className="text-slate-800">{JSON.stringify(output, null, 2)}</pre>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
                            Awaiting Execution...
                          </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-white">
                <NexButton variant="primary" onClick={handleSimulate} disabled={!ruleId || isRunning} className="w-full" icon={Play}>Run Simulation</NexButton>
            </div>
        </div>
    );
};

// --- Condition Components ---
const ConditionEditor = ({ condition, onUpdate, onDelete }: { condition: RuleCondition, onUpdate: (c: RuleCondition) => void, onDelete: () => void }) => (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-sm">
        <div className="flex-1">
          <RuleInput placeholder="fact (e.g. invoice.amount)" value={condition.fact} onChange={(val: string) => onUpdate({ ...condition, fact: val })} />
        </div>
        <div className="w-full sm:w-40">
          <RuleSelect value={condition.operator} onChange={(val: string) => onUpdate({ ...condition, operator: val as RuleCondition['operator'] })}>
              <option value="eq">Equals</option><option value="neq">Not Equal</option><option value="gt">Greater Than</option><option value="lt">Less Than</option><option value="contains">Contains</option>
          </RuleSelect>
        </div>
        <div className="flex-1 flex gap-2">
          <RuleInput placeholder="Value" value={condition.value} onChange={(val: string) => onUpdate({ ...condition, value: val })} />
          <button onClick={onDelete} className="p-2 bg-white border border-slate-300 text-rose-500 hover:bg-rose-50 hover:border-rose-300 rounded-sm"><X size={14}/></button>
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
        <div className={`p-4 rounded-sm space-y-3 border ${group.type === 'AND' ? 'bg-blue-50/10 border-blue-200' : 'bg-amber-50/10 border-amber-200'}`}>
            <div className="flex items-center justify-between">
                <button 
                  onClick={toggleType} 
                  className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase transition-all border ${group.type === 'AND' ? 'bg-blue-600 text-white border-blue-700' : 'bg-amber-500 text-white border-amber-600'}`}
                >
                  {group.type}
                </button>
                <div className="flex items-center gap-2">
                    <NexButton variant="secondary" onClick={addCondition} icon={Plus} className="text-[10px] py-1">Condition</NexButton>
                    <NexButton variant="secondary" onClick={addGroup} icon={GitMerge} className="text-[10px] py-1">Group</NexButton>
                </div>
            </div>
            <div className="pl-4 space-y-2 border-l-2 border-slate-200">
                {group.children.map((child, i) => (
                    <div key={child.id}>
                        {'children' in child 
                            ? <ConditionGroupEditor group={child as ConditionGroup} onUpdate={handleChildUpdate} path={`children.${i}`} />
                            : <ConditionEditor condition={child as RuleCondition} onUpdate={c => handleChildUpdate(`children.${i}`, c)} onDelete={() => deleteChild(i)} />
                        }
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Visual Rule Builder ---
interface RuleBuilderProps {
  rule: BusinessRule;
  onSave: (r: BusinessRule) => void;
  onDelete: (id: string) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({ rule, onSave, onDelete, isFullscreen, toggleFullscreen }) => {
    const [localRule, setLocalRule] = useState<BusinessRule>(rule);
    const { processes } = useBPM();
    const [explanation, setExplanation] = useState('');
    const [newTag, setNewTag] = useState('');

    const summary = useMemo(() => generateConditionSummary(localRule.conditions), [localRule.conditions]);
    const complexity = useMemo(() => calculateComplexity(localRule.conditions), [localRule.conditions]);

    // Calculate Dependencies
    const usedInProcesses = useMemo(() => {
        return processes.filter(p => 
            p.steps.some(s => s.businessRuleId === rule.id || s.data?.ruleId === rule.id)
        );
    }, [rule.id, processes]);

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

    const handleSave = () => {
        updateRule(d => { d.version = (d.version || 1) + 0.1; d.lastModified = new Date().toISOString(); });
        onSave(localRule);
    };

    const handleExplain = async () => {
        const text = await explainRuleLogic(localRule);
        setExplanation(text);
    };

    const addTag = () => {
        if(newTag && !localRule.tags?.includes(newTag)) {
            updateRule(d => { d.tags = [...(d.tags || []), newTag] });
            setNewTag('');
        }
    };

    const removeTag = (t: string) => updateRule(d => { d.tags = d.tags.filter(tag => tag !== t) });

    return (
        <div className={`p-6 space-y-8 animate-fade-in ${isFullscreen ? 'h-full overflow-y-auto' : 'pb-20'}`}>
            <div className="flex justify-between items-start gap-6 border-b border-slate-200 pb-6">
                <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                        <input 
                        value={localRule.name} 
                        onChange={e => updateRule(draft => { draft.name = e.target.value })} 
                        className="text-xl font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-blue-500 outline-none pb-1" 
                        />
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded-sm border border-slate-200">v{localRule.version?.toFixed(1) || '1.0'}</span>
                        <button onClick={() => updateRule(d => { d.status = d.status === 'Active' ? 'Draft' : 'Active' })} className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border ${localRule.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {localRule.status || 'Draft'}
                        </button>
                    </div>
                    <textarea 
                      value={localRule.description} 
                      onChange={e => updateRule(draft => { draft.description = e.target.value })} 
                      className="w-full text-xs text-slate-500 bg-transparent outline-none resize-none" 
                      placeholder="Enter rule description..."
                    />
                    <div className="flex items-center gap-2">
                        {localRule.tags?.map(t => (
                            <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] border border-blue-100">
                                <Tag size={10}/> {t} <button onClick={() => removeTag(t)}><X size={10}/></button>
                            </span>
                        ))}
                        <div className="flex items-center gap-1">
                            <input className="bg-transparent border-b border-slate-200 text-[10px] w-20 outline-none" placeholder="+ Tag" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-slate-700"><Maximize2 size={16}/></button>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <NexButton variant="danger" onClick={() => onDelete(rule.id)} icon={Trash2}>Delete</NexButton>
                    <NexButton variant="primary" onClick={handleSave} icon={Save}>Deploy</NexButton>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-sm font-mono text-xs text-slate-700 leading-relaxed relative group">
                    <span className="text-blue-600 font-bold">IF</span> {summary} <span className="text-blue-600 font-bold">THEN</span> {localRule.action.type}
                    <button onClick={handleExplain} className="absolute right-2 top-2 p-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                        <MessageSquare size={12}/> Explain
                    </button>
                    {explanation && (
                        <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600 italic flex items-start gap-2">
                            <BotIcon className="shrink-0 text-blue-500" />
                            {explanation}
                        </div>
                    )}
                </div>
                <div className="w-40 p-4 border border-slate-200 rounded-sm flex flex-col items-center justify-center">
                    <div className={`text-2xl font-black ${complexity > 10 ? 'text-rose-500' : 'text-emerald-500'}`}>{complexity}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Complexity</div>
                </div>
            </div>

            <section className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Conditions</h4>
              <ConditionGroupEditor group={localRule.conditions} onUpdate={handleConditionsUpdate} path="conditions" />
            </section>

            <section className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Action</h4>
              <div className="p-4 border border-slate-300 rounded-sm space-y-4 bg-white">
                  <div className="space-y-1">
                    <label className="prop-label">Type</label>
                    <select 
                      value={localRule.action.type} 
                      onChange={(val: string) => updateRule(draft => { draft.action.type = val as RuleAction['type']})}
                      className="prop-input"
                    >
                      <option value="SET_VARIABLE">Set Process Variable</option>
                      <option value="ROUTE_TO">Route to User/Group</option>
                      <option value="SEND_NOTIFICATION">Send Notification</option>
                    </select>
                  </div>
                  {localRule.action.type === 'SET_VARIABLE' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="prop-label">Variable Name</label>
                        <input placeholder="Name" value={localRule.action.params.variableName || ''} onChange={(e) => updateActionParam('variableName', e.target.value)} className="prop-input" />
                      </div>
                      <div className="space-y-1">
                        <label className="prop-label">Value</label>
                        <input placeholder="Value" value={localRule.action.params.value || ''} onChange={(e) => updateActionParam('value', e.target.value)} className="prop-input" />
                      </div>
                    </div>
                  )}
                  {localRule.action.type === 'ROUTE_TO' && (
                    <div className="space-y-1">
                        <label className="prop-label">Target Role / Group</label>
                        <input placeholder="e.g. 'Approver' or 'CFO'" value={localRule.action.params.role || localRule.action.params.group || ''} onChange={(e) => updateActionParam('role', e.target.value)} className="prop-input" />
                    </div>
                  )}
              </div>
            </section>

            <section className="space-y-2 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dependency Graph</h4>
                {usedInProcesses.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No active processes trigger this rule.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {usedInProcesses.map(p => (
                            <div key={p.id} className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-sm text-blue-700 text-xs font-medium">
                                <Activity size={12}/> {p.name}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const BotIcon = ({ className }: { className?: string }) => (
    <Sparkles size={14} className={className} />
);

// --- Visual Table Builder ---
interface TableBuilderProps {
  table: DecisionTable;
  onSave: (t: DecisionTable) => void;
  onDelete: (id: string) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const TableBuilder: React.FC<TableBuilderProps> = ({ table, onSave, onDelete, isFullscreen, toggleFullscreen }) => {
    const [localTable, setLocalTable] = useState<DecisionTable>(table);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const updateTable = (updater: (draft: DecisionTable) => void) => {
        setLocalTable(produce(localTable, updater));
    };

    const addRow = () => updateTable(draft => {
        const row = new Array(draft.inputs.length + draft.outputs.length).fill('');
        draft.rules.push(row);
    });

    const moveRow = (idx: number, direction: -1 | 1) => updateTable(draft => {
        if (idx + direction < 0 || idx + direction >= draft.rules.length) return;
        const temp = draft.rules[idx];
        draft.rules[idx] = draft.rules[idx + direction];
        draft.rules[idx + direction] = temp;
    });

    const removeRow = (idx: number) => updateTable(draft => {
        draft.rules.splice(idx, 1);
    });

    const handleExportCSV = () => {
        const headers = [...localTable.inputs.map(i => `${i} (IN)`), ...localTable.outputs.map(o => `${o} (OUT)`)].join(',');
        const rows = localTable.rules.map(r => r.join(',')).join('\n');
        const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${localTable.name.replace(/\s+/g, '_')}_v${localTable.version || 1}.csv`;
        a.click();
    };

    const handleImportCSV = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const rows = text.split('\n').filter(r => r.trim());
            // Skip header, map rest
            const newRules = rows.slice(1).map(r => r.split(',').map(c => c.trim()));
            updateTable(d => { d.rules = newRules; });
        };
        reader.readAsText(file);
    };

    return (
        <div className={`p-6 space-y-6 ${isFullscreen ? 'h-full overflow-y-auto' : ''}`}>
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div className="flex-1">
                    <input className="text-xl font-bold text-slate-900 bg-transparent outline-none w-full" value={localTable.name} onChange={e => updateTable(d => {d.name = e.target.value})} />
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">v{localTable.version || 1}</span>
                        <NexBadge variant={localTable.status === 'Active' ? 'emerald' : 'slate'}>{localTable.status || 'Draft'}</NexBadge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-slate-700"><Maximize2 size={16}/></button>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <NexButton variant="secondary" onClick={handleExportCSV} icon={Download}>Export CSV</NexButton>
                    <NexButton variant="secondary" onClick={() => fileInputRef.current?.click()} icon={Upload}>Import CSV</NexButton>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                    <NexButton variant="danger" onClick={() => onDelete(table.id)} icon={Trash2}>Delete</NexButton>
                    <NexButton variant="primary" onClick={() => onSave(localTable)} icon={Save}>Save</NexButton>
                </div>
            </div>
            
            <div className="overflow-x-auto border border-slate-300 rounded-sm">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="w-10 p-2 border-r border-slate-200"></th>
                            {localTable.inputs.map((col, i) => (
                                <th key={`in-${i}`} className="p-2 border-r border-slate-200 bg-blue-50/50 text-blue-900 font-bold uppercase tracking-wider">{col} (IN)</th>
                            ))}
                            {localTable.outputs.map((col, i) => (
                                <th key={`out-${i}`} className="p-2 border-r border-slate-200 bg-emerald-50/50 text-emerald-900 font-bold uppercase tracking-wider">{col} (OUT)</th>
                            ))}
                            <th className="w-10 p-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {localTable.rules.map((row, rIdx) => (
                            <tr key={rIdx} className="group">
                                <td className="p-2 text-center text-slate-300 font-mono border-r border-slate-100">{rIdx + 1}</td>
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-0 border-r border-slate-100 relative">
                                        <input 
                                            className={`w-full p-2 outline-none border-none bg-transparent hover:bg-slate-50 focus:bg-blue-50 transition-colors ${!cell ? 'bg-rose-50/30' : ''}`}
                                            value={cell}
                                            onChange={e => updateTable(d => { d.rules[rIdx][cIdx] = e.target.value })} 
                                        />
                                        {!cell && <div className="absolute top-0 right-0 w-2 h-2 bg-rose-400 rounded-bl-sm pointer-events-none"/>}
                                    </td>
                                ))}
                                <td className="p-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => moveRow(rIdx, -1)} className="text-slate-400 hover:text-blue-600"><ArrowUp size={12}/></button>
                                    <button onClick={() => moveRow(rIdx, 1)} className="text-slate-400 hover:text-blue-600"><ArrowDown size={12}/></button>
                                    <button onClick={() => removeRow(rIdx)} className="text-slate-400 hover:text-rose-600"><X size={12}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <NexButton variant="secondary" onClick={addRow} icon={Plus} className="w-full border-dashed">Add Rule Row</NexButton>
        </div>
    );
};

// --- Main View ---
export const RulesEngineView: React.FC = () => {
    const { rules, decisionTables, saveRule, deleteRule, saveDecisionTable, deleteDecisionTable, reseedSystem, navigateTo } = useBPM();
    const [selectedAsset, setSelectedAsset] = useState<{type: 'rule' | 'table', id: string} | null>(null);
    const [search, setSearch] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const createNew = (type: 'rule' | 'table') => {
        if (type === 'rule') {
            const newRule: BusinessRule = {
                id: `rule-${Date.now()}`, name: 'New Rule', description: '',
                conditions: { id: `group-${Date.now()}`, type: 'AND', children: [] },
                action: { type: 'SET_VARIABLE', params: {} }, priority: 1,
                version: 1, status: 'Draft', tags: [], lastModified: new Date().toISOString()
            };
            saveRule(newRule);
            setSelectedAsset({type: 'rule', id: newRule.id});
        } else {
            const newTable: DecisionTable = { 
                id: `tbl-${Date.now()}`, 
                name: 'New Table', 
                inputs: ['Amount', 'Category'], 
                outputs: ['ApprovalLevel'], 
                rules: [['< 1000', 'Office', 'Auto']],
                version: 1, status: 'Draft', tags: [], lastModified: new Date().toISOString()
            };
            saveDecisionTable(newTable);
            setSelectedAsset({type: 'table', id: newTable.id});
        }
    };
    
    const handleDelete = (id: string) => {
        if (selectedAsset?.type === 'rule') deleteRule(id);
        else deleteDecisionTable(id);
        setSelectedAsset(null);
    }

    const filteredRules = rules.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    const filteredTables = decisionTables.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    const currentAsset = selectedAsset 
        ? (selectedAsset.type === 'rule' 
            ? rules.find(r => r.id === selectedAsset.id) 
            : decisionTables.find(t => t.id === selectedAsset.id))
        : null;

    if (isFullscreen && currentAsset && selectedAsset) {
        return (
            <div className="fixed inset-0 z-[100] bg-white">
                 {selectedAsset.type === 'rule' 
                    ? <RuleBuilder key={currentAsset.id} rule={currentAsset as BusinessRule} onSave={saveRule} onDelete={handleDelete} isFullscreen={true} toggleFullscreen={() => setIsFullscreen(false)} />
                    : <TableBuilder key={currentAsset.id} table={currentAsset as DecisionTable} onSave={saveDecisionTable} onDelete={handleDelete} isFullscreen={true} toggleFullscreen={() => setIsFullscreen(false)} />
                 }
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white rounded-sm border border-slate-300 overflow-hidden shadow-sm animate-fade-in">
            {/* Assets Sidebar */}
            <aside className="w-full md:w-72 bg-slate-50 border-r border-slate-300 flex flex-col shrink-0">
                <div className="p-3 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-800 uppercase">Library</h3>
                        <div className="flex gap-1">
                            <IconButton icon={Sparkles} onClick={() => navigateTo('ai-rule-gen')} tooltip="AI Generate" className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:text-white shadow-sm border-blue-600" />
                            <IconButton icon={BrainCircuit} onClick={() => createNew('rule')} tooltip="New Rule" className="bg-white border border-slate-300 shadow-sm" />
                            <IconButton icon={Table} onClick={() => createNew('table')} tooltip="New Table" className="bg-white border border-slate-300 shadow-sm" />
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
                        <input 
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs outline-none focus:bg-white focus:border-blue-500 transition-all" 
                            placeholder="Search logic..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="overflow-y-auto no-scrollbar flex-1 p-3 space-y-6">
                    {(rules.length === 0 && decisionTables.length === 0) && (
                        <div className="p-4 text-center border border-dashed border-slate-300 rounded-sm bg-slate-100 flex flex-col items-center gap-2">
                            <Sparkles size={24} className="text-blue-400"/>
                            <p className="text-[10px] text-slate-500 font-medium">Library is empty.</p>
                            <NexButton variant="primary" onClick={reseedSystem} className="w-full text-[10px]">Initialize Templates (100+)</NexButton>
                        </div>
                    )}

                    {filteredRules.length > 0 && (
                        <section>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-2 flex justify-between">Rules <span>{filteredRules.length}</span></h4>
                        <div className="space-y-1">
                            {filteredRules.map(r => (
                            <button 
                                key={r.id} 
                                onClick={() => setSelectedAsset({type: 'rule', id: r.id})} 
                                className={`w-full text-left px-3 py-2 rounded-sm flex items-center gap-3 transition-all border ${selectedAsset?.id === r.id ? 'bg-white border-blue-500 text-blue-700 shadow-sm border-l-4' : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-200'}`}
                            >
                                <BrainCircuit size={16} className={selectedAsset?.id === r.id ? 'text-blue-500' : 'text-slate-400'} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium truncate">{r.name}</span>
                                        {r.status === 'Draft' && <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>}
                                    </div>
                                    <p className="text-[9px] text-slate-400 truncate">v{r.version || 1}</p>
                                </div>
                            </button>
                            ))}
                        </div>
                        </section>
                    )}
                    
                    {filteredTables.length > 0 && (
                        <section>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-2 flex justify-between">Tables <span>{filteredTables.length}</span></h4>
                        <div className="space-y-1">
                            {filteredTables.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setSelectedAsset({type: 'table', id: t.id})} 
                                className={`w-full text-left px-3 py-2 rounded-sm flex items-center gap-3 transition-all border ${selectedAsset?.id === t.id ? 'bg-white border-blue-500 text-blue-700 shadow-sm border-l-4' : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-200'}`}
                            >
                                <Table size={16} className={selectedAsset?.id === t.id ? 'text-blue-500' : 'text-slate-400'} />
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium truncate">{t.name}</span>
                                    <p className="text-[9px] text-slate-400 truncate">{t.inputs.length} IN • {t.outputs.length} OUT</p>
                                </div>
                            </button>
                            ))}
                        </div>
                        </section>
                    )}
                </div>
            </aside>

            {/* Main Builder Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {selectedAsset && currentAsset ? (
                        selectedAsset.type === 'rule' 
                            ? <RuleBuilder key={currentAsset.id} rule={currentAsset as BusinessRule} onSave={saveRule} onDelete={handleDelete} isFullscreen={false} toggleFullscreen={() => setIsFullscreen(true)} />
                            : <TableBuilder key={currentAsset.id} table={currentAsset as DecisionTable} onSave={saveDecisionTable} onDelete={handleDelete} isFullscreen={false} toggleFullscreen={() => setIsFullscreen(true)} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                            <BrainCircuit size={48} strokeWidth={1} className="text-slate-200"/>
                            <p className="text-sm font-medium">Select an asset to configure logic.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Test Sidebar */}
            <aside className="w-full md:w-80 border-l border-slate-300 shrink-0 hidden md:block">
                <LiveTestPanel ruleId={selectedAsset?.id || null} rules={rules} decisionTables={decisionTables} />
            </aside>
        </div>
    );
};
