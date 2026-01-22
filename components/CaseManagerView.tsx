
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Briefcase, Plus, Search, AlertCircle, User as UserIcon, LayoutGrid, List as ListIcon, GripVertical, ChevronRight } from 'lucide-react';
import { NexCard, NexButton, NexBadge, NexStatusBadge } from './shared/NexUI';
import { PageGridLayout } from './shared/PageGridLayout';
import { TaskStatus } from '../types';

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
  const { cases, navigateTo, currentUser, tasks, updateCase } = useBPM();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

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

  const filteredCases = useMemo(() => cases.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())), [cases, searchQuery]);
  const kpis = useMemo(() => ({
      active: cases.filter(c => c.status !== 'Closed').length,
      critical: cases.filter(c => c.priority === 'Critical').length,
      myActive: cases.filter(c => c.stakeholders.some(s => s.userId === currentUser?.id)).length
  }), [cases, currentUser]);

  const stages = ['Open', 'In Progress', 'Pending Review', 'Resolved', 'Closed'];

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between border-b border-default pb-4 shrink-0 mb-2">
        <div><h2 className="text-xl font-bold text-primary tracking-tight">Case Management</h2></div>
        <NexButton variant="primary" icon={Plus} onClick={() => navigateTo('create-case')}>New Case</NexButton>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <PageGridLayout defaultLayouts={defaultLayouts}>
            {({ isEditable }) => (
                <>
                    <KPIWidget key="kpi-active" isEditable={isEditable} title="Active Cases" value={kpis.active} icon={Briefcase} color="blue" />
                    <KPIWidget key="kpi-workload" isEditable={isEditable} title="My Workload" value={kpis.myActive} icon={UserIcon} color="emerald" />
                    <KPIWidget key="kpi-critical" isEditable={isEditable} title="Critical Issues" value={kpis.critical} icon={AlertCircle} color="rose" />

                    <NexCard key="main-content" dragHandle={isEditable} className="p-0 flex flex-col h-full">
                        <div className="p-3 border-b border-default bg-subtle flex flex-col md:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={14}/>
                                <input className="w-full pl-9 pr-4 py-1.5 bg-panel border border-default rounded-sm text-xs font-medium outline-none text-primary" placeholder="Search cases..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setViewMode('list')} className={`p-1 rounded-sm ${viewMode === 'list' ? 'bg-subtle text-primary' : 'text-tertiary'}`}><ListIcon size={14}/></button>
                                <button onClick={() => setViewMode('board')} className={`p-1 rounded-sm ${viewMode === 'board' ? 'bg-subtle text-primary' : 'text-tertiary'}`}><LayoutGrid size={14}/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-canvas min-h-0">
                            {viewMode === 'list' ? (
                                <div className="space-y-2">
                                    {filteredCases.map(c => (
                                        <div key={c.id} onClick={() => !isEditable && navigateTo('case-viewer', c.id)} className="flex items-center justify-between p-3 border border-default rounded-sm bg-panel hover:border-active cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-sm flex items-center justify-center border ${c.priority === 'Critical' ? 'bg-rose-50 border-rose-200' : 'bg-subtle border-default'}`}><Briefcase size={14}/></div>
                                                <div><h4 className="text-sm font-bold text-primary">{c.title}</h4><div className="text-[10px] text-secondary">{c.id} • {new Date(c.createdAt).toLocaleDateString()}</div></div>
                                            </div>
                                            <div className="flex items-center gap-4"><NexStatusBadge status={c.status} /><ChevronRight size={14} className="text-tertiary"/></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-full gap-3 overflow-x-auto pb-2">
                                    {stages.map(stage => (
                                        <div key={stage} className="flex-1 min-w-[240px] bg-subtle rounded-sm border border-default flex flex-col max-h-full">
                                            <div className="p-2 border-b border-default font-bold text-xs text-secondary uppercase">{stage}</div>
                                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                                {filteredCases.filter(c => c.status === stage).map(c => (
                                                    <div key={c.id} onClick={() => !isEditable && navigateTo('case-viewer', c.id)} className="p-3 bg-panel border border-default rounded-sm shadow-sm hover:shadow-md cursor-pointer">
                                                        <div className="text-xs font-bold text-primary mb-1">{c.title}</div>
                                                        <NexBadge variant="slate">{c.priority}</NexBadge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
