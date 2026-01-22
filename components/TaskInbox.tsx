
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
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useDataFilter } from './hooks/useDataFilter';
import { TASK_STATUS, PRIORITIES } from '../constants';

const ResponsiveGridLayout = WidthProvider(Responsive);

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
  const [isEditable, setIsEditable] = useState(false);
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
  const [layouts, setLayouts] = useState(defaultLayouts);

  useEffect(() => {
      setToolbarConfig({
          view: [
              { label: isEditable ? 'Lock Layout' : 'Edit Layout', action: () => setIsEditable(!isEditable), icon: Settings },
              { label: 'Reset Layout', action: () => setLayouts(defaultLayouts) }
          ]
      });
  }, [setToolbarConfig, isEditable]);

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
    <div className="h-full flex flex-col animate-fade-in overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={layoutBreakpoints}
                cols={layoutCols}
                rowHeight={gridConfig.rowHeight}
                margin={gridConfig.margin}
                isDraggable={isEditable}
                isResizable={isEditable}
                draggableHandle=".drag-handle"
                onLayoutChange={(curr, all) => setLayouts(all)}
            >
                {/* --- TASK LIST WIDGET --- */}
                <NexCard key="list" dragHandle={isEditable} className="flex flex-col h-full p-0">
                    <div className="pt-3 px-3 bg-panel border-b border-default">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-primary flex items-center gap-2"><CheckSquare size={18} className="text-blue-600"/> Task Inbox</h2>
                            <div className="flex gap-1">
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-base ${viewMode === 'list' ? 'bg-active text-blue-600' : 'text-tertiary hover:text-secondary'}`}><ListIcon size={16}/></button>
                                <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-base ${viewMode === 'kanban' ? 'bg-active text-blue-600' : 'text-tertiary hover:text-secondary'}`}><LayoutGrid size={16}/></button>
                            </div>
                        </div>
                        <div className="flex gap-4 text-xs font-bold text-secondary uppercase tracking-wide overflow-x-auto no-scrollbar">
                            {[ { id: 'my', label: 'My Work' }, { id: 'team', label: 'Team' }, { id: 'starred', label: 'Starred' } ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-active text-blue-600' : 'border-transparent hover:text-primary'}`}>{tab.label}</button>
                            ))}
                        </div>
                    </div>

                    <div className="p-2 bg-subtle border-b border-default space-y-2">
                        <form onSubmit={handleQuickCreate} className="relative">
                            <Plus size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"/>
                            <input className="w-full pl-8 pr-3 py-1.5 text-xs border border-default rounded-base focus:ring-1 focus:ring-blue-500 outline-none bg-panel text-primary" placeholder="Quick add..." value={quickTaskTitle} onChange={e => setQuickTaskTitle(e.target.value)} />
                        </form>
                        <NexDebouncedInput value={searchQuery} onChange={setSearchQuery} placeholder="Search..." className="w-full pr-3 py-1.5 bg-panel border border-default rounded-base outline-none text-xs text-primary" icon={Search} />
                    </div>

                    <div className="flex-1 overflow-y-auto bg-panel min-h-0">
                        <NexVirtualList 
                            items={filteredTasks}
                            itemHeight={80} 
                            renderItem={(t: Task, idx) => (
                                <NexListItem 
                                    key={t.id} 
                                    title={
                                        <div className="flex items-center gap-2">
                                            {t.isAdHoc && <span className="bg-amber-100 text-amber-700 text-[9px] px-1 rounded font-bold">ADHOC</span>}
                                            {t.title}
                                        </div>
                                    }
                                    subtitle={t.processName}
                                    meta={<SLACountdown dueDate={t.dueDate} />}
                                    status={<NexBadge variant={t.priority === 'Critical' ? 'rose' : 'slate'}>{t.priority}</NexBadge>}
                                    selected={selectedTask?.id === t.id}
                                    onClick={() => setSelectedTask(t)}
                                    before={
                                        <div className="flex flex-col items-center gap-2">
                                            <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelection(t.id)} className="rounded-base text-blue-600" onClick={e => e.stopPropagation()} />
                                            <button onClick={(e) => { e.stopPropagation(); toggleTaskStar(t.id); }}>
                                                <Star size={12} className={t.isStarred ? "fill-amber-400 text-amber-400" : "text-tertiary hover:text-amber-400"} />
                                            </button>
                                        </div>
                                    }
                                />
                            )}
                        />
                    </div>
                </NexCard>

                {/* --- TASK DETAIL WIDGET --- */}
                <NexCard key="detail" dragHandle={isEditable} className="flex flex-col h-full p-0">
                    {selectedTask ? (
                        <>
                            <div className="h-12 bg-panel border-b border-default flex items-center justify-between px-4 shadow-sm shrink-0">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSelectedTask(null)} className="xl:hidden mr-2 text-secondary"><ChevronLeft size={18}/></button>
                                    <NexBadge variant={selectedTask.priority === PRIORITIES.CRITICAL ? 'rose' : 'blue'}>{selectedTask.priority}</NexBadge>
                                    <span className="text-xs text-tertiary font-mono">{selectedTask.id}</span>
                                </div>
                                <button onClick={() => setSelectedTask(null)} className="p-1.5 hover:bg-subtle rounded-base text-secondary"><X size={16}/></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-canvas">
                                <div className="bg-panel rounded-base border border-default shadow-sm p-6 mb-4">
                                    <h2 className="text-lg font-bold text-primary mb-2 leading-tight">{selectedTask.title}</h2>
                                    <div className="flex items-center gap-4 text-xs text-secondary mb-4 pb-4 border-b border-default">
                                        <span className="flex items-center gap-1"><Layers size={12}/> {selectedTask.processName}</span>
                                        <span className="flex items-center gap-1"><NexUserDisplay userId={selectedTask.assignee} size="sm" showEmail={false} /></span>
                                    </div>
                                    <p className="text-base text-primary leading-relaxed mb-4">{selectedTask.description || "No description provided."}</p>
                                    
                                    {/* Checklist */}
                                    {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-sm">
                                            <h4 className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-2"><ListTodo size={14}/> Sub-tasks</h4>
                                            <div className="space-y-1">
                                                {selectedTask.checklist.map(item => (
                                                    <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:bg-amber-100/50 p-1 rounded-sm">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={item.completed} 
                                                            onChange={e => handleToggleCheck(item.id, e.target.checked)} 
                                                            className="rounded-sm text-amber-600 focus:ring-amber-500" 
                                                        />
                                                        <span className={`text-xs ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeForm && selectedTask.status !== TASK_STATUS.COMPLETED && (
                                        <div className="mb-6 p-4 bg-subtle border border-blue-200 rounded-sm">
                                            <div className="flex items-center gap-2 mb-4 text-blue-700">
                                                <FormInput size={16}/>
                                                <h4 className="text-sm font-bold uppercase">{activeForm.name}</h4>
                                            </div>
                                            <FormRenderer form={activeForm} data={formData} onChange={(k, v) => setFormData(prev => ({ ...prev, [k]: v }))} errors={formErrors} />
                                        </div>
                                    )}

                                    <div className="flex gap-2 mb-6">
                                        <NexButton variant="primary" onClick={handleSubmit} icon={CheckCircle}>Complete Task</NexButton>
                                    </div>

                                    {/* Comments & History */}
                                    <div className="border-t border-default pt-6">
                                        <h4 className="text-xs font-bold text-secondary uppercase mb-4 flex items-center gap-2"><MessageSquare size={14}/> Collaboration</h4>
                                        <div className="bg-subtle p-3 rounded-sm border border-default mb-4">
                                            <div className="flex gap-2">
                                                <input 
                                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-tertiary text-primary" 
                                                    placeholder="Write a comment..." 
                                                    value={commentText}
                                                    onChange={e => setCommentText(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                                                />
                                                <button onClick={handlePostComment} disabled={!commentText.trim()} className="text-blue-600 font-bold text-xs hover:text-blue-800 disabled:opacity-50">Post</button>
                                            </div>
                                        </div>
                                        <NexHistoryFeed history={[...(selectedTask.comments || []).map(c => ({...c, description: c.text})), ...(auditLogs.filter(l => l.entityId === selectedTask.id).map(l => ({...l, author: l.userId, description: `${l.action}: ${l.details}`})))].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())} />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-tertiary p-8 text-center bg-subtle">
                            <LayoutGrid size={48} className="opacity-20 mb-4"/>
                            <p className="text-sm font-medium">Select a task to view details</p>
                        </div>
                    )}
                </NexCard>

                {/* --- STATS WIDGET --- */}
                <NexCard key="stats" dragHandle={isEditable} className="flex flex-row items-center justify-between p-4 h-full">
                    <TaskStats tasks={tasks} currentUserId={currentUser?.id} onSync={() => addNotification('info', 'Refreshing...')} />
                    {!isEditable && (
                        <NexButton variant="secondary" size="sm" onClick={() => addNotification('info', 'Refreshing task queue...')}>Sync</NexButton>
                    )}
                </NexCard>
            </ResponsiveGridLayout>
        </div>
    </div>
  );
};
