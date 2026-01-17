
import React from 'react';
import { useBPM } from '../contexts/BPMContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { TrendingUp, Clock, Target, Zap, Activity, Globe, ArrowUpRight } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { instances, processes, navigateTo } = useBPM();

  const completedInstances = instances.filter(i => i.status === 'Completed').length;
  const avgSLACompliance = 94.2;
  const taskVolumeData = [
    { name: 'W1', volume: 120, baseline: 100 },
    { name: 'W2', volume: 150, baseline: 110 },
    { name: 'W3', volume: 180, baseline: 120 },
    { name: 'W4', volume: 140, baseline: 115 },
    { name: 'W5', volume: 210, baseline: 130 },
  ];

  const processPerformance = processes.map(p => ({
    name: p.name.split(' ').map(w => w[0]).join(''),
    active: instances.filter(i => i.definitionId === p.id && i.status === 'Active').length,
    completed: instances.filter(i => i.definitionId === p.id && i.status === 'Completed').length,
    id: p.id
  }));

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const payload = data.activePayload[0].payload;
      // Navigate to explorer with filter
      navigateTo('explorer', undefined, 'Pending');
    }
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tightest">Intelligence</h2>
          <p className="text-[15px] text-slate-500 font-medium mt-1.5 leading-relaxed max-w-md">Aggregated performance metrics and predictive throughput indicators across all enterprise nodes.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[18px] border border-slate-200/50">
          <button className="px-4 py-2 bg-white rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-900 shadow-sm">Real-time</button>
          <button className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">Historical</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button onClick={() => navigateTo('governance')} className="bg-white p-6 rounded-[28px] border border-slate-200/60 card-shadow flex flex-col justify-between group hover:border-blue-200 transition-all text-left">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Zap size={20}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Throughput</p>
            <div className="flex items-end gap-2">
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{completedInstances}</h4>
              <span className="text-[11px] font-bold text-emerald-500 mb-1 flex items-center"><ArrowUpRight size={14}/> +12%</span>
            </div>
          </div>
        </button>
        <button onClick={() => navigateTo('inbox')} className="bg-white p-6 rounded-[28px] border border-slate-200/60 card-shadow flex flex-col justify-between group hover:border-blue-200 transition-all text-left">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Clock size={20}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mean Cycle Time</p>
            <div className="flex items-end gap-2">
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter">1.8d</h4>
              <span className="text-[11px] font-bold text-slate-400 mb-1">Stable</span>
            </div>
          </div>
        </button>
        <button onClick={() => navigateTo('explorer', undefined, 'Critical')} className="bg-white p-6 rounded-[28px] border border-slate-200/60 card-shadow flex flex-col justify-between group hover:border-rose-200 transition-all text-left">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Target size={20}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SLA Compliance</p>
            <div className="flex items-end gap-2">
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{avgSLACompliance}%</h4>
              <span className="text-[11px] font-bold text-emerald-500 mb-1 flex items-center"><ArrowUpRight size={14}/> +0.4%</span>
            </div>
          </div>
        </button>
        <div className="bg-white p-6 rounded-[28px] border border-slate-200/60 card-shadow flex flex-col justify-between">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6"><Activity size={20}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">System Health</p>
            <div className="flex items-end gap-2">
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter">99.9</h4>
              <span className="text-[11px] font-bold text-slate-400 mb-1">Optimal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 card-shadow">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={18} className="text-slate-400"/>
              Volume Projections
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> <span className="text-[10px] font-bold text-slate-500">Actual</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 rounded-full"></div> <span className="text-[10px] font-bold text-slate-500">Forecast</span></div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={taskVolumeData} onClick={handleChartClick} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} />
                <Tooltip cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="volume" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVol)" strokeWidth={3} />
                <Area type="monotone" dataKey="baseline" stroke="#E2E8F0" fill="transparent" strokeWidth={2} strokeDasharray="8 8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 card-shadow">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <Globe size={18} className="text-slate-400"/>
              Operational Load
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Distribution</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processPerformance} onClick={handleChartClick} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Bar dataKey="active" stackId="a" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40}>
                   {processPerformance.map((entry, index) => (
                    <Cell key={`cell-active-${index}`} cursor="pointer" className="hover:opacity-80 transition-opacity" />
                  ))}
                </Bar>
                <Bar dataKey="completed" stackId="a" fill="#0F172A" radius={[12, 12, 0, 0]} barSize={40}>
                   {processPerformance.map((entry, index) => (
                    <Cell key={`cell-comp-${index}`} cursor="pointer" className="hover:fill-blue-600 transition-colors" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
