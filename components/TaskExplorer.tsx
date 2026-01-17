
import React, { useState, useEffect, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Task, TaskStatus, TaskPriority } from '../types';
// Added CheckSquare to the imports to resolve 'Cannot find name CheckSquare' error
import { Search, LayoutGrid, List as ListIcon, Briefcase, Layers, ChevronRight, Activity, ExternalLink, PenTool, CheckSquare } from 'lucide-react';
import { NexBadge } from './shared/NexUI';

export const TaskExplorer: React.FC = () => {
  const { tasks, cases, instances, globalSearch, navigateTo, openInstanceViewer } = useBPM();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Tasks' | 'Cases' | 'Instances'>('All');

  useEffect(() => {
    if (globalSearch) setSearchTerm(globalSearch);
  }, [globalSearch]);

  const searchResults = useMemo(() => {
    const s = searchTerm.toLowerCase();
    
    const taskMatches = tasks
      .filter(t => t.title.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s))
      .map(t => ({ ...t, nexusType: 'Task' as const }));
      
    const caseMatches = cases
      .filter(c => c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s))
      .map(c => ({ ...c, nexusType: 'Case' as const }));
      
    const instanceMatches = instances
      .filter(i => i.definitionName.toLowerCase().includes(s) || i.id.toLowerCase().includes(s))
      .map(i => ({ ...i, nexusType: 'Instance' as const }));

    let combined = [...taskMatches, ...caseMatches, ...instanceMatches];
    
    if (activeFilter !== 'All') {
      combined = combined.filter(item => item.nexusType === activeFilter.slice(0, -1));
    }
    
    return combined;
  }, [searchTerm, tasks, cases, instances, activeFilter]);

  const handleNavigate = (item: any) => {
    if (item.nexusType === 'Task') navigateTo('inbox', item.id);
    else if (item.nexusType === 'Case') navigateTo('case-viewer', item.id);
    else if (item.nexusType === 'Instance') openInstanceViewer(item.id);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-32">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tightest">Nexus Explorer</h2>
            <p className="text-slate-500 text-sm font-medium">Unified enterprise intelligence and asset discovery.</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
             <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon size={20} /></button>
             <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={20} /></button>
          </div>
       </header>

       <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="Omni-search enterprise assets..." 
               value={searchTerm} 
               onChange={(e) => setSearchTerm(e.target.value)} 
               className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" 
             />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
             {['All', 'Tasks', 'Cases', 'Instances'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveFilter(f as any)} 
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeFilter === f ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  {f}
                </button>
             ))}
          </div>
       </div>

       <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {searchResults.map((item: any, idx) => (
             <div 
               key={`${item.id}-${idx}`} 
               onClick={() => handleNavigate(item)} 
               className={`bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all flex flex-col group cursor-pointer active:scale-[0.98] ${viewMode === 'list' ? 'p-6 flex-row items-center gap-8' : 'p-6'}`}
             >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 mb-4 ${viewMode === 'list' ? 'mb-0' : ''} ${
                   item.nexusType === 'Task' ? 'bg-blue-50 text-blue-600' :
                   item.nexusType === 'Case' ? 'bg-amber-50 text-amber-600' : 'bg-slate-900 text-white'
                }`}>
                   {item.nexusType === 'Task' ? <CheckSquare size={24}/> : item.nexusType === 'Case' ? <Briefcase size={24}/> : <Layers size={24}/>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <NexBadge variant={item.nexusType === 'Task' ? 'blue' : item.nexusType === 'Case' ? 'amber' : 'slate'}>{item.nexusType}</NexBadge>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.id.split('-')[1]}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-[15px] mb-1 leading-tight truncate tracking-tightest">
                    {item.title || item.definitionName}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {item.description || item.status || 'Active runtime context'}
                  </p>
                </div>

                <div className={`flex gap-2 ${viewMode === 'list' ? '' : 'mt-6 pt-5 border-t border-slate-50 justify-between items-center'}`}>
                   {viewMode === 'grid' && (
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black">{item.assignee?.charAt(0) || 'S'}</div>
                        <span className="text-[11px] text-slate-600 font-black truncate max-w-[80px]">{item.assignee || 'System'}</span>
                     </div>
                   )}
                   <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                </div>
             </div>
          ))}
          {searchResults.length === 0 && (
             <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-100">
                <Search size={48} className="mx-auto text-slate-100 mb-6" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">No matching operational artifacts discovered.</p>
             </div>
          )}
       </div>
    </div>
  );
};
