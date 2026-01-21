
import React, { useState, useMemo, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, ComposedChart, Line, Legend
} from 'recharts';
import { TrendingUp, Clock, Target, Zap, Activity, Globe, LucideIcon, AlertTriangle, ArrowUpRight, ArrowDownRight, Filter, Settings, GripVertical } from 'lucide-react';
import { NexCard, NexButton } from './shared/NexUI';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

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
        <div ref={ref} onClick={onClick} style={style} className={`bg-white p-4 border rounded-sm shadow-sm cursor-pointer hover:shadow-md transition-all group relative overflow-hidden ${colors[color].replace('text-', 'hover:border-').split(' ')[2]} ${className}`} {...props}>
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={`p-1.5 rounded-sm ${colors[color]}`}>
                    <Icon size={16}/>
                </div>
                {isEditable && <div className="drag-handle absolute top-0 right-0 p-1 cursor-move text-slate-300 hover:text-slate-500"><GripVertical size={12}/></div>}
                {change && !isEditable && (
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
});

export const AnalyticsView: React.FC = () => {
  const { instances, tasks, auditLogs, navigateTo, setToolbarConfig } = useBPM();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [showFilter, setShowFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isEditable, setIsEditable] = useState(false);

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

  const [layouts, setLayouts] = useState(defaultLayouts);

  useEffect(() => {
      setToolbarConfig({
          view: [
              { label: isEditable ? 'Lock Dashboard' : 'Edit Dashboard', action: () => setIsEditable(!isEditable), icon: Settings },
              { label: 'Reset Layout', action: () => setLayouts(defaultLayouts) }
          ]
      });
  }, [setToolbarConfig, isEditable]);
  
  // Real Volume Forecast using Simple Linear Regression
  const volumeForecast = useMemo(() => {
    const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const data = [];
    const today = new Date();
    
    // 1. Gather Historical Data
    const historyPoints: number[] = [];
    
    for (let i = days; i > 0; i--) {
        const d = new Date(today);
        if (timeRange === '24h') {
            d.setHours(today.getHours() - i);
        } else {
            d.setDate(today.getDate() - i);
        }
        
        const label = timeRange === '24h' 
            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : d.toLocaleDateString(undefined, { weekday: 'short' });
        
        let actual = 0;
        if (timeRange === '24h') {
             actual = auditLogs.filter(l => {
                 const logDate = new Date(l.timestamp);
                 return logDate.getDate() === d.getDate() && logDate.getHours() === d.getHours();
             }).length;
        } else {
             actual = auditLogs.filter(l => {
                 const logDate = new Date(l.timestamp);
                 return logDate.toDateString() === d.toDateString();
             }).length;
        }
        
        // Add minimal noise if zero for visual line continuity in demo
        actual = Math.max(actual, 0); 
        historyPoints.push(actual);

        data.push({ name: label, actual, forecast: null, ci_upper: null, ci_lower: null });
    }

    // 2. Calculate Trend (Slope)
    const n = historyPoints.length;
    const sumX = n * (n - 1) / 2;
    const sumY = historyPoints.reduce((a, b) => a + b, 0);
    const sumXY = historyPoints.reduce((acc, val, idx) => acc + (idx * val), 0);
    const sumXX = historyPoints.reduce((acc, _, idx) => acc + (idx * idx), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n || 0;

    // 3. Project Future
    const lastActualIndex = n - 1;
    for (let i = 1; i <= 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const name = d.toLocaleDateString(undefined, { weekday: 'short' }) + "*";
        
        // y = mx + c
        const forecastVal = slope * (lastActualIndex + i) + intercept;
        const forecast = Math.max(0, Math.round(forecastVal));
        
        // Confidence Interval (Simplified for demo visualization)
        const stdDev = Math.sqrt(historyPoints.reduce((acc, val) => acc + Math.pow(val - (sumY/n), 2), 0) / n) || 1;
        
        data.push({ 
            name, 
            actual: null, 
            forecast, 
            ci_upper: forecast + stdDev, 
            ci_lower: Math.max(0, forecast - stdDev) 
        });
    }
    return data;
  }, [timeRange, auditLogs]);

  // Bottleneck Analysis calculated from Instance History
  const bottleneckData = useMemo(() => {
      const stepDurations: Record<string, { total: number, count: number }> = {};
      
      instances.forEach(inst => {
          if (inst.history.length < 2) return;
          
          const sorted = [...inst.history].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          for (let i = 1; i < sorted.length; i++) {
              const prev = sorted[i-1];
              const curr = sorted[i];
              const diffMs = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
              const stepName = prev.stepName;
              
              if (!stepDurations[stepName]) stepDurations[stepName] = { total: 0, count: 0 };
              stepDurations[stepName].total += diffMs;
              stepDurations[stepName].count++;
          }
      });

      const bottlenecks = Object.keys(stepDurations).map(step => {
          const avgMs = stepDurations[step].total / stepDurations[step].count;
          const avgDays = avgMs / (1000 * 60 * 60 * 24);
          
          const sla = 2.0; 
          const impact = avgDays > 5 ? 'Critical' : avgDays > 2 ? 'High' : 'Low';
          
          return { step, avgTime: parseFloat(avgDays.toFixed(1)), sla, impact };
      });

      if (bottlenecks.length === 0) {
          return [
            { step: 'Approvals (No Data)', avgTime: 0, sla: 2.0, impact: 'Low' }
          ];
      }

      return bottlenecks.sort((a,b) => b.avgTime - a.avgTime).slice(0, 5);
  }, [instances]);

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-300 pb-4 shrink-0 mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Performance Analytics</h2>
          <p className="text-xs text-slate-500 font-medium">Predictive modeling & operational telemetry.</p>
        </div>
        <div className="flex items-center gap-2 relative">
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
            <div className="relative">
                <NexButton variant="secondary" icon={Filter} onClick={() => setShowFilter(!showFilter)} className="px-2">Filter</NexButton>
                {showFilter && (
                    <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-sm shadow-xl p-4 w-64 z-50 animate-slide-up">
                        <h4 className="text-xs font-bold mb-3 uppercase">Date Range</h4>
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
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={30}
            isDraggable={isEditable}
            isResizable={isEditable}
            draggableHandle=".drag-handle"
            onLayoutChange={(curr, all) => setLayouts(all)}
            margin={[16, 16]}
        >
            <div key="kpi-throughput">
                <KPICard isEditable={isEditable} title="Global Throughput" value={completedInstances} change="12%" trend="up" icon={Zap} color="blue" onClick={() => !isEditable && navigateTo('governance')} />
            </div>
            <div key="kpi-cycle">
                <KPICard isEditable={isEditable} title="Avg Cycle Time" value="1.8d" change="5%" trend="down" icon={Clock} color="slate" onClick={() => !isEditable && navigateTo('inbox')} />
            </div>
            <div key="kpi-risk">
                <KPICard isEditable={isEditable} title="SLA Breach Risk" value="High" change="3" trend="up" icon={AlertTriangle} color="rose" onClick={() => !isEditable && navigateTo('explorer', undefined, 'Critical')} />
            </div>
            <div key="kpi-util">
                <KPICard isEditable={isEditable} title="Resource Util" value="84%" change="2%" trend="up" icon={Activity} color="violet" onClick={() => !isEditable && navigateTo('resource-planner')} />
            </div>

            <NexCard key="chart-forecast" className="p-0 overflow-hidden flex flex-col h-full" dragHandle={isEditable}>
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                    <TrendingUp size={14} className="text-blue-500"/> Volume Forecast (Linear Projection)
                    </h3>
                    <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> <span className="text-[10px] font-bold text-slate-500">Actuals</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-indigo-400 rounded-full border border-white ring-1 ring-indigo-400"></div> <span className="text-[10px] font-bold text-slate-500">Predicted</span></div>
                    </div>
                </div>
                <div className="flex-1 p-4 bg-white">
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
                        <Area type="monotone" dataKey="ci_upper" stroke="none" fill="#e0e7ff" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="ci_lower" stroke="none" fill="#ffffff" fillOpacity={1} /> 
                        <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                        <Line type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                    </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </NexCard>

            <NexCard key="chart-bottleneck" className="p-0 overflow-hidden flex flex-col h-full" dragHandle={isEditable}>
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                    <Target size={14} className="text-rose-500"/> Process Friction
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                    {bottleneckData.length === 0 ? (
                        <div className="text-center text-slate-400 text-xs italic mt-10">No process history data to analyze.</div>
                    ) : bottleneckData.map((b, i) => {
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
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};
