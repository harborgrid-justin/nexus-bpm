
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { ShieldCheck, History, AlertTriangle, FileText, User, Search, Filter, CheckCircle, Fingerprint, ShieldAlert, Globe, ExternalLink, Eye } from 'lucide-react';
import { NexCard, NexBadge } from './shared/NexUI';

export const GovernanceView: React.FC = () => {
  const { auditLogs, processes, rules, openInstanceViewer, navigateTo } = useBPM();
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
    if (log.entityType === 'Instance') {
      openInstanceViewer(log.entityId);
    } else if (log.entityType === 'Case') {
      navigateTo('case-viewer', log.entityId);
    } else if (log.entityType === 'Process') {
      navigateTo('processes', log.entityId);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-300 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit Center</h2>
          <p className="text-xs text-slate-500 font-medium">Immutable record-keeping and compliance verification.</p>
        </div>
        <div className="flex gap-4">
          <NexCard className="px-4 py-2 min-w-[120px] text-center bg-slate-50">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Trust Score</p>
            <p className={`text-lg font-black ${Number(trustScore) > 90 ? 'text-emerald-600' : 'text-amber-500'}`}>{trustScore}%</p>
          </NexCard>
          <NexCard className="px-4 py-2 min-w-[120px] text-center bg-slate-50">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Active Rules</p>
            <p className="text-lg font-black text-slate-900">{rules.length}</p>
          </NexCard>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><History size={14}/> Operational Ledger</h3>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
              <input 
                type="text" 
                placeholder="Search ledger..." 
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs outline-none focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-500 uppercase">
                  <th className="px-4 py-2 border-r border-slate-200">Timestamp</th>
                  <th className="px-4 py-2 border-r border-slate-200">Action</th>
                  <th className="px-4 py-2 border-r border-slate-200">Entity & Details</th>
                  <th className="px-4 py-2 text-right">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-xs italic text-slate-400">No events found.</td></tr>
                ) : filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors text-xs group">
                    <td className="px-4 py-2 text-slate-600 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase border ${
                        log.severity === 'Alert' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        log.severity === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate max-w-xs">
                          <span className="font-bold text-slate-800 mr-2">{log.entityType}:</span>
                          <span className="text-slate-600">{log.details}</span>
                        </div>
                        {['Instance', 'Case', 'Process'].includes(log.entityType) && (
                          <button onClick={() => handleEntityClick(log)} className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye size={12}/>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="font-semibold text-slate-700">{log.userId}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-4">
          <div className="bg-slate-900 p-5 rounded-sm shadow-sm text-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4 flex items-center gap-2"><ShieldCheck size={14}/> Compliance</h3>
            <div className="space-y-2">
              {['SOC2 Type II', 'GDPR / CCPA', 'HIPAA compliant'].map(reg => (
                <div key={reg} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-sm">
                  <span className="text-xs font-medium text-slate-300">{reg}</span>
                  <CheckCircle size={12} className="text-emerald-500"/>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 bg-white text-slate-900 rounded-sm text-[10px] font-bold uppercase hover:bg-slate-100">Download Report</button>
          </div>

          <NexCard className="p-0">
            <div className="p-3 border-b border-slate-200 bg-slate-50">
               <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><FileText size={14}/> Model Integrity</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {processes.slice(0, 5).map(p => (
                <div key={p.id} onClick={() => navigateTo('processes', p.id)} className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center group">
                   <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">{p.name}</div>
                      <div className="text-[10px] text-slate-500">Ver: {p.version}.0 • {p.complianceLevel}</div>
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
