import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, ComposedChart, Line, Legend
} from 'recharts';
import { TrendingUp, Clock, Target, Zap, Activity, Globe, LucideIcon, AlertTriangle, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { NexCard, NexButton } from './shared/NexUI';

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
    icon: LucideIcon;
    color: 'blue' | 'emerald' | 'rose' | 'slate' | 'violet';
    onClick: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, trend, icon: Icon, color, onClick }) => {
    const colors: Record<string, string> = {
        blue: 'text-blue-600 bg-blue-50 border-blue-200',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        rose: 'text-rose-600 bg-rose-50 border-rose-200',
        slate: 'text-slate-600 bg-slate-50 border-slate-200',
        violet: 'text-violet-600 bg-violet-50 border-violet-200',
    };
    
    return (
        <div onClick={onClick} className={`bg-white p-4 border rounded-sm shadow-sm cursor-pointer hover:shadow-md transition-all group relative overflow-hidden ${colors[color].replace('text-', 'hover:border-').split(' ')[2]}`}>
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={`p-1.5 rounded-sm ${colors[color]}`}>
                    <Icon size={16}/>
                </div>
                {change && (
                    <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-sm ${trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                        {trend === 'up' ? <ArrowUpRight size={10} className="mr-0.5"/> : <ArrowDownRight size={10} className="mr-0.5"/>}
                        {change}
                    </span>
                )}
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase relative z-10">{title}</p>
            <h4 className="text-2xl font-bold text-slate-900 leading-tight relative z-10">{value}</h4>
            
            {/* Decorator Icon */}
            <Icon size={64} className={`absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110 ${colors[color].split(' ')[0]}`} />
        </div>
    );
};

export const AnalyticsView: React.FC = () => {
  const { instances, processes, tasks, navigateTo } = useBPM();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  const completedInstances = instances.filter(i => i.status === 'Completed').length;
  
  const avgSLACompliance = useMemo(() => {
     const completedTasks = tasks.filter(t => t.status === 'Completed');
     if (completedTasks.length === 0) return 100;
     const onTime = completedTasks.filter(t => new Date(t.dueDate) > new Date()).length;
     return ((onTime / completedTasks.length) * 100).toFixed(1);
  }, [tasks]);

  // Mock Predictive Data Generator
  const volumeForecast = useMemo(() => {
    const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const data = [];
    const today = new Date();
    
    // Historical
    for (let i = days; i > 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const name = timeRange === '24h' ? `${d.getHours()}:00` : d.toLocaleDateString(undefined, { weekday: 'short' });
        
        // Random "Actual" data with sine wave pattern
        const base = 50 + Math.sin(i) * 20;
        const actual = Math.floor(base + Math.random() * 10);
        
        data.push({ name, actual, forecast: null, ci_upper: null, ci_lower: null });
    }

    // Future (Forecast)
    for (let i = 1; i <= 5; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const name = d.toLocaleDateString(undefined, { weekday: 'short' }) + "*";
        
        const base = 50 + Math.sin(i) * 20;
        const forecast = Math.floor(base + 5); // Slight growth trend
        
        data.push({ 
            name, 
            actual: null, 
            forecast, 
            ci_upper: forecast + 10, // Confidence Interval
            ci_lower: forecast - 10 
        });
    }
    return data;
  }, [timeRange]);

  const bottleneckData = useMemo(() => {
      // Mock bottleneck analysis based on step types
      const bottlenecks = [
          { step: 'Approvals', avgTime: 4.2, sla: 2.0, impact: 'High' },
          { step: 'Doc Verification', avgTime: 1.8, sla: 2.0, impact: 'Low' },
          { step: 'Payment Processing', avgTime: 0.5, sla: 0.2, impact: 'Medium' },
          { step: 'External API Sync', avgTime: 3.1, sla: 1.0, impact: 'Critical' },
      ];
      return bottlenecks.sort((a,b) => b.avgTime - a.avgTime);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-300 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Performance Analytics</h2>
          <p className="text-xs text-slate-500 font-medium">Predictive modeling & operational telemetry.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-sm border border-slate-200">
                {['24h', '7d', '30d', '90d'].map(r => (
                    <button 
                        key={r}
                        onClick={() => setTimeRange(r as any)}
                        className={`px-3 py-1 text-[10px] font-bold uppercase transition-all rounded-sm ${timeRange === r ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        {r}
                    </button>
                ))}
            </div>
            <NexButton variant="secondary" icon={Filter} className="px-2">Filter</NexButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Global Throughput" value={completedInstances} change="12%" trend="up" icon={Zap} color="blue" onClick={() => navigateTo('governance')} />
        <KPICard title="Avg Cycle Time" value="1.8d" change="5%" trend="down" icon={Clock} color="slate" onClick={() => navigateTo('inbox')} />
        <KPICard title="SLA Breach Risk" value="High" change="3" trend="up" icon={AlertTriangle} color="rose" onClick={() => navigateTo('explorer', undefined, 'Critical')} />
        <KPICard title="Resource Util" value="84%" change="2%" trend="up" icon={Activity} color="violet" onClick={() => navigateTo('resource-planner')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Forecast Chart */}
        <NexCard className="lg:col-span-2 p-0 overflow-hidden h-[400px] flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-500"/> Volume Forecast (AI Model v2)
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> <span className="text-[10px] font-bold text-slate-500">Actuals</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-indigo-400 rounded-full border border-white ring-1 ring-indigo-400"></div> <span className="text-[10px] font-bold text-slate-500">Predicted</span></div>
            </div>
          </div>
          <div className="flex-1 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={volumeForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <pattern id="patternForecast" patternUnits="userSpaceOnUse" width="4" height="4">
                      <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#818cf8" strokeWidth="1" />
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} />
                <Tooltip 
                    contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                
                {/* Confidence Interval Area */}
                <Area type="monotone" dataKey="ci_upper" stroke="none" fill="#e0e7ff" fillOpacity={0.4} />
                <Area type="monotone" dataKey="ci_lower" stroke="none" fill="#ffffff" fillOpacity={1} /> 

                <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                <Line type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </NexCard>

        {/* Bottleneck Analysis */}
        <NexCard className="p-0 overflow-hidden flex flex-col h-[400px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
              <Target size={14} className="text-rose-500"/> Process Friction
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {bottleneckData.map((b, i) => {
                  const variance = ((b.avgTime - b.sla) / b.sla) * 100;
                  return (
                    <div key={i} className="space-y-1 group cursor-pointer hover:bg-slate-50 p-2 rounded-sm -mx-2 transition-colors">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">{b.step}</span>
                            <span className={`font-bold ${variance > 50 ? 'text-rose-600' : 'text-amber-600'}`}>+{variance.toFixed(0)}% var</span>
                        </div>
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="absolute top-0 bottom-0 left-0 bg-slate-300 w-1/2" title="SLA Baseline"></div>
                            <div 
                                className={`absolute top-0 bottom-0 left-0 h-full rounded-full ${b.impact === 'Critical' ? 'bg-rose-500' : b.impact === 'High' ? 'bg-orange-500' : 'bg-blue-500'}`} 
                                style={{ width: `${Math.min(100, (b.avgTime / 5) * 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Avg: {b.avgTime}d</span>
                            <span>SLA: {b.sla}d</span>
                        </div>
                    </div>
                  )
              })}
              
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-800">
                  <p className="font-bold flex items-center gap-2 mb-1"><Zap size={12}/> Recommendation</p>
                  Consider adding capacity to "External API Sync" or loosening SLA requirements.
              </div>
          </div>
        </NexCard>
      </div>
    </div>
  );
};