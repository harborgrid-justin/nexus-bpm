import React, { useState, useEffect, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Search, LayoutGrid, List as ListIcon, Briefcase, Layers, ChevronRight, CheckSquare } from 'lucide-react';
import { NexBadge } from './shared/NexUI';

interface SearchResultItem {
    id: string;
    title: string;
    description?: string;
    status: string;
    nexusType: 'Task' | 'Case' | 'Instance';
    assignee?: string;
    definitionName?: string;
}

export const TaskExplorer: React.FC = () => {
  const { tasks, cases, instances, globalSearch, navigateTo, openInstanceViewer } = useBPM();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Tasks' | 'Cases' | 'Instances'>('All');

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

    let combined = [...taskMatches, ...caseMatches, ...instanceMatches];
    
    if (activeFilter !== 'All') {
      combined = combined.filter(item => item.nexusType === activeFilter.slice(0, -1));
    }
    
    return combined;
  }, [searchTerm, tasks, cases, instances, activeFilter]);

  const handleNavigate = (item: SearchResultItem) => {
    if (item.nexusType === 'Task') navigateTo('inbox', item.id);
    else if (item.nexusType === 'Case') navigateTo('case-viewer', item.id);
    else if (item.nexusType === 'Instance') openInstanceViewer(item.id);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-300 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Nexus Explorer</h2>
            <p className="text-xs text-slate-500 font-medium">Unified asset discovery.</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-sm border border-slate-200">
             <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon size={16} /></button>
             <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16} /></button>
          </div>
       </header>

       <div className="bg-white p-3 rounded-sm border border-slate-300 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <input 
               type="text" 
               placeholder="Omni-search enterprise assets..." 
               value={searchTerm} 
               onChange={(e) => setSearchTerm(e.target.value)} 
               className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" 
             />
          </div>
          <div className="flex items-center gap-1">
             {['All', 'Tasks', 'Cases', 'Instances'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveFilter(f as any)} 
                  className={`px-3 py-2 rounded-sm text-[10px] font-bold uppercase transition-all border ${activeFilter === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  {f}
                </button>
             ))}
          </div>
       </div>

       <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {searchResults.map((item, idx) => (
             <div 
               key={`${item.id}-${idx}`} 
               onClick={() => handleNavigate(item)} 
               className={`bg-white rounded-sm border border-slate-300 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col group cursor-pointer ${viewMode === 'list' ? 'p-4 flex-row items-center gap-6' : 'p-4'}`}
             >
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 border ${viewMode === 'list' ? 'mb-0' : 'mb-3'} ${
                   item.nexusType === 'Task' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                   item.nexusType === 'Case' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-800 text-white border-slate-900'
                }`}>
                   {item.nexusType === 'Task' ? <CheckSquare size={18}/> : item.nexusType === 'Case' ? <Briefcase size={18}/> : <Layers size={18}/>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <NexBadge variant={item.nexusType === 'Task' ? 'blue' : item.nexusType === 'Case' ? 'amber' : 'slate'}>{item.nexusType}</NexBadge>
                    <span className="text-[10px] text-slate-400 font-mono">{item.id.split('-')[1] || item.id}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5 leading-tight truncate">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    {item.description || item.status}
                  </p>
                </div>

                <div className={`flex gap-2 ${viewMode === 'list' ? '' : 'mt-4 pt-3 border-t border-slate-100 justify-between items-center'}`}>
                   {viewMode === 'grid' && (
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-sm bg-slate-100 flex items-center justify-center text-[9px] font-bold border border-slate-200">{item.assignee?.charAt(0) || 'S'}</div>
                        <span className="text-[10px] text-slate-600 font-bold truncate max-w-[80px]">{item.assignee || 'System'}</span>
                     </div>
                   )}
                   <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
             </div>
          ))}
          {searchResults.length === 0 && (
             <div className="col-span-full py-20 text-center bg-white rounded-sm border border-slate-200">
                <Search size={32} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No artifacts found.</p>
             </div>
          )}
       </div>
    </div>
  );
};