
import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { useBPM } from '../contexts/BPMContext';
import { 
  Search, Users, CheckSquare, Clock, AlertCircle, ChevronLeft, 
  Briefcase, MessageSquare, Send, ShieldAlert, Layers
} from 'lucide-react';
import { NexBadge, NexButton, NexCard, NexSectionHeader, NexHistoryFeed } from './shared/NexUI';
import { TaskListItem, getPriorityClasses } from './inbox/TaskListItem';

export const TaskInbox: React.FC = () => {
  const { tasks, completeTask, addTaskComment, currentUser, delegations, navigateTo, openInstanceViewer } = useBPM();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState('');
  
  const delegateRules = delegations.filter(d => d.toUserId === currentUser?.id && d.isActive);
  const proxyForUserIds = delegateRules.map(d => d.fromUserId);

  const myTasks = tasks.filter(t => t.assignee === currentUser?.id);
  
  const delegatedTasks = tasks.filter(t => {
    const rule = delegateRules.find(d => d.fromUserId === t.assignee);
    if (!rule) return false;
    if (rule.scope === 'Critical Only') return t.priority === TaskPriority.CRITICAL;
    return true;
  });

  const unassignedTasks = tasks.filter(t => t.status === TaskStatus.PENDING && t.assignee === 'Unassigned');

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    await completeTask(id, action, action === 'approve' ? 'Approved via unified inbox' : 'Rejected via unified inbox');
    setSelectedTask(null);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;
    addTaskComment(selectedTask.id, commentText);
    setCommentText('');
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-fade-in relative overflow-hidden">
      <div className={`w-full lg:w-[420px] shrink-0 flex flex-col bg-white rounded-3xl border border-slate-200/80 card-shadow overflow-hidden transition-all duration-500 absolute inset-0 z-10 lg:relative lg:translate-x-0 ${selectedTask ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-slate-900 rounded-full"></div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Task Inventory</h3>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          <div className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] bg-slate-50/50 border-y border-slate-100 flex justify-between items-center sticky top-0 z-10 backdrop-blur-xl">
             <span>My Worklist</span>
             <NexBadge variant="slate">{myTasks.length}</NexBadge>
          </div>
          {myTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-[12px]">No assigned items.</div>
          ) : myTasks.map(task => <TaskListItem key={task.id} task={task} selectedTask={selectedTask} onSelectTask={setSelectedTask} />)}
          
          {delegatedTasks.length > 0 && (
            <>
              <div className="px-6 py-4 text-[10px] font-black text-blue-600 uppercase tracking-[0.25em] bg-blue-50/50 border-y border-blue-100 flex justify-between items-center sticky top-0 z-10 backdrop-blur-xl">
                 <span className="flex items-center gap-2"><ShieldAlert size={12}/> Proxy Queue</span>
                 <NexBadge variant="blue">{delegatedTasks.length}</NexBadge>
              </div>
              {delegatedTasks.map(task => <TaskListItem key={task.id} task={task} selectedTask={selectedTask} onSelectTask={setSelectedTask} />)}
            </>
          )}

          <div className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] bg-slate-50/50 border-y border-slate-100 flex justify-between items-center sticky top-0 z-10 backdrop-blur-xl">
             <span>Open Pool</span>
             <NexBadge variant="slate">{unassignedTasks.length}</NexBadge>
          </div>
          {unassignedTasks.map(task => <TaskListItem key={task.id} task={task} selectedTask={selectedTask} onSelectTask={setSelectedTask} />)}
        </div>
      </div>

      <div className={`flex-1 bg-white rounded-3xl border border-slate-200/80 card-shadow flex flex-col overflow-hidden transition-all duration-500 absolute inset-0 z-20 lg:relative lg:translate-x-0 ${selectedTask ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        {selectedTask ? (
          <>
            <div className="p-8 border-b border-slate-100 bg-slate-50/30">
              <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
                <div className="flex-1 space-y-4">
                  <NexButton variant="secondary" onClick={() => setSelectedTask(null)} icon={ChevronLeft} className="lg:hidden !rounded-xl !px-4 !py-2">Back</NexButton>
                  <div className="flex items-center gap-3">
                    <NexBadge variant={selectedTask.priority === 'Critical' ? 'rose' : 'blue'}>{selectedTask.priority}</NexBadge>
                    <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-mono text-[10px] font-bold text-slate-400">ID: {selectedTask.id.split('-')[1]}</div>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tightest leading-tight">{selectedTask.title}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.caseId && (
                    <NexButton variant="primary" onClick={() => navigateTo('case-viewer', selectedTask.caseId)} icon={Briefcase}>View Case</NexButton>
                  )}
                  <NexButton variant="secondary" onClick={() => openInstanceViewer(selectedTask.processInstanceId)} icon={Layers}>Diagram</NexButton>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
               <section className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Objective</h4>
                  <p className="text-[15px] text-slate-700 leading-relaxed font-medium">{selectedTask.description || "Synthesize and validate operational state."}</p>
               </section>

               <section className="space-y-6 pb-20">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Narrative History</h4>
                  <NexHistoryFeed history={selectedTask.comments} />
                  <form onSubmit={handleCommentSubmit} className="flex gap-3 pt-6 sticky bottom-0 bg-white/80 backdrop-blur-lg pb-4 -mb-4">
                     <input className="flex-1 px-5 py-3 bg-slate-100/80 border-none rounded-xl text-[13px] font-bold focus:bg-white outline-none ring-slate-200 focus:ring-2" placeholder="Post operational insight..." value={commentText} onChange={e => setCommentText(e.target.value)} />
                     <NexButton variant="primary" onClick={() => {}} icon={Send}>Post</NexButton>
                  </form>
               </section>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <NexButton variant="danger" onClick={() => handleAction(selectedTask.id, 'reject')}>Reject</NexButton>
              <NexButton variant="primary" onClick={() => handleAction(selectedTask.id, 'approve')} className="px-10">Complete Task</NexButton>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 text-center space-y-10">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <CheckSquare size={48} strokeWidth={1.5} className="text-slate-200" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-2xl tracking-tightest">Workload Hub</h3>
              <p className="text-[15px] font-medium text-slate-400 max-w-sm mx-auto mt-4 leading-relaxed">Choose an operational thread from your inventory to begin processing.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
