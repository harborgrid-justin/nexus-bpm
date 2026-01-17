
import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Briefcase, Plus, Search, Filter, Clock, ChevronRight, AlertCircle, X, SearchX } from 'lucide-react';
import { NexCard, NexButton, NexBadge } from './shared/NexUI';

export const CaseManagerView: React.FC = () => {
  const { cases, navigateTo, createCase, currentUser } = useBPM();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMine, setFilterMine] = useState(false);

  const handleCreate = async () => {
    if (!newTitle) return;
    await createCase(newTitle, newDesc);
    setNewTitle(''); setNewDesc(''); setShowCreate(false);
  };

  const filteredCases = cases.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.includes(searchQuery);
      
      const matchMine = filterMine ? c.stakeholders.some(s => s.userId === currentUser?.id) : true;
      return matchSearch && matchMine;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex items-center justify-between border-b border-slate-300 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Case Management</h2>
          <p className="text-xs text-slate-500 font-medium">Orchestrate complex non-linear workflows.</p>
        </div>
        <NexButton variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>New Case</NexButton>
      </header>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-sm shadow-xl p-6 space-y-6 animate-slide-up border border-slate-300">
             <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Initiate Case File</h3>
                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
             </div>
             <div className="space-y-4">
               <div className="space-y-1">
                 <label className="prop-label">Case Identifier</label>
                 <input 
                   className="prop-input" 
                   placeholder="e.g. Fraud Investigation #402" 
                   value={newTitle} 
                   onChange={e => setNewTitle(e.target.value)} 
                 />
               </div>
               <div className="space-y-1">
                 <label className="prop-label">Strategic Objective</label>
                 <textarea 
                   className="prop-input h-24 resize-none" 
                   placeholder="Describe outcome..." 
                   value={newDesc} 
                   onChange={e => setNewDesc(e.target.value)} 
                 />
               </div>
             </div>
             <div className="flex gap-2 pt-2">
               <NexButton variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Discard</NexButton>
               <NexButton variant="primary" onClick={handleCreate} className="flex-1">Open Case</NexButton>
             </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
            <input 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-sm text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none" 
                placeholder="Search operational context..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setFilterMine(!filterMine)}
            className={`px-3 py-2 border rounded-sm text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${filterMine ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-300 hover:text-slate-900'}`}
          >
            <Filter size={14}/> {filterMine ? 'My Cases' : 'All Cases'}
          </button>
        </div>

        <div className="grid gap-2">
          {cases.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-sm border border-slate-300">
              <Briefcase size={32} className="mx-auto text-slate-300 mb-4"/>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Queue clear.</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-sm border border-dashed border-slate-300">
              <SearchX size={32} className="mx-auto text-slate-300 mb-4"/>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No matching cases found.</p>
            </div>
          ) : (
            filteredCases.map(c => (
              <div 
                key={c.id} 
                onClick={() => navigateTo('case-viewer', c.id)}
                className="bg-white p-4 rounded-sm border border-slate-300 flex items-center justify-between group hover:border-blue-400 transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${c.status === 'Open' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                      <Briefcase size={18}/>
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-0.5">{c.title}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400 font-medium">{c.id}</span>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                           <Clock size={10}/> {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="hidden sm:flex flex-col items-end">
                      <NexBadge variant={c.priority === 'Critical' ? 'rose' : 'slate'}>{c.priority}</NexBadge>
                   </div>
                   <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors"/>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
