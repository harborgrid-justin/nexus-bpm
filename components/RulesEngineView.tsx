import React, { useState, ChangeEvent, useMemo, useRef, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { BusinessRule, RuleCondition, RuleAction, DecisionTable, Condition, ConditionGroup } from '../types';
import { 
  FunctionSquare, Plus, BrainCircuit, Table, TestTube, Trash2, Save, 
  Upload, Play, GitMerge, X, 
  Activity, Tag, ArrowUp, ArrowDown, Download, Maximize2, Sparkles, MessageSquare, Search, LucideIcon,
  ChevronDown, ChevronRight, Check, AlertCircle, GripVertical
} from 'lucide-react';
import { produce } from 'immer';
import { NexButton, NexBadge } from './shared/NexUI';
import { explainRuleLogic } from '../services/geminiService';

// --- Smart Components ---

const SUGGESTED_FACTS = [
  'invoice.amount', 'invoice.currency', 'invoice.vendor', 'invoice.date',
  'user.role', 'user.department', 'user.location', 'user.spendingLimit',
  'request.priority', 'request.category', 'request.type',
  'risk.score', 'risk.level', 'risk.previousIncidents',
  'vendor.rating', 'vendor.status', 'vendor.contractValue'
];

interface SmartInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    options?: string[];
    className?: string;
}

const SmartInput: React.FC<SmartInputProps> = ({ value, onChange, placeholder, options = [], className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filtered, setFiltered] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        if (options.length > 0) {
            setFiltered(options.filter(opt => opt.toLowerCase().includes(val.toLowerCase())));
            setIsOpen(true);
        }
    };

    const handleSelect = (opt: string) => {
        onChange(opt);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <input 
                value={value} 
                onChange={handleChange} 
                onFocus={() => { if(options.length > 0) { setFiltered(options); setIsOpen(true); } }}
                className={`prop-input text-xs ${className}`}
                placeholder={placeholder} 
            />
            {isOpen && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-sm shadow-lg max-h-40 overflow-y-auto mt-1">
                    {filtered.map(opt => (
                        <button 
                            key={opt} 
                            onClick={() => handleSelect(opt)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700 block transition-colors"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const RuleSelect = ({ value, onChange, children }: { value: string, onChange: (val: string) => void, children?: React.ReactNode }) => (
  <div className="relative">
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="prop-input text-xs appearance-none pr-8 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
  </div>
);

interface IconButtonProps {
    icon: LucideIcon;
    onClick: () => void;
    tooltip: string;
    className?: string;
    disabled?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, onClick, tooltip, className, disabled }) => (
    <button 
      onClick={onClick} 
      title={tooltip} 
      disabled={disabled}
      className={`p-2 text-secondary hover:bg-subtle hover:text-primary rounded-base transition-all border border-transparent disabled:opacity-50 ${className}`}
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

const calculateComplexity = (condition: Condition, depth = 1): number => {
    if ('children' in condition) {
        return condition.children.reduce((acc, child) => acc + calculateComplexity(child, depth + 1), 0) + (depth > 3 ? 5 : 1);
    }
    return 1;
};

// --- Test Panel ---

interface TestCase {
    id: string;
    name: string;
    input: string; 
}

const LiveTestPanel = ({ ruleId, rules, decisionTables }: { ruleId: string | null, rules: BusinessRule[], decisionTables: DecisionTable[] }) => {
    const { executeRules } = useBPM();
    const [inputData, setInputData] = useState('{\n  "invoice": {\n    "amount": 7500,\n    "region": "EMEA"\n  }\n}');
    const [output, setOutput] = useState<any>(null);
    const [isRunning, setIsRunning] = useState(false);
    
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
        <div className="flex flex-col h-full bg-subtle border-l border-default">
            <div className="p-3 border-b border-default bg-panel flex items-center justify-between">
              <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><TestTube size={14}/> QA Laboratory</h3>
              {output?.matched && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">MATCHED</span>}
            </div>
            
            <div className="p-4 space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-secondary uppercase">Test Suite Library</h4>
                    <div className="space-y-1">
                        {testCases.map(tc => (
                            <div key={tc.id} onClick={() => loadTestCase(tc)} className="flex items-center justify-between p-2 bg-panel border border-default rounded-base cursor-pointer hover:border-active group transition-all">
                                <span className="text-xs font-medium text-primary">{tc.name}</span>
                                <Play size={10} className="text-tertiary group-hover:text-blue-600"/>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-1 mt-2">
                        <input className="prop-input py-1 text-xs" placeholder="New test name..." value={saveName} onChange={e => setSaveName(e.target.value)} />
                        <NexButton size="sm" onClick={saveTestCase} icon={Save} disabled={!saveName}></NexButton>
                    </div>
                </div>

                <div className="h-px bg-default w-full"></div>

                <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-xs font-bold text-secondary uppercase flex justify-between">
                        Live Input Vector (JSON)
                        <span className="text-[10px] text-blue-600 cursor-pointer hover:underline" onClick={() => { try { setInputData(JSON.stringify(JSON.parse(inputData), null, 2)) } catch(e){} }}>Format</span>
                    </label>
                    <textarea 
                      value={inputData} 
                      onChange={e => setInputData(e.target.value)} 
                      className="flex-1 w-full bg-panel text-primary p-3 rounded-base font-mono text-xs border border-default outline-none focus:border-active transition-all resize-none min-h-[150px]" 
                      spellCheck={false}
                    />
                </div>
                
                <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-xs font-bold text-secondary uppercase">Result Output</label>
                    <div className={`flex-1 bg-panel border rounded-base p-3 font-mono text-xs overflow-auto relative transition-colors ${output?.matched ? 'border-emerald-400 bg-emerald-50/10' : 'border-default'}`}>
                        {output ? (
                          <pre className="text-primary whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-tertiary italic">
                            Awaiting Execution...
                          </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-default bg-panel">
                <NexButton variant="primary" onClick={handleSimulate} disabled={!ruleId || isRunning} className="w-full" icon={Play}>Run Simulation</NexButton>
            </div>
        </div>
    );
};

// --- Logic Builder Components ---

const ConditionEditor = ({ condition, onUpdate, onDelete }: { condition: RuleCondition, onUpdate: (c: RuleCondition) => void, onDelete: () => void }) => (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-white border border-slate-200 rounded-sm shadow-sm relative group animate-slide-up">
        {/* Drag Handle Visual */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-l-sm group-hover:bg-slate-300 transition-colors cursor-move flex items-center justify-center">
            <GripVertical size={10} className="text-white opacity-0 group-hover:opacity-100"/>
        </div>
        
        <div className="flex-1 ml-2">
          <SmartInput 
            placeholder="Fact (e.g. invoice.amount)" 
            value={condition.fact} 
            onChange={(val: string) => onUpdate({ ...condition, fact: val })} 
            options={SUGGESTED_FACTS}
          />
        </div>
        <div className="w-full sm:w-32">
          <RuleSelect value={condition.operator} onChange={(val: string) => onUpdate({ ...condition, operator: val as RuleCondition['operator'] })}>
              <option value="eq">Equals</option><option value="neq">Not Equal</option><option value="gt">Greater Than</option><option value="lt">Less Than</option><option value="contains">Contains</option>
          </RuleSelect>
        </div>
        <div className="flex-1">
          <SmartInput placeholder="Value" value={condition.value} onChange={(val: string) => onUpdate({ ...condition, value: val })} />
        </div>
        <button onClick={onDelete} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-sm transition-colors"><X size={14}/></button>
    </div>
);

const ConditionGroupEditor = ({ group, onUpdate, path, depth = 0 }: { group: ConditionGroup, onUpdate: (path: string, group: ConditionGroup) => void, path: string, depth?: number }) => {
    const [collapsed, setCollapsed] = useState(false);

    const updateGroup = (updater: (draft: ConditionGroup) => void) => {
        onUpdate(path, produce(group, updater));
    };

    const handleChildUpdate = (childPath: string, updatedChild: Condition) => {
        const childIndex = parseInt(childPath.split('.').pop() || '0');
        updateGroup(draft => {
            draft.children[childIndex] = updatedChild;
        });
    };

    const addCondition = () => {
        setCollapsed(false);
        updateGroup(draft => {
            draft.children.push({ id: `cond-${Date.now()}`, fact: '', operator: 'eq', value: '' });
        });
    };
    
    const addGroup = () => {
        setCollapsed(false);
        updateGroup(draft => {
            draft.children.push({ id: `group-${Date.now()}`, type: 'AND', children: [] });
        });
    };
    
    const deleteChild = (index: number) => updateGroup(draft => {
        draft.children.splice(index, 1);
    });

    const toggleType = () => updateGroup(draft => {
        draft.type = draft.type === 'AND' ? 'OR' : 'AND';
    });

    const isRoot = depth === 0;
    const groupColor = group.type === 'AND' ? 'border-blue-200 bg-blue-50/30' : 'border-amber-200 bg-amber-50/30';
    const tagColor = group.type === 'AND' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-700 border-amber-200';

    return (
        <div className={`rounded-sm border ${isRoot ? 'border-slate-200 shadow-sm' : `ml-4 mt-2 ${groupColor}`} transition-all`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-2 ${isRoot ? 'bg-slate-50 border-b border-slate-200' : ''}`}>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {collapsed ? <ChevronRight size={14}/> : <ChevronDown size={14}/>}
                    </button>
                    <button 
                        onClick={toggleType} 
                        className={`px-3 py-0.5 rounded-sm text-[10px] font-bold uppercase transition-all border select-none ${tagColor} hover:brightness-95 active:scale-95`}
                    >
                        {group.type}
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {group.children.length} criteria {collapsed && ' (Collapsed)'}
                    </span>
                </div>
                {!collapsed && (
                    <div className="flex items-center gap-1">
                        <NexButton variant="ghost" size="sm" onClick={addCondition} icon={Plus} className="h-6">Rule</NexButton>
                        <NexButton variant="ghost" size="sm" onClick={addGroup} icon={GitMerge} className="h-6">Group</NexButton>
                    </div>
                )}
            </div>

            {/* Children Tree */}
            {!collapsed && (
                <div className="p-3 relative">
                    {/* Visual Connector Line */}
                    {group.children.length > 0 && (
                        <div className="absolute left-3 top-3 bottom-6 w-px bg-slate-300"></div>
                    )}
                    
                    <div className="space-y-2">
                        {group.children.map((child, i) => (
                            <div key={child.id} className="relative pl-4">
                                {/* Horizontal connector */}
                                <div className="absolute left-0 top-4 w-4 h-px bg-slate-300"></div>
                                
                                {'children' in child 
                                    ? <ConditionGroupEditor group={child as ConditionGroup} onUpdate={handleChildUpdate} path={`children.${i}`} depth={depth + 1} />
                                    : <ConditionEditor condition={child as RuleCondition} onUpdate={c => handleChildUpdate(`children.${i}`, c)} onDelete={() => deleteChild(i)} />
                                }
                            </div>
                        ))}
                        {group.children.length === 0 && (
                            <div className="text-center py-4 border border-dashed border-slate-200 rounded-sm bg-white/50 text-xs text-slate-400 italic">
                                No conditions defined. Add a rule or group.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

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
            {/* Header */}
            <div className="flex justify-between items-start gap-6 border-b border-default pb-6">
                <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                        <input 
                        value={localRule.name} 
                        onChange={e => updateRule(draft => { draft.name = e.target.value })} 
                        className="text-xl font-bold text-primary bg-transparent border-b border-transparent focus:border-active outline-none pb-1" 
                        />
                        <span className="px-2 py-0.5 bg-subtle text-secondary text-xs font-mono rounded-base border border-default">v{localRule.version?.toFixed(1) || '1.0'}</span>
                        <button onClick={() => updateRule(d => { d.status = d.status === 'Active' ? 'Draft' : 'Active' })} className={`px-2 py-0.5 text-xs font-bold uppercase rounded-base border ${localRule.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {localRule.status || 'Draft'}
                        </button>
                    </div>
                    <textarea 
                      value={localRule.description} 
                      onChange={e => updateRule(draft => { draft.description = e.target.value })} 
                      className="w-full text-xs text-secondary bg-transparent outline-none resize-none" 
                      placeholder="Enter rule description..."
                    />
                    <div className="flex items-center gap-2">
                        {localRule.tags?.map(t => (
                            <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100">
                                <Tag size={10}/> {t} <button onClick={() => removeTag(t)}><X size={10}/></button>
                            </span>
                        ))}
                        <div className="flex items-center gap-1">
                            <input className="bg-transparent border-b border-default text-xs w-20 outline-none" placeholder="+ Tag" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={toggleFullscreen} className="p-2 text-tertiary hover:text-primary"><Maximize2 size={16}/></button>
                    <div className="h-6 w-px bg-default mx-2"></div>
                    <NexButton variant="danger" onClick={() => onDelete(rule.id)} icon={Trash2}>Delete</NexButton>
                    <NexButton variant="primary" onClick={handleSave} icon={Save}>Deploy</NexButton>
                </div>
            </div>

            {/* Analysis Bar */}
            <div className="flex gap-4">
                <div className="flex-1 p-4 bg-subtle border border-default rounded-base font-mono text-xs text-primary leading-relaxed relative group">
                    <div className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold shrink-0">LOGIC</span> 
                        <span className="break-all">{summary}</span>
                        <span className="text-blue-600 font-bold shrink-0 ml-2">THEN</span> 
                        <span>{localRule.action.type}</span>
                    </div>
                    <button onClick={handleExplain} className="absolute right-2 top-2 p-1.5 bg-panel border border-default rounded text-tertiary hover:text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                        <MessageSquare size={12}/> Explain
                    </button>
                    {explanation && (
                        <div className="mt-2 pt-2 border-t border-default text-secondary italic flex items-start gap-2">
                            <BotIcon className="shrink-0 text-blue-500" />
                            {explanation}
                        </div>
                    )}
                </div>
                <div className="w-40 p-4 border border-default rounded-base flex flex-col items-center justify-center">
                    <div className={`text-2xl font-black ${complexity > 10 ? 'text-rose-500' : 'text-emerald-500'}`}>{complexity}</div>
                    <div className="text-xs text-secondary uppercase font-bold">Complexity</div>
                </div>
            </div>

            {/* Visual Logic Builder */}
            <section className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <BrainCircuit size={14} className="text-blue-500"/> Logic Definition
              </h4>
              <ConditionGroupEditor group={localRule.conditions} onUpdate={handleConditionsUpdate} path="conditions" />
            </section>

            {/* Action Configuration */}
            <section className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Play size={14} className="text-emerald-500"/> Result Action
              </h4>
              <div className="p-4 border border-default rounded-base space-y-4 bg-panel">
                  <div className="space-y-1">
                    <label className="prop-label">Action Type</label>
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
                        <SmartInput placeholder="Name" value={localRule.action.params.variableName || ''} onChange={(val) => updateActionParam('variableName', val)} options={['approval_status', 'risk_score', 'discount_rate']} />
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

            {/* Dependency Graph */}
            <section className="space-y-2 pt-4 border-t border-default">
                <h4 className="text-xs font-bold text-tertiary uppercase tracking-wider mb-2">Impact Analysis</h4>
                {usedInProcesses.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-tertiary italic">
                        <Check size={14}/> No active dependencies found. Safe to modify.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {usedInProcesses.map(p => (
                            <div key={p.id} className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-base text-blue-700 text-xs font-medium cursor-pointer hover:bg-blue-100 transition-colors">
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

// --- Decision Table Builder ---

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
            const newRules = rows.slice(1).map(r => r.split(',').map(c => c.trim()));
            updateTable(d => { d.rules = newRules; });
        };
        reader.readAsText(file);
    };

    return (
        <div className={`p-6 space-y-6 ${isFullscreen ? 'h-full overflow-y-auto' : ''}`}>
            <div className="flex justify-between items-start border-b border-default pb-4">
                <div className="flex-1">
                    <input className="text-xl font-bold text-primary bg-transparent outline-none w-full" value={localTable.name} onChange={e => updateTable(d => {d.name = e.target.value})} />
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs text-secondary font-mono">v{localTable.version || 1}</span>
                        <NexBadge variant={localTable.status === 'Active' ? 'emerald' : 'slate'}>{localTable.status || 'Draft'}</NexBadge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleFullscreen} className="p-2 text-tertiary hover:text-primary"><Maximize2 size={16}/></button>
                    <div className="h-6 w-px bg-default mx-2"></div>
                    <NexButton variant="secondary" onClick={handleExportCSV} icon={Download}>Export CSV</NexButton>
                    <NexButton variant="secondary" onClick={() => fileInputRef.current?.click()} icon={Upload}>Import CSV</NexButton>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                    <NexButton variant="danger" onClick={() => onDelete(table.id)} icon={Trash2}>Delete</NexButton>
                    <NexButton variant="primary" onClick={() => onSave(localTable)} icon={Save}>Save</NexButton>
                </div>
            </div>
            
            <div className="overflow-x-auto border border-default rounded-base shadow-sm">
                <table className="w-full text-xs text-left">
                    <thead className="bg-subtle border-b border-default">
                        <tr>
                            <th className="w-10 p-2 border-r border-default"></th>
                            {localTable.inputs.map((col, i) => (
                                <th key={`in-${i}`} className="p-2 border-r border-default bg-blue-50/50 text-blue-900 font-bold uppercase tracking-wider relative group">
                                    {col} (IN)
                                </th>
                            ))}
                            {localTable.outputs.map((col, i) => (
                                <th key={`out-${i}`} className="p-2 border-r border-default bg-emerald-50/50 text-emerald-900 font-bold uppercase tracking-wider">
                                    {col} (OUT)
                                </th>
                            ))}
                            <th className="w-16 p-2 text-center text-slate-400">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle bg-panel">
                        {localTable.rules.map((row, rIdx) => (
                            <tr key={rIdx} className="group hover:bg-slate-50 transition-colors">
                                <td className="p-2 text-center text-tertiary font-mono border-r border-subtle">{rIdx + 1}</td>
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-0 border-r border-subtle relative">
                                        <input 
                                            className={`w-full p-2 outline-none border-none bg-transparent focus:bg-blue-50 transition-colors ${!cell ? 'bg-rose-50/30' : ''}`}
                                            value={cell}
                                            onChange={e => updateTable(d => { d.rules[rIdx][cIdx] = e.target.value })} 
                                        />
                                        {!cell && <div className="absolute top-0 right-0 w-2 h-2 bg-rose-400 rounded-bl-sm pointer-events-none"/>}
                                    </td>
                                ))}
                                <td className="p-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => moveRow(rIdx, -1)} className="text-tertiary hover:text-blue-600"><ArrowUp size={12}/></button>
                                    <button onClick={() => moveRow(rIdx, 1)} className="text-tertiary hover:text-blue-600"><ArrowDown size={12}/></button>
                                    <button onClick={() => removeRow(rIdx)} className="text-tertiary hover:text-rose-600"><X size={12}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <NexButton variant="secondary" onClick={addRow} icon={Plus} className="w-full border-dashed mt-2">Add Rule Row</NexButton>
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
            <div className="fixed inset-0 z-[100] bg-panel">
                 {selectedAsset.type === 'rule' 
                    ? <RuleBuilder key={currentAsset.id} rule={currentAsset as BusinessRule} onSave={saveRule} onDelete={handleDelete} isFullscreen={true} toggleFullscreen={() => setIsFullscreen(false)} />
                    : <TableBuilder key={currentAsset.id} table={currentAsset as DecisionTable} onSave={saveDecisionTable} onDelete={handleDelete} isFullscreen={true} toggleFullscreen={() => setIsFullscreen(false)} />
                 }
            </div>
        );
    }

    return (
        <div className="h-content-area flex flex-col md:flex-row bg-panel rounded-base border border-default overflow-hidden shadow-sm animate-fade-in">
            <aside className="w-full md:w-[var(--prop-panel-width)] bg-subtle border-r border-default flex flex-col shrink-0">
                <div className="p-3 border-b border-default bg-panel">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-primary uppercase">Library</h3>
                        <div className="flex gap-1">
                            <IconButton icon={Sparkles} onClick={() => navigateTo('ai-rule-gen')} tooltip="AI Generate" className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:text-white shadow-sm border-blue-600" />
                            <IconButton icon={BrainCircuit} onClick={() => createNew('rule')} tooltip="New Rule" className="bg-panel border border-default shadow-sm" />
                            <IconButton icon={Table} onClick={() => createNew('table')} tooltip="New Table" className="bg-panel border border-default shadow-sm" />
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" size={12}/>
                        <input 
                            className="w-full pl-7 pr-2 py-1.5 bg-subtle border border-default rounded-base text-xs outline-none focus:bg-panel focus:border-active transition-all" 
                            placeholder="Search logic..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="overflow-y-auto no-scrollbar flex-1 p-3 space-y-6">
                    {(rules.length === 0 && decisionTables.length === 0) && (
                        <div className="p-4 text-center border border-dashed border-default rounded-base bg-subtle flex flex-col items-center gap-2">
                            <Sparkles size={24} className="text-blue-400"/>
                            <p className="text-xs text-secondary font-medium">Library is empty.</p>
                            <NexButton variant="primary" onClick={reseedSystem} className="w-full text-xs">Initialize Templates (100+)</NexButton>
                        </div>
                    )}

                    {filteredRules.length > 0 && (
                        <section>
                        <h4 className="text-xs font-bold text-tertiary uppercase mb-2 px-2 flex justify-between">Rules <span>{filteredRules.length}</span></h4>
                        <div className="space-y-1">
                            {filteredRules.map(r => (
                            <button 
                                key={r.id} 
                                onClick={() => setSelectedAsset({type: 'rule', id: r.id})} 
                                className={`w-full text-left px-3 py-2 rounded-base flex items-center gap-3 transition-all border ${selectedAsset?.id === r.id ? 'bg-panel border-active text-blue-700 shadow-sm border-l-4' : 'border-transparent text-secondary hover:bg-panel hover:border-subtle'}`}
                            >
                                <BrainCircuit size={16} className={selectedAsset?.id === r.id ? 'text-blue-500' : 'text-tertiary'} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium truncate">{r.name}</span>
                                        {r.status === 'Draft' && <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>}
                                    </div>
                                    <p className="text-[9px] text-tertiary truncate">v{r.version || 1}</p>
                                </div>
                            </button>
                            ))}
                        </div>
                        </section>
                    )}
                    
                    {filteredTables.length > 0 && (
                        <section>
                        <h4 className="text-xs font-bold text-tertiary uppercase mb-2 px-2 flex justify-between">Tables <span>{filteredTables.length}</span></h4>
                        <div className="space-y-1">
                            {filteredTables.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setSelectedAsset({type: 'table', id: t.id})} 
                                className={`w-full text-left px-3 py-2 rounded-base flex items-center gap-3 transition-all border ${selectedAsset?.id === t.id ? 'bg-panel border-active text-blue-700 shadow-sm border-l-4' : 'border-transparent text-secondary hover:bg-panel hover:border-subtle'}`}
                            >
                                <Table size={16} className={selectedAsset?.id === t.id ? 'text-blue-500' : 'text-tertiary'} />
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium truncate">{t.name}</span>
                                    <p className="text-[9px] text-tertiary truncate">{t.inputs.length} IN • {t.outputs.length} OUT</p>
                                </div>
                            </button>
                            ))}
                        </div>
                        </section>
                    )}
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-panel">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {selectedAsset && currentAsset ? (
                        selectedAsset.type === 'rule' 
                            ? <RuleBuilder key={currentAsset.id} rule={currentAsset as BusinessRule} onSave={saveRule} onDelete={handleDelete} isFullscreen={false} toggleFullscreen={() => setIsFullscreen(true)} />
                            : <TableBuilder key={currentAsset.id} table={currentAsset as DecisionTable} onSave={saveDecisionTable} onDelete={handleDelete} isFullscreen={false} toggleFullscreen={() => setIsFullscreen(true)} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-tertiary gap-4">
                            <BrainCircuit size={48} strokeWidth={1} className="text-slate-200"/>
                            <p className="text-sm font-medium">Select an asset to configure logic.</p>
                        </div>
                    )}
                </div>
            </main>

            <aside className="w-full md:w-[var(--prop-panel-width)] shrink-0 hidden md:block">
                <LiveTestPanel ruleId={selectedAsset?.id || null} rules={rules} decisionTables={decisionTables} />
            </aside>
        </div>
    );
};