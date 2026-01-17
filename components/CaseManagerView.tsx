
import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Briefcase, Plus, Search, Filter, Clock, ChevronRight, AlertCircle, X } from 'lucide-react';

export const CaseManagerView: React.FC = () => {
  const { cases, navigateTo, createCase } = useBPM();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = async () => {
    if (!newTitle) return;
    await createCase(newTitle, newDesc);
    setNewTitle(''); setNewDesc(''); setShowCreate(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-32">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tightest">Adaptive Cases</h2>
            <p className="text-[14px] text-slate-500 font-medium mt-1">Orchestrate complex non-linear outcomes.</p>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-xl active:scale-90 transition-all shrink-0"
          >
            <Plus size={24}/>
          </button>
        </div>
      </header>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 space-y-8 animate-slide-up relative">
             <button onClick={() => setShowCreate(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
             <div>
                <h3 className="text-xl font-black text-slate-900">Initiate Case File</h3>
                <p className="text-sm text-slate-500 font-medium">Define the operational objective.</p>
             </div>
             <div className="space-y-6">
               <div className="space-y-2">
                 <label className="prop-label">Case Identifier</label>
                 <input 
                   className="prop-input" 
                   placeholder="e.g. Fraud Investigation #402" 
                   value={newTitle} 
                   onChange={e => setNewTitle(e.target.value)} 
                 />
               </div>
               <div className="space-y-2">
                 <label className="prop-label">Strategic Objective</label>
                 <textarea 
                   className="prop-input h-28 resize-none py-4" 
                   placeholder="Describe the desired outcome..." 
                   value={newDesc} 
                   onChange={e => setNewDesc(e.target.value)} 
                 />
               </div>
             </div>
             <div className="flex gap-3">
               <button onClick={() => setShowCreate(false)} className="flex-1 py-4 text-slate-500 font-bold text-[13px] uppercase tracking-widest">Discard</button>
               <button onClick={handleCreate} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-slate-200">Open Case File</button>
             </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="Search operational context..." />
          </div>
          <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-400 active:scale-95"><Filter size={20}/></button>
        </div>

        <div className="grid gap-3">
          {cases.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
              <Briefcase size={48} className="mx-auto text-slate-100 mb-6"/>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Domain queue is currently clear.</p>
            </div>
          ) : (
            cases.map(c => (
              <div 
                key={c.id} 
                onClick={() => navigateTo('case-viewer', c.id)}
                className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-5">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${c.status === 'Open' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Briefcase size={24}/>
                   </div>
                   <div>
                      <h4 className="text-[15px] font-black text-slate-900 mb-1">{c.title}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.id.split('-')[1]}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                           <Clock size={12}/> {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="hidden sm:flex flex-col items-end">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${c.priority === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400'}`}>{c.priority}</span>
                   </div>
                   <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors"/>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <aside className="grid grid-cols-2 gap-4">
         <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 mb-4">Throughput</h3>
            <div className="text-3xl font-black tracking-tightest">4.2d</div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Resolution Mean</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4">Active Load</h3>
            <div className="text-3xl font-black tracking-tightest text-slate-900">{cases.length}</div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Live Cases</p>
         </div>
      </aside>
    </div>
  );
};