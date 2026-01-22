
import React, { useState, useRef, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { Play, FileText, Layers, Plus, Edit, MoreVertical, Copy, Trash2, PauseCircle, StopCircle, Search, History, BookOpen, Globe, Upload, BarChart3, AlertCircle, Settings, GripVertical, CheckCircle } from 'lucide-react';
import { NexBadge, NexModal, NexButton, NexCard, NexStatusBadge, NexEmptyState } from './shared/NexUI';
import { ProcessDiffViewer } from './governance/ProcessDiffViewer';
import { ProcessDefinition } from '../types';
import { generateProcessDocumentation } from '../services/geminiService';
import { ProcessHeatmap } from './process/ProcessHeatmap';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const ProcessRepository: React.FC = () => {
  const { processes, instances, startProcess, openInstanceViewer, deployProcess, deleteProcess, toggleProcessState, suspendInstance, terminateInstance, navigateTo, addNotification, setToolbarConfig } = useBPM();
  const { gridConfig, layoutBreakpoints, layoutCols } = useTheme();
  
  const [filterQuery, setFilterQuery] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals
  const [selectedHistoryProc, setSelectedHistoryProc] = useState<ProcessDefinition | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [docContent, setDocContent] = useState('');
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [heatmapProc, setHeatmapProc] = useState<ProcessDefinition | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<'traffic' | 'errors'>('traffic');

  // Layouts
  const defaultLayouts = {
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
  };
  const [layouts, setLayouts] = useState(defaultLayouts);

  useEffect(() => {
      setToolbarConfig({
          view: [
              { label: isEditable ? 'Lock Layout' : 'Edit Layout', action: () => setIsEditable(!isEditable), icon: Settings },
              { label: 'Reset Layout', action: () => setLayouts(defaultLayouts) }
          ]
      });
  }, [setToolbarConfig, isEditable]);

  // Handlers
  const handleStart = (id: string) => { startProcess(id, { summary: `Automated initiation via Registry` }); };
  const handleDuplicate = async (proc: ProcessDefinition) => { const newProc = { ...proc, id: undefined, name: `${proc.name} (Copy)`, version: 1, history: [] }; await deployProcess(newProc); };
  const handleViewHistory = (proc: ProcessDefinition) => { setSelectedHistoryProc(proc); setHistoryModalOpen(true); };
  const handleGenerateDocs = async (proc: ProcessDefinition) => { setDocModalOpen(true); setDocContent('<p>Generating...</p>'); try { const html = await generateProcessDocumentation(proc); setDocContent(html); } catch(e) { setDocContent('Error'); } };
  
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
      <header className="flex items-center justify-between border-b border-slate-300 pb-4 shrink-0 mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Process Registry</h2>
          <p className="text-xs text-slate-500 font-medium">Authoritative source for deployed models and runtimes.</p>
        </div>
        <div className="flex gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportFile} />
            <NexButton variant="secondary" onClick={() => fileInputRef.current?.click()} icon={Upload}>Import</NexButton>
            <NexButton variant="primary" icon={Plus} onClick={() => navigateTo('designer')}>New Model</NexButton>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={layoutBreakpoints}
            cols={layoutCols}
            rowHeight={gridConfig.rowHeight}
            margin={gridConfig.margin}
            isDraggable={isEditable}
            isResizable={isEditable}
            draggableHandle=".drag-handle"
            onLayoutChange={(curr, all) => setLayouts(all)}
        >
            <div key="stats-defs" className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm">
                <div>
                    <div className="text-2xl font-bold text-slate-900">{processes.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Total Definitions</div>
                </div>
                {isEditable && <GripVertical size={14} className="drag-handle text-slate-300"/>}
                <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><Layers size={20}/></div>
            </div>
            <div key="stats-active" className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm">
                <div>
                    <div className="text-2xl font-bold text-emerald-600">{activeInstances.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Active Runtimes</div>
                </div>
                {isEditable && <GripVertical size={14} className="drag-handle text-slate-300"/>}
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full"><Play size={20}/></div>
            </div>
            <div key="stats-errors" className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm">
                <div>
                    <div className="text-2xl font-bold text-rose-600">{errorInstances.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Failures (24h)</div>
                </div>
                {isEditable && <GripVertical size={14} className="drag-handle text-slate-300"/>}
                <div className="p-2 bg-rose-50 text-rose-600 rounded-full"><AlertCircle size={20}/></div>
            </div>

            <NexCard key="defs-list" dragHandle={isEditable} title="Definitions" className="p-0 overflow-hidden flex flex-col h-full"
                actions={<div className="relative w-48"><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full pl-6 pr-2 py-1 bg-slate-100 border border-slate-200 rounded-sm text-xs outline-none" placeholder="Filter..." value={filterQuery} onChange={e => setFilterQuery(e.target.value)}/></div>}
            >
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProcesses.map(p => (
                        <div key={p.id} className="bg-white border border-slate-200 rounded-sm p-3 hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-sm text-slate-800">{p.name}</h4>
                                <button onClick={() => !isEditable && navigateTo('designer', p.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded text-slate-500"><Edit size={12}/></button>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <span className="text-[9px] font-mono bg-slate-100 px-1 rounded">v{p.version}</span>
                                <NexBadge variant={p.isActive ? 'emerald' : 'slate'}>{p.isActive ? 'Active' : 'Archived'}</NexBadge>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                                <button onClick={() => !isEditable && setHeatmapProc(p)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"><BarChart3 size={10}/> Analytics</button>
                                <button onClick={() => !isEditable && handleStart(p.id)} className="bg-blue-600 text-white rounded-full p-1.5 hover:bg-blue-700 shadow-sm"><Play size={10} fill="currentColor"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </NexCard>

            <NexCard key="inst-list" dragHandle={isEditable} title="Active Instances" className="p-0 overflow-hidden flex flex-col h-full">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-[10px] font-bold text-slate-500 uppercase">
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Definition</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2 text-right">Started</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInstances.slice(0, 20).map(inst => (
                                <tr key={inst.id} onClick={() => !isEditable && openInstanceViewer(inst.id)} className="hover:bg-slate-50 cursor-pointer text-xs group">
                                    <td className="px-4 py-2 font-mono text-slate-500">{inst.id.split('-').pop()}</td>
                                    <td className="px-4 py-2 font-bold text-slate-800">{inst.definitionName}</td>
                                    <td className="px-4 py-2"><NexStatusBadge status={inst.status}/></td>
                                    <td className="px-4 py-2 text-right text-slate-500">{new Date(inst.startDate).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </NexCard>
        </ResponsiveGridLayout>
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
