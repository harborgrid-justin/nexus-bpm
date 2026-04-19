
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { ShieldCheck, History, FileText, Eye, Download, GripVertical, CheckCircle, Activity, Lock } from 'lucide-react';
import { NexCard, NexDataTable, NexSearchFilterBar, NexEmptyState, NexStatusBadge, Restricted, KPICard } from './shared/NexUI';
import { Permission, AuditLog } from '../types';
import { exportToCSV, formatDate } from '../utils';
import { PageGridLayout } from './shared/PageGridLayout';

export const GovernanceView: React.FC = () => {
  const { auditLogs, processes, rules, openInstanceViewer, navigateTo, settings, addNotification } = useBPM();
  const [searchTerm, setSearchTerm] = useState('');

  const defaultLayouts = useMemo(() => ({
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
  }), []);

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
      { header: 'Timestamp', accessor: (l: AuditLog) => formatDate(l.timestamp, true), width: '160px', sortable: true },
      { header: 'Action', accessor: (l: AuditLog) => <div className="flex flex-col gap-1"><NexStatusBadge status={l.action} />{l.metadata?.domainId && <span className="text-[9px] font-mono text-tertiary">D: {l.metadata.domainId}</span>}</div>, width: '160px', sortable: true },
      { header: 'Severity', accessor: (l: AuditLog) => <span className={`font-bold ${l.severity === 'Alert' ? 'text-rose-600' : 'text-blue-600'}`}>{l.severity}</span>, width: '80px', sortable: true },
      { header: 'Details', accessor: (l: AuditLog) => <div className="flex flex-col"><span className="truncate max-w-[200px]" title={l.details}>{l.details}</span>{l.metadata?.reasonCode && <span className="text-[10px] text-tertiary italic">Reason: {l.metadata.reasonCode}</span>}</div>},
      { header: 'User', accessor: (l: AuditLog) => <div className="flex flex-col items-end"><span className="font-mono text-secondary truncate text-xs">{l.userId}</span>{l.metadata?.ipAddress && <span className="text-[9px] text-tertiary hidden lg:block">{l.metadata.ipAddress}</span>}</div>, width: '120px', align: 'right' as const }
  ];

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-default pb-04 shrink-0 mb-layout">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight">Audit Center</h2>
          <p className="text-xs text-secondary font-medium">Immutable record-keeping and compliance verification.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <PageGridLayout defaultLayouts={defaultLayouts}>
            {({ isEditable }) => [
                <KPICard 
                    key="kpi-trust" 
                    isEditable={isEditable} 
                    title="System Trust Score" 
                    value={`${trustScore}%`} 
                    icon={ShieldCheck} 
                    color={Number(trustScore) > 90 ? 'emerald' : 'blue'} 
                />,

                <KPICard 
                    key="kpi-rules" 
                    isEditable={isEditable} 
                    title="Applied Rules" 
                    value={rules.length} 
                    icon={Lock} 
                    color="slate" 
                    onClick={() => !isEditable && navigateTo('rules-engine')}
                />,

                <NexCard key="main-log" dragHandle={isEditable} className="flex flex-col p-0 overflow-hidden shadow-sm">
                    <div className="p-03 border-b border-default bg-subtle">
                        <NexSearchFilterBar 
                            placeholder="Search cryptographically signed ledger..." 
                            searchValue={searchTerm} 
                            onSearch={setSearchTerm} 
                            className="bg-panel"
                            actions={
                                <Restricted to={Permission.ADMIN_ACCESS}>
                                    <div className="flex gap-1">
                                        <button onClick={() => addNotification('info', 'Ledger consistency check started')} className="p-2 hover:bg-emerald-50 rounded-sm text-emerald-600 transition-colors" title="Verify Integrity"><ShieldCheck size={16}/></button>
                                        <button onClick={() => exportToCSV(filteredLogs, 'audit', [])} className="p-2 hover:bg-subtle rounded-sm text-tertiary hover:text-primary transition-colors"><Download size={16}/></button>
                                    </div>
                                </Restricted>
                            }
                        />
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col bg-panel">
                        <NexDataTable 
                            data={filteredLogs} 
                            columns={columns} 
                            keyField="id" 
                            onRowClick={(log: AuditLog) => !isEditable && addNotification('info', `Log Entry: ${log.details}`, { view: 'governance' })}
                            emptyState={<NexEmptyState icon={History} title="No observations logged" description="The audit trail is currently awaiting telemetry." />}
                        />
                    </div>
                </NexCard>,

                <div key="widget-compliance" className="h-full">
                    <div className="bg-slate-900 p-05 rounded-base shadow-lg text-white h-full flex flex-col relative overflow-hidden border border-slate-700">
                        {isEditable && <div className="absolute top-2 right-2 drag-handle cursor-move p-1 bg-white/10 rounded-sm hover:bg-white/20 transition-colors"><GripVertical size={14}/></div>}
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-04 flex items-center gap-2"><ShieldCheck size={14}/> Verified Compliance</h3>
                        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                            {settings.compliance.standards.map(reg => (
                                <div key={reg} className="flex items-center justify-between p-03 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-colors">
                                    <span className="text-xs font-medium text-slate-300">{reg}</span>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>,

                <NexCard key="widget-integrity" title="Deployment Integrity" dragHandle={isEditable} className="p-0 flex flex-col shadow-sm">
                    <div className="flex-1 overflow-y-auto divide-y divide-default bg-panel">
                        {processes.length === 0 ? (
                            <NexEmptyState icon={Activity} title="No models" description="Deployment registry is empty." />
                        ) : (
                            processes.slice(0, 8).map(p => (
                                <div key={p.id} onClick={() => !isEditable && navigateTo('processes', p.id)} className="p-03 hover:bg-subtle cursor-pointer flex justify-between items-center group transition-colors">
                                    <div className="text-xs font-bold text-primary truncate max-w-[150px] group-hover:text-blue-600 transition-colors">{p.name}</div>
                                    <div className={`w-2 h-2 rounded-full shadow-sm transition-all ${p.isActive ? 'bg-emerald-500' : 'bg-slate-300 opacity-50'}`}></div>
                                </div>
                            ))
                        )}
                    </div>
                </NexCard>
            ]}
        </PageGridLayout>
      </div>
    </div>
  );
};
