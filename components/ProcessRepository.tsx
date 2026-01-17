
import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Play, FileText, Layers, Plus, Activity, Eye, ChevronRight, Globe, ShieldCheck, Clock, Hash } from 'lucide-react';

export const ProcessRepository: React.FC = () => {
  const { processes, instances, startProcess, openInstanceViewer } = useBPM();
  const [activeTab, setActiveTab] = useState<'definitions' | 'instances'>('definitions');

  const handleStart = (id: string, name: string) => {
    startProcess(id, { summary: `Automated initiation via Registry` });
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tightest">Registry</h2>
          <p className="text-[15px] text-slate-500 font-medium mt-1.5 leading-relaxed max-w-md">The authoritative source for all deployed business process models and active runtimes.</p>
        </div>
        <div className="flex items-center p-1.5 bg-slate-100 rounded-[18px] border border-slate-200/50 w-full md:w-auto overflow-x-auto no-scrollbar">
           <button 
             onClick={() => setActiveTab('definitions')}
             className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${activeTab === 'definitions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Definitions
           </button>
           <button 
             onClick={() => setActiveTab('instances')}
             className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${activeTab === 'instances' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Live Instances ({instances.filter(i => i.status === 'Active').length})
           </button>
        </div>
      </header>

      {activeTab === 'definitions' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <button className="group border-2 border-dashed border-slate-200 rounded-[32px] p-8 flex flex-col items-center justify-center text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all min-h-[260px] md:min-h-[280px] bg-white hover:bg-slate-50 card-shadow active:scale-95">
             <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white transition-all border border-transparent group-hover:border-slate-100">
               <Plus size={32} />
             </div>
             <span className="text-[14px] md:text-[15px] font-black uppercase tracking-widest">Deploy New Model</span>
          </button>

          {processes.map(process => (
            <div key={process.id} className="bg-white p-7 md:p-8 rounded-[32px] card-shadow border border-slate-200/60 flex flex-col hover:-translate-y-2 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-8">
                 <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 text-white rounded-[20px] md:rounded-[22px] flex items-center justify-center shadow-xl group-hover:bg-blue-600 transition-colors">
                   <Layers size={24} className="md:w-7 md:h-7" />
                 </div>
                 <div className="flex flex-col items-end gap-1.5 md:gap-2">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 uppercase tracking-widest">v{process.version || 1}.0.2</span>
                    <div className="flex items-center gap-1.5">
                       <ShieldCheck size={10} className="text-emerald-500"/>
                       <span className="text-[8px] md:text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Verified</span>
                    </div>
                 </div>
              </div>
              
              <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">{process.name}</h3>
              <p className="text-[12px] md:text-[13px] text-slate-500 font-medium leading-relaxed mb-6 md:mb-8 flex-1 line-clamp-2 md:line-clamp-3">
                {process.description || 'Enterprise grade workflow optimized for high-throughput and strict compliance adherence within the global domain.'}
              </p>
              
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-[11px] font-bold text-slate-400">
                  <div className="flex items-center gap-1.5"><FileText size={14} className="opacity-50"/> <span>{process.steps.length} Steps</span></div>
                  <div className="flex items-center gap-1.5"><Globe size={14} className="opacity-50"/> <span>Global</span></div>
                </div>
                
                <button 
                  onClick={() => handleStart(process.id, process.name)}
                  className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all active:scale-90 shadow-sm"
                >
                  <Play size={18} fill="currentColor" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
           {/* Card View for Live Instances on Mobile */}
           <div className="grid grid-cols-1 md:hidden gap-4">
              {instances.map(inst => (
                <div key={inst.id} onClick={() => openInstanceViewer(inst.id)} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <Activity size={20} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-black text-slate-900 leading-none mb-1.5">{inst.definitionName}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{inst.id.split('-')[1]}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                       inst.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {inst.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Clock size={12}/> {new Date(inst.startDate).toLocaleDateString()}
                       </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </div>
                </div>
              ))}
           </div>

           {/* Table View for Desktop */}
           <div className="hidden md:block bg-white rounded-[32px] card-shadow border border-slate-200/60 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">Instance Identity</th>
                      <th className="px-8 py-5">Model</th>
                      <th className="px-8 py-5">Runtime Status</th>
                      <th className="px-8 py-5">Initiated</th>
                      <th className="px-8 py-5 text-right">Monitoring</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {instances.length === 0 ? (
                        <tr><td colSpan={5} className="p-20 text-center"><p className="text-slate-400 font-medium italic">No active runtimes detected.</p></td></tr>
                    ) : instances.map(inst => (
                        <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openInstanceViewer(inst.id)}>
                          <td className="px-8 py-5">
                              <div className="font-mono text-[11px] text-slate-900 font-bold mb-0.5">{inst.id}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{inst.domainId}</div>
                          </td>
                          <td className="px-8 py-5">
                              <div className="text-[13px] font-bold text-slate-900">{inst.definitionName}</div>
                          </td>
                          <td className="px-8 py-5">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                inst.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                inst.status === 'Suspended' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {inst.status}
                              </span>
                          </td>
                          <td className="px-8 py-5 text-[13px] font-medium text-slate-500">
                              {new Date(inst.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-5 text-right">
                              <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all group-hover:translate-x-1">
                                <ChevronRight size={18} />
                              </button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};
