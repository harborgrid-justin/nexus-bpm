
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Search, CheckSquare, Layers, Clock, AlertCircle, UserPlus, Settings,
  CheckCircle, XCircle, Paperclip, LayoutGrid, List as ListIcon, 
  User, Calendar, Star, PauseCircle, ArrowDown, ArrowUp, X,
  Table as TableIcon, Download, Plus, Send, ChevronLeft, FormInput, Sparkles, BrainCircuit
} from 'lucide-react';
import { NexBadge, NexButton, NexHistoryFeed } from './shared/NexUI';
import { FormRenderer, validateForm } from './shared/FormRenderer';
import { summarizeTaskContext } from '../services/geminiService';

// --- Utility Functions ---
const getRelativeTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days}d left`;
};

interface TaskRowProps {
    task: Task;
    isSelected: boolean;
    onToggle: (id: string) => void;
    onClick: (task: Task) => void;
    onStar: (id: string) => void;
    onSnooze: (id: string) => void;
}

// --- Task Row Component (Table View) ---
const TaskTableRow: React.FC<TaskRowProps> = ({ task, isSelected, onToggle, onClick, onStar, onSnooze }) => {
    const isOverdue = new Date(task.dueDate) < new Date();
    return (
        <tr onClick={() => onClick(task)} className={`group border-b border-subtle hover:bg-subtle transition-colors cursor-pointer text-base ${isSelected ? 'bg-active' : ''}`}>
            <td className="p-3 w-10 text-center" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggle(task.id)} className="rounded-base border-default text-blue-600 focus:ring-blue-500" />
            </td>
            <td className="p-3 w-8 text-center" onClick={e => { e.stopPropagation(); onStar(task.id); }}>
                <Star size={14} className={task.isStarred ? "fill-amber-400 text-amber-400" : "text-tertiary group-hover:text-secondary"} />
            </td>
            <td className="p-3 font-medium text-primary">
                <div className="flex flex-col">
                    <span>{task.title}</span>
                    {task.isAdHoc && <span className="text-xs text-amber-600 italic">Ad-Hoc</span>}
                </div>
            </td>
            <td className="p-3">
                <span className={`px-2 py-0.5 rounded-base text-xs font-bold uppercase ${
                    task.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 
                    task.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-subtle text-secondary'
                }`}>
                    {task.priority}
                </span>
            </td>
            <td className="p-3 text-secondary truncate max-w-[120px]">{task.processName}</td>
            <td className="p-3">
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-bold' : 'text-secondary'}`}>
                    <Clock size={12}/> {getRelativeTime(task.dueDate)}
                </div>
            </td>
            <td className="p-3">
               <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-subtle flex items-center justify-center text-xs font-bold text-secondary border border-default">
                       {task.assignee === 'Unassigned' ? '?' : task.assignee.charAt(0)}
                   </div>
                   <span className="truncate max-w-[80px] text-secondary">{task.assignee}</span>
               </div>
            </td>
            <td className="p-3 w-10 text-right opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={() => onSnooze(task.id)} className="p-1 hover:bg-subtle rounded-base text-tertiary hover:text-primary"><PauseCircle size={14}/></button>
            </td>
        </tr>
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
  const isOverdue = new Date(task.dueDate) < new Date();
  
  return (
    <div 
      onClick={() => onClick(task)}
      className={`border-b border-subtle cursor-pointer hover:bg-subtle transition-colors group flex items-start gap-3 relative ${isCompact ? 'px-3 py-2' : 'px-4 py-3'} ${isSelected ? 'bg-active border-l-4 border-l-blue-600 pl-2' : 'border-l-4 border-l-transparent pl-3'}`}
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
               {(task.attachments?.length ?? 0) > 0 && <Paperclip size={12} className="text-tertiary"/>}
               {task.priority === TaskPriority.CRITICAL && <AlertCircle size={14} className="text-rose-600 shrink-0 animate-pulse"/>}
            </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-secondary">
            <span className="truncate max-w-[150px] flex items-center gap-1"><Layers size={10}/> {task.processName}</span>
            <div className="flex items-center gap-2">
                <span className={`${isOverdue ? 'text-rose-600 font-bold' : ''}`}>{getRelativeTime(task.dueDate)}</span>
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
        <div onClick={() => onClick(task)} className="p-3 bg-panel border border-default rounded-base shadow-sm hover:shadow-md hover:border-active cursor-pointer transition-all flex flex-col gap-2 group relative">
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
                <span>{getRelativeTime(task.dueDate)}</span>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-subtle flex items-center justify-center font-bold text-[8px] border border-default">
                        {task.assignee === 'Unassigned' ? '?' : task.assignee.charAt(0)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TaskInbox: React.FC = () => {
  const { 
      tasks, completeTask, claimTask, releaseTask, addTaskComment, bulkCompleteTasks, 
      currentUser, delegations, navigateTo, openInstanceViewer, nav, 
      toggleTaskStar, snoozeTask, createAdHocTask, forms, addNotification
  } = useBPM();
  
  // -- Selection State --
  const selectedTask = useMemo(() => tasks.find(t => t.id === nav.selectedId) || null, [tasks, nav.selectedId]);
  const setSelectedTask = (t: Task | null) => navigateTo('inbox', t?.id);

  // -- View State --
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'starred' | 'snoozed'>('my');
  const [density, setDensity] = useState<'compact' | 'comfy'>('comfy');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task, dir: 'asc' | 'desc' }>({ key: 'dueDate', dir: 'asc' });
  const [localSearch, setLocalSearch] = useState('');
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
      // Reset data when task changes
      if (selectedTask) {
          setFormData(selectedTask.data || {});
          setFormErrors({});
          setAiInsight(null);
          // Auto-trigger AI summary if task is selected and not loaded
          handleAiSummary(selectedTask);
      }
  }, [selectedTask]);

  // --- Derived Data & Filtering ---
  const delegateRules = delegations.filter(d => d.toUserId === currentUser?.id && d.isActive);
  
  const filteredTasks = useMemo(() => {
      let result = tasks.filter(t => {
          // Snooze Logic
          if (activeTab !== 'snoozed' && t.snoozeUntil && new Date(t.snoozeUntil) > new Date()) return false;
          if (activeTab === 'snoozed' && (!t.snoozeUntil || new Date(t.snoozeUntil) <= new Date())) return false;

          // Tab Logic
          if (activeTab === 'my') return t.assignee === currentUser?.id;
          if (activeTab === 'starred') return t.isStarred;
          if (activeTab === 'team') return t.assignee === 'Unassigned' || delegateRules.some(d => d.fromUserId === t.assignee);
          
          return true;
      });

      // Local Search
      if (localSearch) {
          const q = localSearch.toLowerCase();
          result = result.filter(t => t.title.toLowerCase().includes(q) || t.processName.toLowerCase().includes(q));
      }

      // Quick Filters
      if (quickFilter === 'Critical') result = result.filter(t => t.priority === TaskPriority.CRITICAL);
      if (quickFilter === 'Overdue') result = result.filter(t => new Date(t.dueDate) < new Date());

      // Sorting
      return result.sort((a, b) => {
          const valA = a[sortConfig.key];
          const valB = b[sortConfig.key];
          if (valA === undefined || valB === undefined) return 0;
          
          if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
          return 0;
      });
  }, [tasks, activeTab, localSearch, quickFilter, sortConfig, currentUser]);

  // --- Actions ---
  const handleSort = (key: keyof Task) => {
      setSortConfig(curr => ({ key, dir: curr.key === key && curr.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === filteredTasks.length) setSelectedIds(new Set());
      else setSelectedIds(new Set(filteredTasks.map(t => t.id)));
  };

  const handleBulkAction = async (action: 'complete' | 'claim' | 'release' | 'priority') => {
      const ids = Array.from(selectedIds);
      if (action === 'complete') await bulkCompleteTasks(ids, 'approve');
      if (action === 'claim') for (const id of ids) await claimTask(id);
      if (action === 'release') for (const id of ids) await releaseTask(id);
      setSelectedIds(new Set());
  };

  const handleExport = () => {
      const ids = Array.from(selectedIds);
      const data = filteredTasks.filter(t => ids.length === 0 || ids.includes(t.id));
      const csv = [
          ['ID', 'Title', 'Process', 'Status', 'Priority', 'Due Date'].join(','),
          ...data.map(t => [t.id, `"${t.title}"`, t.processName, t.status, t.priority, t.dueDate].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `tasks_export_${new Date().toISOString()}.csv`; a.click();
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!quickTaskTitle.trim()) return;
      await createAdHocTask(quickTaskTitle);
      setQuickTaskTitle('');
  };

  const handleSnooze = (taskId: string) => {
      // Snooze until tomorrow 9am
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
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingAi(false);
      }
  };

  // Find linked form definition
  const activeForm = selectedTask?.formId ? forms.find(f => f.id === selectedTask.formId) : null;

  const handleSubmit = async () => {
      if (!selectedTask) return;
      
      // Validate form if exists
      if (activeForm) {
          const errors = validateForm(activeForm, formData);
          if (Object.keys(errors).length > 0) {
              setFormErrors(errors);
              addNotification('error', 'Please correct the errors in the form.');
              return;
          }
      }

      await completeTask(selectedTask.id, 'approve', 'Completed from preview', formData);
  };

  // --- Rendering ---

  return (
    <div className="flex h-content-area bg-canvas border border-default rounded-base shadow-sm overflow-hidden animate-fade-in">
      
      {/* LEFT PANE: TASK LIST (Token Width) */}
      <div className={`flex flex-col border-r border-default bg-panel transition-all duration-300 ${selectedTask ? 'w-inbox-list shrink-0 hidden xl:flex' : 'w-full'}`}>
        
        {/* 1. Header & Tabs */}
        <div className="pt-3 px-3 bg-panel border-b border-subtle">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2"><CheckSquare size={18} className="text-blue-600"/> Task Inbox</h2>
                <div className="flex gap-1">
                    <button onClick={() => setViewMode('list')} title="List View" className={`p-1.5 rounded-base ${viewMode === 'list' ? 'bg-active text-blue-600' : 'text-tertiary hover:text-secondary'}`}><ListIcon size={16}/></button>
                    <button onClick={() => setViewMode('table')} title="Table View" className={`p-1.5 rounded-base ${viewMode === 'table' ? 'bg-active text-blue-600' : 'text-tertiary hover:text-secondary'}`}><TableIcon size={16}/></button>
                    <button onClick={() => setViewMode('kanban')} title="Kanban View" className={`p-1.5 rounded-base ${viewMode === 'kanban' ? 'bg-active text-blue-600' : 'text-tertiary hover:text-secondary'}`}><LayoutGrid size={16}/></button>
                </div>
            </div>
            
            <div className="flex gap-6 text-xs font-bold text-secondary uppercase tracking-wide">
                {[ 
                    { id: 'my', label: 'My Work' }, 
                    { id: 'team', label: 'Team Queue' }, 
                    { id: 'starred', label: 'Starred' },
                    { id: 'snoozed', label: 'Snoozed' }
                ].map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as any)} 
                        className={`pb-2 border-b-2 transition-colors ${activeTab === tab.id ? 'border-active text-blue-600' : 'border-transparent hover:text-primary'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* 2. Toolbar & Quick Actions */}
        <div className="p-2 bg-subtle border-b border-subtle space-y-2">
            {/* Quick Create AdHoc */}
            <form onSubmit={handleQuickCreate} className="relative">
                <Plus size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"/>
                <input 
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-default rounded-base focus:ring-1 focus:ring-blue-500 outline-none" 
                    placeholder="Quick add personal task..." 
                    value={quickTaskTitle}
                    onChange={e => setQuickTaskTitle(e.target.value)}
                />
            </form>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"/>
                    <input 
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-panel border border-default rounded-base outline-none" 
                        placeholder="Search..." 
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                    />
                </div>
                {/* Filter Chips */}
                <button 
                    onClick={() => setQuickFilter(f => f === 'Critical' ? null : 'Critical')}
                    className={`px-2 py-1 rounded-base text-xs font-bold border ${quickFilter === 'Critical' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-panel text-secondary border-default'}`}
                >
                    Critical
                </button>
                <button 
                    onClick={() => setQuickFilter(f => f === 'Overdue' ? null : 'Overdue')}
                    className={`px-2 py-1 rounded-base text-xs font-bold border ${quickFilter === 'Overdue' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-panel text-secondary border-default'}`}
                >
                    Overdue
                </button>
            </div>

            {/* Bulk Toolbar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between bg-blue-600 text-white px-3 py-1.5 rounded-base shadow-md animate-slide-up">
                    <span className="text-xs font-bold">{selectedIds.size} Selected</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleBulkAction('complete')} className="hover:bg-blue-500 p-1 rounded-base"><CheckSquare size={14}/></button>
                        <button onClick={() => handleBulkAction('claim')} className="hover:bg-blue-500 p-1 rounded-base"><UserPlus size={14}/></button>
                        <button onClick={() => handleBulkAction('release')} className="hover:bg-blue-500 p-1 rounded-base"><XCircle size={14}/></button>
                        <button onClick={handleExport} className="hover:bg-blue-500 p-1 rounded-base"><Download size={14}/></button>
                    </div>
                </div>
            )}
        </div>

        {/* 3. Task List Area */}
        <div className="flex-1 overflow-y-auto bg-panel min-h-0">
            {viewMode === 'list' && (
                <div className="divide-y divide-subtle">
                    {filteredTasks.map(t => (
                        <TaskListItem 
                            key={t.id} 
                            task={t} 
                            isSelected={selectedTask?.id === t.id}
                            isChecked={selectedIds.has(t.id)}
                            isCompact={density === 'compact'}
                            onCheck={toggleSelection}
                            onClick={setSelectedTask}
                            onStar={toggleTaskStar}
                        />
                    ))}
                </div>
            )}

            {viewMode === 'table' && (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-subtle sticky top-0 z-10 text-xs font-bold text-secondary uppercase border-b border-subtle">
                        <tr>
                            <th className="p-3 w-10 text-center"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === filteredTasks.length && filteredTasks.length > 0} /></th>
                            <th className="p-3 w-8"></th>
                            <th className="p-3 cursor-pointer hover:text-blue-600" onClick={() => handleSort('title')}>Title {sortConfig.key === 'title' && (sortConfig.dir === 'asc' ? <ArrowUp size={10} className="inline"/> : <ArrowDown size={10} className="inline"/>)}</th>
                            <th className="p-3 cursor-pointer hover:text-blue-600" onClick={() => handleSort('priority')}>Pri</th>
                            <th className="p-3">Process</th>
                            <th className="p-3 cursor-pointer hover:text-blue-600" onClick={() => handleSort('dueDate')}>Due</th>
                            <th className="p-3">Assignee</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.map(t => (
                            <TaskTableRow 
                                key={t.id} task={t} 
                                isSelected={selectedIds.has(t.id) || selectedTask?.id === t.id} 
                                onToggle={toggleSelection} 
                                onClick={setSelectedTask}
                                onStar={toggleTaskStar}
                                onSnooze={handleSnooze}
                            />
                        ))}
                    </tbody>
                </table>
            )}

            {viewMode === 'kanban' && (
                <div className="flex gap-4 p-4 h-full overflow-x-auto bg-canvas">
                    {[TaskStatus.PENDING, TaskStatus.CLAIMED, TaskStatus.IN_PROGRESS].map(status => (
                        <div key={status} className="flex-1 min-w-[200px] flex flex-col h-full">
                            <h4 className="text-xs font-bold text-secondary uppercase mb-2 flex justify-between bg-subtle px-2 py-1 rounded-base border border-subtle">
                                {status} <span className="bg-panel px-1.5 rounded-full text-primary border border-default">{filteredTasks.filter(t => t.status === status).length}</span>
                            </h4>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                {filteredTasks.filter(t => t.status === status).map(t => (
                                    <KanbanCard key={t.id} task={t} onClick={setSelectedTask} onStar={toggleTaskStar} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-tertiary">
                    <CheckSquare size={32} className="mb-2 opacity-50"/>
                    <p className="text-xs font-bold uppercase">No tasks found</p>
                </div>
            )}
        </div>
        
        <div className="p-2 border-t border-default bg-subtle text-xs text-secondary font-medium flex justify-between items-center">
            <span>{filteredTasks.length} items</span>
            <button onClick={() => setDensity(d => d === 'compact' ? 'comfy' : 'compact')} className="hover:text-blue-600">{density === 'compact' ? 'Comfy View' : 'Compact View'}</button>
        </div>
      </div>

      {/* RIGHT PANE: TASK PREVIEW (Fixed Width) */}
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
                   <button onClick={() => navigateTo('task-reassign', selectedTask.id)} title="Reassign" className="p-1.5 hover:bg-subtle rounded-base text-secondary"><UserPlus size={16}/></button>
                   <button onClick={() => navigateTo('task-metadata', selectedTask.id)} title="Edit Metadata" className="p-1.5 hover:bg-subtle rounded-base text-secondary"><Settings size={16}/></button>
                   <button onClick={() => handleSnooze(selectedTask.id)} title="Snooze" className="p-1.5 hover:bg-subtle rounded-base text-secondary"><PauseCircle size={16}/></button>
                   <div className="h-4 w-px bg-default mx-1"></div>
                   <button onClick={() => setSelectedTask(null)} title="Close Preview" className="p-1.5 hover:bg-subtle rounded-base text-secondary"><X size={16}/></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
               <div className="bg-panel p-6 rounded-base border border-default shadow-sm mb-4">
                   <h2 className="text-lg font-bold text-primary mb-2 leading-tight">{selectedTask.title}</h2>
                   <div className="flex items-center gap-4 text-xs text-secondary mb-4 pb-4 border-b border-subtle">
                       <span className="flex items-center gap-1"><Layers size={12}/> {selectedTask.processName}</span>
                       <span className="flex items-center gap-1"><User size={12}/> {selectedTask.assignee}</span>
                       <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                   </div>
                   <p className="text-base text-primary leading-relaxed mb-4">{selectedTask.description || "No description provided."}</p>
                   
                   {/* AI INSIGHT SECTION */}
                   <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-sm">
                       <div className="flex justify-between items-start mb-2">
                           <h4 className="text-xs font-bold text-violet-800 uppercase flex items-center gap-2"><Sparkles size={12}/> Intelligent Briefing</h4>
                           {loadingAi && <span className="text-[10px] text-violet-500 animate-pulse">Analyzing...</span>}
                       </div>
                       {aiInsight ? (
                           <div className="space-y-2 text-xs">
                               <p className="text-slate-700 italic">"{aiInsight.summary}"</p>
                               <div className="flex gap-2 mt-2">
                                   <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                       aiInsight.sentiment === 'Negative' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                   }`}>
                                       Sentiment: {aiInsight.sentiment}
                                   </span>
                                   <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                       Suggested: {aiInsight.nextAction}
                                   </span>
                               </div>
                           </div>
                       ) : (
                           <div className="text-xs text-slate-400 italic">Select task to generate insight...</div>
                       )}
                   </div>

                   {/* DYNAMIC FORM RENDERING */}
                   {activeForm && selectedTask.status !== TaskStatus.COMPLETED && selectedTask.assignee !== 'Unassigned' && (
                       <div className="mb-6 p-4 bg-slate-50 border border-blue-200 rounded-sm">
                           <div className="flex items-center gap-2 mb-4 text-blue-700">
                               <FormInput size={16}/>
                               <h4 className="text-sm font-bold uppercase">{activeForm.name}</h4>
                           </div>
                           <FormRenderer 
                               form={activeForm} 
                               data={formData} 
                               onChange={(k, v) => setFormData(prev => ({ ...prev, [k]: v }))} 
                               errors={formErrors}
                           />
                       </div>
                   )}

                   {/* Context Actions */}
                   <div className="flex gap-2">
                       {selectedTask.status === TaskStatus.PENDING && selectedTask.assignee === 'Unassigned' && (
                           <NexButton variant="primary" onClick={() => claimTask(selectedTask.id)} icon={CheckCircle}>Claim Task</NexButton>
                       )}
                       {selectedTask.status !== TaskStatus.COMPLETED && selectedTask.assignee !== 'Unassigned' && (
                           <>
                            <NexButton variant="primary" onClick={handleSubmit} icon={CheckSquare}>Submit & Complete</NexButton>
                            <NexButton variant="secondary" onClick={() => releaseTask(selectedTask.id)} icon={XCircle}>Release</NexButton>
                           </>
                       )}
                       {selectedTask.processInstanceId && selectedTask.processInstanceId !== 'adhoc' && (
                           <NexButton variant="ghost" onClick={() => openInstanceViewer(selectedTask.processInstanceId)} icon={Layers}>Diagram</NexButton>
                       )}
                   </div>
               </div>

               {/* Activity Stream */}
               <div className="bg-panel rounded-base border border-default shadow-sm flex flex-col">
                   <div className="p-3 bg-subtle border-b border-subtle">
                       <h3 className="text-xs font-bold text-secondary uppercase">Discussion</h3>
                   </div>
                   <div className="p-4 flex-1">
                       <NexHistoryFeed history={selectedTask.comments} />
                   </div>
                   <div className="p-3 border-t border-subtle bg-subtle flex gap-2">
                       <input 
                           className="flex-1 bg-panel border border-default rounded-base px-3 text-base outline-none focus:border-blue-500"
                           placeholder="Type a comment..."
                           value={commentText}
                           onChange={e => setCommentText(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && (addTaskComment(selectedTask.id, commentText), setCommentText(''))}
                       />
                       <button onClick={() => { addTaskComment(selectedTask.id, commentText); setCommentText(''); }} className="p-2 bg-blue-600 text-white rounded-base hover:bg-blue-700"><Send size={14}/></button>
                   </div>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-tertiary">
             <div className="w-16 h-16 bg-subtle rounded-full flex items-center justify-center mb-4 border border-default">
                 <LayoutGrid size={32} className="opacity-50"/>
             </div>
             <p className="text-sm font-medium">Select a task to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
