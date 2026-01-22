
import React, { useState, useMemo, useEffect } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Calendar, User, ChevronLeft, ChevronRight, Filter, Search, Briefcase, AlertCircle, Clock, Zap, Grid, List, Settings, GripVertical } from 'lucide-react';
import { NexBadge, NexButton, NexCard } from '../shared/NexUI';
import { TaskPriority } from '../../types';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const ResourcePlanner = () => {
  const { navigateTo, users, tasks, roles, groups, setToolbarConfig } = useBPM();
  const { gridConfig } = useTheme();
  
  const [startDate, setStartDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list');
  const [isEditable, setIsEditable] = useState(false);

  // Simplified Layouts
  const defaultLayouts = {
      lg: [
          { i: 'grid', x: 0, y: 0, w: 12, h: 20 }
      ],
      md: [
          { i: 'grid', x: 0, y: 0, w: 10, h: 20 }
      ]
  };
  const [layouts, setLayouts] = useState(defaultLayouts);

  useEffect(() => {
      setToolbarConfig({
          view: [
              { label: isEditable ? 'Lock Layout' : 'Edit Layout', action: () => setIsEditable(!isEditable), icon: Settings },
              { label: 'Reset Layout', action: () => setLayouts(defaultLayouts) }
          ]
      });
  }, [setToolbarConfig, isEditable]);

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
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
        {/* Header matched to Process Registry style */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-default pb-4 shrink-0 mb-2">
            <div className="flex items-center gap-6">
                <div>
                    <h2 className="text-xl font-bold text-primary tracking-tight">Resource Planner</h2>
                    <p className="text-xs text-secondary font-medium">Capacity planning and workload distribution.</p>
                </div>
                
                {/* Integrated Header Metrics */}
                <div className="hidden xl:flex items-center gap-4 bg-subtle px-3 py-1.5 rounded-sm border border-default">
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[9px] font-bold text-tertiary uppercase">Total Load</span>
                        <span className="text-sm font-black text-primary">{totalTasksInView}</span>
                    </div>
                    <div className="w-px h-6 bg-default mx-1"></div>
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[9px] font-bold text-tertiary uppercase">Utilization</span>
                        <span className={`text-sm font-black ${utilization > 80 ? 'text-rose-600' : 'text-emerald-600'}`}>{utilization}%</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {/* Date Navigation */}
                <div className="flex items-center bg-subtle p-0.5 rounded-sm border border-default shadow-sm">
                    <button onClick={handlePrevWeek} className="p-1 hover:bg-panel rounded-sm text-secondary transition-colors"><ChevronLeft size={14}/></button>
                    <span className="text-xs font-mono font-bold text-primary px-2 w-24 text-center">{startDate.toLocaleDateString(undefined, {month:'short', day:'numeric', year: '2-digit'})}</span>
                    <button onClick={handleNextWeek} className="p-1 hover:bg-panel rounded-sm text-secondary transition-colors"><ChevronRight size={14}/></button>
                </div>

                {/* Search */}
                <div className="relative w-40 lg:w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" size={14}/>
                    <input 
                        className="w-full pl-8 pr-2 py-1.5 bg-subtle border border-default rounded-sm text-xs outline-none text-primary focus:border-blue-500 transition-colors focus:ring-1 focus:ring-blue-500/20" 
                        placeholder="Search resources..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <select className="py-1.5 px-2 bg-subtle border border-default rounded-sm text-xs outline-none text-primary cursor-pointer hover:bg-panel transition-colors max-w-[120px]" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
                    <option value="All">All Groups</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>

                {/* View Mode */}
                <div className="flex bg-subtle p-0.5 rounded-sm border border-default shadow-sm">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'list' ? 'bg-panel shadow-sm text-blue-600' : 'text-tertiary hover:text-secondary'}`} title="List View"><List size={14}/></button>
                    <button onClick={() => setViewMode('heatmap')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'heatmap' ? 'bg-panel shadow-sm text-blue-600' : 'text-tertiary hover:text-secondary'}`} title="Heatmap View"><Grid size={14}/></button>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={gridConfig.rowHeight}
                margin={gridConfig.margin}
                isDraggable={isEditable}
                isResizable={isEditable}
                draggableHandle=".drag-handle"
                onLayoutChange={(curr, all) => setLayouts(all)}
            >
                <NexCard key="grid" dragHandle={isEditable} className="p-0 overflow-hidden flex flex-col h-full shadow-sm">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 bg-subtle border-b border-default shrink-0">
                        <div className="col-span-3 text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center p-3">Principal</div>
                        <div className="col-span-1 text-center text-[10px] font-bold text-secondary uppercase tracking-wider border-l border-default flex items-center justify-center p-3">W/L</div>
                        <div className="col-span-8 flex border-l border-default">
                            {days.map((d, i) => {
                                const isToday = d.toDateString() === new Date().toDateString();
                                return (
                                    <div key={i} className={`flex-1 text-center border-r border-default last:border-0 flex flex-col justify-center p-2 ${isToday ? 'bg-blue-50/50' : ''}`}>
                                        <div className={`text-[10px] font-bold uppercase ${isToday ? 'text-blue-700' : 'text-secondary'}`}>{d.toLocaleDateString(undefined, {weekday: 'short'})}</div>
                                        <div className={`text-[9px] font-medium ${isToday ? 'text-blue-600' : 'text-tertiary'}`}>{d.getDate()}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-default overflow-y-auto flex-1">
                        {scheduleData.length === 0 ? (
                            <div className="text-center text-tertiary italic text-xs p-8">No resources match current filter.</div>
                        ) : (
                            scheduleData.map((row) => (
                                <div key={row.user.id} className="grid grid-cols-12 items-stretch hover:bg-subtle transition-colors group min-h-[60px]">
                                    {/* User Info */}
                                    <div className="col-span-3 flex items-center p-3 gap-3">
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
                                                className="text-xs font-bold text-primary truncate cursor-pointer hover:text-blue-600 hover:underline"
                                                onClick={() => navigateTo('edit-user', row.user.id)}
                                            >
                                                {row.user.name}
                                            </div>
                                            <div className="text-[10px] text-secondary truncate flex items-center gap-1">
                                                <span>{row.roleName}</span>
                                                <span className="text-tertiary">•</span>
                                                <span className="text-tertiary">{row.groupName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Load Badge */}
                                    <div className="col-span-1 flex items-center justify-center border-l border-default bg-subtle/30">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            row.totalLoad > 8 ? 'bg-rose-100 text-rose-700 border-rose-200' : 
                                            row.totalLoad > 4 ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                            'bg-subtle text-secondary border-default'
                                        }`}>
                                            {row.totalLoad}
                                        </span>
                                    </div>

                                    {/* Timeline Grid */}
                                    <div className="col-span-8 flex border-l border-default">
                                        {row.dailyLoad.map((dayData, i) => {
                                            const isToday = dayData.date.toDateString() === new Date().toDateString();
                                            const isOOO = row.user.status !== 'Active';
                                            
                                            if (isOOO) {
                                                return (
                                                    <div key={i} className="flex-1 bg-subtle/50 border-r border-default last:border-0 flex items-center justify-center">
                                                        <span className="text-[9px] font-bold text-tertiary select-none">OOO</span>
                                                    </div>
                                                );
                                            }

                                            // HEATMAP MODE
                                            if (viewMode === 'heatmap') {
                                                const loadLevel = dayData.count;
                                                let bgClass = 'bg-panel';
                                                if (loadLevel > 0) bgClass = 'bg-emerald-100 dark:bg-emerald-900/40';
                                                if (loadLevel > 3) bgClass = 'bg-amber-200 dark:bg-amber-900/40';
                                                if (loadLevel > 5) bgClass = 'bg-rose-300 dark:bg-rose-900/40';
                                                
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className={`flex-1 border-r border-default last:border-0 relative cursor-pointer hover:brightness-95 transition-all ${bgClass}`}
                                                        title={`${dayData.count} Tasks`}
                                                        onClick={() => navigateTo('inbox', undefined, undefined, { assignee: row.user.id })}
                                                    >
                                                        {dayData.count > 0 && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700/50 dark:text-slate-300/50">{dayData.count}</span>}
                                                    </div>
                                                );
                                            }

                                            // LIST MODE (Standard)
                                            return (
                                                <div key={i} className={`flex-1 border-r border-default last:border-0 relative ${isToday ? 'bg-blue-50/30' : ''}`} style={{ padding: '4px' }}>
                                                    {dayData.count > 0 ? (
                                                        <div 
                                                            className={`w-full h-full rounded-sm flex flex-col items-center justify-center cursor-pointer transition-all hover:brightness-95 border ${
                                                                dayData.hasCritical 
                                                                    ? 'bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300' 
                                                                    : 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                                                            }`}
                                                            style={{ opacity: Math.min(1, 0.4 + (dayData.count * 0.15)) }}
                                                            title={dayData.tasks.map(t => `• ${t.title} (${t.priority})`).join('\n')}
                                                            onClick={() => navigateTo('inbox', undefined, undefined, { assignee: row.user.id })}
                                                        >
                                                            <span className="text-[10px] font-black">{dayData.count}</span>
                                                            {dayData.hasCritical && <Zap size={8} className="mt-0.5 animate-pulse"/>}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full hover:bg-subtle transition-colors"></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </NexCard>
            </ResponsiveGridLayout>
        </div>
    </div>
  );
};
