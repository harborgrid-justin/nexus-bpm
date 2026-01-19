import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Play, FileText, Layers, Plus, Activity, Eye, ChevronRight, Globe, ShieldCheck, Clock, Hash, MoreVertical, Copy, Trash2, Edit, PauseCircle, StopCircle, Search, History, BookOpen } from 'lucide-react';
import { NexCard, NexButton, NexBadge, NexModal } from './shared/NexUI';
import { ProcessDiffViewer } from './governance/ProcessDiffViewer';
import { ProcessDefinition } from '../types';
import { generateProcessDocumentation } from '../services/geminiService';

export const ProcessRepository: React.FC = () => {
  const { processes, instances, startProcess, openInstanceViewer, deployProcess, deleteProcess, toggleProcessState, suspendInstance, terminateInstance, navigateTo } = useBPM();
  const [activeTab, setActiveTab] = useState<'definitions' | 'instances'>('definitions');
  const [filterQuery, setFilterQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  // History Modal State
  const [selectedHistoryProc, setSelectedHistoryProc] = useState<ProcessDefinition | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Docs Modal State
  const [docContent, setDocContent] = useState('');
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [generatingDocs, setGeneratingDocs] = useState(false);

  const handleStart = (id: string, name: string) => {
    startProcess(id, { summary: `Automated initiation via Registry` });
  };

  const handleDuplicate = async (proc: any) => {
      const newProc = { ...proc, id: '', name: `${proc.name} (Copy)`, version: 1, history: [] };
      await deployProcess(newProc);
  };

  const handleViewHistory = (proc: ProcessDefinition) => {
      setSelectedHistoryProc(proc);
      setHistoryModalOpen(true);
  };

  const handleGenerateDocs = async (proc: ProcessDefinition) => {
      setGeneratingDocs(true);
      setDocModalOpen(true);
      setDocContent('<div class="p-8 text-center"><p>Generating documentation...</p></div>');
      try {
          const html = await generateProcessDocumentation(proc);
          setDocContent(html);
      } catch (e) {
          setDocContent('<p>Error generating documentation.</p>');
      } finally {
          setGeneratingDocs(false);
      }
  };

  const filteredProcesses = processes.filter(p => 
      (p.name.toLowerCase().includes(filterQuery.toLowerCase()) || p.description.toLowerCase().includes(filterQuery.toLowerCase())) &&
      (showArchived ? true : p.isActive)
  );

  const filteredInstances = instances.filter(i => 
      i.definitionName.toLowerCase().includes(filterQuery.toLowerCase()) || 
      i.id.includes(filterQuery)
  );

  return (
    <div 
      className="animate-fade-in pb-20 flex flex-col"
      style={{ gap: 'var(--section-gap)' }}
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-300 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Process Registry</h2>
          <p className="text-xs text-slate-500 font-medium">Authoritative source for deployed models and runtimes.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200">
           <button 
             onClick={() => setActiveTab('definitions')}
             className={`px-4 py-1.5 rounded-sm text-xs font-semibold transition-all ${activeTab === 'definitions' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
           >
             Definitions
           </button>
           <button 
             onClick={() => setActiveTab('instances')}
             className={`px-4 py-1.5 rounded-sm text-xs font-semibold transition-all ${activeTab === 'instances' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
           >
             Active Runtimes ({instances.filter(i => i.status === 'Active').length})
           </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex gap-4 items-center">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <input 
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-sm text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none" 
                placeholder={activeTab === 'definitions' ? "Search definitions..." : "Search instances..."}
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
              />
          </div>
          {activeTab === 'definitions' && (
              <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer select-none">
                  <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"/>
                  Show Archived
              </label>
          )}
      </div>

      {activeTab === 'definitions' ? (
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 'var(--layout-gap)' }}
        >
          <button onClick={() => navigateTo('designer')} className="group border border-dashed border-slate-300 rounded-sm p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:bg-blue-50 transition-all min-h-[200px]">
             <Plus size={24} className="mb-2 group-hover:text-blue-600"/>
             <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-700">Deploy New Model</span>
          </button>

          {filteredProcesses.map(process => (
            <div 
              key={process.id} 
              className="bg-white rounded-sm border border-slate-300 shadow-sm flex flex-col hover:border-blue-400 transition-all group relative"
              style={{ padding: 'var(--card-padding)' }}
            >
              <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-sm transition-colors ${process.isActive ? 'bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Layers size={18} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${process.isActive ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{process.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-500">v{process.version}.0</span>
                            {process.isActive ? <NexBadge variant="emerald">Active</NexBadge> : <NexBadge variant="slate">Archived</NexBadge>}
                        </div>
                    </div>
                 </div>
                 
                 {/* Definition Actions Menu */}
                 <div className="relative group/menu">
                    <button className="p-1 hover:bg-slate-100 rounded-sm text-slate-400"><MoreVertical size={16}/></button>
                    <div className="absolute right-0 top-6 w-40 bg-white border border-slate-200 shadow-xl rounded-sm z-20 hidden group-hover/menu:block py-1">
                        <button onClick={() => navigateTo('designer', process.id)} className="w-full text-left px-3 py-2 text-[10px] hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-bold"><Edit size={12} className="text-blue-600"/> Edit Model</button>
                        <button onClick={() => handleGenerateDocs(process)} className="w-full text-left px-3 py-2 text-[10px] hover:bg-slate-50 flex items-center gap-2 text-slate-700"><BookOpen size={12}/> Generate Docs</button>
                        <button onClick={() => handleViewHistory(process)} className="w-full text-left px-3 py-2 text-[10px] hover:bg-slate-50 flex items-center gap-2 text-slate-700"><History size={12}/> Version History</button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => handleDuplicate(process)} className="w-full text-left px-3 py-2 text-[10px] hover:bg-slate-50 flex items-center gap-2 text-slate-700"><Copy size={12}/> Duplicate</button>
                        <button onClick={() => toggleProcessState(process.id)} className="w-full text-left px-3 py-2 text-[10px] hover:bg-slate-50 flex items-center gap-2 text-slate-700"><PauseCircle size={12}/> {process.isActive ? 'Archive' : 'Activate'}</button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => deleteProcess(process.id)} className="w-full text-left px-3 py-2 text-[10px] hover:bg-rose-50 flex items-center gap-2 text-rose-600"><Trash2 size={12}/> Delete</button>
                    </div>
                 </div>
              </div>
              
              <p className="text-xs text-slate-600 leading-relaxed mb-4 flex-1 line-clamp-3">
                {process.description || 'Enterprise grade workflow optimized for high-throughput and strict compliance adherence.'}
              </p>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                  <div className="flex items-center gap-1"><FileText size={12}/> {process.steps.length} Steps</div>
                  <div className="flex items-center gap-1"><Globe size={12}/> Global</div>
                </div>
                
                {process.isActive && (
                    <button 
                    onClick={() => handleStart(process.id, process.name)}
                    className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                    >
                    <Play size={14} fill="currentColor" />
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-sm border border-slate-300 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] font-bold text-slate-500 uppercase">
                  <th className="px-6 py-3 border-r border-slate-200">Instance ID</th>
                  <th className="px-6 py-3 border-r border-slate-200">Definition</th>
                  <th className="px-6 py-3 border-r border-slate-200">Status</th>
                  <th className="px-6 py-3 border-r border-slate-200">Started</th>
                  <th className="px-6 py-3 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInstances.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-xs text-slate-500 italic">No active runtimes matching criteria.</td></tr>
                ) : filteredInstances.map(inst => (
                    <tr key={inst.id} className="hover:bg-slate-50 transition-colors text-xs group">
                      <td className="px-6 py-3 font-mono text-slate-700 font-medium cursor-pointer hover:text-blue-600 underline" onClick={() => openInstanceViewer(inst.id)}>{inst.id}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{inst.definitionName}</td>
                      <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${
                            inst.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            inst.status === 'Suspended' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            inst.status === 'Terminated' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {inst.status}
                          </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                          {new Date(inst.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {inst.status === 'Active' && <button onClick={() => suspendInstance(inst.id)} title="Suspend" className="p-1 hover:bg-amber-100 text-amber-600 rounded"><PauseCircle size={14}/></button>}
                              {inst.status === 'Suspended' && <button onClick={() => suspendInstance(inst.id)} title="Resume" className="p-1 hover:bg-emerald-100 text-emerald-600 rounded"><Play size={14}/></button>}
                              {inst.status !== 'Terminated' && inst.status !== 'Completed' && <button onClick={() => terminateInstance(inst.id)} title="Terminate" className="p-1 hover:bg-rose-100 text-rose-600 rounded"><StopCircle size={14}/></button>}
                              <button onClick={() => openInstanceViewer(inst.id)} title="View" className="p-1 hover:bg-blue-100 text-blue-600 rounded"><Eye size={14}/></button>
                          </div>
                      </td>
                    </tr>
                ))}
              </tbody>
          </table>
        </div>
      )}

      {/* Version History Modal */}
      {selectedHistoryProc && (
          <NexModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title={`History: ${selectedHistoryProc.name}`} size="xl">
              <div className="space-y-4">
                  {(!selectedHistoryProc.history || selectedHistoryProc.history.length === 0) ? (
                      <div className="p-8 text-center text-slate-400 italic">No previous versions available.</div>
                  ) : (
                      selectedHistoryProc.history.sort((a,b) => b.version - a.version).map(snap => (
                          <div key={snap.version} className="border border-slate-200 rounded-sm overflow-hidden mb-4">
                              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                  <div>
                                      <span className="font-bold text-sm text-slate-800">Version {snap.version}.0</span>
                                      <span className="text-xs text-slate-500 ml-2">Deployed by {snap.author} on {new Date(snap.timestamp).toLocaleDateString()}</span>
                                  </div>
                                  <button className="text-xs font-bold text-blue-600 hover:underline">Revert to V{snap.version}</button>
                              </div>
                              <div className="h-64 relative">
                                  <ProcessDiffViewer oldVer={snap.definition as ProcessDefinition} newVer={selectedHistoryProc} />
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </NexModal>
      )}

      {/* Documentation Modal */}
      <NexModal isOpen={docModalOpen} onClose={() => setDocModalOpen(false)} title="Process Documentation" size="xl">
          <div className="prose prose-sm max-w-none p-4" dangerouslySetInnerHTML={{ __html: docContent }} />
      </NexModal>
    </div>
  );
};