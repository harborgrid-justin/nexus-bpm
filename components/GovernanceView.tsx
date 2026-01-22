
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { ShieldCheck, History, FileText, Eye, Download, GripVertical } from 'lucide-react';
import { NexCard, NexDataTable, NexSearchFilterBar, NexEmptyState, NexStatusBadge, Restricted } from './shared/NexUI';
import { Permission } from '../types';
import { exportToCSV, formatDate } from '../utils';
import { PageGridLayout } from './shared/PageGridLayout';

export const GovernanceView: React.FC = () => {
  const { auditLogs, processes, rules, openInstanceViewer, navigateTo, settings } = useBPM();
  const [searchTerm, setSearchTerm] = useState('');

  const defaultLayouts = {
      lg: [
          { i: 'kpi-trust', x: 0, y: 0, w: 3, h: 4 },
          { i: 'kpi-rules', x: 3, y: 0, w: 3, h: 4 },
          { i: 'widget-compliance', x: 6, y: 0, w: 3, h: 8 },
          { i: 'widget-integrity', x: 9, y: 0, w: 3, h: 8 },
          { i: 'main-log', x: 0, y: 4, w: 6, h: 14 }
      ],
      md: [
          { i: 'kpi-trust', x: 0, y: 0, w: 5, h: 4 },
          { i: 'kpi-rules', x: 5, y: 0, w: 5, h: 4 },
          { i: 'widget-compliance', x: 0, y: 4, w: 5, h: 8 },
          { i: 'widget-integrity', x: 5, y: 4, w: 5, h: 8 },
          { i: 'main-log', x: 0, y: 12, w: 10, h: 14 }
      ]
  };

  const trustScore = useMemo(() => {
    if (auditLogs.length === 0) return 100;
    const alerts = auditLogs.filter(l => l.severity === 'Alert').length;
    return Math.max(0, 100 - (alerts * 5)).toFixed(1);
  }, [auditLogs]);

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
      { header: 'Timestamp', accessor: (l: any) => formatDate(l.timestamp, true), width: '160px', sortable: true },
      { header: 'Action', accessor: (l: any) => <NexStatusBadge status={l.action} />, width: '140px', sortable: true },
      { header: 'Severity', accessor: (l: any) => <span className={`font-bold ${l.severity === 'Alert' ? 'text-rose-600' : 'text-blue-600'}`}>{l.severity}</span>, width: '80px', sortable: true },
      { header: 'Details', accessor: (l: any) => <span className="truncate max-w-[200px]" title={l.details}>{l.details}</span>},
      { header: 'User', accessor: (l: any) => <span className="font-mono text-tertiary truncate">{l.userId}</span>, width: '100px', align: 'right' as const }
  ];

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-default pb-4 shrink-0 mb-4">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight">Audit Center</h2>
          <p className="text-xs text-secondary font-medium">Immutable record-keeping and compliance verification.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <PageGridLayout defaultLayouts={defaultLayouts}>
            {({ isEditable }) => (
                <>
                    <NexCard key="kpi-trust" dragHandle={isEditable} className="flex flex-col justify-center items-center text-center p-0">
                        <div className="p-4">
                            <p className="text-xs font-bold text-secondary uppercase mb-2">Trust Score</p>
                            <p className={`text-4xl font-black ${Number(trustScore) > 90 ? 'text-emerald-600' : 'text-amber-500'}`}>{trustScore}%</p>
                        </div>
                    </NexCard>

                    <NexCard key="kpi-rules" dragHandle={isEditable} className="flex flex-col justify-center items-center text-center p-0">
                        <div className="p-4">
                            <p className="text-xs font-bold text-secondary uppercase mb-2">Active Rules</p>
                            <p className="text-4xl font-black text-primary">{rules.length}</p>
                        </div>
                    </NexCard>

                    <NexCard key="main-log" dragHandle={isEditable} className="flex flex-col p-0 overflow-hidden h-full">
                        <div className="p-3 border-b border-default bg-subtle">
                            <NexSearchFilterBar 
                                placeholder="Search ledger..." 
                                searchValue={searchTerm} 
                                onSearch={setSearchTerm} 
                                actions={
                                    <Restricted to={Permission.ADMIN_ACCESS}>
                                        <button onClick={() => exportToCSV(filteredLogs, 'audit', [])} className="p-2 hover:bg-slate-200 rounded text-tertiary hover:text-primary"><Download size={16}/></button>
                                    </Restricted>
                                }
                            />
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <NexDataTable 
                                data={filteredLogs} 
                                columns={columns} 
                                keyField="id" 
                                emptyState={<NexEmptyState icon={History} title="No Events" description="Audit log is empty." />}
                            />
                        </div>
                    </NexCard>

                    <div key="widget-compliance" className="h-full">
                        <div className="bg-brand-slate p-5 rounded-base shadow-sm text-white h-full flex flex-col relative overflow-hidden">
                            {isEditable && <div className="absolute top-2 right-2 drag-handle cursor-move p-1 bg-white/10 rounded"><GripVertical size={14}/></div>}
                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4 flex items-center gap-2"><ShieldCheck size={14}/> Compliance</h3>
                            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                                {settings.compliance.standards.map(reg => (
                                    <div key={reg} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-base">
                                        <span className="text-xs font-medium text-slate-300">{reg}</span>
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <NexCard key="widget-integrity" title="Model Integrity" dragHandle={isEditable} className="p-0 h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto divide-y divide-default">
                            {processes.slice(0, 8).map(p => (
                                <div key={p.id} onClick={() => !isEditable && navigateTo('processes', p.id)} className="p-3 hover:bg-subtle cursor-pointer flex justify-between items-center group transition-colors">
                                    <div className="text-xs font-bold text-primary truncate max-w-[150px]">{p.name}</div>
                                    <div className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                </div>
                            ))}
                        </div>
                    </NexCard>
                </>
            )}
        </PageGridLayout>
      </div>
    </div>
  );
};
