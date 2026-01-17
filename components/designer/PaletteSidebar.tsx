
import React from 'react';
import { ProcessStepType } from '../../types';
import { getStepTypeMetadata } from './designerUtils';
import { Layers, Activity, Plus, Sparkles, X } from 'lucide-react';

const PaletteItem = ({ type, onAdd }: { type: ProcessStepType, onAdd: (type: ProcessStepType) => void }) => {
  const { icon: Icon, color, defaultName: label } = getStepTypeMetadata(type);
  
  return (
    <button 
      onClick={() => onAdd(type)} 
      className="w-full group flex items-center gap-4 p-4 md:p-5 bg-white border border-slate-100 rounded-[18px] md:rounded-[22px] text-left transition-all duration-300 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.98]"
    >
      <div className={`w-10 h-10 md:w-11 md:h-11 rounded-[14px] md:rounded-[16px] flex items-center justify-center shrink-0 transition-all duration-300 bg-slate-50 group-hover:bg-blue-50`}>
        <Icon size={18} className={`transition-colors duration-300 ${color} group-hover:text-blue-600`} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-[13px] font-black text-slate-800 truncate tracking-tight mb-0.5 group-hover:text-blue-900 transition-colors">{label}</span>
        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">Component</span>
      </div>
      <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center transition-all">
        <Plus size={14} strokeWidth={3} />
      </div>
    </button>
  );
};

export const PaletteSidebar = ({ onAddNode }: { onAddNode: (type: ProcessStepType) => void }) => (
  <aside className="w-full h-full bg-white border-r border-slate-100 flex flex-col shrink-0">
    <div className="px-8 py-10">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tightest">Palette</h2>
      </div>
    </div>
    
    <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-10 pb-12">
      <section>
        <div className="flex items-center gap-3 text-slate-400 mb-6 px-2">
           <Layers size={14} />
           <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Orchestration</h4>
        </div>
        <div className="grid gap-2.5 md:gap-3">
          <PaletteItem type="start" onAdd={onAddNode} />
          <PaletteItem type="user-task" onAdd={onAddNode} />
          <PaletteItem type="service-task" onAdd={onAddNode} />
          <PaletteItem type="end" onAdd={onAddNode} />
        </div>
      </section>
      
      <section>
        <div className="flex items-center gap-3 text-slate-400 mb-6 px-2">
           <Activity size={14} />
           <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Logic & Flow</h4>
        </div>
        <div className="grid gap-2.5 md:gap-3">
          <PaletteItem type="decision" onAdd={onAddNode} />
          <PaletteItem type="rules-engine-task" onAdd={onAddNode} />
          <PaletteItem type="parallel-gateway" onAdd={onAddNode} />
        </div>
      </section>
      
      <section className="pt-6">
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-[28px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[50px] rounded-full -mr-12 -mt-12 transition-all group-hover:bg-blue-600/30"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-blue-400 animate-pulse" />
                <h5 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Synthesizer</h5>
              </div>
              <p className="text-[12px] font-medium text-slate-400 leading-relaxed mb-6">
                Active reasoning agents standing by to simulate high-throughput compliance blueprints.
              </p>
              <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                Ready to Process
              </div>
            </div>
         </div>
      </section>
    </div>
  </aside>
);
