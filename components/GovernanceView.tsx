
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { ShieldCheck, History, FileText, Eye, Download } from 'lucide-react';
import { NexCard, NexDataTable, NexSearchFilterBar, NexEmptyState, NexStatusBadge, Restricted } from './shared/NexUI';
import { Permission } from '../types';
import { exportToCSV, formatDate } from '../utils';

export const GovernanceView: React.FC = () => {
  const { auditLogs, processes, rules, openInstanceViewer, navigateTo, settings } = useBPM();
  const [searchTerm, setSearchTerm] = useState('');

  // Dynamic Trust Calculation
  const trustScore = useMemo(() => {
    if (auditLogs.length === 0) return 100;
    const alerts = auditLogs.filter(l => l.severity === 'Alert').length;
    const warnings = auditLogs.filter(l => l.severity === 'Warning').length;
    const score = 100 - ((alerts * 5) + (warnings * 1)) / auditLogs.length * 10; 
    return Math.max(0, Math.min(100, score)).toFixed(1);
  }, [auditLogs]);

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEntityClick = (log: any) => {
    if (log.entityType === 'Instance') openInstanceViewer(log.entityId);
    else if (log.entityType === 'Case') navigateTo('case-viewer', log.entityId);
    else if (log.entityType === 'Process') navigateTo('processes', log.entityId);
  };

  const handleDownloadReport = () => {
      exportToCSV(filteredLogs, 'audit_report', ['timestamp', 'action', 'severity', 'entityType', 'entityId', 'userId', 'details']);
  };

  const columns = [
      { header: 'Timestamp', accessor: (l: any) => formatDate(l.timestamp, true), width: '180px', sortable: true },
      { header: 'Action', accessor: (l: any) => <NexStatusBadge status={l.action} />, width: '150px', sortable: true },
      { header: 'Severity', accessor: (l: any) => (
          <span className={`font-bold ${l.severity === 'Alert' ? 'text-rose-600' : l.severity === 'Warning' ? 'text-amber-600' : 'text-blue-600'}`}>{l.severity}</span>
      ), width: '100px', sortable: true },
      { header: 'Entity & Details', accessor: (l: any) => (
          <div className="flex justify-between items-center w-full">
              <span className="truncate max-w-xs" title={l.details}><span className="font-bold">{l.entityType}:</span> {l.details}</span>
              {['Instance', 'Case', 'Process'].includes(l.entityType) && (
                  <button onClick={(e) => { e.stopPropagation(); handleEntityClick(l); }} className="text-slate-400 hover:text-blue-600 p-1"><Eye size={14}/></button>
              )}
          </div>
      )},
      { header: 'User', accessor: (l: any) => <span className="font-mono text-slate-500">{l.userId}</span>, width: '120px', align: 'right' as const }
  ];

  return (
    <div 
      className="animate-fade-in pb-20 flex flex-col"
      style={{ gap: 'var(--section-gap)' }}
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-default pb-4">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight">Audit Center</h2>
          <p className="text-xs text-secondary font-medium">Immutable record-keeping and compliance verification.</p>
        </div>
        <div className="flex gap-4">
          <NexCard className="px-4 py-2 min-w-[120px] text-center bg-subtle">
            <p className="text-xs font-bold text-secondary uppercase">Trust Score</p>
            <p className={`text-lg font-black ${Number(trustScore) > 90 ? 'text-emerald-600' : 'text-amber-500'}`}>{trustScore}%</p>
          </NexCard>
          <NexCard className="px-4 py-2 min-w-[120px] text-center bg-subtle">
            <p className="text-xs font-bold text-secondary uppercase">Active Rules</p>
            <p className="text-lg font-black text-primary">{rules.length}</p>
          </NexCard>
        </div>
      </header>

      <div 
        className="flex flex-col lg:flex-row"
        style={{ gap: 'var(--layout-gap)' }}
      >
        <div className="flex-1 bg-panel border border-default rounded-base shadow-sm flex flex-col">
          <div className="p-3 border-b border-subtle bg-subtle">
             <NexSearchFilterBar 
                placeholder="Search ledger..." 
                searchValue={searchTerm} 
                onSearch={setSearchTerm} 
                actions={
                    <Restricted to={Permission.ADMIN_ACCESS}>
                        <button onClick={handleDownloadReport} className="p-2 hover:bg-slate-200 rounded text-slate-500" title="Export CSV"><Download size={16}/></button>
                    </Restricted>
                }
             />
          </div>
          <NexDataTable 
            data={filteredLogs} 
            columns={columns} 
            keyField="id" 
            emptyState={<NexEmptyState icon={History} title="No Events" description="Audit log is empty." />}
          />
        </div>

        <div 
          className="w-full lg:w-80 flex flex-col"
          style={{ gap: 'var(--layout-gap)' }}
        >
          <div className="bg-brand-slate p-5 rounded-base shadow-sm text-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4 flex items-center gap-2"><ShieldCheck size={14}/> Compliance</h3>
            <div className="space-y-2">
              {settings.compliance.standards.map(reg => (
                <div key={reg} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-base">
                  <span className="text-xs font-medium text-slate-300">{reg}</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 text-[10px] text-slate-400">
                Last Audit: {formatDate(settings.compliance.lastAudit)}
            </div>
          </div>

          <NexCard title={<span className="flex items-center gap-2 text-xs font-bold uppercase"><FileText size={14}/> Model Integrity</span>}>
            <div className="divide-y divide-subtle">
              {processes.slice(0, 5).map(p => (
                <div key={p.id} onClick={() => navigateTo('processes', p.id)} className="p-3 hover:bg-subtle cursor-pointer flex justify-between items-center group">
                   <div>
                      <div className="text-xs font-bold text-primary group-hover:text-blue-600">{p.name}</div>
                      <div className="text-xs text-secondary">Ver: {p.version}.0 • {p.complianceLevel}</div>
                   </div>
                   <div className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                </div>
              ))}
            </div>
          </NexCard>
        </div>
      </div>
    </div>
  );
};
