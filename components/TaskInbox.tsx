
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, ChecklistItem, SavedView } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Search, CheckSquare, Layers, Clock, AlertCircle, UserPlus, Settings,
  CheckCircle, XCircle, Paperclip, LayoutGrid, List as ListIcon, 
  User, Calendar, Star, PauseCircle, ArrowDown, ArrowUp, X,
  Table as TableIcon, Download, Plus, Send, ChevronLeft, FormInput, Sparkles, BrainCircuit, ListChecks, Award, Trash2, Printer,
  Filter, Save, Eye, GripVertical, MessageSquare, ListTodo
} from 'lucide-react';
import { NexBadge, NexButton, NexHistoryFeed, NexDebouncedInput, NexUserDisplay, NexVirtualList, NexCard, NexListItem } from './shared/NexUI';
import { FormRenderer } from './shared/FormRenderer';
import { validateForm, calculateSLA } from '../utils';
import { summarizeTaskContext } from '../services/geminiService';
import { PageGridLayout } from './shared/PageGridLayout';
import { useDataFilter } from './hooks/useDataFilter';
import { TASK_STATUS, PRIORITIES } from '../constants';

// --- SLA Visual Component ---
const SLACountdown = ({ dueDate }: { dueDate: string }) => {
    const [sla, setSla] = useState(calculateSLA(dueDate));

    useEffect(() => {
        const calculate = () => setSla(calculateSLA(dueDate));
        calculate();
        const interval = setInterval(calculate, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [dueDate]);

    const colors = {
        safe: 'bg-emerald-100 text-emerald-700',
        warn: 'bg-amber-100 text-amber-700',
        breach: 'bg-rose-100 text-rose-700 animate-pulse'
    };

    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${colors[sla.status]}`}>
            {sla.timeLeft}
        </span>
    );
};

// --- Extracted Stats Component for Memoization ---
const TaskStats = React.memo(({ tasks, currentUserId, onSync }: { tasks: Task[], currentUserId: string | undefined, onSync: () => void }) => {
    const stats = useMemo(() => ({
        total: tasks.length,
        myOpen: tasks.filter(t => t.assignee === currentUserId && t.status !== TASK_STATUS.COMPLETED).length,
        critical: tasks.filter(t => t.priority === PRIORITIES.CRITICAL).length
    }), [tasks, currentUserId]);

    return (
        <div className="flex items-center gap-4">
            <div>
                <div className="text-xs text-secondary uppercase font-bold">Total</div>
                <div className="text-xl font-black text-primary">{stats.total}</div>
            </div>
            <div className="w-px h-8 bg-default"></div>
            <div>
                <div className="text-xs text-secondary uppercase font-bold">My Open</div>
                <div className="text-xl font-black text-blue-600">{stats.myOpen}</div>
            </div>
            <div className="w-px h-8 bg-default"></div>
            <div>
                <div className="text-xs text-secondary uppercase font-bold">Critical</div>
                <div className="text-xl font-black text-rose-600">{stats.critical}</div>
            </div>
        </div>
    );
});

export const TaskInbox: React.FC = () => {
  const { 
      tasks, completeTask, claimTask, releaseTask, addTaskComment, bulkCompleteTasks, updateTaskChecklist,
      currentUser, delegations, navigateTo, openInstanceViewer, nav, 
      toggleTaskStar, snoozeTask, createAdHocTask, forms, addNotification,
      savedViews, saveView, deleteView, setToolbarConfig, auditLogs
  } = useBPM();
  const { gridConfig, layoutBreakpoints, layoutCols } = useTheme();
  
  // -- Selection State --
  const selectedTask = useMemo(() => tasks.find(t => t.id === nav.selectedId) || null, [tasks, nav.selectedId]);
  const setSelectedTask = (t: Task | null) => navigateTo('inbox', t?.id);

  // -- View State --
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'starred' | 'snoozed'>('my');
  const [density, setDensity] = useState<'compact' | 'comfy'>('comfy');
  const [quickFilter, setQuickFilter] = useState<string | null>(null); // 'Critical', 'Overdue'
  
  // -- Layouts --
  const defaultLayouts = {
      lg: [
          { i: 'list', x: 0, y: 0, w: 4, h: 20 },
          { i: 'detail', x: 4, y: 0, w: 8, h: 20 },
          { i: 'stats', x: 0, y: 20, w: 12, h: 4 }
      ],
      md: [
          { i: 'list', x: 0, y: 0, w: 4, h: 20 },
          { i: 'detail', x: 4, y: 0, w: 6, h: 20 },
          { i: 'stats', x: 0, y: 20, w: 10, h: 4 }
      ]
  };

  // --- Filtering Logic using Hooks (Finding 8) ---
  const delegateRules = delegations.filter(d => d.toUserId === currentUser?.id && d.isActive);
  
  const baseTasks = useMemo(() => {
      return tasks.filter(t => {
          if (activeTab === 'snoozed') return !!t.snoozeUntil && new Date(t.snoozeUntil) > new Date();
          if (t.snoozeUntil && new Date(t.snoozeUntil) > new Date()) return false;

          if (activeTab === 'my') return t.assignee === currentUser?.id;
          if (activeTab === 'starred') return t.isStarred;
          if (activeTab === 'team') return t.assignee === 'Unassigned' || delegateRules.some(d => d.fromUserId === t.assignee);
          return true;
      });
  }, [tasks, activeTab, currentUser, delegateRules]);

  const { data: filteredTasks, searchQuery, setSearchQuery } = useDataFilter<Task>(baseTasks, {
      searchFields: ['title', 'processName'],
      initialSort: { key: 'dueDate', dir: 'asc' },
      filterPredicate: (t) => {
          const isCritical = quickFilter === 'Critical' ? t.priority === PRIORITIES.CRITICAL : true;
          const isOverdue = quickFilter === 'Overdue' ? new Date(t.dueDate) < new Date() : true;
          return isCritical && isOverdue;
      }
  });

  // -- Bulk State --
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // -- Ad-Hoc Creation --
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // -- Comment Input --
  const [commentText, setCommentText] = useState('');

  // -- Form Data & Validation --
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
      if (selectedTask) {
          setFormData(selectedTask.data || {});
          setFormErrors({});
      }
  }, [selectedTask]);

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setSelectedIds(newSet);
  };
  
  const handleQuickCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!quickTaskTitle.trim()) return;
      await createAdHocTask(quickTaskTitle);
      setQuickTaskTitle('');
  };
  
  const activeForm = selectedTask?.formId ? forms.find(f => f.id === selectedTask.formId) : null;
  
  const handleSubmit = async () => { 
      if (!selectedTask) return;
      if (activeForm) {
          const errors = validateForm(activeForm, formData);
          if (Object.keys(errors).length > 0) {
              setFormErrors(errors);
              addNotification('error', 'Please fix form errors before completing.');
              return;
          }
      }
      await completeTask(selectedTask.id, 'completed', commentText, formData);
      addNotification('success', 'Task completed successfully');
      setSelectedTask(null);
  };

  const handlePostComment = async () => {
      if (!selectedTask || !commentText.trim()) return;
      await addTaskComment(selectedTask.id, commentText);
      setCommentText('');
  };

  const handleToggleCheck = async (itemId: string, checked: boolean) => {
      if (!selectedTask?.checklist) return;
      const updated = selectedTask.checklist.map(i => i.id === itemId ? { ...i, completed: checked } : i);
      await updateTaskChecklist(selectedTask.id, updated);
  };

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
            <PageGridLayout defaultLayouts={defaultLayouts}>
                {({ isEditable }) => [
                    /* --- TASK LIST WIDGET --- */
                    <NexCard key="list" dragHandle={isEditable} className="flex flex-col p-0 overflow-hidden shadow-sm">
                        <div className="pt-03 px-03 bg-subtle border-b border-default shrink-0">
                            <div className="flex items-center justify-between mb-03">
                                <h2 className="text-lg font-bold text-primary flex items-center gap-02"><CheckSquare size={18} className="text-blue-600"/> Task Inbox</h2>
                                <div className="flex gap-01">
                                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-base ${viewMode === 'list' ? 'bg-active text-blue-600' : 'text-tertiary hover:text-secondary'}`}><ListIcon size={16}/></button>
                                    <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-base ${viewMode === 'kanban' ? 'bg-active text-blue-600' : 'text-tertiary hover:text-secondary'}`}><LayoutGrid size={16}/></button>
                                </div>
                            </div>
                            <div className="flex gap-04 text-xs font-bold text-secondary uppercase tracking-wide overflow-x-auto no-scrollbar">
                                {[ { id: 'my', label: 'My Work' }, { id: 'team', label: 'Team' }, { id: 'starred', label: 'Starred' } ].map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-02 border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-active text-blue-600' : 'border-transparent hover:text-primary'}`}>{tab.label}</button>
                                ))}
                            </div>
                        </div>

                        <div className="p-02 bg-panel border-b border-default space-y-02 shrink-0">
                            <form onSubmit={handleQuickCreate} className="relative">
                                <Plus size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"/>
                                <input className="w-full pl-8 pr-3 py-1.5 text-xs border border-default rounded-sm focus:ring-1 focus:ring-blue-500 outline-none bg-subtle text-primary" placeholder="Quick add..." value={quickTaskTitle} onChange={e => setQuickTaskTitle(e.target.value)} />
                            </form>
                            <NexDebouncedInput value={searchQuery} onChange={setSearchQuery} placeholder="Search assets..." className="w-full pr-3 py-1.5 bg-subtle border border-default rounded-sm outline-none text-xs text-primary" icon={Search} />
                        </div>

                        <div className="flex-1 overflow-y-auto bg-panel min-h-0">
                            <NexVirtualList 
                                items={filteredTasks}
                                itemHeight={88} 
                                renderItem={(t: Task) => (
                                    <NexListItem 
                                        key={t.id} 
                                        title={
                                            <div className="flex items-center gap-02">
                                                {t.isAdHoc && <span className="bg-amber-100 text-amber-700 text-[9px] px-1 rounded font-bold border border-amber-200">ADHOC</span>}
                                                {t.title}
                                            </div>
                                        }
                                        subtitle={t.processName}
                                        meta={<SLACountdown dueDate={t.dueDate} />}
                                        status={
                                            <div className="flex flex-col items-end gap-1">
                                                <NexBadge variant={t.priority === 'Critical' ? 'rose' : 'slate'}>{t.priority}</NexBadge>
                                                {t.assignee === 'Unassigned' && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); claimTask(t.id); }}
                                                        className="text-[9px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tighter bg-blue-50 px-1 border border-blue-100 rounded-sm"
                                                    >
                                                        Claim Task
                                                    </button>
                                                )}
                                            </div>
                                        }
                                        selected={selectedTask?.id === t.id}
                                        onClick={() => setSelectedTask(t)}
                                        className="h-[88px]"
                                        before={
                                            <div className="flex flex-col items-center gap-02">
                                                <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelection(t.id)} className="rounded-sm text-blue-600 border-default" onClick={e => e.stopPropagation()} />
                                                <button onClick={(e) => { e.stopPropagation(); toggleTaskStar(t.id); }}>
                                                    <Star size={12} className={t.isStarred ? "fill-amber-400 text-amber-400" : "text-tertiary hover:text-amber-400"} />
                                                </button>
                                            </div>
                                        }
                                    />
                                )}
                            />
                        </div>

                        {selectedIds.size > 0 && (
                            <div className="bg-blue-600 p-2 flex items-center justify-between text-white animate-slide-up z-20">
                                <span className="text-[10px] font-bold uppercase tracking-widest ml-2">{selectedIds.size} Artifacts Selected</span>
                                <div className="flex gap-1">
                                    <NexButton 
                                        variant="primary" 
                                        size="sm" 
                                        className="bg-white text-blue-600 hover:bg-white/90 border-0"
                                        onClick={() => {
                                            bulkCompleteTasks(Array.from(selectedIds), 'completed');
                                            setSelectedIds(new Set());
                                            addNotification('success', `Bulk completed ${selectedIds.size} tasks.`);
                                        }}
                                    >
                                        Execute Bulk
                                    </NexButton>
                                    <button onClick={() => setSelectedIds(new Set())} className="p-1.5 hover:bg-white/10 rounded-sm"><X size={14}/></button>
                                </div>
                            </div>
                        )}
                    </NexCard>,

                    /* --- TASK DETAIL WIDGET --- */
                    <NexCard key="detail" dragHandle={isEditable} className="flex flex-col p-0 overflow-hidden shadow-sm">
                        {selectedTask ? (
                            <>
                                <header className="h-12 bg-panel border-b border-default flex items-center justify-between px-04 shrink-0 z-10">
                                    <div className="flex items-center gap-02">
                                        <button onClick={() => setSelectedTask(null)} className="xl:hidden mr-2 text-secondary p-1 hover:bg-subtle rounded-sm"><ChevronLeft size={18}/></button>
                                        <NexBadge variant={selectedTask.priority === PRIORITIES.CRITICAL ? 'rose' : 'blue'}>{selectedTask.priority}</NexBadge>
                                        <span className="text-[10px] text-tertiary font-mono tracking-wider">{selectedTask.id}</span>
                                    </div>
                                    <button onClick={() => setSelectedTask(null)} className="p-1.5 hover:bg-subtle rounded-sm text-tertiary hover:text-primary transition-colors"><X size={16}/></button>
                                </header>

                                <div className="flex-1 overflow-y-auto p-05 bg-canvas">
                                    <div className="bg-panel rounded-base border border-default shadow-sm p-06 mb-05">
                                        <h2 className="text-xl font-bold text-primary mb-02 leading-tight tracking-tight">{selectedTask.title}</h2>
                                        <div className="flex items-center gap-04 text-xs text-secondary mb-04 pb-04 border-b border-default">
                                            <span className="flex items-center gap-1 font-medium"><Layers size={14} className="text-tertiary"/> {selectedTask.processName}</span>
                                            <span className="flex items-center gap-1 border-l border-default pl-04"><NexUserDisplay userId={selectedTask.assignee} size="sm" showEmail={false} /></span>
                                        </div>
                                        <p className="text-[15px] text-primary leading-relaxed mb-06">{selectedTask.description || "No specific instructions provided for this telemetry point."}</p>
                                        
                                        {/* Checklist */}
                                        {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                                            <div className="mb-06 p-04 bg-amber-50/50 border border-amber-200 rounded-sm">
                                                <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-03 flex items-center gap-02"><ListTodo size={14}/> Operational Checklist</h4>
                                                <div className="space-y-01">
                                                    {selectedTask.checklist.map(item => (
                                                        <label key={item.id} className="flex items-center gap-02 cursor-pointer hover:bg-amber-100/50 p-1.5 rounded-sm transition-colors">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={item.completed} 
                                                                onChange={e => handleToggleCheck(item.id, e.target.checked)} 
                                                                className="rounded-sm text-amber-600 focus:ring-amber-500 border-amber-300" 
                                                            />
                                                            <span className={`text-xs font-medium ${item.completed ? 'line-through text-tertiary' : 'text-primary'}`}>{item.text}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeForm && selectedTask.status !== TASK_STATUS.COMPLETED && (
                                            <div className="mb-06 p-05 bg-subtle border border-default rounded-sm shadow-inner">
                                                <div className="flex items-center gap-02 mb-05 pb-03 border-b border-default text-primary">
                                                    <FormInput size={18} className="text-blue-600"/>
                                                    <h4 className="text-sm font-bold uppercase tracking-wider">{activeForm.name}</h4>
                                                </div>
                                                <div className="bg-panel p-04 rounded-sm border border-default shadow-sm">
                                                    <FormRenderer form={activeForm} data={formData} onChange={(k, v) => setFormData(prev => ({ ...prev, [k]: v }))} errors={formErrors} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-02 mb-08 pt-04">
                                            <NexButton variant="primary" onClick={handleSubmit} icon={CheckCircle}>Execute Task</NexButton>
                                            <NexButton variant="secondary" onClick={() => addNotification('info', 'Task delegated.')} icon={UserPlus}>Delegate</NexButton>
                                        </div>

                                        {/* Comments & History */}
                                        <div className="border-t border-default pt-06">
                                            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-04 flex items-center gap-02"><MessageSquare size={14} className="text-tertiary"/> Enterprise Collaboration</h4>
                                            <div className="bg-subtle p-03 rounded-sm border border-default mb-05 group focus-within:border-blue-500 transition-colors">
                                                <div className="flex gap-2">
                                                    <input 
                                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-tertiary text-primary" 
                                                        placeholder="Post a secure update..." 
                                                        value={commentText}
                                                        onChange={e => setCommentText(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                                                    />
                                                    <button onClick={handlePostComment} disabled={!commentText.trim()} className="text-blue-600 font-bold text-xs hover:text-blue-800 disabled:opacity-50 transition-opacity">Post</button>
                                                </div>
                                            </div>
                                            <NexHistoryFeed history={[...(selectedTask.comments || []).map(c => ({...c, description: c.text})), ...(auditLogs.filter(l => l.entityId === selectedTask.id).map(l => ({...l, author: l.userId, description: `${l.action}: ${l.details}`})))].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-tertiary p-08 text-center bg-subtle/50">
                                <LayoutGrid size={48} className="opacity-20 mb-4 animate-pulse"/>
                                <p className="text-xs font-bold uppercase tracking-widest">Awaiting Artifact Selection</p>
                            </div>
                        )}
                    </NexCard>,

                    /* --- STATS WIDGET --- */
                    <NexCard key="stats" dragHandle={isEditable} className="flex flex-row items-center justify-between p-04 shadow-sm">
                        <TaskStats tasks={tasks} currentUserId={currentUser?.id} onSync={() => addNotification('info', 'Refreshing...')} />
                        {!isEditable && (
                            <NexButton variant="secondary" size="sm" onClick={() => addNotification('info', 'Refreshing task queue...')}>Refresh Hub</NexButton>
                        )}
                    </NexCard>
                ]}
            </PageGridLayout>
        </div>
    </div>
  );
};
