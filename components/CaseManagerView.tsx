
import React, { useState, useMemo, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { Briefcase, Plus, Search, Filter, Clock, ChevronRight, AlertCircle, X, SearchX, CheckCircle, PieChart, BarChart3, User as UserIcon, LayoutGrid, List as ListIcon, MoreHorizontal, Settings, GripVertical } from 'lucide-react';
import { NexCard, NexButton, NexBadge, NexStatusBadge } from './shared/NexUI';
import { TaskStatus, Case } from '../types';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- KPI Widget Component ---
const KPIWidget = React.forwardRef<HTMLDivElement, any>(({ title, value, icon: Icon, color, onClick, isEditable, className, style, ...props }, ref) => {
    const colors = {
        blue: 'text-blue-700 bg-blue-50 border-blue-200',
        emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        rose: 'text-rose-700 bg-rose-50 border-rose-200'
    };
    return (
        <div 
            ref={ref} 
            style={{ borderRadius: 'var(--radius-base)', ...style }}
            className={`bg-panel p-3 border border-default shadow-sm flex flex-col justify-between h-full ${className} ${onClick ? 'cursor-pointer hover:border-active' : ''}`}
            onClick={onClick}
            {...props}
        >
            <div className="flex justify-between items-start">
                <div className={`p-2 rounded-sm ${colors[color as keyof typeof colors]}`}>
                    <Icon size={18}/>
                </div>
                {isEditable && <GripVertical size={14} className="drag-handle text-tertiary cursor-move"/>}
            </div>
            <div>
                <div className="text-2xl font-bold text-primary">{value}</div>
                <div className="text-[10px] font-bold text-secondary uppercase">{title}</div>
            </div>
        </div>
    );
});

export const CaseManagerView: React.FC = () => {
  const { cases, navigateTo, currentUser, tasks, users, updateCase, setToolbarConfig } = useBPM();
  const { gridConfig } = useTheme();
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMine, setFilterMine] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [isEditable, setIsEditable] = useState(false);

  // Layouts
  const defaultLayouts = {
      lg: [
          { i: 'kpi-active', x: 0, y: 0, w: 4, h: 4 },
          { i: 'kpi-workload', x: 4, y: 0, w: 4, h: 4 },
          { i: 'kpi-critical', x: 8, y: 0, w: 4, h: 4 },
          { i: 'main-content', x: 0, y: 4, w: 12, h: 16 }
      ],
      md: [
          { i: 'kpi-active', x: 0, y: 0, w: 3, h: 4 },
          { i: 'kpi-workload', x: 3, y: 0, w: 3, h: 4 },
          { i: 'kpi-critical', x: 6, y: 0, w: 4, h: 4 },
          { i: 'main-content', x: 0, y: 4, w: 10, h: 16 }
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

  // --- Filtering & Sorting ---
  const filteredCases = useMemo(() => {
      return cases
        .filter(c => {
            const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                c.id.includes(searchQuery);
            
            const matchMine = filterMine ? c.stakeholders.some(s => s.userId === currentUser?.id) : true;
            const matchStatus = statusFilter === 'All' || c.status === statusFilter;
            const matchPriority = priorityFilter === 'All' || c.priority === priorityFilter;

            return matchSearch && matchMine && matchStatus && matchPriority;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort Newest First
  }, [cases, searchQuery, filterMine, statusFilter, priorityFilter, currentUser]);

  // --- KPI Calculations ---
  const kpis = useMemo(() => {
      const active = cases.filter(c => c.status !== 'Closed').length;
      const critical = cases.filter(c => c.priority === 'Critical' && c.status !== 'Closed').length;
      const myActive = cases.filter(c => c.status !== 'Closed' && c.stakeholders.some(s => s.userId === currentUser?.id)).length;
      return { active, critical, myActive };
  }, [cases, currentUser]);

  // Helper to get case owner
  const getCaseOwner = (c: any) => {
      const ownerId = c.stakeholders.find((s: any) => s.role === 'Owner')?.userId;
      return users.find(u => u.id === ownerId);
  };

  // Helper for progress bar
  const getCaseProgress = (caseId: string) => {
      const caseTasks = tasks.filter(t => t.caseId === caseId);
      if (caseTasks.length === 0) return 0;
      const completed = caseTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      return Math.round((completed / caseTasks.length) * 100);
  };

  // Kanban Logic
  const stages = ['Open', 'In Progress', 'Pending Review', 'Resolved', 'Closed'];
  
  const handleDrop = (e: React.DragEvent, newStatus: string) => {
      const caseId = e.dataTransfer.getData('caseId');
      if (caseId) {
          updateCase(caseId, { status: newStatus as any });
      }
  };

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between border-b border-default pb-4 shrink-0 mb-2">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight">Case Management</h2>
          <p className="text-xs text-secondary font-medium">Orchestrate complex non-linear workflows.</p>
        </div>
        <NexButton variant="primary" icon={Plus} onClick={() => navigateTo('create-case')}>New Case</NexButton>
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
            <KPIWidget key="kpi-active" isEditable={isEditable} title="Active Cases" value={kpis.active} icon={Briefcase} color="blue" onClick={() => !isEditable && setStatusFilter('Open')} />
            <KPIWidget key="kpi-workload" isEditable={isEditable} title="My Workload" value={kpis.myActive} icon={UserIcon} color="emerald" onClick={() => !isEditable && setFilterMine(true)} />
            <KPIWidget key="kpi-critical" isEditable={isEditable} title="Critical Issues" value={kpis.critical} icon={AlertCircle} color="rose" onClick={() => !isEditable && setPriorityFilter('Critical')} />

            <NexCard key="main-content" dragHandle={isEditable} className="p-0 flex flex-col h-full">
                {/* Toolbar inside Widget */}
                <div className="p-3 border-b border-default bg-subtle flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={14}/>
                        <input 
                            className="w-full pl-9 pr-4 py-1.5 bg-panel border border-default rounded-sm text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none text-primary" 
                            placeholder="Search cases..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex bg-panel p-0.5 rounded-sm border border-default">
                            <button onClick={() => setViewMode('list')} className={`p-1 rounded-sm transition-all ${viewMode === 'list' ? 'bg-subtle text-primary' : 'text-tertiary hover:text-secondary'}`}><ListIcon size={14}/></button>
                            <button onClick={() => setViewMode('board')} className={`p-1 rounded-sm transition-all ${viewMode === 'board' ? 'bg-subtle text-primary' : 'text-tertiary hover:text-secondary'}`}><LayoutGrid size={14}/></button>
                        </div>
                        {viewMode === 'list' && (
                            <select className="px-2 py-1 border border-default rounded-sm text-xs bg-panel text-primary" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="All">All Status</option>
                                {stages.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        )}
                        <button onClick={() => setFilterMine(!filterMine)} className={`px-2 py-1 border rounded-sm text-[10px] font-bold uppercase transition-all ${filterMine ? 'bg-slate-800 text-white border-slate-800' : 'bg-panel text-secondary border-default'}`}>My Cases</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-canvas min-h-0">
                    {/* LIST VIEW */}
                    {viewMode === 'list' && (
                        <div className="space-y-2">
                            {filteredCases.length === 0 ? <div className="text-center text-tertiary text-xs py-8 italic">No matching cases.</div> : 
                            filteredCases.map(c => {
                                const owner = getCaseOwner(c);
                                const progress = getCaseProgress(c.id);
                                return (
                                    <div key={c.id} onClick={() => !isEditable && navigateTo('case-viewer', c.id)} className="flex items-center justify-between p-3 border border-default rounded-sm hover:border-active hover:shadow-sm transition-all cursor-pointer group bg-panel">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-8 h-8 rounded-sm flex items-center justify-center border shrink-0 ${c.priority === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-subtle text-secondary border-default'}`}>
                                                <Briefcase size={14}/>
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-primary truncate">{c.title}</h4>
                                                <div className="flex items-center gap-2 text-[10px] text-secondary">
                                                    <span className="font-mono text-tertiary">{c.id}</span>
                                                    <span>• {new Date(c.createdAt).toLocaleDateString()}</span>
                                                    {owner && <span className="bg-subtle px-1 rounded flex items-center gap-1"><UserIcon size={8}/> {owner.name}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="hidden sm:block w-20">
                                                <div className="h-1 bg-subtle rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div></div>
                                            </div>
                                            <NexStatusBadge status={c.status} />
                                            <ChevronRight size={14} className="text-tertiary group-hover:text-primary"/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* BOARD VIEW */}
                    {viewMode === 'board' && (
                        <div className="flex h-full gap-3 overflow-x-auto pb-2">
                            {stages.map(stage => {
                                const casesInStage = filteredCases.filter(c => c.status === stage);
                                return (
                                    <div key={stage} className="flex-1 min-w-[240px] bg-subtle rounded-sm border border-default flex flex-col max-h-full" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, stage)}>
                                        <div className="p-2 border-b border-default font-bold text-xs text-secondary uppercase flex justify-between">{stage} <span>{casesInStage.length}</span></div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                            {casesInStage.map(c => (
                                                <div key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData('caseId', c.id)} onClick={() => !isEditable && navigateTo('case-viewer', c.id)} className="p-3 bg-panel border border-default rounded-sm shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing">
                                                    <div className="flex justify-between mb-1"><NexBadge variant={c.priority === 'Critical' ? 'rose' : 'slate'}>{c.priority}</NexBadge></div>
                                                    <div className="text-xs font-bold text-primary line-clamp-2 mb-2">{c.title}</div>
                                                    <div className="text-[9px] text-tertiary font-mono">{c.id}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </NexCard>
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};
