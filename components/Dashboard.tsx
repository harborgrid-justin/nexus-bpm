
import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Clock, AlertCircle, ShieldCheck, Briefcase, Sparkles, ListChecks, DollarSign, Gauge, LucideIcon, TrendingUp } from 'lucide-react';
import { useBPM } from '../contexts/BPMContext';
import { NexCard } from './shared/NexUI';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getProcessInsights } from '../services/geminiService';

interface MetricPanelProps {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'amber' | 'red';
  onClick?: () => void;
}

const MetricPanel = ({ label, value, sub, icon: Icon, color, onClick }: MetricPanelProps) => {
  const colors = {
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    red: 'text-rose-700 bg-rose-50 border-rose-200'
  };

  return (
    <NexCard 
      onClick={onClick} 
      className={`flex items-center justify-between border-l-4 border-l-transparent hover:border-l-blue-600 transition-all cursor-pointer`}
      style={{ padding: 'var(--card-padding)' }} // Dynamic Padding
    >
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-2xl font-bold text-slate-900 leading-none mb-1">{value}</div>
        <p className="text-[11px] text-slate-400">{sub}</p>
      </div>
      <div className={`p-2 rounded-sm border ${colors[color].replace('text-', 'border-').split(' ')[2]} ${colors[color].split(' ')[1]} ${colors[color].split(' ')[0]}`}>
        <Icon size={18} />
      </div>
    </NexCard>
  );
};

export const Dashboard: React.FC = () => {
  const { tasks, cases, auditLogs, navigateTo } = useBPM();
  const [activeTab, setActiveTab] = useState('Overview');
  const [aiInsight, setAiInsight] = useState("Analyzing operational telemetry...");
  
  // Real-time Metrics Calculation
  const criticalCount = tasks.filter(t => t.priority === 'Critical').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = tasks.length || 1;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  // Real Financial Variance from Active Cases
  const varianceValue = useMemo(() => {
    const totalImpact = cases
        .filter(c => c.status !== 'Closed')
        .reduce((sum, c) => sum + (c.data?.impactAmount || 0), 0);
    
    // Convert to Millions for display if > 1M, else K
    if (totalImpact > 1000000) return `$${(totalImpact / 1000000).toFixed(2)}M`;
    if (totalImpact > 1000) return `$${(totalImpact / 1000).toFixed(0)}K`;
    return `$${totalImpact}`;
  }, [cases]);

  // Quality Metric (Approval Rate)
  const qualityRate = useMemo(() => {
    const approvals = auditLogs.filter(l => l.action === 'TASK_COMPLETE' && l.details.includes('Approved')).length;
    const rejections = auditLogs.filter(l => l.action === 'TASK_COMPLETE' && l.details.includes('Rejected')).length;
    const totalDecisions = approvals + rejections;
    return totalDecisions === 0 ? 100 : Math.round((approvals / totalDecisions) * 100);
  }, [auditLogs]);

  // Velocity Chart Data (Real Audit Logs)
  const velocityData = useMemo(() => {
    const days = 7;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { weekday: 'short' });
      
      const count = auditLogs.filter(l => {
        const logDate = new Date(l.timestamp);
        return logDate.toDateString() === d.toDateString() && l.action.includes('TASK');
      }).length;
      
      // Jitter for demo if empty to show the chart isn't broken
      const displayCount = count;
      
      data.push({ name: dateStr, tasks: displayCount });
    }
    return data;
  }, [auditLogs]);

  useEffect(() => {
    const fetchInsight = async () => {
      const context = {
        openTasks: tasks.length,
        critical: criticalCount,
        quality: qualityRate,
        velocity: velocityData.map(d => d.tasks)
      };
      const insight = await getProcessInsights(context);
      setAiInsight(insight);
    };
    fetchInsight();
  }, [tasks.length, criticalCount]);

  const handleChartClick = () => {
      navigateTo('governance');
  };

  return (
    <div 
      className="animate-fade-in flex flex-col"
      style={{ gap: 'var(--layout-gap)' }}
    >
      {/* Dense Top Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-300 p-2 rounded-sm shadow-sm">
        <div className="flex gap-1">
          {['Overview', 'Planning', 'Execution', 'Control'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-sm transition-all ${activeTab === tab ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 border-l border-slate-200">
           <span className="text-[11px] font-bold text-slate-500">LAST SYNC:</span>
           <span className="text-[11px] font-mono text-slate-800">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-4"
        style={{ gap: 'var(--layout-gap)' }}
      >
        <MetricPanel onClick={() => navigateTo('inbox')} label="Progress" value={`${progress}%`} sub={`${completedTasks}/${totalTasks} Tasks`} icon={ListChecks} color="blue" />
        <MetricPanel onClick={() => navigateTo('cases')} label="Exposure" value={varianceValue} sub="Active Case Impact" icon={DollarSign} color="green" />
        <MetricPanel onClick={() => navigateTo('inbox', undefined, 'Critical')} label="Risks" value={criticalCount} sub="Critical Items" icon={AlertCircle} color="red" />
        <MetricPanel onClick={() => navigateTo('governance')} label="Quality" value={`${qualityRate}%`} sub="Approval Rate" icon={ShieldCheck} color="green" />
      </div>

      <div 
        className="grid grid-cols-1 lg:grid-cols-3"
        style={{ gap: 'var(--layout-gap)' }}
      >
        {/* Main Chart Area */}
        <NexCard className="lg:col-span-2 p-0 overflow-hidden min-h-[300px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
              <Activity size={14} className="text-slate-400"/> Operational Velocity
            </h3>
            <button onClick={() => navigateTo('analytics')} className="text-blue-600 text-xs font-medium hover:underline">View Report</button>
          </div>
          <div className="p-4 h-64 bg-white cursor-pointer" onClick={handleChartClick}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={velocityData}>
                 <defs>
                   <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#0284c7" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} />
                 <Tooltip 
                   cursor={{ stroke: '#0284c7', strokeWidth: 1 }}
                   contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                 />
                 <Area type="monotone" dataKey="tasks" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorTasks)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </NexCard>

        {/* Actionable Insights */}
        <NexCard className="flex flex-col p-0">
           <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
             <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
               <Sparkles size={14} className="text-amber-500"/> AI Advisor
             </h3>
           </div>
           <div className="p-4 flex-1 bg-slate-50/30 flex flex-col">
             <div className="bg-white border-l-4 border-l-amber-500 border border-slate-200 p-4 shadow-sm mb-4 flex-1">
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {aiInsight}
                </p>
             </div>
             <button onClick={() => navigateTo('designer')} className="w-full py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold uppercase hover:bg-slate-50 transition-all shadow-sm">
               Optimize Workflows
             </button>
           </div>
        </NexCard>
      </div>
    </div>
  );
};
