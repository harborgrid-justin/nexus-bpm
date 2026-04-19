
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { Play, FileText, Layers, Plus, Edit, MoreVertical, Copy, Trash2, PauseCircle, StopCircle, Search, History, BookOpen, Globe, Upload, BarChart3, AlertCircle, Settings, GripVertical, CheckCircle, Database, Activity, Download } from 'lucide-react';
import { NexBadge, NexModal, NexButton, NexCard, NexStatusBadge, NexEmptyState, KPICard } from './shared/NexUI';
import { ProcessDiffViewer } from './governance/ProcessDiffViewer';
import { ProcessDefinition } from '../types';
import { generateProcessDocumentation } from '../services/geminiService';
import { ProcessHeatmap } from './process/ProcessHeatmap';
import { PageGridLayout } from './shared/PageGridLayout';

export const ProcessRepository: React.FC = () => {
  const { processes, instances, startProcess, openInstanceViewer, deployProcess, deleteProcess, toggleProcessState, suspendInstance, terminateInstance, navigateTo, addNotification, setToolbarConfig } = useBPM();
  const { gridConfig, layoutBreakpoints, layoutCols } = useTheme();
  
  const [filterQuery, setFilterQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals
  const [selectedHistoryProc, setSelectedHistoryProc] = useState<ProcessDefinition | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [docContent, setDocContent] = useState('');
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [heatmapProc, setHeatmapProc] = useState<ProcessDefinition | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<'traffic' | 'errors'>('traffic');

  // Layouts
  const defaultLayouts = useMemo(() => ({
      lg: [
          { i: 'stats-defs', x: 0, y: 0, w: 4, h: 3 },
          { i: 'stats-active', x: 4, y: 0, w: 4, h: 3 },
          { i: 'stats-errors', x: 8, y: 0, w: 4, h: 3 },
          { i: 'defs-list', x: 0, y: 3, w: 12, h: 10 },
          { i: 'inst-list', x: 0, y: 13, w: 12, h: 10 }
      ],
      md: [
          { i: 'stats-defs', x: 0, y: 0, w: 3, h: 3 },
          { i: 'stats-active', x: 3, y: 0, w: 3, h: 3 },
          { i: 'stats-errors', x: 6, y: 0, w: 4, h: 3 },
          { i: 'defs-list', x: 0, y: 3, w: 10, h: 8 },
          { i: 'inst-list', x: 0, y: 11, w: 10, h: 8 }
      ]
  }), []);

  // Handlers
  const handleStart = (id: string) => { startProcess(id, { summary: `Automated initiation via Registry` }); };
  const handleDuplicate = async (proc: ProcessDefinition) => { const newProc = { ...proc, id: undefined, name: `${proc.name} (Copy)`, version: 1, history: [] }; await deployProcess(newProc); };
  const handleExportProcess = (proc: ProcessDefinition) => {
      const data = JSON.stringify(proc, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `process_${proc.name.replace(/\s+/g, '_').toLowerCase()}.json`; a.click();
      addNotification('info', 'Process model exported.');
  };
  const handleViewHistory = (proc: ProcessDefinition) => { setSelectedHistoryProc(proc); setHistoryModalOpen(true); };
  const handleGenerateDocs = async (proc: ProcessDefinition) => { 
      setDocModalOpen(true); 
      setDocContent('<p>Generating...</p>'); 
      try { 
          const html = await generateProcessDocumentation(proc); 
          setDocContent(html); 
      } catch(e: any) { 
          const msg = e?.message || '';
          if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
              setDocContent('<div class="p-6 text-center text-rose-600"><p class="font-bold mb-2">Quota Exceeded</p><p class="text-sm">Cannot generate documentation because the AI quota rate limits have been reached. Please try again later.</p></div>');
          } else {
              setDocContent('<p class="text-rose-600">Error generating documentation.</p>'); 
          }
      } 
  };
  
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
              const content = JSON.parse(evt.target?.result as string);
              if (!content.name) throw new Error();
              await deployProcess({ ...content, id: undefined, version: 1, history: [], createdAt: new Date().toISOString() });
              addNotification('success', 'Imported successfully');
          } catch(err) { addNotification('error', 'Invalid JSON'); }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  // Metrics
  const activeInstances = instances.filter(i => i.status === 'Active');
  const errorInstances = instances.filter(i => i.history.some(h => h.action.toLowerCase().includes('error')));

  const filteredProcesses = processes.filter(p => p.name.toLowerCase().includes(filterQuery.toLowerCase()));
  const filteredInstances = instances.filter(i => i.definitionName.toLowerCase().includes(filterQuery.toLowerCase()));

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between border-b border-default pb-04 shrink-0 mb-layout">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight">Process Registry</h2>
          <p className="text-xs text-secondary font-medium">Authoritative source for deployed models and runtimes.</p>
        </div>
        <div className="flex gap-02">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportFile} />
            <NexButton variant="secondary" onClick={() => fileInputRef.current?.click()} icon={Upload}>Import</NexButton>
            <NexButton variant="primary" icon={Plus} onClick={() => navigateTo('designer')}>New Model</NexButton>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <PageGridLayout defaultLayouts={defaultLayouts}>
            {({ isEditable }) => [
                <KPICard 
                    key="stats-defs" 
                    isEditable={isEditable} 
                    title="Total Definitions" 
                    value={processes.length} 
                    icon={Database} 
                    color="blue" 
                />,
                <KPICard 
                    key="stats-active" 
                    isEditable={isEditable} 
                    title="Active Runtimes" 
                    value={activeInstances.length} 
                    icon={Play} 
                    color="emerald" 
                />,
                <KPICard 
                    key="stats-errors" 
                    isEditable={isEditable} 
                    title="Failures (24h)" 
                    value={errorInstances.length} 
                    icon={AlertCircle} 
                    color="rose" 
                />,
                <NexCard key="defs-list" dragHandle={isEditable} title="Deployed Definitions" className="p-0 overflow-hidden flex flex-col"
                    actions={<div className="relative w-48"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"/><input className="w-full pl-8 pr-2 py-1 bg-subtle border border-default rounded-sm text-[11px] outline-none text-primary" placeholder="Filter..." value={filterQuery} onChange={e => setFilterQuery(e.target.value)}/></div>}
                >
                    <div className="flex-1 overflow-y-auto p-04 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-04 bg-panel">
                        {filteredProcesses.length === 0 ? (
                            <div className="col-span-full py-12">
                                <NexEmptyState icon={Database} title="No definitions found" description="Try refining your search or import a new model." />
                            </div>
                        ) : (
                            filteredProcesses.map(p => (
                                <div key={p.id} className="bg-panel border border-default rounded-sm p-04 hover:shadow-md transition-shadow relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-primary tracking-tight">{p.name}</h4>
                                        <button onClick={() => !isEditable && navigateTo('designer', p.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-subtle rounded-sm text-tertiary"><Edit size={12}/></button>
                                    </div>
                                    <div className="flex gap-2 mb-3">
                                        <span className="text-[9px] font-mono bg-subtle px-1 rounded border border-default">v{p.version}</span>
                                        <NexBadge variant={p.isActive ? 'emerald' : 'slate'}>{p.isActive ? 'Active' : 'Archived'}</NexBadge>
                                    </div>
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-default">
                                        <div className="flex gap-3">
                                            <button onClick={() => !isEditable && setHeatmapProc(p)} className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 uppercase tracking-wider"><BarChart3 size={12}/> Analysis</button>
                                            <button onClick={() => !isEditable && handleExportProcess(p)} className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 uppercase tracking-wider"><Download size={12}/> Export</button>
                                        </div>
                                        <button onClick={() => !isEditable && handleStart(p.id)} className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 shadow-md transition-all active:scale-95"><Play size={10} fill="currentColor"/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </NexCard>,
                <NexCard key="inst-list" dragHandle={isEditable} title="Active Deployment Instances" className="p-0 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-subtle border-b border-default sticky top-0 z-10">
                                <tr className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                                    <th className="px-layout py-3">Reference ID</th>
                                    <th className="px-layout py-3">Namespace</th>
                                    <th className="px-layout py-3">Status</th>
                                    <th className="px-layout py-3 text-right">Observation Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {filteredInstances.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-20">
                                            <NexEmptyState icon={Activity} title="No active instances" description="Trigger a process to see live execution data." />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInstances.slice(0, 20).map(inst => (
                                        <tr key={inst.id} onClick={() => !isEditable && openInstanceViewer(inst.id)} className="hover:bg-subtle cursor-pointer text-xs group transition-colors">
                                            <td className="px-layout py-3 font-mono text-blue-600 font-medium">#{inst.id.split('-').pop()}</td>
                                            <td className="px-layout py-3 font-bold text-primary">{inst.definitionName}</td>
                                            <td className="px-layout py-3"><NexStatusBadge status={inst.status}/></td>
                                            <td className="px-layout py-3 text-right text-tertiary">{new Date(inst.startDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </NexCard>
            ]}
        </PageGridLayout>
      </div>

      {/* Modals */}
      {selectedHistoryProc && (
          <NexModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title={`History: ${selectedHistoryProc.name}`} size="xl">
              <div className="h-96 relative"><ProcessDiffViewer oldVer={selectedHistoryProc} newVer={selectedHistoryProc} /></div>
          </NexModal>
      )}
      <NexModal isOpen={docModalOpen} onClose={() => setDocModalOpen(false)} title="Documentation" size="xl">
          <div className="prose prose-sm max-w-none p-4" dangerouslySetInnerHTML={{ __html: docContent }} />
      </NexModal>
      <NexModal isOpen={!!heatmapProc} onClose={() => setHeatmapProc(null)} title={`Heatmap: ${heatmapProc?.name}`} size="xl">
          <div className="h-[600px] flex flex-col">
              <div className="flex gap-4 mb-4 border-b border-slate-100 pb-2">
                  <button onClick={() => setHeatmapMode('traffic')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${heatmapMode === 'traffic' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}><Layers size={14}/> Volume</button>
                  <button onClick={() => setHeatmapMode('errors')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${heatmapMode === 'errors' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}><AlertCircle size={14}/> Errors</button>
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-sm relative overflow-hidden">
                  {heatmapProc && <ProcessHeatmap process={heatmapProc} mode={heatmapMode} />}
              </div>
          </div>
      </NexModal>
    </div>
  );
};
