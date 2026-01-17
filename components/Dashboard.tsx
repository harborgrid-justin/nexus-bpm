
import React, { useEffect, useState } from 'react';
import { Activity, Clock, AlertCircle, ShieldCheck, Briefcase, Sparkles, ChevronDown, ListChecks, DollarSign, Gauge, LucideIcon } from 'lucide-react';
import { getProcessInsights } from '../services/geminiService';
import { useBPM } from '../contexts/BPMContext';
import { NexSectionHeader, NexCard, NexBadge } from './shared/NexUI';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  variant: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  trend?: string;
}

const MetricCard = ({ label, value, subValue, icon: Icon, variant, trend }: MetricCardProps) => {
  const variantStyles = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-50 text-slate-400'
  };

  return (
    <NexCard className="relative flex flex-col justify-center min-h-[140px] group" hover={false}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
            {trend && <span className="text-[11px] font-bold text-emerald-600">{trend}</span>}
          </div>
          {subValue && <p className="text-[12px] text-slate-400 font-medium">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-xl ${variantStyles[variant]} transition-all`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
    </NexCard>
  );
};

export const Dashboard: React.FC = () => {
  const { instances, tasks, navigateTo } = useBPM();
  const [activeTopTab, setActiveTopTab] = useState('Overview');
  const [activeContextTab, setActiveContextTab] = useState('Dashboard');
  
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const criticalCount = tasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed').length;
  const activeInstancesCount = instances.filter(i => i.status === 'Active').length;

  return (
    <div className="space-y-8 pb-32 animate-fade-in">
      {/* Top Nav Tabs - Screenshot Style */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {['Overview', 'Planning', 'Execution', 'Control'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTopTab(tab)}
            className={`tab-capsule ${activeTopTab === tab ? 'tab-active' : 'tab-inactive'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Breadcrumb Pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg w-fit card-shadow">
        <Briefcase size={14} className="text-blue-500" />
        <span className="text-[12px] font-bold text-slate-700">Dashboard</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <NexSectionHeader 
          icon={Briefcase}
          title="Integration Management"
          subtitle="Coordinate all aspects of the project from initiation to closure."
        />
        
        {/* Card Level Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200/50 rounded-xl card-shadow">
          {['Dashboard', 'Charter', 'Logs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveContextTab(tab)}
              className={`px-5 py-2 rounded-lg text-[12px] font-bold transition-all ${
                activeContextTab === tab 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Stack */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard 
          label="Overall Progress" 
          value="30%" 
          subValue="1 / 3 tasks complete" 
          icon={ListChecks} 
          variant="blue" 
        />
        <MetricCard 
          label="Budget Variance" 
          value="$2.9M" 
          subValue="Includes $0.0 committed" 
          icon={DollarSign} 
          variant="emerald" 
          trend="↑"
        />
        <MetricCard 
          label="Open Risks" 
          value={criticalCount} 
          subValue="0 high-impact" 
          icon={AlertCircle} 
          variant="rose" 
        />
        <MetricCard 
          label="Quality Score" 
          value="100%" 
          subValue="Exceeding threshold" 
          icon={ShieldCheck} 
          variant="emerald" 
        />
      </div>

      {/* Insight Banner */}
      <div className="bg-[#0F172A] p-8 rounded-3xl card-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full -mr-10 -mt-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-400" />
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Cognitive Advisor</h4>
            </div>
            <p className="text-white text-lg font-bold leading-relaxed tracking-tight">
              Project throughput is stable. Recommend expanding the scope of Downtown Metro Hub logic.
            </p>
          </div>
          <button onClick={() => navigateTo('designer')} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all backdrop-blur-md shrink-0">
            <Gauge size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
