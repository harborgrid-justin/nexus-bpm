
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, ChecklistItem, SavedView } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Search, CheckSquare, Layers, Clock, AlertCircle, UserPlus, Settings,
  CheckCircle, XCircle, Paperclip, LayoutGrid, List as ListIcon, 
  User, Calendar, Star, PauseCircle, ArrowDown, ArrowUp, X,
  Table as TableIcon, Download, Plus, Send, ChevronLeft, FormInput, Sparkles, BrainCircuit, ListChecks, Award, Trash2, Printer,
  Filter, Save, Eye
} from 'lucide-react';
import { NexBadge, NexButton, NexHistoryFeed, NexDebouncedInput, NexUserDisplay, NexVirtualList } from './shared/NexUI';
import { FormRenderer } from './shared/FormRenderer';
import { validateForm, createFilterPredicate, calculateSLA } from '../utils';
import { summarizeTaskContext } from '../services/geminiService';

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

interface TaskListProps {
    task: Task;
    isSelected: boolean;
    isChecked: boolean;
    isCompact: boolean;
    onCheck: (id: string) => void;
    onClick: (task: Task) => void;
    onStar: (id: string) => void;
}

// --- Task List Item Component ---
const TaskListItem: React.FC<TaskListProps> = ({ task, isSelected, isChecked, isCompact, onCheck, onClick, onStar }) => {
  return (
    <div 
      onClick={() => onClick(task)}
      className={`border-b border-subtle cursor-pointer hover:bg-subtle transition-colors group flex items-start gap-3 relative ${isSelected ? 'bg-active border-l-4 border-l-blue-600 pl-2' : 'border-l-4 border-l-transparent pl-3'}`}
      style={{ padding: isCompact ? 'calc(var(--space-base) * 0.75)' : 'var(--space-base)', height: '80px' }}
    >
      <div className="pt-1 flex flex-col gap-2 items-center" onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={isChecked} onChange={() => onCheck(task.id)} className="rounded-base border-default text-blue-600 focus:ring-blue-500" />
          <button onClick={() => onStar(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
             <Star size={12} className={task.isStarred ? "fill-amber-400 text-amber-400 opacity-100" : "text-tertiary"} />
          </button>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
            <div className="flex items-center gap-2">
                <span className={`font-bold truncate pr-2 ${isCompact ? 'text-base' : 'text-sm'} ${isSelected ? 'text-blue-800' : 'text-primary'}`}>
                    {task.title}
                </span>
                {task.isAdHoc && <span className="bg-amber-100 text-amber-700 text-xs px-1 rounded-base font-bold">ADHOC</span>}
                {task.tags?.map((t: string) => <span key={t} className="bg-subtle text-secondary text-xs px-1 rounded-base border border-default">{t}</span>)}
            </div>
            <div className="flex items-center gap-1">
               <SLACountdown dueDate={task.dueDate} />
               {(task.attachments?.length ?? 0) > 0 && <Paperclip size={12} className="text-tertiary"/>}
               {task.priority === TaskPriority.CRITICAL && <AlertCircle size={14} className="text-rose-600 shrink-0"/>}
            </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-secondary">
            <span className="truncate max-w-[150px] flex items-center gap-1"><Layers size={10}/> {task.processName}</span>
            <div className="flex items-center gap-2">
                <span className="bg-subtle px-1.5 py-0.5 rounded-base text-secondary font-medium border border-default">{task.status}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

interface KanbanProps {
    task: Task;
    onClick: (task: Task) => void;
    onStar: (id: string) => void;
}

// --- Kanban Card ---
const KanbanCard: React.FC<KanbanProps> = ({ task, onClick, onStar }) => {
    return (
        <div 
            onClick={() => onClick(task)} 
            className="bg-panel border border-default rounded-base shadow-sm hover:shadow-md hover:border-active cursor-pointer transition-all flex flex-col gap-2 group relative"
            style={{ padding: 'var(--space-base)' }}
        >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); onStar(task.id); }}>
                <Star size={12} className={task.isStarred ? "fill-amber-400 text-amber-400 opacity-100" : "text-tertiary"} />
            </div>
            <div className="flex justify-between items-start pr-4">
                <span className="text-sm font-bold text-primary line-clamp-2">{task.title}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-secondary truncate max-w-[100px]">{task.processName}</span>
                <NexBadge variant={task.priority === 'Critical' ? 'rose' : 'slate'}>{task.priority}</NexBadge>
            </div>
            <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs text-tertiary">
                <SLACountdown dueDate={task.dueDate} />
                <div className="flex items-center gap-1">
                    <NexUserDisplay userId={task.assignee} size="sm" />
                </div>
            </div>
        </div>
    );
};

export const TaskInbox: React.FC = () => {
  const { 
      tasks, completeTask, claimTask, releaseTask, addTaskComment, bulkCompleteTasks, updateTaskChecklist,
      currentUser, delegations, navigateTo, openInstanceViewer, nav, 
      toggleTaskStar, snoozeTask, createAdHocTask, forms, addNotification,
      savedViews, saveView, deleteView
  } = useBPM();
  
  // -- Selection State --
  const selectedTask = useMemo(() => tasks.find(t => t.id === nav.selectedId) || null, [tasks, nav.selectedId]);
  const setSelectedTask = (t: Task | null) => navigateTo('inbox', t?.id);

  // -- View State --
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'starred' | 'snoozed'>('my');
  const [density, setDensity] = useState<'compact' | 'comfy'>('comfy');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task, dir: 'asc' | 'desc' }>({ key: 'dueDate', dir: 'asc' });
  const [localSearch, setLocalSearch] = useState('');
  
  // -- Saved View State --
  const [activeSavedView, setActiveSavedView] = useState<string | null>(null);
  const [showSaveViewInput, setShowSaveViewInput] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // -- Filters --
  const [quickFilter, setQuickFilter] = useState<string | null>(null); // 'Critical', 'Overdue'
  
  // -- Bulk State --
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // -- Ad-Hoc Creation --
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // -- Comment Input --
  const [commentText, setCommentText] = useState('');

  // -- Form Data & Validation --
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // -- AI Insight State --
  const [aiInsight, setAiInsight] = useState<{summary: string, sentiment: string, nextAction: string} | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
      if (selectedTask) {
          setFormData(selectedTask.data || {});
          setFormErrors({});
          setAiInsight(null);
          handleAiSummary(selectedTask);
      }
  }, [selectedTask]);

  const handleApplySavedView = (view: SavedView) => {
      setActiveSavedView(view.id);
      if (view.filters.status) setQuickFilter(view.filters.status); // Simplified mapping
      if (view.filters.search) setLocalSearch(view.filters.search);
      // More filter logic would go here
  };

  const handleSaveCurrentView = async () => {
      if (!newViewName) return;
      await saveView({
          id: '',
          name: newViewName,
          type: 'Task',
          filters: { search: localSearch, priority: quickFilter || undefined }
      });
      setNewViewName('');
      setShowSaveViewInput(false);
  };

  // --- Derived Data & Filtering (Rule 24 Applied) ---
  const delegateRules = delegations.filter(d => d.toUserId === currentUser?.id && d.isActive);
  
  const filteredTasks = useMemo(() => {
      // Base Filter based on Tab
      const baseFilter = (t: Task) => {
          if (activeTab === 'snoozed') return !!t.snoozeUntil && new Date(t.snoozeUntil) > new Date();
          if (t.snoozeUntil && new Date(t.snoozeUntil) > new Date()) return false;

          if (activeTab === 'my') return t.assignee === currentUser?.id;
          if (activeTab === 'starred') return t.isStarred;
          if (activeTab === 'team') return t.assignee === 'Unassigned' || delegateRules.some(d => d.fromUserId === t.assignee);
          return true;
      };

      // Create Predicate from Config
      const predicate = createFilterPredicate<Task>({
          priority: quickFilter === 'Critical' ? TaskPriority.CRITICAL : undefined,
      }, localSearch, ['title', 'processName']);

      // Overdue Custom Check
      const overdueFilter = (t: Task) => quickFilter === 'Overdue' ? new Date(t.dueDate) < new Date() : true;

      return tasks.filter(t => baseFilter(t) && predicate(t) && overdueFilter(t)).sort((a, b) => {
          const valA = a[sortConfig.key];
          const valB = b[sortConfig.key];
          if (valA === undefined || valB === undefined) return 0;
          if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
          return 0;
      });
  }, [tasks, activeTab, localSearch, quickFilter, sortConfig, currentUser, delegateRules]);

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setSelectedIds(newSet);
  };
  
  const handleBulkAction = async (action: 'complete' | 'claim' | 'release' | 'priority') => {
      const ids = Array.from(selectedIds);
      if (action === 'complete') await bulkCompleteTasks(ids, 'approve');
      if (action === 'claim') for (const id of ids) await claimTask(id);
      if (action === 'release') for (const id of ids) await releaseTask(id);
      setSelectedIds(new Set());
  };
  const handleQuickCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!quickTaskTitle.trim()) return;
      await createAdHocTask(quickTaskTitle);
      setQuickTaskTitle('');
  };
  const handleSnooze = (taskId: string) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      snoozeTask(taskId, tomorrow.toISOString());
  };
  const handleAiSummary = async (task: Task) => {
      setLoadingAi(true);
      try {
          const result = await summarizeTaskContext(task);
          setAiInsight(result);
      } catch (e) { console.error(e); } finally { setLoadingAi(false); }
  };
  
  const activeForm = selectedTask?.formId ? forms.find(f => f.id === selectedTask.formId) : null;
  
  const handleSubmit = async () => { 
      if (!selectedTask) return;
      
      // Validation Logic (Rule 15 Applied)
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

  const handleExportCSV = () => {
      const headers = ['ID', 'Title', 'Process', 'Status', 'Priority', 'Due Date', 'Assignee'];
      const rows = filteredTasks.map(t => [
          t.id, t.title, t.processName, t.status, t.priority, new Date(t.dueDate).toLocaleDateString(), t.assignee
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
  };

  return (
    <div 
        className="flex h-content-area bg-canvas border border-default shadow-sm overflow-hidden animate-fade-in"
        style={{ borderRadius: 'var(--radius-base)' }}
    >
      {/* ENTERPRISE SIDEBAR: Saved Views */}
      <div className="w-48 border-r border-default bg-subtle hidden lg:flex flex-col">
          <div className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-default bg-panel">Smart Views</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {savedViews.filter(v => v.type === 'Task').map(view => (
                  <button 
                    key={view.id}
                    onClick={() => handleApplySavedView(view)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-sm flex items-center justify-between group ${activeSavedView === view.id ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-slate-200 text-slate-700'}`}
                  >
                      <span className="truncate">{view.name}</span>
                      <X size={12} className="opacity-0 group-hover:opacity-100 hover:text-rose-600" onClick={(e) => { e.stopPropagation(); deleteView(view.id); }}/>
                  </button>
              ))}
              {savedViews.length === 0 && <div className="text-center text-slate-400 text-xs italic py-4">No saved views</div>}
          </div>
          
          <div className="p-2 border-t border-default">
              {showSaveViewInput ? (
                  <div className="flex gap-1">
                      <input className="prop-input py-1 h-7 text-xs" value={newViewName} onChange={e => setNewViewName(e.target.value)} placeholder="View Name" autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveCurrentView()} />
                      <button onClick={handleSaveCurrentView} className="bg-blue-600 text-white p-1 rounded-sm"><CheckCircle size={14}/></button>
                  </div>
              ) : (
                  <button onClick={() => setShowSaveViewInput(true)} className="w-full flex items-center gap-2 justify-center py-1 text-xs text-blue-600 font-bold hover:bg-blue-50 rounded-sm">
                      <Save size={12}/> Save Current Filter
                  </button>
              )}
          </div>
      </div>
      
      {/* LEFT PANE: TASK LIST */}
      <div className={`flex flex-col border-r border-default bg-panel transition-all duration-300 ${selectedTask ? 'w-inbox-list shrink-0 hidden xl:flex' : 'flex-1'}`}>
        
        {/* Header */}
        <div className="pt-3 px-3 bg-panel border-b border-subtle">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2"><CheckSquare size={18} className="text-blue-600"/> Task Inbox</h2>
                <div className="flex gap-1">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-base ${viewMode === 'list' ? 'bg-active text-blue-600' : 'text-tertiary hover:text-secondary'}`}><ListIcon size={16}/></button>
                    <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-base ${viewMode === 'kanban' ? 'bg-active text-blue-600' : 'text-tertiary hover:text-secondary'}`}><LayoutGrid size={16}/></button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button onClick={handleExportCSV} className="p-1.5 rounded-base text-tertiary hover:text-blue-600" title="Export CSV"><Download size={16}/></button>
                </div>
            </div>
            
            <div className="flex gap-6 text-xs font-bold text-secondary uppercase tracking-wide">
                {[ { id: 'my', label: 'My Work' }, { id: 'team', label: 'Team Queue' }, { id: 'starred', label: 'Starred' }, { id: 'snoozed', label: 'Snoozed' } ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-2 border-b-2 transition-colors ${activeTab === tab.id ? 'border-active text-blue-600' : 'border-transparent hover:text-primary'}`}>{tab.label}</button>
                ))}
            </div>
        </div>

        {/* Toolbar */}
        <div className="p-2 bg-subtle border-b border-subtle space-y-2">
            <form onSubmit={handleQuickCreate} className="relative">
                <Plus size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"/>
                <input className="w-full pl-8 pr-3 py-1.5 text-xs border border-default rounded-base focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Quick add personal task..." value={quickTaskTitle} onChange={e => setQuickTaskTitle(e.target.value)} />
            </form>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <NexDebouncedInput 
                        value={localSearch} 
                        onChange={setLocalSearch} 
                        placeholder="Search..."
                        className="w-full pr-3 py-1.5 bg-panel border border-default rounded-base outline-none text-xs"
                        icon={Search}
                    />
                </div>
                <button onClick={() => setQuickFilter(f => f === 'Critical' ? null : 'Critical')} className={`px-2 py-1 rounded-base text-xs font-bold border ${quickFilter === 'Critical' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-panel text-secondary border-default'}`}>Critical</button>
            </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-hidden bg-panel min-h-0">
            {viewMode === 'list' && (
                <NexVirtualList 
                    items={filteredTasks}
                    itemHeight={80} // Height of TaskListItem
                    renderItem={(t: Task, idx) => (
                        <TaskListItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} isChecked={selectedIds.has(t.id)} isCompact={density === 'compact'} onCheck={toggleSelection} onClick={setSelectedTask} onStar={toggleTaskStar} />
                    )}
                />
            )}
            {viewMode === 'kanban' && (
                <div className="flex gap-4 p-4 h-full overflow-x-auto bg-canvas">
                    {[TaskStatus.PENDING, TaskStatus.CLAIMED, TaskStatus.IN_PROGRESS].map(status => (
                        <div key={status} className="flex-1 min-w-[200px] flex flex-col h-full">
                            <h4 className="text-xs font-bold text-secondary uppercase mb-2 flex justify-between bg-subtle px-2 py-1 rounded-base border border-subtle">
                                {status} <span className="bg-panel px-1.5 rounded-full text-primary border border-default">{filteredTasks.filter(t => t.status === status).length}</span>
                            </h4>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                {filteredTasks.filter(t => t.status === status).map(t => <KanbanCard key={t.id} task={t} onClick={setSelectedTask} onStar={toggleTaskStar} />)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* RIGHT PANE: PREVIEW */}
      <div className={`flex-1 bg-subtle flex flex-col border-l border-default transition-all duration-300 ${!selectedTask ? 'hidden xl:hidden' : 'flex'}`}>
        {selectedTask ? (
          <>
            <div className="h-12 bg-panel border-b border-subtle flex items-center justify-between px-4 shadow-sm shrink-0">
               <div className="flex items-center gap-2">
                   <button onClick={() => setSelectedTask(null)} className="xl:hidden mr-2"><ChevronLeft size={18}/></button>
                   <NexBadge variant={selectedTask.priority === 'Critical' ? 'rose' : 'blue'}>{selectedTask.priority}</NexBadge>
                   <span className="text-xs text-tertiary font-mono">{selectedTask.id}</span>
               </div>
               <div className="flex items-center gap-1">
                   <button onClick={() => navigateTo('task-reassign', selectedTask.id)} className="p-1.5 hover:bg-subtle rounded-base text-secondary"><UserPlus size={16}/></button>
                   <div className="h-4 w-px bg-default mx-1"></div>
                   <button onClick={() => setSelectedTask(null)} className="p-1.5 hover:bg-subtle rounded-base text-secondary"><X size={16}/></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--layout-padding)' }}>
               <div 
                 className="bg-panel rounded-base border border-default shadow-sm mb-4"
                 style={{ padding: 'var(--card-padding)' }}
               >
                   <h2 className="text-lg font-bold text-primary mb-2 leading-tight">{selectedTask.title}</h2>
                   <div className="flex items-center gap-4 text-xs text-secondary mb-4 pb-4 border-b border-subtle">
                       <span className="flex items-center gap-1"><Layers size={12}/> {selectedTask.processName}</span>
                       <span className="flex items-center gap-1"><NexUserDisplay userId={selectedTask.assignee} size="sm" showEmail={false} /></span>
                   </div>
                   <p className="text-base text-primary leading-relaxed mb-4">{selectedTask.description || "No description provided."}</p>
                   
                   {/* Form Renderer Placeholder */}
                   {activeForm && selectedTask.status !== TaskStatus.COMPLETED && (
                       <div className="mb-6 p-4 bg-slate-50 border border-blue-200 rounded-sm">
                           <div className="flex items-center gap-2 mb-4 text-blue-700">
                               <FormInput size={16}/>
                               <h4 className="text-sm font-bold uppercase">{activeForm.name}</h4>
                           </div>
                           <FormRenderer form={activeForm} data={formData} onChange={(k, v) => setFormData(prev => ({ ...prev, [k]: v }))} errors={formErrors} />
                       </div>
                   )}

                   <div className="flex gap-2 print:hidden">
                       <NexButton variant="primary" onClick={handleSubmit} icon={CheckCircle}>Complete</NexButton>
                   </div>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-tertiary">
             <LayoutGrid size={32} className="opacity-50 mb-4"/>
             <p className="text-sm font-medium">Select a task to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
