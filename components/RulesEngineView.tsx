
import React, { useState, ChangeEvent, useMemo, useRef, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { BusinessRule, RuleCondition, RuleAction, DecisionTable, Condition, ConditionGroup } from '../types';
import { 
  FunctionSquare, Plus, BrainCircuit, Table, TestTube, Trash2, Save, 
  Upload, Play, GitMerge, X, 
  Activity, Tag, ArrowUp, ArrowDown, Download, Maximize2, Sparkles, MessageSquare, Search, LucideIcon,
  ChevronDown, ChevronRight, Check, GripVertical, Settings, Minus
} from 'lucide-react';
import { produce } from 'immer';
import { NexButton, NexBadge, NexCard } from './shared/NexUI';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

const SUGGESTED_FACTS = [
  'invoice.amount', 'invoice.currency', 'invoice.vendor', 'invoice.date',
  'user.role', 'user.department', 'user.location', 'user.spendingLimit',
  'request.priority', 'request.category', 'request.type',
  'risk.score', 'risk.level', 'risk.previousIncidents',
  'vendor.rating', 'vendor.status', 'vendor.contractValue'
];

interface SmartInputProps {
    value: any; 
    onChange: (val: string) => void;
    placeholder?: string;
    options?: string[];
    className?: string;
}

const SmartInput: React.FC<SmartInputProps> = ({ value, onChange, placeholder, options = [], className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filtered, setFiltered] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const safeValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
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

    return (
        <div className="relative w-full" ref={containerRef}>
            <input 
                value={safeValue} 
                onChange={handleChange} 
                onFocus={() => { if(options.length > 0) { setFiltered(options); setIsOpen(true); } }}
                className={`prop-input text-xs ${className}`}
                placeholder={placeholder} 
            />
            {isOpen && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-panel border border-default rounded-sm shadow-lg max-h-40 overflow-y-auto mt-1">
                    {filtered.map(opt => (
                        <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700 block transition-colors">{opt}</button>
                    ))}
                </div>
            )}
        </div>
    );
};

const RuleSelect = ({ value, onChange, children }: { value: string, onChange: (val: string) => void, children?: React.ReactNode }) => (
  <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className="prop-input text-xs appearance-none pr-8 cursor-pointer">{children}</select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"/>
  </div>
);

interface IconButtonProps { icon: LucideIcon; onClick: () => void; tooltip: string; className?: string; disabled?: boolean; }
const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, onClick, tooltip, className, disabled }) => (
    <button onClick={onClick} title={tooltip} disabled={disabled} className={`p-2 text-secondary hover:bg-subtle hover:text-primary rounded-base transition-all border border-transparent disabled:opacity-50 ${className}`}><Icon size={16} /></button>
);

const operatorToText = (op: RuleCondition['operator']) => ({ 'eq': 'equals', 'neq': 'does not equal', 'gt': 'is greater than', 'lt': 'is less than', 'contains': 'contains' }[op]);
const generateConditionSummary = (condition: Condition): string => {
    if ('children' in condition) {
        if (condition.children.length === 0) return '(Empty)';
        return `(${condition.children.map(generateConditionSummary).join(` ${condition.type} `)})`;
    }
    return `"${condition.fact}" ${operatorToText(condition.operator)} "${condition.value}"`;
};

// --- Test Panel ---
interface TestCase { id: string; name: string; input: string; }
const LiveTestPanel = ({ ruleId }: { ruleId: string | null }) => {
    const { executeRules } = useBPM();
    const [inputData, setInputData] = useState('{\n  "invoice": {\n    "amount": 7500,\n    "region": "EMEA"\n  }\n}');
    const [output, setOutput] = useState<any>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [testCases, setTestCases] = useState<TestCase[]>([{ id: 'tc-1', name: 'Standard EMEA Invoice', input: '{\n  "invoice": {\n    "amount": 7500,\n    "region": "EMEA"\n  }\n}' }]);
    const [saveName, setSaveName] = useState('');

    const handleSimulate = async () => {
        if (!ruleId) return;
        setIsRunning(true);
        try { const data = JSON.parse(inputData); const result = await executeRules(ruleId, data); setOutput(result); } catch (e) { setOutput({ error: (e as Error).message }); } finally { setIsRunning(false); }
    };

    return (
        <div className="flex flex-col h-full bg-subtle">
            <div className="p-3 border-b border-default bg-panel flex items-center justify-between">
              <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><TestTube size={14}/> QA Laboratory</h3>
              {output?.matched && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">MATCHED</span>}
            </div>
            <div className="p-4 space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-secondary uppercase">Test Suite Library</h4>
                    <div className="space-y-1">
                        {testCases.map(tc => (
                            <div key={tc.id} onClick={() => setInputData(tc.input)} className="flex items-center justify-between p-2 bg-panel border border-default rounded-base cursor-pointer hover:border-active group transition-all">
                                <span className="text-xs font-medium text-primary">{tc.name}</span>
                                <Play size={10} className="text-tertiary group-hover:text-blue-600"/>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-1 mt-2">
                        <input className="prop-input py-1 text-xs" placeholder="New test name..." value={saveName} onChange={e => setSaveName(e.target.value)} />
                        <NexButton size="sm" onClick={() => { if(saveName) { setTestCases([...testCases, { id: `tc-${Date.now()}`, name: saveName, input: inputData }]); setSaveName(''); } }} icon={Save} disabled={!saveName}></NexButton>
                    </div>
                </div>
                <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-xs font-bold text-secondary uppercase flex justify-between">Live Input (JSON)</label>
                    <textarea value={inputData} onChange={e => setInputData(e.target.value)} className="flex-1 w-full bg-panel text-primary p-3 rounded-base font-mono text-xs border border-default outline-none resize-none min-h-[150px]" spellCheck={false}/>
                </div>
                <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-xs font-bold text-secondary uppercase">Output</label>
                    <div className={`flex-1 bg-panel border rounded-base p-3 font-mono text-xs overflow-auto ${output?.matched ? 'border-emerald-400 bg-emerald-50/10' : 'border-default'}`}>
                        {output ? <pre className="text-primary whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre> : <div className="h-full flex flex-col items-center justify-center text-tertiary italic">Ready</div>}
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-default bg-panel"><NexButton variant="primary" onClick={handleSimulate} disabled={!ruleId || isRunning} className="w-full" icon={Play}>Run Simulation</NexButton></div>
        </div>
    );
};

// --- Logic Builder ---
const ConditionEditor = ({ condition, onUpdate, onDelete }: { condition: RuleCondition, onUpdate: (c: RuleCondition) => void, onDelete: () => void }) => (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-panel border border-default rounded-sm shadow-sm relative group animate-slide-up">
        <div className="flex-1 ml-2"><SmartInput placeholder="Fact (e.g. invoice.amount)" value={condition.fact} onChange={(val: string) => onUpdate({ ...condition, fact: val })} options={SUGGESTED_FACTS}/></div>
        <div className="w-full sm:w-32"><RuleSelect value={condition.operator} onChange={(val: string) => onUpdate({ ...condition, operator: val as RuleCondition['operator'] })}><option value="eq">Equals</option><option value="neq">Not Equal</option><option value="gt">Greater Than</option><option value="lt">Less Than</option><option value="contains">Contains</option></RuleSelect></div>
        <div className="flex-1"><SmartInput placeholder="Value" value={condition.value} onChange={(val: string) => onUpdate({ ...condition, value: val })} /></div>
        <button onClick={onDelete} className="p-2 text-tertiary hover:text-rose-500 hover:bg-rose-50 rounded-sm transition-colors"><X size={14}/></button>
    </div>
);

const ConditionGroupEditor = ({ group, onUpdate, path, depth = 0 }: { group: ConditionGroup, onUpdate: (path: string, group: ConditionGroup) => void, path: string, depth?: number }) => {
    const [collapsed, setCollapsed] = useState(false);
    const updateGroup = (updater: (draft: ConditionGroup) => void) => onUpdate(path, produce(group, updater));
    const handleChildUpdate = (childPath: string, updatedChild: Condition) => { const childIndex = parseInt(childPath.split('.').pop() || '0'); updateGroup(draft => { draft.children[childIndex] = updatedChild; }); };
    const addCondition = () => { setCollapsed(false); updateGroup(draft => { draft.children.push({ id: `cond-${Date.now()}`, fact: '', operator: 'eq', value: '' }); }); };
    const addGroup = () => { setCollapsed(false); updateGroup(draft => { draft.children.push({ id: `group-${Date.now()}`, type: 'AND', children: [] }); }); };
    const deleteChild = (index: number) => updateGroup(draft => { draft.children.splice(index, 1); });
    const isRoot = depth === 0;
    const groupColor = group.type === 'AND' ? 'border-blue-200 bg-blue-50/30' : 'border-amber-200 bg-amber-50/30';

    return (
        <div className={`rounded-sm border ${isRoot ? 'border-default shadow-sm' : `ml-4 mt-2 ${groupColor}`} transition-all`}>
            <div className={`flex items-center justify-between p-2 ${isRoot ? 'bg-subtle border-b border-default' : ''}`}>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCollapsed(!collapsed)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">{collapsed ? <ChevronRight size={14}/> : <ChevronDown size={14}/>}</button>
                    <button onClick={() => updateGroup(d => {d.type = d.type === 'AND' ? 'OR' : 'AND'})} className={`px-3 py-0.5 rounded-sm text-[10px] font-bold uppercase transition-all border select-none ${group.type === 'AND' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>{group.type}</button>
                    <span className="text-[10px] text-secondary font-medium">{group.children.length} criteria {collapsed && ' (Collapsed)'}</span>
                </div>
                {!collapsed && (<div className="flex items-center gap-1"><NexButton variant="ghost" size="sm" onClick={addCondition} icon={Plus} className="h-6">Rule</NexButton><NexButton variant="ghost" size="sm" onClick={addGroup} icon={GitMerge} className="h-6">Group</NexButton></div>)}
            </div>
            {!collapsed && (
                <div className="p-3 relative space-y-2">
                    {group.children.map((child, i) => (
                        <div key={child.id} className="relative pl-4">
                            {'children' in child ? <ConditionGroupEditor group={child as ConditionGroup} onUpdate={handleChildUpdate} path={`children.${i}`} depth={depth + 1} /> : <ConditionEditor condition={child as RuleCondition} onUpdate={c => handleChildUpdate(`children.${i}`, c)} onDelete={() => deleteChild(i)} />}
                        </div>
                    ))}
                    {group.children.length === 0 && <div className="text-center py-4 text-xs text-tertiary italic">No conditions.</div>}
                </div>
            )}
        </div>
    );
};

interface RuleBuilderProps { rule: BusinessRule; onSave: (r: BusinessRule) => void; onDelete: (id: string) => void; }
const RuleBuilder: React.FC<RuleBuilderProps> = ({ rule, onSave, onDelete }) => {
    const [localRule, setLocalRule] = useState<BusinessRule>(rule);
    const summary = useMemo(() => generateConditionSummary(localRule.conditions), [localRule.conditions]);
    const updateRule = (updater: (draft: BusinessRule) => void) => setLocalRule(produce(localRule, updater));
    const handleSave = () => { updateRule(d => { d.version = (d.version || 1) + 0.1; d.lastModified = new Date().toISOString(); }); onSave(localRule); };

    return (
        <div className="p-6 space-y-8 animate-fade-in h-full overflow-y-auto">
            <div className="flex justify-between items-start gap-6 border-b border-default pb-6">
                <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2"><input value={localRule.name} onChange={e => updateRule(d => { d.name = e.target.value })} className="text-xl font-bold text-primary bg-transparent outline-none" /><span className="px-2 py-0.5 bg-subtle text-secondary text-xs font-mono rounded-base border border-default">v{localRule.version?.toFixed(1) || '1.0'}</span></div>
                    <textarea value={localRule.description} onChange={e => updateRule(d => { d.description = e.target.value })} className="w-full text-xs text-secondary bg-transparent outline-none resize-none" placeholder="Description..."/>
                </div>
                <div className="flex items-center gap-2 shrink-0"><NexButton variant="danger" onClick={() => onDelete(rule.id)} icon={Trash2}>Delete</NexButton><NexButton variant="primary" onClick={handleSave} icon={Save}>Deploy</NexButton></div>
            </div>
            <div className="flex-1 p-4 bg-subtle border border-default rounded-base font-mono text-xs text-primary leading-relaxed"><span className="text-blue-600 font-bold">LOGIC</span> {summary}</div>
            <section className="space-y-4"><h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2"><BrainCircuit size={14} className="text-blue-500"/> Logic Definition</h4><ConditionGroupEditor group={localRule.conditions} onUpdate={(p, g) => updateRule(d => {d.conditions = g})} path="conditions" /></section>
            <section className="space-y-4"><h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2"><Play size={14} className="text-emerald-500"/> Result Action</h4><div className="p-4 border border-default rounded-base space-y-4 bg-panel"><select value={localRule.action.type} onChange={(e) => updateRule(d => { d.action.type = e.target.value as any })} className="prop-input"><option value="SET_VARIABLE">Set Variable</option><option value="ROUTE_TO">Route To</option><option value="SEND_NOTIFICATION">Notification</option></select><input placeholder="Param Value" value={localRule.action.params.value || ''} onChange={(e) => updateRule(d => {d.action.params.value = e.target.value})} className="prop-input" /></div></section>
        </div>
    );
};

// --- Table Builder (Enhanced) ---
interface TableBuilderProps { table: DecisionTable; onSave: (t: DecisionTable) => void; onDelete: (id: string) => void; }
const TableBuilder: React.FC<TableBuilderProps> = ({ table, onSave, onDelete }) => {
    const [localTable, setLocalTable] = useState<DecisionTable>(table);
    const updateTable = (updater: (draft: DecisionTable) => void) => setLocalTable(produce(localTable, updater));

    const addColumn = (type: 'input' | 'output') => {
        updateTable(draft => {
            if (type === 'input') {
                draft.inputs.push(`New Input`);
                draft.rules.forEach(row => row.splice(draft.inputs.length - 1, 0, ''));
            } else {
                draft.outputs.push(`New Output`);
                draft.rules.forEach(row => row.push(''));
            }
        });
    };

    const removeColumn = (type: 'input' | 'output', index: number) => {
        updateTable(draft => {
            if (type === 'input') {
                draft.inputs.splice(index, 1);
                draft.rules.forEach(row => row.splice(index, 1));
            } else {
                draft.outputs.splice(index, 1);
                draft.rules.forEach(row => row.splice(draft.inputs.length + index, 1));
            }
        });
    };

    return (
        <div className="p-6 space-y-6 h-full overflow-y-auto">
            <div className="flex justify-between border-b border-default pb-4"><input className="text-xl font-bold bg-transparent outline-none text-primary" value={localTable.name} onChange={e => updateTable(d => {d.name = e.target.value})} /><div className="flex gap-2"><NexButton variant="danger" onClick={() => onDelete(table.id)} icon={Trash2}>Delete</NexButton><NexButton variant="primary" onClick={() => onSave(localTable)} icon={Save}>Save</NexButton></div></div>
            
            <div className="overflow-x-auto border border-default rounded-base shadow-sm">
                <table className="w-full text-xs text-left">
                    <thead className="bg-subtle border-b border-default">
                        <tr>
                            <th className="w-10 p-2 bg-subtle sticky left-0 z-10 border-r border-default">#</th>
                            {localTable.inputs.map((c, i) => (
                                <th key={`in-${i}`} className="p-2 border-r border-default bg-blue-50/50 min-w-[120px] group relative">
                                    <input className="bg-transparent font-bold text-blue-800 w-full outline-none" value={c} onChange={e => updateTable(d => {d.inputs[i] = e.target.value})} />
                                    <span className="text-[9px] text-blue-400 block">Input Condition</span>
                                    <button onClick={() => removeColumn('input', i)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600"><Minus size={10}/></button>
                                </th>
                            ))}
                            <th className="w-8 p-0 bg-blue-50/20 text-center border-r border-default cursor-pointer hover:bg-blue-100 transition-colors" title="Add Input" onClick={() => addColumn('input')}>
                                <Plus size={12} className="mx-auto text-blue-400"/>
                            </th>
                            
                            {localTable.outputs.map((c, i) => (
                                <th key={`out-${i}`} className="p-2 border-r border-default bg-emerald-50/50 min-w-[120px] group relative">
                                    <input className="bg-transparent font-bold text-emerald-800 w-full outline-none" value={c} onChange={e => updateTable(d => {d.outputs[i] = e.target.value})} />
                                    <span className="text-[9px] text-emerald-500 block">Result Action</span>
                                    <button onClick={() => removeColumn('output', i)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600"><Minus size={10}/></button>
                                </th>
                            ))}
                            <th className="w-8 p-0 bg-emerald-50/20 text-center cursor-pointer hover:bg-emerald-100 transition-colors" title="Add Output" onClick={() => addColumn('output')}>
                                <Plus size={12} className="mx-auto text-emerald-500"/>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-default bg-panel">
                        {localTable.rules.map((row, rIdx) => (
                            <tr key={rIdx} className="group">
                                <td className="p-2 text-center bg-subtle sticky left-0 border-r border-default relative">
                                    {rIdx + 1}
                                    <button onClick={() => updateTable(d => {d.rules.splice(rIdx, 1)})} className="absolute left-0 top-0 bottom-0 w-full bg-rose-50 flex items-center justify-center opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 font-bold">-</button>
                                </td>
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-0 border-r border-default relative">
                                        <input className="w-full p-2 outline-none bg-transparent focus:bg-blue-50/20 text-primary" value={cell} onChange={e => updateTable(d => {d.rules[rIdx][cIdx] = e.target.value})} />
                                    </td>
                                ))}
                                <td colSpan={2}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <NexButton variant="secondary" onClick={() => updateTable(d => {d.rules.push(new Array(d.inputs.length+d.outputs.length).fill(''))})} icon={Plus} className="w-full border-dashed">Add Rule Row</NexButton>
        </div>
    );
};

// --- Main View ---

export const RulesEngineView: React.FC = () => {
    const { rules, decisionTables, saveRule, deleteRule, saveDecisionTable, deleteDecisionTable, reseedSystem, navigateTo, setToolbarConfig } = useBPM();
    const { gridConfig } = useTheme();
    const [selectedAsset, setSelectedAsset] = useState<{type: 'rule' | 'table', id: string} | null>(null);
    const [search, setSearch] = useState('');
    const [isEditable, setIsEditable] = useState(false);

    // Layouts
    const defaultLayouts = {
        lg: [
            { i: 'library', x: 0, y: 0, w: 3, h: 20 },
            { i: 'editor', x: 3, y: 0, w: 6, h: 20 },
            { i: 'test', x: 9, y: 0, w: 3, h: 20 }
        ],
        md: [
            { i: 'library', x: 0, y: 0, w: 4, h: 10 },
            { i: 'test', x: 0, y: 10, w: 4, h: 10 },
            { i: 'editor', x: 4, y: 0, w: 6, h: 20 }
        ]
    };
    const [layouts, setLayouts] = useState(defaultLayouts);

    useEffect(() => {
        setToolbarConfig({
            view: [
                { label: isEditable ? 'Lock Layout' : 'Edit Layout', action: () => setIsEditable(!isEditable), icon: Settings },
                { label: 'Reset Layout', action: () => setLayouts(defaultLayouts) }
            ]
      });
    }, [setToolbarConfig, isEditable]);

    const createNew = (type: 'rule' | 'table') => {
        const id = `${type}-${Date.now()}`;
        if (type === 'rule') {
            const newRule: BusinessRule = { id, name: 'New Rule', description: '', conditions: { id: `g-${Date.now()}`, type: 'AND', children: [] }, action: { type: 'SET_VARIABLE', params: {} }, priority: 1, version: 1, status: 'Draft', tags: [], lastModified: new Date().toISOString() };
            saveRule(newRule); setSelectedAsset({type, id});
        } else {
            const newTable: DecisionTable = { id, name: 'New Table', inputs: ['In'], outputs: ['Out'], rules: [['', '']], version: 1, status: 'Draft', tags: [], lastModified: new Date().toISOString() };
            saveDecisionTable(newTable); setSelectedAsset({type, id});
        }
    };
    
    const handleDelete = (id: string) => { if (selectedAsset?.type === 'rule') deleteRule(id); else deleteDecisionTable(id); setSelectedAsset(null); }
    const filteredRules = rules.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    const filteredTables = decisionTables.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    const currentAsset = selectedAsset ? (selectedAsset.type === 'rule' ? rules.find(r => r.id === selectedAsset.id) : decisionTables.find(t => t.id === selectedAsset.id)) : null;

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
            <ResponsiveGridLayout className="layout" layouts={layouts} breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }} rowHeight={gridConfig.rowHeight} margin={gridConfig.margin} isDraggable={isEditable} isResizable={isEditable} draggableHandle=".drag-handle" onLayoutChange={(curr, all) => setLayouts(all)}>
                <NexCard key="library" dragHandle={isEditable} className="p-0 flex flex-col h-full">
                    <div className="p-3 border-b border-default bg-subtle">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-primary uppercase">Library</h3>
                            <div className="flex gap-1"><IconButton icon={Sparkles} onClick={() => navigateTo('ai-rule-gen')} tooltip="AI Generate" className="text-blue-600"/><IconButton icon={BrainCircuit} onClick={() => createNew('rule')} tooltip="New Rule"/><IconButton icon={Table} onClick={() => createNew('table')} tooltip="New Table"/></div>
                        </div>
                        <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" size={12}/><input className="w-full pl-7 pr-2 py-1.5 bg-panel border border-default rounded-base text-xs outline-none text-primary" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}/></div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-3 space-y-6">
                        {filteredRules.length > 0 && <section><h4 className="text-xs font-bold text-tertiary uppercase mb-2">Rules</h4>{filteredRules.map(r => <button key={r.id} onClick={() => setSelectedAsset({type: 'rule', id: r.id})} className={`w-full text-left px-3 py-2 rounded-base flex items-center gap-2 ${selectedAsset?.id === r.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-secondary hover:bg-subtle'}`}><BrainCircuit size={14} /> {r.name}</button>)}</section>}
                        {filteredTables.length > 0 && <section><h4 className="text-xs font-bold text-tertiary uppercase mb-2">Tables</h4>{filteredTables.map(t => <button key={t.id} onClick={() => setSelectedAsset({type: 'table', id: t.id})} className={`w-full text-left px-3 py-2 rounded-base flex items-center gap-2 ${selectedAsset?.id === t.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-secondary hover:bg-subtle'}`}><Table size={14} /> {t.name}</button>)}</section>}
                    </div>
                </NexCard>

                <NexCard key="editor" dragHandle={isEditable} className="p-0 flex flex-col h-full overflow-hidden">
                    {currentAsset ? (selectedAsset?.type === 'rule' ? <RuleBuilder rule={currentAsset as BusinessRule} onSave={saveRule} onDelete={handleDelete} /> : <TableBuilder table={currentAsset as DecisionTable} onSave={saveDecisionTable} onDelete={handleDelete} />) : <div className="flex-1 flex items-center justify-center text-tertiary italic">Select an asset</div>}
                </NexCard>

                <NexCard key="test" dragHandle={isEditable} className="p-0 flex flex-col h-full overflow-hidden">
                    <LiveTestPanel ruleId={selectedAsset?.id || null} />
                </NexCard>
            </ResponsiveGridLayout>
        </div>
    );
};
