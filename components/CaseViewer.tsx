
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  ArrowLeft, Users, Send, Settings, Activity, 
  CheckSquare, ChevronRight, Briefcase, ShieldCheck, Play, X, Layers, Plus, Shield, Edit, Trash2, RotateCcw, Lock, Database, Paperclip, FileText, Upload, Save, User as UserIcon, CheckCircle
} from 'lucide-react';
import { NexBadge, NexButton, NexHistoryFeed, NexCard, NexModal, NexFormGroup } from './shared/NexUI';
import { TaskStatus } from '../types';

const MOCK_STAGES = ['Open', 'In Progress', 'Pending Review', 'Resolved', 'Closed'];

export const CaseViewer: React.FC<{ caseId: string }> = ({ caseId }) => {
  const { cases, tasks, processes, users, navigateTo, addCaseEvent, removeCaseEvent, addCasePolicy, removeCasePolicy, addCaseStakeholder, removeCaseStakeholder, updateCase, startProcess, currentUser, openInstanceViewer } = useBPM();
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'data' | 'content'>('timeline');
  const [note, setNote] = useState('');
  const [caseData, setCaseData] = useState<string>('');

  const currentCase = cases.find(c => c.id === caseId);
  const relatedTasks = useMemo(() => tasks.filter(t => t.caseId === caseId), [tasks, caseId]);

  // Sync internal state when case changes
  React.useEffect(() => {
      if (currentCase) {
          setCaseData(JSON.stringify(currentCase.data || {}, null, 2));
      }
  }, [currentCase]);

  if (!currentCase) return <div className="p-20 text-center text-slate-400">Case file not found.</div>;

  const currentStageIndex = MOCK_STAGES.indexOf(currentCase.status) !== -1 ? MOCK_STAGES.indexOf(currentCase.status) : 0;

  const handlePostNote = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    await addCaseEvent(caseId, note);
    setNote('');
  };

  const handleCloseCase = async () => {
      await updateCase(caseId, { status: 'Closed', resolvedAt: new Date().toISOString() });
      await addCaseEvent(caseId, 'Case officially closed.');
  };

  const handleReopenCase = async () => {
      await updateCase(caseId, { status: 'Open' });
      await addCaseEvent(caseId, 'Case reopened for further action.');
  };

  const handleSaveData = async () => {
      try {
          const parsed = JSON.parse(caseData);
          await updateCase(caseId, { data: parsed });
          await addCaseEvent(caseId, 'Updated case data fields.');
      } catch (e) {
          alert('Invalid JSON format');
      }
  };

  const handleMockUpload = async () => {
      const mockFile = {
          id: `file-${Date.now()}`,
          name: `Document_${Date.now()}.pdf`,
          type: 'internal' as const,
          size: Math.floor(Math.random() * 5000) + 1000,
          uploadDate: new Date().toISOString()
      };
      await updateCase(caseId, { attachments: [...currentCase.attachments, mockFile] });
      await addCaseEvent(caseId, `Uploaded document: ${mockFile.name}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in bg-white rounded-sm border border-slate-300 shadow-sm overflow-hidden relative">
      {/* Header */}
      <header className="h-14 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigateTo('cases')} className="p-1 hover:bg-white border border-transparent hover:border-slate-200 rounded-sm transition-all"><ArrowLeft size={16}/></button>
          <div className="h-6 w-px bg-slate-300 mx-1"></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">{currentCase.title}</h2>
              <NexBadge variant={currentCase.status === 'Closed' ? 'slate' : 'blue'}>{currentCase.status}</NexBadge>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">{currentCase.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => navigateTo('edit-case', currentCase.id)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-sm"><Edit size={16}/></button>
           {currentCase.status !== 'Closed' ? (
                <NexButton variant="danger" icon={Lock} onClick={handleCloseCase}>Close Case</NexButton>
           ) : (
                <NexButton variant="primary" icon={RotateCcw} onClick={handleReopenCase}>Reopen</NexButton>
           )}
           <div className="h-6 w-px bg-slate-300 mx-1"></div>
           <NexButton variant="secondary" icon={Play} onClick={() => navigateTo('case-launch', currentCase.id)} disabled={currentCase.status === 'Closed'}>Action</NexButton>
        </div>
      </header>

      {/* Stage Progress Bar (Milestones) */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
              {MOCK_STAGES.map((stage, i) => {
                  const isCompleted = i <= currentStageIndex;
                  const isCurrent = i === currentStageIndex;
                  return (
                      <div key={stage} className="relative z-10 flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-slate-300'} ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}>
                              {isCompleted ? <CheckCircle size={14}/> : <div className="w-2 h-2 bg-slate-200 rounded-full"></div>}
                          </div>
                          <span className={`text-[10px] font-bold mt-1 uppercase ${isCurrent ? 'text-emerald-700' : isCompleted ? 'text-slate-600' : 'text-slate-300'}`}>{stage}</span>
                      </div>
                  )
              })}
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 flex flex-col hidden xl:flex p-4 bg-slate-50 space-y-6 overflow-y-auto">
           <div>
              <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stakeholders</h4>
                  <button onClick={() => navigateTo('case-stakeholder', currentCase.id)} className="text-blue-600 hover:text-blue-700"><Plus size={12}/></button>
              </div>
              <div className="space-y-2">
                 {currentCase.stakeholders.map((sh, i) => {
                     const u = users.find(user => user.id === sh.userId);
                     return (
                         <div key={i} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-sm group shadow-sm">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600 border border-slate-200 shrink-0">
                                    {u?.name ? u.name[0] : <UserIcon size={12}/>}
                                </div>
                                <div className="overflow-hidden min-w-0">
                                    <p className="text-xs font-bold truncate text-slate-800">{u?.name || 'Unknown User'}</p>
                                    <p className="text-[9px] text-slate-500 truncate">{sh.role}</p>
                                </div>
                             </div>
                             <button onClick={() => removeCaseStakeholder(caseId, sh.userId)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1"><Trash2 size={12}/></button>
                         </div>
                     );
                 })}
              </div>
           </div>
           
           <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center mb-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Policies</h4>
                  <button onClick={() => navigateTo('case-policy', currentCase.id)} className="text-blue-600 hover:text-blue-700"><Plus size={12}/></button>
              </div>
              <div className="space-y-2">
                  {currentCase.policies.map((pol, i) => (
                      <div key={i} className="p-2 bg-amber-50 border border-amber-200 rounded-sm text-[10px] text-amber-900 font-medium flex justify-between items-start gap-2 group">
                          <div className="flex gap-2">
                            <Shield size={12} className="shrink-0 mt-0.5"/>
                            <span className="leading-tight">{pol.description}</span>
                          </div>
                          <button onClick={() => removeCasePolicy(caseId, pol.id)} className="opacity-0 group-hover:opacity-100 text-amber-400 hover:text-amber-800 transition-opacity"><X size={12}/></button>
                      </div>
                  ))}
                  {currentCase.policies.length === 0 && <div className="text-[10px] text-slate-400 italic">No specific policies attached.</div>}
              </div>
           </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-white">
           <div className="flex border-b border-slate-200 bg-white">
              {['timeline', 'tasks', 'data', 'content'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)} 
                  className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'}`}
                >
                  {tab}
                </button>
              ))}
           </div>

           <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {activeTab === 'timeline' && (
                <div className="max-w-2xl mx-auto space-y-6">
                   <div className="bg-white p-4 rounded-sm border border-slate-300 shadow-sm">
                      <div className="flex gap-3 mb-3">
                         <div className="w-8 h-8 rounded-sm bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0 text-xs">{currentUser?.name[0]}</div>
                         <textarea className="flex-1 bg-transparent outline-none text-xs min-h-[60px] resize-none" placeholder="Post a case note or update..." value={note} onChange={e => setNote(e.target.value)} />
                      </div>
                      <div className="flex justify-end">
                         <NexButton variant="primary" onClick={handlePostNote} icon={Send} disabled={!note.trim()}>Post Note</NexButton>
                      </div>
                   </div>
                   <NexHistoryFeed history={currentCase.timeline} />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="flex justify-between items-end pb-2 border-b border-slate-200">
                      <h3 className="text-xs font-bold text-slate-700 uppercase">Related Work Items</h3>
                      <div className="text-[10px] font-bold text-slate-500">
                          {relatedTasks.filter(t => t.status === TaskStatus.COMPLETED).length} / {relatedTasks.length} Completed
                      </div>
                  </div>
                  {relatedTasks.map(task => {
                    const isCompleted = task.status === TaskStatus.COMPLETED;
                    return (
                      <div key={task.id} className={`bg-white p-4 rounded-sm border border-slate-300 shadow-sm flex items-center justify-between group hover:border-blue-400 transition-all ${isCompleted ? 'opacity-70' : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-sm flex items-center justify-center border transition-all ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                            {isCompleted ? <CheckSquare size={16} /> : <Activity size={16}/>}
                          </div>
                          <div>
                            <h4 className={`text-sm font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{task.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <NexBadge variant={task.priority === 'Critical' ? 'rose' : (isCompleted ? 'emerald' : 'blue')}>{task.priority}</NexBadge>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{task.status}</span>
                              <span className="text-[10px] text-slate-400">• Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {task.processInstanceId && task.processInstanceId !== 'adhoc' && (
                             <NexButton variant="ghost" onClick={() => openInstanceViewer(task.processInstanceId)} icon={Layers}>View</NexButton>
                          )}
                          <NexButton variant="primary" onClick={() => navigateTo('inbox', task.id)} icon={ChevronRight} />
                        </div>
                      </div>
                    );
                  })}
                  {relatedTasks.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic text-xs bg-white border border-dashed border-slate-300 rounded-sm">No tasks currently associated with this case.</div>
                  )}
                </div>
              )}

              {activeTab === 'data' && (
                  <div className="max-w-4xl mx-auto h-full flex flex-col">
                      <div className="bg-white border border-slate-300 rounded-sm p-4 shadow-sm flex-1 flex flex-col min-h-[400px]">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Database size={14}/> Structured Case Data</h3>
                              <NexButton size="sm" icon={Save} onClick={handleSaveData}>Update Schema</NexButton>
                          </div>
                          <textarea 
                              className="flex-1 w-full font-mono text-xs p-4 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-blue-400 resize-none"
                              value={caseData}
                              onChange={e => setCaseData(e.target.value)}
                              spellCheck={false}
                          />
                          <p className="text-[10px] text-slate-400 mt-2">Edit JSON structure to update process variables.</p>
                      </div>
                  </div>
              )}

              {activeTab === 'content' && (
                  <div className="max-w-4xl mx-auto space-y-4">
                      <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold text-slate-700 uppercase">Attached Artifacts</h3>
                          <NexButton size="sm" icon={Upload} onClick={handleMockUpload}>Upload File</NexButton>
                      </div>
                      <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
                          {(currentCase.attachments || []).length === 0 ? (
                              <div className="p-12 text-center flex flex-col items-center">
                                  <Paperclip size={32} className="text-slate-300 mb-2"/>
                                  <p className="text-slate-400 text-xs font-bold uppercase">No attachments</p>
                              </div>
                          ) : (
                              (currentCase.attachments || []).map((file, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 group">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-sm flex items-center justify-center border border-blue-100">
                                              <FileText size={20}/>
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-slate-800">{file.name}</p>
                                              <p className="text-[10px] text-slate-500">{(file.size || 0) / 1024} KB • {new Date(file.uploadDate).toLocaleDateString()}</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button className="text-blue-600 hover:underline text-xs font-medium px-2 py-1 bg-white border border-slate-200 rounded-sm hover:bg-blue-50">Download</button>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              )}
           </div>
        </main>
      </div>
    </div>
  );
};
