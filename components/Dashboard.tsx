
import React, { useState, useEffect, useMemo } from 'react';
import { Activity, ListChecks, DollarSign, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useBPM } from '../contexts/BPMContext';
import { NexCard } from './shared/NexUI';
import { PageGridLayout } from './shared/PageGridLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getProcessInsights } from '../services/geminiService';

const MetricPanel = React.forwardRef<HTMLDivElement, any>(({ label, value, sub, icon: Icon, color, onClick, ...props }, ref) => {
  const colors: Record<string, string> = {
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    red: 'text-rose-700 bg-rose-50 border-rose-200'
  };

  return (
    <NexCard
      ref={ref}
      onClick={onClick} 
      dragHandle={props.isDraggable}
      className={`border-l-4 border-l-transparent hover:border-l-blue-600 h-full p-4`}
      style={{ ...props.style }}
      {...props}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {label}
            </p>
            <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
        </div>
        <p className="text-[11px] text-slate-400">{sub}</p>
      </div>
      <div className={`absolute top-4 right-4 rounded-sm border flex items-center justify-center w-10 h-10 ${colors[color].replace('text-', 'border-').split(' ')[2]} ${colors[color].split(' ')[1]} ${colors[color].split(' ')[0]}`}>
        <Icon size={18} />
      </div>
    </NexCard>
  );
});

export const Dashboard: React.FC = () => {
  const { tasks, cases, auditLogs, navigateTo, addNotification } = useBPM();
  const [activeTab, setActiveTab] = useState('Overview');
  const [aiInsight, setAiInsight] = useState("Analyzing operational telemetry...");
  
  const criticalCount = tasks.filter(t => t.priority === 'Critical').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = tasks.length || 1;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  const defaultLayouts = {
    lg: [
      { i: 'metric-progress', x: 0, y: 0, w: 3, h: 4 },
      { i: 'metric-exposure', x: 3, y: 0, w: 3, h: 4 },
      { i: 'metric-risks', x: 6, y: 0, w: 3, h: 4 },
      { i: 'metric-quality', x: 9, y: 0, w: 3, h: 4 },
      { i: 'chart-velocity', x: 0, y: 4, w: 8, h: 10 },
      { i: 'ai-advisor', x: 8, y: 4, w: 4, h: 10 }
    ],
    md: [
      { i: 'metric-progress', x: 0, y: 0, w: 5, h: 4 },
      { i: 'metric-exposure', x: 5, y: 0, w: 5, h: 4 },
      { i: 'metric-risks', x: 0, y: 4, w: 5, h: 4 },
      { i: 'metric-quality', x: 5, y: 4, w: 5, h: 4 },
      { i: 'chart-velocity', x: 0, y: 8, w: 10, h: 10 },
      { i: 'ai-advisor', x: 0, y: 18, w: 10, h: 8 }
    ]
  };

  const varianceValue = useMemo(() => {
    const totalImpact = cases
        .filter(c => c.status !== 'Closed')
        .reduce((sum, c) => sum + (c.data?.impactAmount || 0), 0);
    
    if (totalImpact > 1000000) return `$${(totalImpact / 1000000).toFixed(2)}M`;
    if (totalImpact > 1000) return `$${(totalImpact / 1000).toFixed(0)}K`;
    return `$${totalImpact}`;
  }, [cases]);

  const qualityRate = useMemo(() => {
    const approvals = auditLogs.filter(l => l.action === 'TASK_COMPLETE' && l.details.includes('Approved')).length;
    const rejections = auditLogs.filter(l => l.action === 'TASK_COMPLETE' && l.details.includes('Rejected')).length;
    const totalDecisions = approvals + rejections;
    return totalDecisions === 0 ? 100 : Math.round((approvals / totalDecisions) * 100);
  }, [auditLogs]);

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
      
      data.push({ name: dateStr, tasks: count });
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

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <div 
        className="flex items-center justify-between bg-white border border-slate-300 shadow-sm shrink-0 mb-4 px-4 py-2"
        style={{ borderRadius: 'var(--radius-base)' }}
      >
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
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 border-l border-slate-200">
              <span className="text-[11px] font-bold text-slate-500">LAST SYNC:</span>
              <span className="text-[11px] font-mono text-slate-800">{new Date().toLocaleTimeString()}</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <PageGridLayout
            defaultLayouts={defaultLayouts}
            toolbarActions={[
                { label: 'Export Report (PDF)', action: () => addNotification('info', 'Report generation started...') },
                { label: 'Export Data (CSV)', action: () => addNotification('info', 'CSV download started...') }
            ]}
        >
            <div key="metric-progress">
                <MetricPanel 
                    onClick={() => navigateTo('inbox')} 
                    label="Progress" 
                    value={`${progress}%`} 
                    sub={`${completedTasks}/${totalTasks} Tasks`} 
                    icon={ListChecks} 
                    color="blue" 
                />
            </div>
            <div key="metric-exposure">
                <MetricPanel 
                    onClick={() => navigateTo('cases')} 
                    label="Exposure" 
                    value={varianceValue} 
                    sub="Active Case Impact" 
                    icon={DollarSign} 
                    color="green" 
                />
            </div>
            <div key="metric-risks">
                <MetricPanel 
                    onClick={() => navigateTo('inbox', undefined, 'Critical')} 
                    label="Risks" 
                    value={criticalCount} 
                    sub="Critical Items" 
                    icon={AlertCircle} 
                    color="red" 
                />
            </div>
            <div key="metric-quality">
                <MetricPanel 
                    onClick={() => navigateTo('governance')} 
                    label="Quality" 
                    value={`${qualityRate}%`} 
                    sub="Approval Rate" 
                    icon={ShieldCheck} 
                    color="green" 
                />
            </div>

            <NexCard key="chart-velocity" className="p-0 overflow-hidden flex flex-col h-full">
                <div className="border-b border-slate-200 bg-slate-50 flex justify-between items-center px-4 py-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                    <Activity size={14} className="text-slate-400"/> Operational Velocity
                    </h3>
                    <button onClick={() => navigateTo('analytics')} className="text-blue-600 text-xs font-medium hover:underline">View Report</button>
                </div>
                <div className="flex-1 bg-white cursor-pointer p-4" onClick={() => navigateTo('governance')}>
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

            <NexCard key="ai-advisor" className="flex flex-col p-0 h-full">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500"/> AI Advisor
                    </h3>
                </div>
                <div className="flex-1 bg-slate-50/30 flex flex-col justify-between p-4">
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
        </PageGridLayout>
      </div>
    </div>
  );
};
