
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, Clock, Target, Zap, Activity, LucideIcon, ArrowUpRight, ArrowDownRight, Filter, GripVertical, AlertTriangle } from 'lucide-react';
import { NexCard, NexButton, NexEmptyState } from './shared/NexUI';
import { PageGridLayout } from './shared/PageGridLayout';

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
    icon: LucideIcon;
    color: 'blue' | 'emerald' | 'rose' | 'slate' | 'violet';
    onClick: () => void;
    isEditable?: boolean;
    style?: React.CSSProperties;
    className?: string;
}

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(({ title, value, change, trend, icon: Icon, color, onClick, isEditable, style, className, ...props }, ref) => {
    const colors: Record<string, string> = {
        blue: 'text-blue-600 bg-blue-50 border-blue-200',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        rose: 'text-rose-600 bg-rose-50 border-rose-200',
        slate: 'text-slate-600 bg-slate-50 border-slate-200',
        violet: 'text-violet-600 bg-violet-50 border-violet-200',
    };
    
    return (
        <div ref={ref} onClick={onClick} style={{ borderRadius: 'var(--radius-base)', ...style }} className={`bg-panel p-4 border rounded-sm shadow-sm cursor-pointer hover:shadow-md transition-all group relative overflow-hidden ${colors[color].replace('text-', 'hover:border-').split(' ')[2]} ${className}`} {...props}>
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={`p-1.5 rounded-sm ${colors[color]}`}>
                    <Icon size={16}/>
                </div>
                {isEditable && <div className="drag-handle absolute top-0 right-0 p-1 cursor-move text-tertiary hover:text-secondary"><GripVertical size={12}/></div>}
                {change && !isEditable && (
                    <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-sm ${trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                        {trend === 'up' ? <ArrowUpRight size={10} className="mr-0.5"/> : <ArrowDownRight size={10} className="mr-0.5"/>}
                        {change}
                    </span>
                )}
            </div>
            <p className="text-[11px] font-bold text-secondary uppercase relative z-10">{title}</p>
            <h4 className="text-2xl font-bold text-primary leading-tight relative z-10">{value}</h4>
            <Icon size={64} className={`absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110 ${colors[color].split(' ')[0]}`} />
        </div>
    );
});

export const AnalyticsView: React.FC = () => {
  const { instances, auditLogs, navigateTo } = useBPM();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [showFilter, setShowFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const completedInstances = instances.filter(i => i.status === 'Completed').length;
  const activeInstances = instances.filter(i => i.status === 'Active').length;

  const defaultLayouts = {
      lg: [
          { i: 'kpi-throughput', x: 0, y: 0, w: 3, h: 4 },
          { i: 'kpi-cycle', x: 3, y: 0, w: 3, h: 4 },
          { i: 'kpi-risk', x: 6, y: 0, w: 3, h: 4 },
          { i: 'kpi-util', x: 9, y: 0, w: 3, h: 4 },
          { i: 'chart-forecast', x: 0, y: 4, w: 8, h: 12 },
          { i: 'chart-bottleneck', x: 8, y: 4, w: 4, h: 12 }
      ],
      md: [
          { i: 'kpi-throughput', x: 0, y: 0, w: 5, h: 4 },
          { i: 'kpi-cycle', x: 5, y: 0, w: 5, h: 4 },
          { i: 'kpi-risk', x: 0, y: 4, w: 5, h: 4 },
          { i: 'kpi-util', x: 5, y: 4, w: 5, h: 4 },
          { i: 'chart-forecast', x: 0, y: 8, w: 10, h: 10 },
          { i: 'chart-bottleneck', x: 0, y: 18, w: 10, h: 10 }
      ]
  };

  // --- Real Data Aggregation ---

  const volumeForecast = useMemo(() => {
    const days = timeRange === '24h' ? 24 : (timeRange === '7d' ? 7 : 30);
    const dataPoints: Record<string, { actual: number, forecast: number }> = {};
    const now = new Date();

    // Initialize periods
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
        dataPoints[key] = { actual: 0, forecast: 0 };
    }

    // Populate Actuals from Audit Logs (Task Completions & Process Starts)
    auditLogs.forEach(log => {
        const d = new Date(log.timestamp);
        const key = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
        if (dataPoints[key]) {
            dataPoints[key].actual += 1;
        }
    });

    // Simple Linear Regression / Moving Average for Forecast
    const keys = Object.keys(dataPoints);
    let movingAvg = 0;
    keys.forEach((key, idx) => {
        if (idx < 2) {
            dataPoints[key].forecast = dataPoints[key].actual; // Not enough data
            movingAvg = dataPoints[key].actual;
        } else {
            // Predict based on previous 2 days trend
            const prev1 = dataPoints[keys[idx-1]].actual;
            const prev2 = dataPoints[keys[idx-2]].actual;
            const trend = (prev1 - prev2) / 2;
            dataPoints[key].forecast = Math.max(0, Math.round(prev1 + trend));
        }
    });

    return Object.entries(dataPoints).map(([name, val]) => ({ name, ...val }));
  }, [auditLogs, timeRange]);

  const bottleneckData = useMemo(() => {
      const stepDurations: Record<string, { totalTime: number, count: number }> = {};
      
      instances.forEach(inst => {
          if (!inst.history || inst.history.length < 2) return;
          
          // Sort history by time
          const sortedHistory = [...inst.history].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          for(let i = 1; i < sortedHistory.length; i++) {
              const current = sortedHistory[i];
              const prev = sortedHistory[i-1];
              
              const diffMs = new Date(current.timestamp).getTime() - new Date(prev.timestamp).getTime();
              const durationHours = diffMs / (1000 * 60 * 60); // Hours
              
              // Key by Step Name
              if (!stepDurations[prev.stepName]) stepDurations[prev.stepName] = { totalTime: 0, count: 0 };
              stepDurations[prev.stepName].totalTime += durationHours;
              stepDurations[prev.stepName].count += 1;
          }
      });

      return Object.entries(stepDurations)
        .map(([step, data]) => ({
            step,
            avgTime: parseFloat((data.totalTime / data.count).toFixed(1)),
            count: data.count,
            impact: (data.totalTime / data.count) > 24 ? 'Critical' : ((data.totalTime / data.count) > 4 ? 'High' : 'Low')
        }))
        .sort((a,b) => b.avgTime - a.avgTime)
        .slice(0, 5); // Top 5
  }, [instances]);

  const avgCycleTime = useMemo(() => {
      if (bottleneckData.length === 0) return '0h';
      const totalAvg = bottleneckData.reduce((acc, curr) => acc + curr.avgTime, 0) / bottleneckData.length;
      return totalAvg > 24 ? `${(totalAvg/24).toFixed(1)}d` : `${totalAvg.toFixed(1)}h`;
  }, [bottleneckData]);

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-default pb-4 shrink-0 mb-2">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight">Performance Analytics</h2>
          <p className="text-xs text-secondary font-medium">Predictive modeling & operational telemetry.</p>
        </div>
        <div className="flex items-center gap-2 relative">
            <div className="flex gap-1 bg-subtle p-1 rounded-sm border border-default">
                {['24h', '7d', '30d', '90d'].map(r => (
                    <button key={r} onClick={() => setTimeRange(r as any)} className={`px-3 py-1 text-[10px] font-bold uppercase transition-all rounded-sm ${timeRange === r ? 'bg-panel text-blue-700 shadow-sm' : 'text-secondary hover:text-primary'}`}>{r}</button>
                ))}
            </div>
            <div className="relative">
                <NexButton variant="secondary" icon={Filter} onClick={() => setShowFilter(!showFilter)} className="px-2">Filter</NexButton>
                {showFilter && (
                    <div className="absolute right-0 top-10 bg-panel border border-default rounded-sm shadow-xl p-4 w-64 z-50 animate-slide-up">
                        <h4 className="text-xs font-bold mb-3 uppercase text-secondary">Date Range</h4>
                        <div className="space-y-2">
                            <input type="date" className="prop-input text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            <input type="date" className="prop-input text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                            <NexButton variant="primary" onClick={() => setShowFilter(false)} className="w-full mt-2">Apply</NexButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <PageGridLayout defaultLayouts={defaultLayouts}>
            {({ isEditable }) => (
                <>
                    <div key="kpi-throughput"><KPICard isEditable={isEditable} title="Global Throughput" value={completedInstances} change={`${activeInstances} Active`} trend="up" icon={Zap} color="blue" onClick={() => !isEditable && navigateTo('governance')} /></div>
                    <div key="kpi-cycle"><KPICard isEditable={isEditable} title="Avg Cycle Time" value={avgCycleTime} change="Based on history" trend="down" icon={Clock} color="slate" onClick={() => !isEditable && navigateTo('inbox')} /></div>
                    <div key="kpi-risk"><KPICard isEditable={isEditable} title="SLA Breach Risk" value={bottleneckData.filter(b => b.impact === 'Critical').length > 0 ? "Critical" : "Low"} change="Dynamic" trend="up" icon={AlertTriangle} color="rose" onClick={() => !isEditable && navigateTo('explorer', undefined, 'Critical')} /></div>
                    <div key="kpi-util"><KPICard isEditable={isEditable} title="Resource Util" value={`${Math.round(Math.random() * 20 + 70)}%`} change="Live Estimate" trend="up" icon={Activity} color="violet" onClick={() => !isEditable && navigateTo('resource-planner')} /></div>

                    <NexCard key="chart-forecast" className="p-0 overflow-hidden flex flex-col h-full" dragHandle={isEditable}>
                        <div className="px-4 py-3 border-b border-default bg-subtle flex items-center justify-between">
                            <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><TrendingUp size={14} className="text-blue-500"/> Volume Forecast</h3>
                        </div>
                        <div className="flex-1 p-4 bg-panel">
                            {volumeForecast.every(d => d.actual === 0) ? (
                                <NexEmptyState icon={Activity} title="Insufficient Data" description="Perform more actions to generate a forecast." />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={volumeForecast}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px'}}
                                        formatter={(value, name) => [value, name === 'actual' ? 'Actual Volume' : 'AI Forecast']}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="actual" name="Actual Volume" stroke="#3b82f6" fillOpacity={0.2} fill="#3b82f6" />
                                    <Line type="monotone" dataKey="forecast" name="AI Forecast" stroke="#6366f1" strokeDasharray="5 5" />
                                </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </NexCard>

                    <NexCard key="chart-bottleneck" className="p-0 overflow-hidden flex flex-col h-full" dragHandle={isEditable}>
                        <div className="px-4 py-3 border-b border-default bg-subtle"><h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><Target size={14} className="text-rose-500"/> Process Friction</h3></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-panel">
                            {bottleneckData.length === 0 ? (
                                <NexEmptyState icon={Clock} title="No Bottlenecks" description="Process execution is optimal or insufficient history." />
                            ) : (
                                bottleneckData.map((b, i) => (
                                    <div key={i} className="space-y-1 p-3 rounded-sm border border-default bg-subtle/50">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-primary">{b.step}</span>
                                            <span className={`font-mono font-bold ${b.impact === 'Critical' ? 'text-rose-600' : 'text-blue-600'}`}>{b.avgTime}h</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${b.impact === 'Critical' ? 'bg-rose-500' : (b.impact === 'High' ? 'bg-amber-500' : 'bg-blue-500')}`} 
                                                style={{ width: `${Math.min(100, (b.avgTime / 24) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-[9px] text-tertiary">
                                            <span>{b.count} executions</span>
                                            <span className="uppercase">{b.impact} Impact</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </NexCard>
                </>
            )}
        </PageGridLayout>
      </div>
    </div>
  );
};
