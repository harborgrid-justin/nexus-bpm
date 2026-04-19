
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Briefcase, Plus, Search, AlertCircle, User as UserIcon, LayoutGrid, List as ListIcon, GripVertical, ChevronRight, Activity } from 'lucide-react';
import { NexCard, NexButton, NexBadge, NexStatusBadge, KPICard, NexEmptyState } from './shared/NexUI';
import { PageGridLayout } from './shared/PageGridLayout';

export const CaseManagerView: React.FC = () => {
  const { cases, navigateTo, currentUser, tasks, updateCase } = useBPM();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  const defaultLayouts = useMemo(() => ({
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
  }), []);

  const filteredCases = useMemo(() => cases.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())), [cases, searchQuery]);
  const kpis = useMemo(() => ({
      active: cases.filter(c => c.status !== 'Closed').length,
      critical: cases.filter(c => c.priority === 'Critical').length,
      myActive: cases.filter(c => c.stakeholders.some(s => s.userId === currentUser?.id)).length
  }), [cases, currentUser]);

  const stages = ['Open', 'In Progress', 'Pending Review', 'Resolved', 'Closed'];

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between border-b border-default pb-04 shrink-0 mb-layout">
        <div><h2 className="text-xl font-bold text-primary tracking-tight">Case Management Hub</h2></div>
        <NexButton variant="primary" icon={Plus} onClick={() => navigateTo('create-case')}>Assemble Case</NexButton>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <PageGridLayout defaultLayouts={defaultLayouts}>
            {({ isEditable }) => [
                <KPICard key="kpi-active" isEditable={isEditable} title="Active Investigations" value={kpis.active} icon={Briefcase} color="blue" onClick={() => !isEditable && navigateTo('cases')} />,
                <KPICard key="kpi-workload" isEditable={isEditable} title="Lead Stakeholder" value={kpis.myActive} icon={UserIcon} color="emerald" />,
                <KPICard key="kpi-critical" isEditable={isEditable} title="High Priority" value={kpis.critical} icon={AlertCircle} color="rose" />,

                <NexCard key="main-content" dragHandle={isEditable} className="p-0 flex flex-col shadow-sm">
                    <div className="p-03 border-b border-default bg-subtle flex flex-col md:flex-row gap-02">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={14}/>
                            <input className="w-full pl-9 pr-4 py-1.5 bg-panel border border-default rounded-sm text-xs font-semibold outline-none text-primary placeholder:text-tertiary" placeholder="Search case registry..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="flex gap-01 bg-panel border border-default p-01 rounded-sm">
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'list' ? 'bg-subtle shadow-inner text-blue-600' : 'text-tertiary hover:text-secondary'}`}><ListIcon size={16}/></button>
                            <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'board' ? 'bg-subtle shadow-inner text-blue-600' : 'text-tertiary hover:text-secondary'}`}><LayoutGrid size={16}/></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-04 bg-panel min-h-0">
                        {viewMode === 'list' ? (
                            <div className="space-y-2">
                                {filteredCases.length === 0 ? (
                                    <div className="py-20">
                                        <NexEmptyState icon={Briefcase} title="Empty Registry" description="No cases matching your current filter criteria." />
                                    </div>
                                ) : (
                                    filteredCases.map(c => (
                                        <div key={c.id} onClick={() => !isEditable && navigateTo('case-viewer', c.id)} className="flex items-center justify-between p-04 border border-default rounded-sm bg-panel hover:border-active cursor-pointer group transition-all hover:shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-sm flex items-center justify-center border transition-colors ${c.priority === 'Critical' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-subtle border-default text-tertiary'}`}><Briefcase size={18}/></div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-primary group-hover:text-blue-600 transition-colors uppercase tracking-tight">{c.title}</h4>
                                                    <div className="text-[10px] text-tertiary font-mono">RID: {c.id.split('-').pop()} • {new Date(c.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <NexStatusBadge status={c.status} />
                                                <ChevronRight size={16} className="text-tertiary group-hover:translate-x-1 transition-transform"/>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="flex h-full gap-04 overflow-x-auto pb-2 no-scrollbar">
                                {stages.map(stage => (
                                    <div key={stage} className="flex-1 min-w-[280px] bg-subtle rounded-sm border border-default flex flex-col max-h-full shadow-inner">
                                        <div className="p-04 border-b border-default font-bold text-[10px] text-secondary uppercase tracking-widest bg-panel/50 flex justify-between items-center">
                                            <span>{stage}</span>
                                            <span className="bg-subtle px-1.5 py-0.5 rounded-full border border-default text-[9px]">{filteredCases.filter(c => c.status === stage).length}</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-03 space-y-03">
                                            {filteredCases.filter(c => c.status === stage).map(c => (
                                                <div key={c.id} onClick={() => !isEditable && navigateTo('case-viewer', c.id)} className="p-04 bg-panel border border-default rounded-sm shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 border-l-4 border-l-blue-500">
                                                    <div className="text-xs font-bold text-primary mb-2 line-clamp-2 uppercase tracking-tight leading-snug">{c.title}</div>
                                                    <div className="flex justify-between items-center mt-3">
                                                        <NexBadge variant={c.priority === 'Critical' ? 'rose' : 'slate'}>{c.priority}</NexBadge>
                                                        <div className="flex items-center gap-1">
                                                            <div className="text-[9px] font-mono text-tertiary">...{c.id.split('-').pop()?.slice(-4)}</div>
                                                            {stage !== 'Closed' && (
                                                                <button 
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        const nextIdx = stages.indexOf(stage) + 1;
                                                                        if (nextIdx < stages.length) updateCase(c.id, { status: stages[nextIdx] as any });
                                                                    }}
                                                                    className="ml-auto p-1 hover:bg-emerald-50 text-emerald-600 rounded-sm"
                                                                    title="Advance Stage"
                                                                >
                                                                    <ChevronRight size={12}/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredCases.filter(c => c.status === stage).length === 0 && (
                                                <div className="h-full flex items-center justify-center py-10 opacity-30 grayscale">
                                                    <Activity size={24} className="text-tertiary"/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </NexCard>
            ]}
        </PageGridLayout>
      </div>
    </div>
  );
};
