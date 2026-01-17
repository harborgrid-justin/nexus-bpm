import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Search, CheckSquare, ShieldAlert, ChevronLeft, 
  Briefcase, Send, Layers, Clock, AlertCircle, UserPlus, Settings, Tag,
  Filter, CheckCircle, XCircle, Play, StopCircle, Paperclip, LayoutGrid, List as ListIcon, 
  User, MoreHorizontal, Calendar, Star, PauseCircle, ArrowDown, ArrowUp, X,
  ChevronsRight, Table as TableIcon, Download, RefreshCw, Zap, Plus
} from 'lucide-react';
import { NexBadge, NexButton, NexHistoryFeed, NexModal, NexFormGroup } from './shared/NexUI';

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

// --- Task Row Component (Table View) ---
const TaskTableRow = ({ task, isSelected, onToggle, onClick, onStar, onSnooze }: any) => {
    const isOverdue = new Date(task.dueDate) < new Date();
    return (
        <tr onClick={() => onClick(task)} className={`group border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer text-xs ${isSelected ? 'bg-blue-50/50' : ''}`}>
            <td className="p-3 w-10 text-center" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggle(task.id)} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
            </td>
            <td className="p-3 w-8 text-center" onClick={e => { e.stopPropagation(); onStar(task.id); }}>
                <Star size={14} className={task.isStarred ? "fill-amber-400 text-amber-400" : "text-slate-300 group-hover:text-slate-400"} />
            </td>
            <td className="p-3 font-medium text-slate-800">
                <div className="flex flex-col">
                    <span>{task.title}</span>
                    {task.isAdHoc && <span className="text-[9px] text-amber-600 italic">Ad-Hoc</span>}
                </div>
            </td>
            <td className="p-3">
                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                    task.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 
                    task.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                }`}>
                    {task.priority}
                </span>
            </td>
            <td className="p-3 text-slate-500 truncate max-w-[120px]">{task.processName}</td>
            <td className="p-3">
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                    <Clock size={12}/> {getRelativeTime(task.dueDate)}
                </div>
            </td>
            <td className="p-3">
               <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                       {task.assignee === 'Unassigned' ? '?' : task.assignee.charAt(0)}
                   </div>
                   <span className="truncate max-w-[80px]">{task.assignee}</span>
               </div>
            </td>
            <td className="p-3 w-10 text-right opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={() => onSnooze(task.id)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"><PauseCircle size={14}/></button>
            </td>
        </tr>
    );
};

// --- Task List Item Component ---
const TaskListItem = ({ task, isSelected, isChecked, isCompact, onCheck, onClick, onStar }: any) => {
  const isOverdue = new Date(task.dueDate) < new Date();
  
  return (
    <div 
      onClick={() => onClick(task)}
      className={`border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors group flex items-start gap-3 relative ${isCompact ? 'px-3 py-2' : 'px-4 py-3'} ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-2' : 'border-l-4 border-l-transparent pl-3'}`}
    >
      <div className="pt-1 flex flex-col gap-2 items-center" onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={isChecked} onChange={() => onCheck(task.id)} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
          <button onClick={() => onStar(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
             <Star size={12} className={task.isStarred ? "fill-amber-400 text-amber-400 opacity-100" : "text-slate-300"} />
          </button>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
            <div className="flex items-center gap-2">
                <span className={`font-bold truncate pr-2 ${isCompact ? 'text-xs' : 'text-sm'} ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>
                    {task.title}
                </span>
                {task.isAdHoc && <span className="bg-amber-100 text-amber-700 text-[9px] px-1 rounded font-bold">ADHOC</span>}
                {task.tags?.map((t: string) => <span key={t} className="bg-slate-100 text-slate-500 text-[9px] px-1 rounded border border-slate-200">{t}</span>)}
            </div>
            <div className="flex items-center gap-1">
               {(task.attachments?.length ?? 0) > 0 && <Paperclip size={12} className="text-slate-400"/>}
               {task.priority === TaskPriority.CRITICAL && <AlertCircle size={14} className="text-rose-600 shrink-0 animate-pulse"/>}
            </div>
        </div>
        
        <div className="flex justify-between items-center text-[10px] text-slate-500">
            <span className="truncate max-w-[150px] flex items-center gap-1"><Layers size={10}/> {task.processName}</span>
            <div className="flex items-center gap-2">
                <span className={`${isOverdue ? 'text-rose-600 font-bold' : ''}`}>{getRelativeTime(task.dueDate)}</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium border border-slate-200">{task.status}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Kanban Card ---
const KanbanCard = ({ task, onClick, onStar }: any) => {
    return (
        <div onClick={() => onClick(task)} className="p-3 bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all flex flex-col gap-2 group relative">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); onStar(task.id); }}>
                <Star size={12} className={task.isStarred ? "fill-amber-400 text-amber-400 opacity-100" : "text-slate-300"} />
            </div>
            <div className="flex justify-between items-start pr-4">
                <span className="text-xs font-bold text-slate-800 line-clamp-2">{task.title}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-500 truncate max-w-[100px]">{task.processName}</span>
                <NexBadge variant={task.priority === 'Critical' ? 'rose' : 'slate'}>{task.priority}</NexBadge>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                <span>{getRelativeTime(task.dueDate)}</span>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[8px] border border-slate-200">
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
      toggleTaskStar, snoozeTask, createAdHocTask 
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

  // --- Rendering ---

  return (
    <div className="flex h-[calc(100vh-100px)] bg-slate-50 border border-slate-300 rounded-sm shadow-sm overflow-hidden animate-fade-in">
      
      {/* LEFT PANE: TASK LIST (Flexible Width) */}
      <div className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${selectedTask ? 'w-[450px] shrink-0 hidden xl:flex' : 'w-full'}`}>
        
        {/* 1. Header & Tabs */}
        <div className="pt-3 px-3 bg-white border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><CheckSquare size={18} className="text-blue-600"/> Task Inbox</h2>
                <div className="flex gap-1">
                    <button onClick={() => setViewMode('list')} title="List View" className={`p-1.5 rounded-sm ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon size={16}/></button>
                    <button onClick={() => setViewMode('table')} title="Table View" className={`p-1.5 rounded-sm ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><TableIcon size={16}/></button>
                    <button onClick={() => setViewMode('kanban')} title="Kanban View" className={`p-1.5 rounded-sm ${viewMode === 'kanban' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16}/></button>
                </div>
            </div>
            
            <div className="flex gap-6 text-xs font-bold text-slate-500 uppercase tracking-wide">
                {[ 
                    { id: 'my', label: 'My Work' }, 
                    { id: 'team', label: 'Team Queue' }, 
                    { id: 'starred', label: 'Starred' },
                    { id: 'snoozed', label: 'Snoozed' }
                ].map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as any)} 
                        className={`pb-2 border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-800'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* 2. Toolbar & Quick Actions */}
        <div className="p-2 bg-slate-50 border-b border-slate-200 space-y-2">
            {/* Quick Create AdHoc */}
            <form onSubmit={handleQuickCreate} className="relative">
                <Plus size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none" 
                    placeholder="Quick add personal task..." 
                    value={quickTaskTitle}
                    onChange={e => setQuickTaskTitle(e.target.value)}
                />
            </form>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm outline-none" 
                        placeholder="Search..." 
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                    />
                </div>
                {/* Filter Chips */}
                <button 
                    onClick={() => setQuickFilter(f => f === 'Critical' ? null : 'Critical')}
                    className={`px-2 py-1 rounded-sm text-[10px] font-bold border ${quickFilter === 'Critical' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                    Critical
                </button>
                <button 
                    onClick={() => setQuickFilter(f => f === 'Overdue' ? null : 'Overdue')}
                    className={`px-2 py-1 rounded-sm text-[10px] font-bold border ${quickFilter === 'Overdue' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                    Overdue
                </button>
            </div>

            {/* Bulk Toolbar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between bg-blue-600 text-white px-3 py-1.5 rounded-sm shadow-md animate-slide-up">
                    <span className="text-[10px] font-bold">{selectedIds.size} Selected</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleBulkAction('complete')} className="hover:bg-blue-500 p-1 rounded"><CheckSquare size={14}/></button>
                        <button onClick={() => handleBulkAction('claim')} className="hover:bg-blue-500 p-1 rounded"><UserPlus size={14}/></button>
                        <button onClick={() => handleBulkAction('release')} className="hover:bg-blue-500 p-1 rounded"><XCircle size={14}/></button>
                        <button onClick={handleExport} className="hover:bg-blue-500 p-1 rounded"><Download size={14}/></button>
                    </div>
                </div>
            )}
        </div>

        {/* 3. Task List Area */}
        <div className="flex-1 overflow-y-auto bg-white min-h-0">
            {viewMode === 'list' && (
                <div className="divide-y divide-slate-100">
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
                    <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
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
                <div className="flex gap-4 p-4 h-full overflow-x-auto bg-slate-100">
                    {[TaskStatus.PENDING, TaskStatus.CLAIMED, TaskStatus.IN_PROGRESS].map(status => (
                        <div key={status} className="flex-1 min-w-[200px] flex flex-col h-full">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between bg-slate-200 px-2 py-1 rounded-sm">
                                {status} <span className="bg-white px-1.5 rounded-full text-slate-600">{filteredTasks.filter(t => t.status === status).length}</span>
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
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <CheckSquare size={32} className="mb-2 opacity-50"/>
                    <p className="text-xs font-bold uppercase">No tasks found</p>
                </div>
            )}
        </div>
        
        <div className="p-2 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-medium flex justify-between items-center">
            <span>{filteredTasks.length} items</span>
            <button onClick={() => setDensity(d => d === 'compact' ? 'comfy' : 'compact')} className="hover:text-blue-600">{density === 'compact' ? 'Comfy View' : 'Compact View'}</button>
        </div>
      </div>

      {/* RIGHT PANE: TASK PREVIEW (Fixed Width) */}
      <div className={`flex-1 bg-slate-50 flex flex-col border-l border-slate-200 transition-all duration-300 ${!selectedTask ? 'hidden xl:hidden' : 'flex'}`}>
        {selectedTask ? (
          <>
            <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm shrink-0">
               <div className="flex items-center gap-2">
                   <button onClick={() => setSelectedTask(null)} className="xl:hidden mr-2"><ChevronLeft size={18}/></button>
                   <NexBadge variant={selectedTask.priority === 'Critical' ? 'rose' : 'blue'}>{selectedTask.priority}</NexBadge>
                   <span className="text-xs text-slate-400 font-mono">{selectedTask.id}</span>
               </div>
               <div className="flex items-center gap-1">
                   <button onClick={() => navigateTo('task-reassign', selectedTask.id)} title="Reassign" className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><UserPlus size={16}/></button>
                   <button onClick={() => navigateTo('task-metadata', selectedTask.id)} title="Edit Metadata" className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Settings size={16}/></button>
                   <button onClick={() => handleSnooze(selectedTask.id)} title="Snooze" className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><PauseCircle size={16}/></button>
                   <div className="h-4 w-px bg-slate-300 mx-1"></div>
                   <button onClick={() => setSelectedTask(null)} title="Close Preview" className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><X size={16}/></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
               <div className="bg-white p-6 rounded-sm border border-slate-300 shadow-sm mb-4">
                   <h2 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{selectedTask.title}</h2>
                   <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
                       <span className="flex items-center gap-1"><Layers size={12}/> {selectedTask.processName}</span>
                       <span className="flex items-center gap-1"><User size={12}/> {selectedTask.assignee}</span>
                       <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                   </div>
                   <p className="text-sm text-slate-700 leading-relaxed mb-4">{selectedTask.description || "No description provided."}</p>
                   
                   {/* Context Actions */}
                   <div className="flex gap-2">
                       {selectedTask.status === TaskStatus.PENDING && selectedTask.assignee === 'Unassigned' && (
                           <NexButton variant="primary" onClick={() => claimTask(selectedTask.id)} icon={CheckCircle}>Claim Task</NexButton>
                       )}
                       {selectedTask.status !== TaskStatus.COMPLETED && selectedTask.assignee !== 'Unassigned' && (
                           <>
                            <NexButton variant="primary" onClick={() => completeTask(selectedTask.id, 'approve', 'Completed from preview')} icon={CheckSquare}>Complete</NexButton>
                            <NexButton variant="secondary" onClick={() => releaseTask(selectedTask.id)} icon={XCircle}>Release</NexButton>
                           </>
                       )}
                       {selectedTask.processInstanceId && selectedTask.processInstanceId !== 'adhoc' && (
                           <NexButton variant="ghost" onClick={() => openInstanceViewer(selectedTask.processInstanceId)} icon={Layers}>Diagram</NexButton>
                       )}
                   </div>
               </div>

               {/* Activity Stream */}
               <div className="bg-white rounded-sm border border-slate-300 shadow-sm flex flex-col">
                   <div className="p-3 bg-slate-50 border-b border-slate-200">
                       <h3 className="text-xs font-bold text-slate-700 uppercase">Discussion</h3>
                   </div>
                   <div className="p-4 flex-1">
                       <NexHistoryFeed history={selectedTask.comments} />
                   </div>
                   <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
                       <input 
                           className="flex-1 bg-white border border-slate-300 rounded-sm px-3 text-xs outline-none focus:border-blue-500"
                           placeholder="Type a comment..."
                           value={commentText}
                           onChange={e => setCommentText(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && (addTaskComment(selectedTask.id, commentText), setCommentText(''))}
                       />
                       <button onClick={() => { addTaskComment(selectedTask.id, commentText); setCommentText(''); }} className="p-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700"><Send size={14}/></button>
                   </div>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
             <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                 <LayoutGrid size={32} className="opacity-50"/>
             </div>
             <p className="text-sm font-medium">Select a task to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};