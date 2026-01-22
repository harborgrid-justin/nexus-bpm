
import React, { useState, useMemo, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  ArrowLeft, Users, Send, Settings, Activity, 
  CheckSquare, ChevronRight, Briefcase, ShieldCheck, Play, X, Layers, Plus, Shield, Edit, Trash2, RotateCcw, Lock, Database, Paperclip, FileText, Upload, Save, User as UserIcon, CheckCircle, Eye, GripVertical
} from 'lucide-react';
import { NexBadge, NexButton, NexHistoryFeed, NexCard, NexModal, NexFormGroup, NexStatusBadge, NexEmptyState } from './shared/NexUI';
import { TaskStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Standard Case Stages (In production this would come from a configuration service)
const STANDARD_STAGES = ['Open', 'In Progress', 'Pending Review', 'Resolved', 'Closed'];

export const CaseViewer: React.FC<{ caseId: string }> = ({ caseId }) => {
  const { cases, tasks, users, navigateTo, addCaseEvent, removeCaseEvent, addCasePolicy, removeCasePolicy, addCaseStakeholder, removeCaseStakeholder, updateCase, currentUser, openInstanceViewer, getActiveUsersOnRecord, setToolbarConfig, processes, startProcess } = useBPM();
  const { gridConfig } = useTheme();
  
  const [note, setNote] = useState('');
  const [caseData, setCaseData] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<{name: string, url?: string} | null>(null);
  const [isEditable, setIsEditable] = useState(false);

  const currentCase = cases.find(c => c.id === caseId);
  const relatedTasks = useMemo(() => tasks.filter(t => t.caseId === caseId), [tasks, caseId]);
  const activeViewers = getActiveUsersOnRecord(caseId);

  // Layouts
  const defaultLayouts = {
      lg: [
          { i: 'header', x: 0, y: 0, w: 12, h: 3 },
          { i: 'progress', x: 0, y: 3, w: 8, h: 3 },
          { i: 'actions', x: 8, y: 3, w: 4, h: 3 },
          { i: 'timeline', x: 0, y: 6, w: 6, h: 14 },
          { i: 'tasks', x: 6, y: 6, w: 6, h: 8 },
          { i: 'data', x: 6, y: 14, w: 6, h: 6 },
          { i: 'stakeholders', x: 0, y: 20, w: 4, h: 8 },
          { i: 'content', x: 4, y: 20, w: 8, h: 8 },
          { i: 'dynamic', x: 0, y: 28, w: 12, h: 6 }
      ],
      md: [
          { i: 'header', x: 0, y: 0, w: 10, h: 3 },
          { i: 'progress', x: 0, y: 3, w: 6, h: 3 },
          { i: 'actions', x: 6, y: 3, w: 4, h: 3 },
          { i: 'timeline', x: 0, y: 6, w: 10, h: 10 },
          { i: 'tasks', x: 0, y: 16, w: 10, h: 8 },
          { i: 'data', x: 0, y: 24, w: 10, h: 6 },
          { i: 'stakeholders', x: 0, y: 30, w: 5, h: 8 },
          { i: 'content', x: 5, y: 30, w: 5, h: 8 },
          { i: 'dynamic', x: 0, y: 38, w: 10, h: 6 }
      ]
  };
  const [layouts, setLayouts] = useState(defaultLayouts);

  useEffect(() => {
      setToolbarConfig({
          view: [
              { label: isEditable ? 'Lock Layout' : 'Customize Dashboard', action: () => setIsEditable(!isEditable), icon: Settings },
              { label: 'Reset Layout', action: () => setLayouts(defaultLayouts) }
          ]
      });
  }, [setToolbarConfig, isEditable]);

  useEffect(() => {
      if (currentCase) {
          setCaseData(JSON.stringify(currentCase.data || {}, null, 2));
      }
  }, [currentCase]);

  if (!currentCase) return <div className="p-20 text-center text-tertiary">Case file not found.</div>;

  const currentStageIndex = STANDARD_STAGES.indexOf(currentCase.status) !== -1 ? STANDARD_STAGES.indexOf(currentCase.status) : 0;

  const handlePostNote = async () => {
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

  const triggerDynamicAction = async (procId: string, procName: string) => {
      await startProcess(procId, { caseContext: currentCase.title }, caseId);
      await addCaseEvent(caseId, `Launched dynamic activity: ${procName}`);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={gridConfig.rowHeight}
            margin={gridConfig.margin}
            isDraggable={isEditable}
            isResizable={isEditable}
            draggableHandle=".drag-handle"
            onLayoutChange={(curr, all) => setLayouts(all)}
        >
            <NexCard key="header" dragHandle={isEditable} className="flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigateTo('cases')} className="p-2 hover:bg-subtle rounded-full text-secondary transition-colors"><ArrowLeft size={20}/></button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-primary">{currentCase.title}</h2>
                            <NexStatusBadge status={currentCase.status}/>
                        </div>
                        <p className="text-xs text-secondary font-mono mt-0.5">{currentCase.id} • Created {new Date(currentCase.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                {activeViewers.length > 0 && (
                   <div className="flex items-center -space-x-2">
                       {activeViewers.map(u => (
                           <div key={u.id} className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shadow-sm" title={u.name}>{u.name[0]}</div>
                       ))}
                   </div>
               )}
            </NexCard>

            <NexCard key="progress" dragHandle={isEditable} className="flex items-center justify-center p-4">
                <div className="w-full flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-subtle rounded-full z-0"></div>
                    {STANDARD_STAGES.map((stage, i) => {
                        const isCompleted = i <= currentStageIndex;
                        const isCurrent = i === currentStageIndex;
                        return (
                            <div key={stage} className="relative z-10 flex flex-col items-center">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500' : 'bg-panel border-default'}`}>
                                    {isCompleted && <CheckCircle size={10} className="text-white"/>}
                                </div>
                                <span className={`text-[9px] font-bold mt-1 uppercase ${isCurrent ? 'text-emerald-700' : 'text-tertiary'}`}>{stage}</span>
                            </div>
                        )
                    })}
                </div>
            </NexCard>

            <NexCard key="actions" dragHandle={isEditable} className="flex items-center justify-end gap-2 p-4">
                <button onClick={() => !isEditable && navigateTo('edit-case', currentCase.id)} className="p-2 text-secondary hover:text-blue-600 hover:bg-subtle rounded"><Edit size={16}/></button>
                {currentCase.status !== 'Closed' ? (
                    <NexButton variant="danger" icon={Lock} onClick={handleCloseCase}>Close</NexButton>
                ) : (
                    <NexButton variant="primary" icon={RotateCcw} onClick={handleReopenCase}>Reopen</NexButton>
                )}
                <NexButton variant="secondary" icon={Play} onClick={() => !isEditable && navigateTo('case-launch', currentCase.id)} disabled={currentCase.status === 'Closed'}>Action</NexButton>
            </NexCard>

            <NexCard key="timeline" dragHandle={isEditable} title="Case Timeline" className="flex flex-col h-full">
                <div className="p-4 border-b border-default">
                    <div className="flex gap-2">
                        <textarea className="flex-1 bg-subtle border border-default rounded-sm p-2 text-xs outline-none focus:border-blue-400 resize-none h-16 text-primary" placeholder="Add a case note..." value={note} onChange={e => setNote(e.target.value)} />
                        <NexButton variant="primary" onClick={handlePostNote} disabled={!note.trim()} className="self-end"><Send size={14}/></NexButton>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <NexHistoryFeed history={currentCase.timeline} />
                </div>
            </NexCard>

            <NexCard key="tasks" dragHandle={isEditable} title="Related Tasks" className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {relatedTasks.length === 0 ? (
                        <NexEmptyState icon={CheckSquare} title="No tasks" description="No active tasks linked."/>
                    ) : (
                        relatedTasks.map(task => (
                            <div key={task.id} className="bg-subtle border border-default rounded-sm p-3 flex justify-between items-center group hover:shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center border ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-panel text-secondary border-default'}`}>
                                        {task.status === 'Completed' ? <CheckCircle size={14}/> : <Activity size={14}/>}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-xs text-primary truncate">{task.title}</div>
                                        <div className="text-[10px] text-secondary">{task.status} • {task.priority}</div>
                                    </div>
                                </div>
                                <button onClick={() => !isEditable && navigateTo('inbox', task.id)} className="p-1 text-tertiary hover:text-blue-600"><ChevronRight size={16}/></button>
                            </div>
                        ))
                    )}
                </div>
            </NexCard>

            <NexCard key="data" dragHandle={isEditable} title="Case Data (JSON)" className="flex flex-col h-full" actions={<button onClick={handleSaveData} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Save size={14}/></button>}>
                <textarea 
                    className="flex-1 w-full font-mono text-[10px] p-2 bg-subtle border-none outline-none resize-none text-primary"
                    value={caseData}
                    onChange={e => setCaseData(e.target.value)}
                    spellCheck={false}
                />
            </NexCard>

            <NexCard key="stakeholders" dragHandle={isEditable} title="Stakeholders" className="flex flex-col h-full" actions={<button onClick={() => !isEditable && navigateTo('case-stakeholder', currentCase.id)}><Plus size={14}/></button>}>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {currentCase.stakeholders.map((sh, i) => {
                        const u = users.find(user => user.id === sh.userId);
                        return (
                            <div key={i} className="flex items-center gap-2 p-2 border border-default rounded-sm">
                                <div className="w-6 h-6 bg-subtle rounded-full flex items-center justify-center text-[10px] font-bold border border-default">{u?.name?.[0]}</div>
                                <div className="overflow-hidden">
                                    <div className="text-xs font-bold text-primary truncate">{u?.name || 'Unknown'}</div>
                                    <div className="text-[9px] text-secondary">{sh.role}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </NexCard>

            <NexCard key="content" dragHandle={isEditable} title="Artifacts" className="flex flex-col h-full" actions={<button onClick={handleMockUpload}><Upload size={14}/></button>}>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {currentCase.attachments.length === 0 ? (
                        <NexEmptyState icon={FileText} title="Empty" description="No artifacts attached."/>
                    ) : (
                        currentCase.attachments.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-2 border border-default rounded-sm hover:bg-subtle">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText size={14} className="text-blue-500 shrink-0"/>
                                    <span className="text-xs text-primary truncate">{file.name}</span>
                                </div>
                                <button onClick={() => setPreviewFile({name: file.name})} className="text-tertiary hover:text-blue-600"><Eye size={12}/></button>
                            </div>
                        ))
                    )}
                </div>
            </NexCard>

            <NexCard key="dynamic" dragHandle={isEditable} title="Available Dynamic Actions" className="flex flex-col h-full">
                <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto">
                    {processes.slice(0, 4).map(proc => (
                        <button 
                            key={proc.id} 
                            onClick={() => triggerDynamicAction(proc.id, proc.name)}
                            className="flex flex-col items-center justify-center p-3 border border-dashed border-default rounded-sm hover:border-blue-400 hover:bg-subtle transition-colors group text-center"
                        >
                            <Play size={20} className="text-secondary group-hover:text-blue-600 mb-2"/>
                            <span className="text-xs font-bold text-primary group-hover:text-blue-800">{proc.name}</span>
                        </button>
                    ))}
                </div>
            </NexCard>
        </ResponsiveGridLayout>
      </div>

      {previewFile && (
          <NexModal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} title={previewFile.name} size="xl">
              <div className="h-[600px] bg-subtle flex items-center justify-center border border-default rounded-sm">
                  <div className="text-center">
                      <FileText size={64} className="mx-auto text-tertiary mb-4"/>
                      <p className="text-secondary font-bold mb-2">Preview Unavailable</p>
                      <p className="text-xs text-tertiary">Mock artifact rendering.</p>
                  </div>
              </div>
          </NexModal>
      )}
    </div>
  );
};
