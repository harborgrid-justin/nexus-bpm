
import React from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { FormPageLayout } from '../shared/PageTemplates';
import { Calendar, User } from 'lucide-react';

export const ResourcePlanner = () => {
  const { navigateTo, users, tasks } = useBPM();

  // Mock schedule generation based on active tasks
  const schedule = users.map(u => {
      const userTasks = tasks.filter(t => t.assignee === u.id && t.status !== 'Completed');
      return { user: u, load: userTasks.length };
  });

  return (
    <FormPageLayout title="Resource Planner" subtitle="Operational capacity and shift management." onBack={() => navigateTo('dashboard')} actions={<div className="text-xs text-slate-500 flex items-center gap-2"><Calendar size={14}/> Q3 2024</div>}>
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase py-2 px-4">
                    <div className="col-span-3">Principal</div>
                    <div className="col-span-1 text-center">Load</div>
                    <div className="col-span-8">Capacity Timeline (Next 7 Days)</div>
                </div>
                <div className="divide-y divide-slate-100">
                    {schedule.map((row, i) => (
                        <div key={i} className="grid grid-cols-12 py-3 px-4 items-center hover:bg-slate-50 transition-colors">
                            <div className="col-span-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {row.user.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">{row.user.name}</div>
                                    <div className="text-[10px] text-slate-500">{row.user.roleIds[0]}</div>
                                </div>
                            </div>
                            <div className="col-span-1 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.load > 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.load} Tasks</span>
                            </div>
                            <div className="col-span-8 flex gap-1 h-6">
                                {[...Array(7)].map((_, d) => (
                                    <div key={d} className={`flex-1 rounded-sm ${Math.random() > 0.3 ? 'bg-blue-100' : 'bg-slate-100'} relative group`}>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[9px] font-bold text-slate-600 bg-white/90">
                                            {Math.random() > 0.3 ? 'Active' : 'Off'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </FormPageLayout>
  );
};
