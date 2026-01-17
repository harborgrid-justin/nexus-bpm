
import React, { useState } from 'react';
import { Activity, Clock, AlertCircle, ShieldCheck, Briefcase, Sparkles, ListChecks, DollarSign, Gauge, LucideIcon } from 'lucide-react';
import { useBPM } from '../contexts/BPMContext';
import { NexCard } from './shared/NexUI';

interface MetricPanelProps {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'amber' | 'red';
}

const MetricPanel = ({ label, value, sub, icon: Icon, color }: MetricPanelProps) => {
  const colors = {
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    red: 'text-rose-700 bg-rose-50 border-rose-200'
  };

  return (
    <NexCard className="p-4 flex items-center justify-between border-l-4 border-l-transparent hover:border-l-blue-600 transition-all">
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
  const { tasks, instances, navigateTo } = useBPM();
  const [activeTab, setActiveTab] = useState('Overview');
  
  const criticalCount = tasks.filter(t => t.priority === 'Critical').length;

  return (
    <div className="space-y-4 animate-fade-in">
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
           <span className="text-[11px] font-mono text-slate-800">10:42:05 AM</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricPanel label="Progress" value="30%" sub="1/3 Phases" icon={ListChecks} color="blue" />
        <MetricPanel label="Variance" value="$2.9M" sub="Under Budget" icon={DollarSign} color="green" />
        <MetricPanel label="Risks" value={criticalCount} sub="High Impact" icon={AlertCircle} color="red" />
        <MetricPanel label="Quality" value="100%" sub="Verified" icon={ShieldCheck} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart Area */}
        <NexCard className="lg:col-span-2 p-0 overflow-hidden min-h-[300px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Velocity Burn-down</h3>
            <button className="text-blue-600 text-xs font-medium hover:underline">View Report</button>
          </div>
          <div className="p-6 flex items-center justify-center h-64 bg-white">
             {/* Placeholder for chart */}
             <div className="w-full h-full border-l border-b border-slate-200 relative">
                <div className="absolute bottom-0 left-0 w-full h-[60%] bg-blue-50/50 border-t border-blue-200"></div>
                <div className="absolute bottom-0 left-[20%] w-[10%] h-[40%] bg-slate-800"></div>
                <div className="absolute bottom-0 left-[35%] w-[10%] h-[55%] bg-slate-800"></div>
                <div className="absolute bottom-0 left-[50%] w-[10%] h-[30%] bg-slate-800"></div>
                <div className="absolute bottom-0 left-[65%] w-[10%] h-[70%] bg-slate-800"></div>
             </div>
          </div>
        </NexCard>

        {/* Actionable Insights */}
        <NexCard className="flex flex-col p-0">
           <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
             <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
               <Sparkles size={14} className="text-amber-500"/> AI Advisor
             </h3>
           </div>
           <div className="p-4 flex-1 bg-slate-50/30">
             <div className="bg-white border border-l-4 border-l-blue-500 border-slate-200 p-4 shadow-sm mb-4">
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  Throughput is stable. Recommend expanding DMH-24 logic to include automated vendor notifications.
                </p>
             </div>
             <button onClick={() => navigateTo('designer')} className="w-full py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold uppercase hover:bg-slate-50 transition-all shadow-sm">
               Open Designer
             </button>
           </div>
        </NexCard>
      </div>
    </div>
  );
};
