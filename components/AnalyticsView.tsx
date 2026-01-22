
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Line 
} from 'recharts';
import { TrendingUp, Clock, Target, Zap, Activity, LucideIcon, ArrowUpRight, ArrowDownRight, Filter, GripVertical, AlertTriangle } from 'lucide-react';
import { NexCard, NexButton } from './shared/NexUI';
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

  const volumeForecast = useMemo(() => {
    // Simplified forecast logic for brevity
    const days = timeRange === '24h' ? 24 : 7;
    return Array.from({ length: days }).map((_, i) => ({
        name: i.toString(),
        actual: Math.floor(Math.random() * 50),
        forecast: Math.floor(Math.random() * 50) + 10
    }));
  }, [timeRange]);

  const bottleneckData = useMemo(() => {
      // Simplified
      return [{ step: 'Approval', avgTime: 2.5, sla: 2, impact: 'High' }];
  }, []);

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
                    <div key="kpi-throughput"><KPICard isEditable={isEditable} title="Global Throughput" value={completedInstances} change="12%" trend="up" icon={Zap} color="blue" onClick={() => !isEditable && navigateTo('governance')} /></div>
                    <div key="kpi-cycle"><KPICard isEditable={isEditable} title="Avg Cycle Time" value="1.8d" change="5%" trend="down" icon={Clock} color="slate" onClick={() => !isEditable && navigateTo('inbox')} /></div>
                    <div key="kpi-risk"><KPICard isEditable={isEditable} title="SLA Breach Risk" value="High" change="3" trend="up" icon={AlertTriangle} color="rose" onClick={() => !isEditable && navigateTo('explorer', undefined, 'Critical')} /></div>
                    <div key="kpi-util"><KPICard isEditable={isEditable} title="Resource Util" value="84%" change="2%" trend="up" icon={Activity} color="violet" onClick={() => !isEditable && navigateTo('resource-planner')} /></div>

                    <NexCard key="chart-forecast" className="p-0 overflow-hidden flex flex-col h-full" dragHandle={isEditable}>
                        <div className="px-4 py-3 border-b border-default bg-subtle flex items-center justify-between">
                            <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><TrendingUp size={14} className="text-blue-500"/> Volume Forecast</h3>
                        </div>
                        <div className="flex-1 p-4 bg-panel">
                            <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={volumeForecast}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                <Tooltip />
                                <Area type="monotone" dataKey="actual" stroke="#3b82f6" fillOpacity={0.2} fill="#3b82f6" />
                                <Line type="monotone" dataKey="forecast" stroke="#6366f1" strokeDasharray="5 5" />
                            </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </NexCard>

                    <NexCard key="chart-bottleneck" className="p-0 overflow-hidden flex flex-col h-full" dragHandle={isEditable}>
                        <div className="px-4 py-3 border-b border-default bg-subtle"><h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><Target size={14} className="text-rose-500"/> Process Friction</h3></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-panel">
                            {bottleneckData.map((b, i) => (
                                <div key={i} className="space-y-1 p-2 rounded-sm border border-default">
                                    <div className="flex justify-between items-center text-xs"><span className="font-bold text-primary">{b.step}</span></div>
                                </div>
                            ))}
                        </div>
                    </NexCard>
                </>
            )}
        </PageGridLayout>
      </div>
    </div>
  );
};
