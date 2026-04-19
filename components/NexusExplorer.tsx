import React, { useState, useEffect, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Search, LayoutGrid, List as ListIcon, Briefcase, Layers, ChevronRight, CheckSquare, Zap, Database } from 'lucide-react';
import { NexBadge, NexCard } from './shared/NexUI';
import { PageGridLayout } from './shared/PageGridLayout';

interface SearchResultItem {
    id: string;
    title: string;
    description?: string;
    status: string;
    nexusType: 'Task' | 'Case' | 'Instance';
    assignee?: string;
    definitionName?: string;
}

export const NexusExplorer: React.FC = () => {
  const { 
    tasks, cases, instances, triggers, queues, artifacts, 
    globalSearch, navigateTo, openInstanceViewer 
  } = useBPM();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Artifacts' | 'Triggers' | 'Tasks' | 'Cases' | 'Instances'>('All');

  const defaultLayouts = useMemo(() => ({
    lg: [
      { i: 'search-controls', x: 0, y: 0, w: 12, h: 3 },
      { i: 'results-grid', x: 0, y: 3, w: 12, h: 20 }
    ],
    md: [
      { i: 'search-controls', x: 0, y: 0, w: 10, h: 4 },
      { i: 'results-grid', x: 0, y: 4, w: 10, h: 20 }
    ]
  }), []);

  useEffect(() => {
    if (globalSearch) setSearchTerm(globalSearch);
  }, [globalSearch]);

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const s = searchTerm.toLowerCase();
    
    const taskMatches = tasks
      .filter(t => t.title.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s))
      .map(t => ({ ...t, nexusType: 'Task' as const, description: t.description || 'Active task' }));
      
    const caseMatches = cases
      .filter(c => c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s))
      .map(c => ({ ...c, nexusType: 'Case' as const, assignee: 'Case Owner' }));
      
    const instanceMatches = instances
      .filter(i => i.definitionName.toLowerCase().includes(s) || i.id.toLowerCase().includes(s))
      .map(i => ({ 
          id: i.id, 
          title: i.definitionName, 
          status: i.status, 
          nexusType: 'Instance' as const, 
          assignee: 'System',
          description: `Started ${new Date(i.startDate).toLocaleDateString()}`
      }));
      
    const artifactMatches = artifacts
      .filter(a => a.name.toLowerCase().includes(s) || a.schema.toLowerCase().includes(s))
      .map(a => ({ 
          id: a.id, title: a.name, status: 'Active', 
          nexusType: 'Artifact' as any, 
          description: `Schema: ${a.schema} | v${a.version}` 
      }));

    const triggerMatches = triggers
      .filter(t => t.name.toLowerCase().includes(s))
      .map(t => ({ 
          id: t.id, title: t.name, status: t.isEnabled ? 'Enabled' : 'Disabled', 
          nexusType: 'Trigger' as any, 
          description: `${t.eventSource} -> ${t.actionType}` 
      }));

    let combined = [...taskMatches, ...caseMatches, ...instanceMatches, ...artifactMatches, ...triggerMatches];
    
    if (activeFilter !== 'All') {
      combined = combined.filter(item => item.nexusType === (activeFilter.endsWith('s') ? activeFilter.slice(0, -1) : activeFilter) as any);
    }
    
    return combined;
  }, [searchTerm, tasks, cases, instances, activeFilter]);

  const handleNavigate = (item: SearchResultItem) => {
    if (item.nexusType === 'Task') navigateTo('inbox', item.id);
    else if (item.nexusType === 'Case') navigateTo('case-viewer', item.id);
    else if (item.nexusType === 'Instance') openInstanceViewer(item.id);
    else if (item.nexusType === 'Trigger') navigateTo('trigger-manager', item.id);
  };

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-default pb-4 shrink-0 mb-2">
          <div>
            <h2 className="text-xl font-bold text-primary tracking-tight">Nexus Explorer</h2>
            <p className="text-xs text-secondary font-medium">Unified asset discovery across the ecosystem.</p>
          </div>
          <div className="flex items-center gap-1 bg-subtle p-01 rounded-sm border border-default shadow-sm">
             <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'list' ? 'bg-panel text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}`}><ListIcon size={16} /></button>
             <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-panel text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}`}><LayoutGrid size={16} /></button>
          </div>
       </header>

       <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
         <PageGridLayout defaultLayouts={defaultLayouts}>
           <NexCard key="search-controls" className="p-03 flex flex-col md:flex-row gap-03">
              <div className="relative flex-1 group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={14} />
                 <input 
                   type="text" 
                   placeholder="Omni-search enterprise assets..." 
                   value={searchTerm} 
                   onChange={(e) => setSearchTerm(e.target.value)} 
                   className="w-full pl-9 pr-3 py-2 bg-subtle border border-default rounded-sm text-xs font-medium focus:bg-panel focus:border-blue-500 outline-none transition-all text-primary" 
                 />
              </div>
              <div className="flex items-center gap-01">
                 {['All', 'Artifacts', 'Triggers', 'Tasks', 'Cases', 'Instances'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => setActiveFilter(f as any)} 
                      className={`px-3 py-2 rounded-sm text-[10px] font-bold uppercase transition-all border ${activeFilter === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-panel text-secondary border-default hover:bg-hover'}`}
                    >
                      {f}
                    </button>
                 ))}
              </div>
           </NexCard>

           <div key="results-grid" className={`grid gap-layout ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {searchResults.map((item, idx) => (
                 <NexCard 
                   key={`${item.id}-${idx}`} 
                   onClick={() => handleNavigate(item)} 
                   className={`hover:border-blue-400 group cursor-pointer ${viewMode === 'list' ? 'p-05 flex-row items-center gap-06' : 'p-05'}`}
                 >
                    <div className={`w-10 h-10 rounded-base flex items-center justify-center shrink-0 border ${viewMode === 'list' ? 'mb-0' : 'mb-3'} ${
                       item.nexusType === 'Task' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                       item.nexusType === 'Case' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                       item.nexusType === 'Trigger' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                       item.nexusType === 'Artifact' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                       'bg-slate-800 text-white border-slate-900'
                    }`}>
                       {item.nexusType === 'Task' ? <CheckSquare size={18}/> : 
                        item.nexusType === 'Case' ? <Briefcase size={18}/> : 
                        item.nexusType === 'Trigger' ? <Zap size={18}/> :
                        item.nexusType === 'Artifact' ? <Database size={18}/> :
                        <Layers size={18}/>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-02 mb-1">
                        <NexBadge variant={
                            item.nexusType === 'Task' ? 'blue' : 
                            item.nexusType === 'Case' ? 'amber' : 
                            item.nexusType === 'Trigger' ? 'emerald' :
                            item.nexusType === 'Artifact' ? 'indigo' :
                            'slate'
                        }>{item.nexusType}</NexBadge>
                        <span className="text-[10px] text-tertiary font-mono">{item.id.split('-')[1] || item.id}</span>
                      </div>
                      <h3 className="font-bold text-primary text-sm mb-0.5 leading-tight truncate">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-secondary truncate">
                        {item.description || item.status}
                      </p>
                    </div>

                    <div className={`flex gap-02 ${viewMode === 'list' ? '' : 'mt-4 pt-3 border-t border-default justify-between items-center'}`}>
                       {viewMode === 'grid' && (
                         <div className="flex items-center gap-02">
                            <div className="w-6 h-6 rounded-sm bg-subtle border border-default flex items-center justify-center text-[9px] font-bold text-primary">{item.assignee?.charAt(0) || 'S'}</div>
                            <span className="text-[10px] text-secondary font-bold truncate max-w-[80px]">{item.assignee || 'System'}</span>
                         </div>
                       )}
                       <ChevronRight size={16} className="text-tertiary group-hover:text-blue-600 transition-colors" />
                    </div>
                 </NexCard>
              ))}
              {searchResults.length === 0 && (
                 <div className="col-span-full py-20 text-center bg-panel rounded-base border border-default shadow-sm">
                    <Search size={32} className="mx-auto text-tertiary mb-4" />
                    <p className="text-tertiary font-bold uppercase tracking-widest text-[10px]">No artifacts found.</p>
                 </div>
              )}
           </div>
         </PageGridLayout>
       </div>
    </div>
  );
};
