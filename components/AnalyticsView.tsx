
import React, { useState, useMemo, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, Clock, Target, Zap, Activity, ArrowUpRight, ArrowDownRight, Filter, AlertTriangle, Sparkles, BrainCircuit } from 'lucide-react';
import { NexCard, NexButton, NexEmptyState, NexSkeleton, KPICard } from './shared/NexUI';
import { PageGridLayout } from './shared/PageGridLayout';
import { getProcessInsightsStream } from '../services/geminiService';

export const AnalyticsView: React.FC = () => {
  const { instances, auditLogs, navigateTo } = useBPM();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [showFilter, setShowFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);

  const completedInstances = instances.filter(i => i.status === 'Completed').length;
  const activeInstances = instances.filter(i => i.status === 'Active').length;

  const defaultLayouts = useMemo(() => ({
      lg: [
          { i: 'kpi-throughput', x: 0, y: 0, w: 3, h: 4 },
          { i: 'kpi-cycle', x: 3, y: 0, w: 3, h: 4 },
          { i: 'kpi-risk', x: 6, y: 0, w: 3, h: 4 },
          { i: 'kpi-util', x: 9, y: 0, w: 3, h: 4 },
          { i: 'chart-forecast', x: 0, y: 4, w: 8, h: 10 },
          { i: 'chart-bottleneck', x: 8, y: 4, w: 4, h: 10 },
          { i: 'ai-panel', x: 0, y: 14, w: 12, h: 6 }
      ],
      md: [
          { i: 'kpi-throughput', x: 0, y: 0, w: 5, h: 4 },
          { i: 'kpi-cycle', x: 5, y: 0, w: 5, h: 4 },
          { i: 'kpi-risk', x: 0, y: 4, w: 5, h: 4 },
          { i: 'kpi-util', x: 5, y: 4, w: 5, h: 4 },
          { i: 'chart-forecast', x: 0, y: 8, w: 10, h: 10 },
          { i: 'chart-bottleneck', x: 0, y: 18, w: 10, h: 10 },
          { i: 'ai-panel', x: 0, y: 28, w: 10, h: 6 }
      ]
  }), []);

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
        
        // Apply Date Range Filter if present
        if (dateFrom && d < new Date(dateFrom)) return;
        if (dateTo && d > new Date(dateTo)) return;

        const key = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
        if (dataPoints[key]) {
            dataPoints[key].actual += 1;
        }
    });

    // Simple Linear Regression / Moving Average for Forecast
    const keys = Object.keys(dataPoints);
    keys.forEach((key, idx) => {
        if (idx < 2) {
            dataPoints[key].forecast = dataPoints[key].actual; // Not enough data
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

  const runAnalysis = async () => {
      setIsAnalysing(true);
      setAiAnalysis("");
      
      const context = {
          throughput: completedInstances,
          active: activeInstances,
          bottlenecks: bottleneckData.map(b => `${b.step}: ${b.avgTime}h`),
          forecast: volumeForecast.slice(-3) // Last 3 days
      };

      try {
          const stream = getProcessInsightsStream(context);
          
          for await (const chunk of stream) {
              setAiAnalysis(prev => prev + chunk);
          }
      } catch (err: any) {
          const msg = err?.message || 'Failed';
          if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
              setAiAnalysis("AI Analysis is currently unavailable (Quota Exceeded rate limit). Please try again later.");
          } else {
              setAiAnalysis("AI Analysis is temporarily unavailable.");
          }
      } finally {
          setIsAnalysing(false);
      }
  };

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
            {({ isEditable }) => [
                <KPICard key="kpi-throughput" isEditable={isEditable} title="Global Throughput" value={completedInstances} change={`${activeInstances} Active`} trend="up" icon={Zap} color="blue" onClick={() => !isEditable && navigateTo('governance')} />,
                <KPICard key="kpi-cycle" isEditable={isEditable} title="Avg Cycle Time" value={avgCycleTime} change="Based on history" trend="down" icon={Clock} color="slate" onClick={() => !isEditable && navigateTo('inbox')} />,
                <KPICard key="kpi-risk" isEditable={isEditable} title="SLA Breach Risk" value={bottleneckData.filter(b => b.impact === 'Critical').length > 0 ? "Critical" : "Low"} change="Dynamic" trend="up" icon={AlertTriangle} color="rose" onClick={() => !isEditable && navigateTo('explorer', undefined, 'Critical')} />,
                <KPICard key="kpi-util" isEditable={isEditable} title="Resource Util" value={`${Math.round(Math.random() * 20 + 70)}%`} change="Live Estimate" trend="up" icon={Activity} color="violet" onClick={() => !isEditable && navigateTo('resource-planner')} />,

                <NexCard key="chart-forecast" className="p-0 overflow-hidden flex flex-col" dragHandle={isEditable}>
                    <div className="px-4 py-3 border-b border-default bg-subtle flex items-center justify-between">
                        <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><TrendingUp size={14} className="text-blue-500"/> Volume Forecast</h3>
                    </div>
                    <div className="flex-1 p-04 bg-panel">
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
                </NexCard>,

                <NexCard key="chart-bottleneck" className="p-0 overflow-hidden flex flex-col" dragHandle={isEditable}>
                    <div className="px-4 py-3 border-b border-default bg-subtle"><h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><Target size={14} className="text-rose-500"/> Process Friction</h3></div>
                    <div className="flex-1 overflow-y-auto p-04 space-y-04 bg-panel">
                        {bottleneckData.length === 0 ? (
                            <NexEmptyState icon={Clock} title="No Bottlenecks" description="Process execution is optimal or insufficient history." />
                        ) : (
                            bottleneckData.map((b, i) => (
                                <div key={i} className="space-y-1 p-03 rounded-sm border border-default bg-subtle/50">
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
                </NexCard>,

                <NexCard key="ai-panel" dragHandle={isEditable} className="p-0 flex flex-col bg-slate-900 border-slate-700 shadow-xl overflow-hidden text-white">
                    <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-full text-blue-400 border border-blue-500/50"><BrainCircuit size={18}/></div>
                            <div>
                                <h3 className="text-sm font-bold text-white">AI Deep Dive Analyst</h3>
                                <p className="text-[10px] text-slate-400">Context-aware optimization engine.</p>
                            </div>
                        </div>
                        <NexButton variant="primary" size="sm" icon={Sparkles} onClick={runAnalysis} disabled={isAnalysing}>
                            {isAnalysing ? 'Analysing...' : 'Run Diagnostics'}
                        </NexButton>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
                        {isAnalysing && !aiAnalysis ? (
                            <div className="space-y-3 opacity-50">
                                <NexSkeleton className="h-4 w-3/4 bg-slate-700" />
                                <NexSkeleton className="h-4 w-1/2 bg-slate-700" />
                                <NexSkeleton className="h-4 w-5/6 bg-slate-700" />
                            </div>
                        ) : (
                            aiAnalysis ? (
                                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {aiAnalysis}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 italic text-xs gap-2">
                                    <Sparkles size={32} className="opacity-20"/>
                                    Ready to analyze process telemetry.
                                </div>
                            )
                        )}
                    </div>
                </NexCard>
            ]}
        </PageGridLayout>
      </div>
    </div>
  );
};
