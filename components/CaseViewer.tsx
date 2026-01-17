
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  ArrowLeft, Users, Send, Settings, Activity, 
  CheckSquare, ChevronRight, Briefcase, ShieldCheck, Play, X, Layers
} from 'lucide-react';
import { NexBadge, NexButton, NexHistoryFeed } from './shared/NexUI';
import { getPriorityClasses } from './inbox/TaskListItem';

export const CaseViewer: React.FC<{ caseId: string }> = ({ caseId }) => {
  const { cases, tasks, processes, navigateTo, addCaseEvent, currentUser, openInstanceViewer, startProcess } = useBPM();
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'data' | 'content'>('timeline');
  const [note, setNote] = useState('');
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  const currentCase = cases.find(c => c.id === caseId);
  const relatedTasks = useMemo(() => tasks.filter(t => t.caseId === caseId), [tasks, caseId]);

  if (!currentCase) return <div className="p-20 text-center text-slate-400">Case file not found.</div>;

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    await addCaseEvent(caseId, note);
    setNote('');
  };

  const handleLaunchWorkflow = async (procId: string) => {
    await startProcess(procId, { summary: `Auto-launched from case: ${currentCase.title}` }, caseId);
    setShowLaunchModal(false);
    setActiveTab('tasks');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-fade-in bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
      <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigateTo('cases')} className="p-2 hover:bg-white rounded-full transition-colors"><ArrowLeft size={20}/></button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{currentCase.title}</h2>
              <NexBadge variant="blue">{currentCase.status}</NexBadge>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{currentCase.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <NexButton variant="secondary" icon={Play} onClick={() => setShowLaunchModal(true)}>Initiate Workflow</NexButton>
           <NexButton variant="primary" onClick={() => {}}>Close Case</NexButton>
        </div>
      </header>

      {showLaunchModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-3xl animate-slide-up space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Select Workflow Blueprint</h3>
                 <button onClick={() => setShowLaunchModal(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400"><X size={20}/></button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar pb-4">
                 {processes.map(proc => (
                   <button 
                     key={proc.id} 
                     onClick={() => handleLaunchWorkflow(proc.id)}
                     className="w-full p-6 border border-slate-100 rounded-[1.5rem] flex items-center justify-between hover:border-blue-200 hover:bg-blue-50/20 transition-all text-left group"
                   >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-all"><Layers size={20}/></div>
                        <span className="font-bold text-slate-900">{proc.name}</span>
                     </div>
                     <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600" />
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-slate-100 flex flex-col hidden xl:flex p-6 space-y-8">
           <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Stakeholders</h4>
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center font-bold text-xs">U{i}</div>)}
              </div>
           </div>
           <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata</h4>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs"><span className="text-slate-400">Created</span><span className="font-bold text-slate-800">{new Date(currentCase.createdAt).toLocaleDateString()}</span></div>
                 <div className="flex justify-between text-xs"><span className="text-slate-400">Domain</span><span className="font-bold text-slate-800 uppercase tracking-tighter">{currentCase.domainId}</span></div>
                 <div className="flex justify-between text-xs"><span className="text-slate-400">Security</span><span className="font-bold text-emerald-600">Encrypted</span></div>
              </div>
           </div>
        </aside>

        <main className="flex-1 flex flex-col bg-slate-50/30">
           <div className="flex border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
              {['timeline', 'tasks', 'data', 'content'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)} 
                  className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
                >
                  {tab}
                </button>
              ))}
           </div>

           <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              {activeTab === 'timeline' && (
                <div className="max-w-3xl mx-auto space-y-8">
                   <form onSubmit={handlePostNote} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-3 mb-10">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">{currentUser?.name[0]}</div>
                      <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 font-medium" placeholder="Post a case note..." value={note} onChange={e => setNote(e.target.value)} />
                      <NexButton variant="primary" onClick={() => {}} icon={Send}>Post</NexButton>
                   </form>
                   <NexHistoryFeed history={currentCase.timeline} />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="max-w-4xl mx-auto space-y-4">
                  {relatedTasks.map(task => {
                    return (
                      <div key={task.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                            <CheckSquare size={22} />
                          </div>
                          <div>
                            <h4 className="text-[15px] font-black text-slate-900 mb-1">{task.title}</h4>
                            <div className="flex items-center gap-3">
                              <NexBadge variant={task.priority === 'Critical' ? 'rose' : 'blue'}>{task.priority}</NexBadge>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{task.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <NexButton variant="secondary" onClick={() => openInstanceViewer(task.processInstanceId)} icon={Activity} />
                          <NexButton variant="primary" onClick={() => navigateTo('inbox', task.id)} icon={ChevronRight} />
                        </div>
                      </div>
                    );
                  })}
                  {relatedTasks.length === 0 && (
                    <div className="p-20 text-center text-slate-300 italic">No automated workflows launched for this case.</div>
                  )}
                </div>
              )}
           </div>
        </main>
      </div>
    </div>
  );
};
