
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  ArrowLeft, Users, Send, Settings, Activity, 
  CheckSquare, ChevronRight, Briefcase, ShieldCheck, Play, X, Layers, Plus, Shield, Edit, Trash2, RotateCcw, Lock, Database, Paperclip, FileText, Upload, Save
} from 'lucide-react';
import { NexBadge, NexButton, NexHistoryFeed, NexCard, NexModal, NexFormGroup } from './shared/NexUI';

export const CaseViewer: React.FC<{ caseId: string }> = ({ caseId }) => {
  const { cases, tasks, processes, users, navigateTo, addCaseEvent, removeCaseEvent, addCasePolicy, removeCasePolicy, addCaseStakeholder, removeCaseStakeholder, updateCase, startProcess, currentUser, openInstanceViewer } = useBPM();
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'data' | 'content'>('timeline');
  const [note, setNote] = useState('');
  
  // Modals
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showStakeholderModal, setShowStakeholderModal] = useState(false);
  const [showEditCase, setShowEditCase] = useState(false);

  // Forms
  const [newPolicy, setNewPolicy] = useState('');
  const [newStakeholderId, setNewStakeholderId] = useState('');
  const [newStakeholderRole, setNewStakeholderRole] = useState('Consultant');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Data Tab State
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

  const handlePostNote = async (e: React.SyntheticEvent) => {
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

  const handleAddPolicy = async () => {
      if (newPolicy) {
          await addCasePolicy(caseId, newPolicy);
          setShowPolicyModal(false);
          setNewPolicy('');
      }
  };

  const handleAddStakeholder = async () => {
      if (newStakeholderId) {
          await addCaseStakeholder(caseId, newStakeholderId, newStakeholderRole);
          setShowStakeholderModal(false);
          setNewStakeholderId('');
      }
  };

  const openEdit = () => {
      setEditTitle(currentCase.title);
      setEditDesc(currentCase.description);
      setShowEditCase(true);
  };

  const handleUpdateCase = async () => {
      await updateCase(caseId, { title: editTitle, description: editDesc });
      setShowEditCase(false);
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in bg-white rounded-sm border border-slate-300 shadow-sm overflow-hidden relative">
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
           <button onClick={openEdit} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-sm"><Edit size={16}/></button>
           {currentCase.status !== 'Closed' ? (
                <NexButton variant="danger" icon={Lock} onClick={handleCloseCase}>Close Case</NexButton>
           ) : (
                <NexButton variant="primary" icon={RotateCcw} onClick={handleReopenCase}>Reopen</NexButton>
           )}
           <div className="h-6 w-px bg-slate-300 mx-1"></div>
           <NexButton variant="secondary" icon={Play} onClick={() => setShowLaunchModal(true)} disabled={currentCase.status === 'Closed'}>Action</NexButton>
        </div>
      </header>

      {/* --- Modals --- */}
      <NexModal isOpen={showEditCase} onClose={() => setShowEditCase(false)} title="Edit Case Details">
          <div className="space-y-4">
              <NexFormGroup label="Case Title">
                  <input className="prop-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </NexFormGroup>
              <NexFormGroup label="Description">
                  <textarea className="prop-input h-32 resize-none" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              </NexFormGroup>
              <div className="flex justify-end">
                  <NexButton variant="primary" onClick={handleUpdateCase} icon={Edit}>Save Changes</NexButton>
              </div>
          </div>
      </NexModal>

      <NexModal isOpen={showPolicyModal} onClose={() => setShowPolicyModal(false)} title="Attach Policy">
          <div className="space-y-4">
              <NexFormGroup label="Policy Statement">
                  <textarea className="prop-input h-32 resize-none" value={newPolicy} onChange={e => setNewPolicy(e.target.value)} placeholder="e.g. All refunds > $500 must have VP approval..." />
              </NexFormGroup>
              <div className="flex justify-end">
                  <NexButton variant="primary" onClick={handleAddPolicy} icon={ShieldCheck}>Enforce Policy</NexButton>
              </div>
          </div>
      </NexModal>

      <NexModal isOpen={showStakeholderModal} onClose={() => setShowStakeholderModal(false)} title="Add Stakeholder">
          <div className="space-y-4">
              <NexFormGroup label="Principal">
                  <select className="prop-input" value={newStakeholderId} onChange={e => setNewStakeholderId(e.target.value)}>
                      <option value="">Select User...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
              </NexFormGroup>
              <NexFormGroup label="Case Role">
                  <select className="prop-input" value={newStakeholderRole} onChange={e => setNewStakeholderRole(e.target.value)}>
                      <option>Consultant</option><option>Approver</option><option>Auditor</option><option>Observer</option>
                  </select>
              </NexFormGroup>
              <div className="flex justify-end">
                  <NexButton variant="primary" onClick={handleAddStakeholder} icon={Users}>Add to Case</NexButton>
              </div>
          </div>
      </NexModal>

      {showLaunchModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-sm border border-slate-300 p-6 shadow-xl animate-slide-up space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900">Select Blueprint</h3>
                 <button onClick={() => setShowLaunchModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={18}/></button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto border-t border-b border-slate-100 py-2">
                 {processes.map(proc => (
                   <button 
                     key={proc.id} 
                     onClick={() => handleLaunchWorkflow(proc.id)}
                     className="w-full p-3 border border-slate-200 rounded-sm flex items-center justify-between hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                   >
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all"><Layers size={16}/></div>
                        <span className="font-bold text-xs text-slate-800">{proc.name}</span>
                     </div>
                     <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600" />
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-slate-200 flex flex-col hidden xl:flex p-4 bg-slate-50 space-y-6 overflow-y-auto">
           <div>
              <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stakeholders</h4>
                  <button onClick={() => setShowStakeholderModal(true)} className="text-blue-600 hover:text-blue-700"><Plus size={12}/></button>
              </div>
              <div className="space-y-2">
                 {currentCase.stakeholders.map((sh, i) => {
                     const u = users.find(user => user.id === sh.userId);
                     return (
                         <div key={i} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-sm group">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-6 h-6 rounded-sm bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">{u?.name[0] || 'U'}</div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold truncate">{u?.name || 'Unknown'}</p>
                                    <p className="text-[9px] text-slate-500">{sh.role}</p>
                                </div>
                             </div>
                             <button onClick={() => removeCaseStakeholder(caseId, sh.userId)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity"><Trash2 size={12}/></button>
                         </div>
                     );
                 })}
              </div>
           </div>
           
           <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center mb-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Policies</h4>
                  <button onClick={() => setShowPolicyModal(true)} className="text-blue-600 hover:text-blue-700"><Plus size={12}/></button>
              </div>
              <div className="space-y-2">
                  {currentCase.policies.map((pol, i) => (
                      <div key={i} className="p-2 bg-amber-50 border border-amber-200 rounded-sm text-[10px] text-amber-900 font-medium flex justify-between items-start gap-2 group">
                          <div className="flex gap-2">
                            <Shield size={12} className="shrink-0 mt-0.5"/>
                            {pol.description}
                          </div>
                          <button onClick={() => removeCasePolicy(caseId, pol.id)} className="opacity-0 group-hover:opacity-100 text-amber-400 hover:text-amber-800 transition-opacity"><X size={12}/></button>
                      </div>
                  ))}
                  {currentCase.policies.length === 0 && <div className="text-[10px] text-slate-400 italic">No specific policies attached.</div>}
              </div>
           </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white">
           <div className="flex border-b border-slate-200 bg-white">
              {['timeline', 'tasks', 'data', 'content'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)} 
                  className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
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
                         <textarea className="flex-1 bg-transparent outline-none text-xs min-h-[60px] resize-none" placeholder="Post a case note..." value={note} onChange={e => setNote(e.target.value)} />
                      </div>
                      <div className="flex justify-end">
                         <NexButton variant="primary" onClick={handlePostNote} icon={Send}>Post</NexButton>
                      </div>
                   </div>
                   <NexHistoryFeed history={currentCase.timeline} />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="max-w-3xl mx-auto space-y-3">
                  {relatedTasks.map(task => {
                    return (
                      <div key={task.id} className="bg-white p-4 rounded-sm border border-slate-300 shadow-sm flex items-center justify-between group hover:border-blue-400 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all border border-slate-200">
                            <CheckSquare size={16} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
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
                    <div className="p-12 text-center text-slate-400 italic text-xs">No tasks associated with this case.</div>
                  )}
                </div>
              )}

              {activeTab === 'data' && (
                  <div className="max-w-4xl mx-auto h-full flex flex-col">
                      <div className="bg-white border border-slate-300 rounded-sm p-4 shadow-sm flex-1 flex flex-col">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Database size={14}/> Structured Case Data</h3>
                              <NexButton size="sm" icon={Save} onClick={handleSaveData}>Update Schema</NexButton>
                          </div>
                          <textarea 
                              className="flex-1 w-full font-mono text-xs p-4 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:border-blue-400 resize-none"
                              value={caseData}
                              onChange={e => setCaseData(e.target.value)}
                          />
                      </div>
                  </div>
              )}

              {activeTab === 'content' && (
                  <div className="max-w-4xl mx-auto space-y-4">
                      <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold text-slate-700 uppercase">Attached Artifacts</h3>
                          <NexButton size="sm" icon={Upload}>Upload File</NexButton>
                      </div>
                      <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
                          {(currentCase.attachments || []).length === 0 ? (
                              <div className="p-12 text-center flex flex-col items-center">
                                  <Paperclip size={32} className="text-slate-300 mb-2"/>
                                  <p className="text-slate-400 text-xs font-bold uppercase">No attachments</p>
                              </div>
                          ) : (
                              (currentCase.attachments || []).map((file, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-sm flex items-center justify-center">
                                              <FileText size={20}/>
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-slate-800">{file.name}</p>
                                              <p className="text-[10px] text-slate-500">{(file.size || 0) / 1024} KB • {new Date(file.uploadDate).toLocaleDateString()}</p>
                                          </div>
                                      </div>
                                      <button className="text-blue-600 hover:underline text-xs font-medium">Download</button>
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
