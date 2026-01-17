
import React from 'react';
import { useBPM } from '../contexts/BPMContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { TrendingUp, Clock, Target, Zap, Activity, Globe, ArrowUpRight } from 'lucide-react';
import { NexCard } from './shared/NexUI';

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
      navigateTo('explorer', undefined, 'Pending');
    }
  };

  const KPICard = ({ title, value, change, icon: Icon, color, onClick }: any) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50 border-blue-200',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        rose: 'text-rose-600 bg-rose-50 border-rose-200',
        slate: 'text-slate-600 bg-slate-50 border-slate-200'
    };
    return (
        <div onClick={onClick} className={`bg-white p-4 border rounded-sm shadow-sm cursor-pointer hover:shadow-md transition-all ${colors[color].replace('text-', 'hover:border-').split(' ')[2]}`}>
            <div className="flex justify-between items-start mb-2">
                <div className={`p-1.5 rounded-sm ${colors[color]}`}>
                    <Icon size={16}/>
                </div>
                {change && <span className="text-[10px] font-bold text-emerald-600 flex items-center bg-emerald-50 px-1 rounded-sm">+{change}</span>}
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">{title}</p>
            <h4 className="text-2xl font-bold text-slate-900 leading-tight">{value}</h4>
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-300 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Performance Analytics</h2>
          <p className="text-xs text-slate-500 font-medium">Aggregated KPIs and predictive indicators.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-sm border border-slate-200">
          <button className="px-3 py-1 bg-white border border-slate-200 rounded-sm text-[10px] font-bold uppercase text-slate-900 shadow-sm">Real-time</button>
          <button className="px-3 py-1 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-900">Historical</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Global Throughput" value={completedInstances} change="12%" icon={Zap} color="blue" onClick={() => navigateTo('governance')} />
        <KPICard title="Mean Cycle Time" value="1.8d" icon={Clock} color="slate" onClick={() => navigateTo('inbox')} />
        <KPICard title="SLA Compliance" value={`${avgSLACompliance}%`} change="0.4%" icon={Target} color="rose" onClick={() => navigateTo('explorer', undefined, 'Critical')} />
        <KPICard title="System Health" value="99.9" icon={Activity} color="emerald" onClick={() => {}} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NexCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
              <TrendingUp size={14} className="text-slate-400"/> Volume Projections
            </h3>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-sm"></div> <span className="text-[10px] font-bold text-slate-500">Actual</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-300 rounded-sm"></div> <span className="text-[10px] font-bold text-slate-400">Forecast</span></div>
            </div>
          </div>
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={taskVolumeData} onClick={handleChartClick} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} />
                <Tooltip cursor={{ stroke: '#3b82f6', strokeWidth: 1 }} contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="volume" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVol)" strokeWidth={2} />
                <Area type="monotone" dataKey="baseline" stroke="#cbd5e1" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </NexCard>

        <NexCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
              <Globe size={14} className="text-slate-400"/> Operational Load
            </h3>
          </div>
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processPerformance} onClick={handleChartClick} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0'}} />
                <Bar dataKey="active" stackId="a" fill="#cbd5e1" barSize={32}>
                   {processPerformance.map((entry, index) => (
                    <Cell key={`cell-active-${index}`} cursor="pointer" />
                  ))}
                </Bar>
                <Bar dataKey="completed" stackId="a" fill="#1e293b" barSize={32}>
                   {processPerformance.map((entry, index) => (
                    <Cell key={`cell-comp-${index}`} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NexCard>
      </div>
    </div>
  );
};
