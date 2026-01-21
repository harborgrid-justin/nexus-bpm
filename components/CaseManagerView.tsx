
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Briefcase, Plus, Search, Filter, Clock, ChevronRight, AlertCircle, X, SearchX, CheckCircle, PieChart, BarChart3, User as UserIcon, LayoutGrid, List as ListIcon, MoreHorizontal } from 'lucide-react';
import { NexCard, NexButton, NexBadge } from './shared/NexUI';
import { TaskStatus, Case } from '../types';

export const CaseManagerView: React.FC = () => {
  const { cases, navigateTo, currentUser, tasks, users, updateCase } = useBPM();
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMine, setFilterMine] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // --- 1. & 2. Filtering & Sorting ---
  const filteredCases = useMemo(() => {
      return cases
        .filter(c => {
            const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                c.id.includes(searchQuery);
            
            const matchMine = filterMine ? c.stakeholders.some(s => s.userId === currentUser?.id) : true;
            const matchStatus = statusFilter === 'All' || c.status === statusFilter;
            const matchPriority = priorityFilter === 'All' || c.priority === priorityFilter;

            return matchSearch && matchMine && matchStatus && matchPriority;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort Newest First
  }, [cases, searchQuery, filterMine, statusFilter, priorityFilter, currentUser]);

  // --- 3. KPI Calculations ---
  const kpis = useMemo(() => {
      const active = cases.filter(c => c.status !== 'Closed').length;
      const critical = cases.filter(c => c.priority === 'Critical' && c.status !== 'Closed').length;
      const myActive = cases.filter(c => c.status !== 'Closed' && c.stakeholders.some(s => s.userId === currentUser?.id)).length;
      return { active, critical, myActive };
  }, [cases, currentUser]);

  // Helper to get case owner
  const getCaseOwner = (c: any) => {
      const ownerId = c.stakeholders.find((s: any) => s.role === 'Owner')?.userId;
      return users.find(u => u.id === ownerId);
  };

  // Helper for progress bar
  const getCaseProgress = (caseId: string) => {
      const caseTasks = tasks.filter(t => t.caseId === caseId);
      if (caseTasks.length === 0) return 0;
      const completed = caseTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      return Math.round((completed / caseTasks.length) * 100);
  };

  // Kanban Logic
  const stages = ['Open', 'In Progress', 'Pending Review', 'Resolved', 'Closed'];
  
  const handleDrop = (e: React.DragEvent, newStatus: string) => {
      const caseId = e.dataTransfer.getData('caseId');
      if (caseId) {
          updateCase(caseId, { status: newStatus as any });
      }
  };

  return (
    <div 
      className="animate-fade-in pb-20 flex flex-col h-[calc(100vh-120px)]"
      style={{ gap: 'var(--section-gap)' }}
    >
      <header className="flex items-center justify-between border-b border-slate-300 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Case Management</h2>
          <p className="text-xs text-slate-500 font-medium">Orchestrate complex non-linear workflows.</p>
        </div>
        <div className="flex gap-4">
            <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon size={16}/></button>
                <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16}/></button>
            </div>
            <NexButton variant="primary" icon={Plus} onClick={() => navigateTo('create-case')}>New Case</NexButton>
        </div>
      </header>

      {/* --- KPI Stats (Only in List Mode to save space in Board) --- */}
      {viewMode === 'list' && (
        <div 
            className="grid grid-cols-3 shrink-0"
            style={{ gap: 'var(--layout-gap)' }}
        >
            <div className="bg-white p-3 border border-slate-200 rounded-sm shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Active Cases</p>
                    <p className="text-xl font-bold text-slate-800">{kpis.active}</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-sm"><Briefcase size={18}/></div>
            </div>
            <div className="bg-white p-3 border border-slate-200 rounded-sm shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">My Workload</p>
                    <p className="text-xl font-bold text-slate-800">{kpis.myActive}</p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-sm"><UserIcon size={18}/></div>
            </div>
            <div className="bg-white p-3 border border-slate-200 rounded-sm shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Critical</p>
                    <p className="text-xl font-bold text-rose-700">{kpis.critical}</p>
                </div>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-sm"><AlertCircle size={18}/></div>
            </div>
        </div>
      )}

      <div 
        className="flex flex-col flex-1 min-h-0"
        style={{ gap: 'var(--layout-gap)' }}
      >
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
            <input 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-sm text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none" 
                placeholder="Search case ID, title, or description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             {viewMode === 'list' && (
                 <select 
                    className="px-3 py-2 border border-slate-300 rounded-sm text-xs font-medium bg-white outline-none"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                 >
                     <option value="All">All Status</option>
                     {stages.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
             )}
             <select 
                className="px-3 py-2 border border-slate-300 rounded-sm text-xs font-medium bg-white outline-none"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
             >
                 <option value="All">All Priorities</option>
                 <option value="Critical">Critical</option>
                 <option value="High">High</option>
                 <option value="Medium">Medium</option>
                 <option value="Low">Low</option>
             </select>
             <button 
                onClick={() => setFilterMine(!filterMine)}
                className={`px-3 py-2 border rounded-sm text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${filterMine ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-300 hover:text-slate-900'}`}
             >
                <Filter size={14}/> My Cases
             </button>
          </div>
        </div>

        {/* --- LIST VIEW --- */}
        {viewMode === 'list' && (
            <div className="grid gap-2 overflow-y-auto">
            {cases.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-sm border border-slate-300">
                <Briefcase size={32} className="mx-auto text-slate-300 mb-4"/>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Queue clear.</p>
                </div>
            ) : filteredCases.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-sm border border-dashed border-slate-300">
                <SearchX size={32} className="mx-auto text-slate-300 mb-4"/>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No cases match your filters.</p>
                </div>
            ) : (
                filteredCases.map(c => {
                const owner = getCaseOwner(c);
                const progress = getCaseProgress(c.id);
                const isClosed = c.status === 'Closed';

                return (
                    <div 
                    key={c.id} 
                    onClick={() => navigateTo('case-viewer', c.id)}
                    className={`bg-white p-4 rounded-sm border border-slate-300 flex items-center justify-between group hover:border-blue-400 transition-all cursor-pointer shadow-sm ${isClosed ? 'opacity-75 bg-slate-50' : ''}`}
                    >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center border shrink-0 ${isClosed ? 'bg-slate-100 text-slate-400 border-slate-200' : (c.priority === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-blue-50 text-blue-600 border-blue-200')}`}>
                            {isClosed ? <CheckCircle size={18}/> : <Briefcase size={18}/>}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className={`text-sm font-bold truncate ${isClosed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{c.title}</h4>
                                {c.priority === 'Critical' && <AlertCircle size={12} className="text-rose-600 fill-rose-100"/>}
                            </div>
                            <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-400 font-medium">{c.id}</span>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                                <Clock size={10}/> {new Date(c.createdAt).toLocaleDateString()}
                            </div>
                            {owner && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-1.5 rounded-full border border-slate-200">
                                    <div className="w-3 h-3 rounded-full bg-slate-300 text-[8px] flex items-center justify-center font-bold">{owner.name[0]}</div>
                                    <span className="truncate max-w-[80px]">{owner.name}</span>
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex flex-col items-end w-24">
                            <div className="flex justify-between w-full text-[9px] font-bold text-slate-500 mb-1">
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                        <div className="hidden sm:flex flex-col items-end">
                            <NexBadge variant={isClosed ? 'slate' : (c.priority === 'Critical' ? 'rose' : 'blue')}>{c.status}</NexBadge>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors"/>
                    </div>
                    </div>
                );
                })
            )}
            </div>
        )}

        {/* --- KANBAN BOARD VIEW --- */}
        {viewMode === 'board' && (
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex h-full gap-4 pb-2">
                    {stages.map(stage => {
                        const casesInStage = filteredCases.filter(c => c.status === stage);
                        return (
                            <div 
                                key={stage} 
                                className="flex-1 min-w-[280px] bg-slate-100 rounded-md border border-slate-200 flex flex-col"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, stage)}
                            >
                                <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-md">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase">{stage}</h3>
                                    <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200">{casesInStage.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {casesInStage.map(c => {
                                        const owner = getCaseOwner(c);
                                        return (
                                            <div 
                                                key={c.id} 
                                                className="bg-white p-3 rounded-sm border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                                                draggable
                                                onDragStart={(e) => e.dataTransfer.setData('caseId', c.id)}
                                                onClick={() => navigateTo('case-viewer', c.id)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${c.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{c.priority}</span>
                                                    <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal size={14}/></button>
                                                </div>
                                                <h4 className="text-xs font-bold text-slate-800 mb-1 leading-tight">{c.title}</h4>
                                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                                                    <span className="text-[9px] text-slate-400 font-mono">{c.id}</span>
                                                    {owner && (
                                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 border border-slate-200" title={owner.name}>
                                                            {owner.name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
