
import React, { useState, useMemo } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { FormPageLayout } from '../shared/PageTemplates';
import { Calendar, User, ChevronLeft, ChevronRight, Filter, Search, Briefcase, AlertCircle, Clock, Zap } from 'lucide-react';
import { NexBadge, NexButton } from '../shared/NexUI';
import { TaskPriority } from '../../types';

export const ResourcePlanner = () => {
  const { navigateTo, users, tasks, roles, groups } = useBPM();
  const [startDate, setStartDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  // --- 1. Date Logic (Time Travel) ---
  const days = useMemo(() => {
    const result = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        result.push(d);
    }
    return result;
  }, [startDate]);

  const handlePrevWeek = () => {
      const d = new Date(startDate);
      d.setDate(d.getDate() - 7);
      setStartDate(d);
  };

  const handleNextWeek = () => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + 7);
      setStartDate(d);
  };

  // --- 2. Data Filtering (Search & Group) ---
  const filteredUsers = useMemo(() => {
      return users.filter(u => {
          const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                u.email.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesGroup = selectedGroup === 'All' || u.groupIds.includes(selectedGroup);
          
          return matchesSearch && matchesGroup;
      });
  }, [users, searchQuery, selectedGroup]);

  // --- 3. Workload Calculation (The "Wiring") ---
  const scheduleData = useMemo(() => {
      return filteredUsers.map(u => {
          // Get primary metadata
          const roleName = roles.find(r => u.roleIds.includes(r.id))?.name || 'Staff';
          const groupName = groups.find(g => u.groupIds.includes(g.id))?.name || 'General';
          
          // Map tasks to days
          const dailyLoad = days.map(day => {
              const dayTasks = tasks.filter(t => {
                  const tDate = new Date(t.dueDate);
                  return t.assignee === u.id && 
                         t.status !== 'Completed' &&
                         tDate.toDateString() === day.toDateString();
              });
              
              const hasCritical = dayTasks.some(t => t.priority === TaskPriority.CRITICAL);
              const count = dayTasks.length;
              
              return { date: day, tasks: dayTasks, count, hasCritical };
          });

          const totalLoad = dailyLoad.reduce((acc, d) => acc + d.count, 0);
          
          return { user: u, roleName, groupName, dailyLoad, totalLoad };
      });
  }, [filteredUsers, tasks, days, roles, groups]);

  // --- 4. Metrics ---
  const totalTasksInView = scheduleData.reduce((acc, row) => acc + row.totalLoad, 0);
  const capacity = scheduleData.length * 7 * 5; // Assuming max 5 tasks/day capacity per user
  const utilization = Math.min(100, Math.round((totalTasksInView / (capacity || 1)) * 100));

  return (
    <FormPageLayout 
        title="Resource Planner" 
        subtitle="Capacity allocation and deadline tracking." 
        onBack={() => navigateTo('dashboard')} 
        actions={
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-sm border border-slate-200">
                <button onClick={handlePrevWeek} className="p-1 hover:bg-white rounded-sm text-slate-500 hover:text-slate-800 transition-all"><ChevronLeft size={16}/></button>
                <span className="text-xs font-mono font-bold text-slate-700 px-2 w-24 text-center">
                    {startDate.toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                </span>
                <button onClick={handleNextWeek} className="p-1 hover:bg-white rounded-sm text-slate-500 hover:text-slate-800 transition-all"><ChevronRight size={16}/></button>
            </div>
        }
    >
        <div className="space-y-6">
            
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                <div className="flex gap-2 flex-1 w-full">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                        <input 
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs focus:ring-1 focus:ring-blue-600 outline-none" 
                            placeholder="Filter resources..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative w-40">
                        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                        <select 
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs focus:ring-1 focus:ring-blue-600 outline-none appearance-none"
                            value={selectedGroup}
                            onChange={e => setSelectedGroup(e.target.value)}
                        >
                            <option value="All">All Units</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Load</span>
                        <span className="text-lg font-bold text-slate-800 leading-none">{totalTasksInView} <span className="text-xs font-normal text-slate-400">Tasks</span></span>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Utilization</span>
                        <span className={`text-lg font-bold leading-none ${utilization > 80 ? 'text-rose-600' : 'text-emerald-600'}`}>{utilization}%</span>
                    </div>
                </div>
            </div>

            {/* Scheduler Grid */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                
                {/* Header Row */}
                <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200">
                    <div className="col-span-3 py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Principal</div>
                    <div className="col-span-1 py-3 px-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider border-l border-slate-100">W/L</div>
                    <div className="col-span-8 flex border-l border-slate-100">
                        {days.map((d, i) => {
                            const isToday = d.toDateString() === new Date().toDateString();
                            return (
                                <div key={i} className={`flex-1 py-2 text-center border-r border-slate-100 last:border-0 ${isToday ? 'bg-blue-50/50' : ''}`}>
                                    <div className={`text-[10px] font-bold uppercase ${isToday ? 'text-blue-700' : 'text-slate-500'}`}>{d.toLocaleDateString(undefined, {weekday: 'short'})}</div>
                                    <div className={`text-[9px] font-medium ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{d.getDate()}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-100">
                    {scheduleData.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic text-xs">No resources match current filter.</div>
                    ) : (
                        scheduleData.map((row) => (
                            <div key={row.user.id} className="grid grid-cols-12 items-stretch hover:bg-slate-50 transition-colors group min-h-[60px]">
                                {/* User Info */}
                                <div className="col-span-3 p-3 flex items-center gap-3">
                                    <div 
                                        className={`w-9 h-9 rounded-sm flex items-center justify-center text-xs font-bold shrink-0 border cursor-pointer transition-transform hover:scale-105 ${row.user.status === 'Active' ? 'bg-slate-800 text-white border-slate-900' : 'bg-slate-100 text-slate-400 border-dashed border-slate-300'}`}
                                        onClick={() => navigateTo('edit-user', row.user.id)}
                                        title={row.user.status === 'Active' ? 'Active' : 'On Leave / Inactive'}
                                    >
                                        {row.user.name.charAt(0)}
                                        {row.user.status !== 'Active' && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 border border-white rounded-full"></div>}
                                    </div>
                                    <div className="min-w-0">
                                        <div 
                                            className="text-xs font-bold text-slate-800 truncate cursor-pointer hover:text-blue-600 hover:underline"
                                            onClick={() => navigateTo('edit-user', row.user.id)}
                                        >
                                            {row.user.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                            <span>{row.roleName}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-400">{row.groupName}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Load Badge */}
                                <div className="col-span-1 flex items-center justify-center border-l border-slate-100 bg-slate-50/30">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        row.totalLoad > 8 ? 'bg-rose-100 text-rose-700 border-rose-200' : 
                                        row.totalLoad > 4 ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                        'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {row.totalLoad}
                                    </span>
                                </div>

                                {/* Timeline Grid */}
                                <div className="col-span-8 flex border-l border-slate-100">
                                    {row.dailyLoad.map((dayData, i) => {
                                        const isToday = dayData.date.toDateString() === new Date().toDateString();
                                        const isOOO = row.user.status !== 'Active';
                                        
                                        if (isOOO) {
                                            return (
                                                <div key={i} className="flex-1 bg-slate-100/50 border-r border-slate-100 last:border-0 flex items-center justify-center">
                                                    <span className="text-[9px] font-bold text-slate-300 select-none">OOO</span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={i} className={`flex-1 p-1 border-r border-slate-100 last:border-0 relative ${isToday ? 'bg-blue-50/30' : ''}`}>
                                                {dayData.count > 0 ? (
                                                    <div 
                                                        className={`w-full h-full rounded-sm flex flex-col items-center justify-center cursor-pointer transition-all hover:brightness-95 border ${
                                                            dayData.hasCritical 
                                                                ? 'bg-rose-100 border-rose-200 text-rose-700' 
                                                                : 'bg-blue-100 border-blue-200 text-blue-700'
                                                        }`}
                                                        style={{ opacity: Math.min(1, 0.4 + (dayData.count * 0.15)) }}
                                                        title={dayData.tasks.map(t => `• ${t.title} (${t.priority})`).join('\n')}
                                                        // WIRE: Clicking day cell navigates to inbox filtered by user + date (conceptually, just user for now)
                                                        onClick={() => navigateTo('inbox', undefined, undefined, { assignee: row.user.id })}
                                                    >
                                                        <span className="text-[10px] font-black">{dayData.count}</span>
                                                        {dayData.hasCritical && <Zap size={8} className="mt-0.5 animate-pulse"/>}
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full hover:bg-slate-50 transition-colors"></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </FormPageLayout>
  );
};
