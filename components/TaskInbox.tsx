
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Search, CheckSquare, ShieldAlert, ChevronLeft, 
  Briefcase, Send, Layers, Clock, AlertCircle, UserPlus, Settings, Tag,
  Filter, CheckCircle, XCircle, Play, StopCircle, Paperclip, LayoutGrid, List as ListIcon
} from 'lucide-react';
import { NexBadge, NexButton, NexHistoryFeed, NexModal, NexFormGroup } from './shared/NexUI';

interface ListItemProps {
  task: Task;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  isChecked: boolean;
  onCheck: (id: string) => void;
  onClick: (task: Task) => void;
}

const ListItem: React.FC<ListItemProps> = ({ task, isSelected, isMultiSelectMode, isChecked, onCheck, onClick }) => {
  return (
    <div 
      onClick={() => onClick(task)}
      className={`px-4 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors group flex items-start gap-3 ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-3' : 'border-l-4 border-l-transparent pl-3'}`}
    >
      {isMultiSelectMode && (
          <div onClick={(e) => { e.stopPropagation(); onCheck(task.id); }} className={`w-4 h-4 mt-1 border rounded-sm flex items-center justify-center transition-all ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
              {isChecked && <CheckSquare size={10} className="text-white"/>}
          </div>
      )}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
            <span className={`text-[13px] font-bold truncate pr-2 ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>{task.title}</span>
            <div className="flex items-center gap-1">
               {(task.attachments?.length ?? 0) > 0 && <Paperclip size={12} className="text-slate-400"/>}
               {task.priority === TaskPriority.CRITICAL && <AlertCircle size={14} className="text-rose-600 shrink-0"/>}
            </div>
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span className="truncate max-w-[120px]">{task.processName}</span>
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

// --- Kanban Card ---
const KanbanCard: React.FC<{ task: Task, onClick: (t: Task) => void }> = ({ task, onClick }) => {
    return (
        <div onClick={() => onClick(task)} className="p-3 bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all flex flex-col gap-2 group">
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-800 line-clamp-2">{task.title}</span>
                {task.priority === TaskPriority.CRITICAL && <AlertCircle size={12} className="text-rose-600 shrink-0 mt-0.5"/>}
            </div>
            <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-500 truncate max-w-[100px]">{task.processName}</span>
                <NexBadge variant={task.priority === 'Critical' ? 'rose' : 'slate'}>{task.priority}</NexBadge>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                <span className="font-bold">{task.assignee === 'Unassigned' ? 'Pool' : task.assignee.split(' ')[0]}</span>
            </div>
        </div>
    );
};

export const TaskInbox: React.FC = () => {
  const { tasks, completeTask, claimTask, releaseTask, addTaskComment, reassignTask, updateTaskMetadata, bulkCompleteTasks, currentUser, delegations, users, navigateTo, openInstanceViewer } = useBPM();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // View State
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [localFilter, setLocalFilter] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');
  const [filterProcess, setFilterProcess] = useState('All');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal States
  const [showReassign, setShowReassign] = useState(false);
  const [reassignTarget, setReassignTarget] = useState('');
  const [showMetadata, setShowMetadata] = useState(false);
  
  // Metadata Form State
  const [metaPriority, setMetaPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [metaDueDate, setMetaDueDate] = useState('');

  // Derived Lists
  const delegateRules = delegations.filter(d => d.toUserId === currentUser?.id && d.isActive);
  
  const allRelevantTasks = tasks.filter(t => {
      const isMyTask = t.assignee === currentUser?.id;
      const isDelegated = delegateRules.some(d => d.fromUserId === t.assignee);
      const isUnassigned = t.status === TaskStatus.PENDING && t.assignee === 'Unassigned';
      
      // Filter Logic
      const matchesProcess = filterProcess === 'All' || t.processName === filterProcess;
      const matchesSearch = !localFilter || t.title.toLowerCase().includes(localFilter.toLowerCase()) || t.id.toLowerCase().includes(localFilter.toLowerCase());
      
      return (isMyTask || isDelegated || isUnassigned) && matchesProcess && matchesSearch;
  });

  const sortedTasks = useMemo(() => {
      return [...allRelevantTasks].sort((a, b) => {
          if (sortBy === 'priority') {
              const pMap = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
              return pMap[b.priority] - pMap[a.priority];
          }
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [allRelevantTasks, sortBy]);

  const myTasks = sortedTasks.filter(t => t.assignee === currentUser?.id);
  const delegatedTasks = sortedTasks.filter(t => delegateRules.some(d => d.fromUserId === t.assignee));
  const unassignedTasks = sortedTasks.filter(t => t.status === TaskStatus.PENDING && t.assignee === 'Unassigned');
  
  // Unique Process Names for Filter
  const processNames = Array.from(new Set(tasks.map(t => t.processName)));

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    await completeTask(id, action, action === 'approve' ? 'Approved' : 'Rejected');
    setSelectedTask(null);
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
      await bulkCompleteTasks(Array.from(selectedIds), action);
      setSelectedIds(new Set());
      setMultiSelectMode(false);
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const openReassign = () => { setReassignTarget(''); setShowReassign(true); };
  const handleReassign = async () => {
      if (selectedTask && reassignTarget) {
          await reassignTask(selectedTask.id, reassignTarget);
          setShowReassign(false);
          setSelectedTask(null);
      }
  };

  const openMetadata = () => {
      if (selectedTask) {
          setMetaPriority(selectedTask.priority);
          setMetaDueDate(selectedTask.dueDate.split('T')[0]);
          setShowMetadata(true);
      }
  };

  const handleUpdateMetadata = async () => {
      if (selectedTask) {
          await updateTaskMetadata(selectedTask.id, { priority: metaPriority, dueDate: new Date(metaDueDate).toISOString() });
          setShowMetadata(false);
      }
  };

  // Grouping for Kanban
  const kanbanColumns = useMemo(() => {
      return {
          [TaskStatus.PENDING]: sortedTasks.filter(t => t.status === TaskStatus.PENDING),
          [TaskStatus.CLAIMED]: sortedTasks.filter(t => t.status === TaskStatus.CLAIMED),
          [TaskStatus.IN_PROGRESS]: sortedTasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
      };
  }, [sortedTasks]);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
      
      {/* --- Modals --- */}
      <NexModal isOpen={showReassign} onClose={() => setShowReassign(false)} title="Transfer Ownership">
          <div className="space-y-4">
              <NexFormGroup label="New Owner">
                  <select className="prop-input" value={reassignTarget} onChange={e => setReassignTarget(e.target.value)}>
                      <option value="">Select Principal...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
              </NexFormGroup>
              <div className="flex justify-end">
                  <NexButton variant="primary" onClick={handleReassign} icon={UserPlus}>Confirm Transfer</NexButton>
              </div>
          </div>
      </NexModal>

      <NexModal isOpen={showMetadata} onClose={() => setShowMetadata(false)} title="Task Parameters">
          <div className="space-y-4">
              <NexFormGroup label="Priority Level">
                  <select className="prop-input" value={metaPriority} onChange={e => setMetaPriority(e.target.value as TaskPriority)}>
                      {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
              </NexFormGroup>
              <NexFormGroup label="Due Date">
                  <input type="date" className="prop-input" value={metaDueDate} onChange={e => setMetaDueDate(e.target.value)} />
              </NexFormGroup>
              <div className="flex justify-end">
                  <NexButton variant="primary" onClick={handleUpdateMetadata} icon={Settings}>Update Task</NexButton>
              </div>
          </div>
      </NexModal>

      {/* LEFT SIDE: List/Kanban Container */}
      <div className={`flex flex-col border-r border-slate-200 bg-white ${selectedTask ? 'hidden lg:flex w-full lg:w-96' : 'w-full'}`}>
        <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
           <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none" 
                        placeholder="Filter tasks..." 
                        value={localFilter}
                        onChange={e => setLocalFilter(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-200 p-0.5 rounded-sm shrink-0">
                    <button onClick={() => setViewMode('list')} className={`p-1 rounded-sm ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><ListIcon size={14}/></button>
                    <button onClick={() => setViewMode('kanban')} className={`p-1 rounded-sm ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><LayoutGrid size={14}/></button>
                </div>
           </div>
           
           <div className="flex gap-1">
               <select className="flex-1 py-1 px-2 text-[10px] bg-slate-100 border border-slate-200 rounded-sm outline-none" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                   <option value="dueDate">By Due Date</option>
                   <option value="priority">By Priority</option>
               </select>
               <select className="flex-1 py-1 px-2 text-[10px] bg-slate-100 border border-slate-200 rounded-sm outline-none" value={filterProcess} onChange={e => setFilterProcess(e.target.value)}>
                   <option value="All">All Flows</option>
                   {processNames.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
           </div>
           {viewMode === 'list' && (
               <button 
                onClick={() => setMultiSelectMode(!multiSelectMode)} 
                className={`w-full py-1 text-[10px] font-bold uppercase rounded-sm border transition-all ${multiSelectMode ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
               >
                {multiSelectMode ? 'Cancel Selection' : 'Bulk Actions'}
               </button>
           )}
        </div>

        {/* Bulk Action Bar */}
        {multiSelectMode && selectedIds.size > 0 && viewMode === 'list' && (
            <div className="bg-blue-50 border-b border-blue-100 p-2 flex gap-2 justify-center animate-slide-up">
                <button onClick={() => handleBulkAction('approve')} className="flex-1 py-1 bg-emerald-600 text-white rounded-sm text-[10px] font-bold hover:bg-emerald-700">Approve ({selectedIds.size})</button>
                <button onClick={() => handleBulkAction('reject')} className="flex-1 py-1 bg-rose-600 text-white rounded-sm text-[10px] font-bold hover:bg-rose-700">Reject ({selectedIds.size})</button>
            </div>
        )}

        {viewMode === 'list' ? (
            <div className="flex-1 overflow-y-auto no-scrollbar">
            {sortedTasks.length === 0 ? (
                <div className="p-8 text-center">
                    <CheckCircle size={32} className="mx-auto text-slate-200 mb-2"/>
                    <p className="text-xs text-slate-400 font-bold uppercase">All caught up</p>
                </div>
            ) : (
                <>
                    {myTasks.length > 0 && <div className="px-4 py-2 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase border-y border-slate-200">My Worklist ({myTasks.length})</div>}
                    {myTasks.map(t => <ListItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} isMultiSelectMode={multiSelectMode} isChecked={selectedIds.has(t.id)} onCheck={toggleSelection} onClick={setSelectedTask} />)}
                    
                    {delegatedTasks.length > 0 && (
                        <>
                        <div className="px-4 py-2 bg-slate-100 text-[10px] font-bold text-blue-600 uppercase border-y border-slate-200 flex items-center gap-2"><ShieldAlert size={10}/> Delegated</div>
                        {delegatedTasks.map(t => <ListItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} isMultiSelectMode={multiSelectMode} isChecked={selectedIds.has(t.id)} onCheck={toggleSelection} onClick={setSelectedTask} />)}
                        </>
                    )}
                    
                    {unassignedTasks.length > 0 && (
                        <>
                        <div className="px-4 py-2 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase border-y border-slate-200">Unassigned ({unassignedTasks.length})</div>
                        {unassignedTasks.map(t => <ListItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} isMultiSelectMode={multiSelectMode} isChecked={selectedIds.has(t.id)} onCheck={toggleSelection} onClick={setSelectedTask} />)}
                        </>
                    )}
                </>
            )}
            </div>
        ) : (
            <div className="flex-1 overflow-x-auto p-4 bg-slate-100 flex gap-4 min-w-0">
                {[TaskStatus.PENDING, TaskStatus.CLAIMED, TaskStatus.IN_PROGRESS].map(status => (
                    <div key={status} className="flex-1 min-w-[200px] flex flex-col h-full">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between">
                            {status} <span className="bg-slate-200 px-1.5 rounded-full text-slate-600">{kanbanColumns[status]?.length || 0}</span>
                        </h4>
                        <div className="flex-1 bg-slate-100/50 rounded-sm overflow-y-auto space-y-2 pr-1">
                            {(kanbanColumns[status] || []).map(t => (
                                <KanbanCard key={t.id} task={t} onClick={setSelectedTask} />
                            ))}
                            {(kanbanColumns[status]?.length || 0) === 0 && (
                                <div className="text-center py-8 text-slate-300 italic text-[10px] border border-dashed border-slate-300 rounded-sm">Empty</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* RIGHT SIDE: Detail View */}
      <div className={`flex-1 flex flex-col bg-slate-50 ${selectedTask ? 'flex' : 'hidden lg:flex'}`}>
        {selectedTask ? (
          <>
            <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedTask(null)} className="lg:hidden p-1 border rounded hover:bg-slate-100"><ChevronLeft size={16}/></button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400">{selectedTask.id}</span>
                  <h2 className="text-sm font-bold text-slate-800">{selectedTask.title}</h2>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedTask.assignee === 'Unassigned' ? (
                    <NexButton variant="primary" onClick={() => claimTask(selectedTask.id)} icon={CheckCircle}>Claim</NexButton>
                ) : (
                    <>
                        <NexButton variant="secondary" onClick={() => releaseTask(selectedTask.id)} icon={XCircle}>Release</NexButton>
                        <NexButton variant="secondary" onClick={openReassign} icon={UserPlus}>Reassign</NexButton>
                    </>
                )}
                <NexButton variant="secondary" onClick={openMetadata} icon={Settings}>Metadata</NexButton>
                <div className="h-6 w-px bg-slate-300 mx-2"></div>
                <NexButton variant="secondary" onClick={() => openInstanceViewer(selectedTask.processInstanceId)} icon={Layers}>Diagram</NexButton>
                {selectedTask.caseId && <NexButton variant="secondary" onClick={() => navigateTo('case-viewer', selectedTask.caseId)} icon={Briefcase}>Case</NexButton>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
               <div className="bg-white border border-slate-300 rounded-sm p-6 mb-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-bold text-slate-700 uppercase">Task Context</h3>
                      {selectedTask.isAdHoc && <NexBadge variant="amber">Ad-Hoc</NexBadge>}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mb-6">{selectedTask.description || "No specific instructions provided for this task."}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><span className="text-slate-500 block mb-1">Process</span> <span className="font-medium">{selectedTask.processName}</span></div>
                    <div><span className="text-slate-500 block mb-1">Priority</span> <NexBadge variant={selectedTask.priority === 'Critical' ? 'rose' : 'blue'}>{selectedTask.priority}</NexBadge></div>
                    <div><span className="text-slate-500 block mb-1">Due Date</span> <span className="font-medium">{new Date(selectedTask.dueDate).toLocaleDateString()}</span></div>
                    <div><span className="text-slate-500 block mb-1">Assignee</span> <span className="font-medium">{selectedTask.assignee}</span></div>
                  </div>
               </div>

               <div className="bg-white border border-slate-300 rounded-sm p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase border-b border-slate-100 pb-2 mb-4">Activity Log</h3>
                  <NexHistoryFeed history={selectedTask.comments} />
                  <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                     <input className="prop-input" placeholder="Add comment..." value={commentText} onChange={e => setCommentText(e.target.value)} />
                     <NexButton onClick={() => { if(selectedTask && commentText) { addTaskComment(selectedTask.id, commentText); setCommentText(''); }}} icon={Send}>Add</NexButton>
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-slate-300 bg-white flex justify-end gap-3">
              <NexButton variant="danger" onClick={() => handleAction(selectedTask.id, 'reject')} disabled={selectedTask.assignee === 'Unassigned'}>Reject</NexButton>
              <NexButton variant="primary" onClick={() => handleAction(selectedTask.id, 'approve')} disabled={selectedTask.assignee === 'Unassigned'}>Approve & Complete</NexButton>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <CheckSquare size={48} className="mb-4 opacity-20"/>
            <p className="text-sm font-medium">Select a task item to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
