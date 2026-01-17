
import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { ShieldCheck, History, AlertTriangle, FileText, User, Search, Filter, CheckCircle, Fingerprint, ShieldAlert, Globe, ExternalLink, Eye } from 'lucide-react';

export const GovernanceView: React.FC = () => {
  const { auditLogs, processes, openInstanceViewer, navigateTo } = useBPM();
  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tightest">Audit Center</h2>
          <p className="text-[15px] text-slate-500 font-medium mt-1.5 leading-relaxed max-w-md">Immutable record-keeping and regulatory compliance verification for all business orchestration events.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-5 rounded-[24px] border border-slate-200/60 shadow-sm min-w-[140px] text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trust Integrity</p>
            <p className="text-2xl font-black text-emerald-500 tracking-tighter">99.9%</p>
          </div>
          <div className="bg-white p-5 rounded-[24px] border border-slate-200/60 shadow-sm min-w-[140px] text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Rules</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">482</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 bg-white rounded-[32px] border border-slate-200/60 card-shadow overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/30">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><History size={20} className="text-slate-400"/> Operational Ledger</h3>
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-900" size={16}/>
              <input 
                type="text" 
                placeholder="Search ledger entries..." 
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Event Lifecycle</th>
                  <th className="px-8 py-5">Classification</th>
                  <th className="px-8 py-5">Entity Domain</th>
                  <th className="px-8 py-5 text-right">Security context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center italic text-slate-400">No matching audit events found.</td></tr>
                ) : filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="text-[13px] font-bold text-slate-900 mb-1">{new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                      <div className="text-[11px] text-slate-400 font-medium">Session ID: {log.id.split('-')[0]}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        log.severity === 'Alert' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        log.severity === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[13px] font-bold text-slate-800 mb-0.5">{log.entityType}</div>
                          <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">{log.details}</div>
                        </div>
                        {['Instance', 'Case', 'Process'].includes(log.entityType) && (
                          <button 
                            onClick={() => handleEntityClick(log)}
                            className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Eye size={14}/>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[13px] font-bold text-slate-700">{log.userId}</span>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[11px] text-slate-600 border border-slate-200">
                          {log.userId.charAt(0)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-8">
          <div className="bg-slate-900 p-8 rounded-[32px] card-shadow text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-400 mb-6 flex items-center gap-2"><ShieldCheck size={18}/> Compliance Registry</h3>
            <div className="space-y-4 relative z-10">
              {['SOC2 Type II', 'GDPR / CCPA', 'HIPAA compliant'].map(reg => (
                <div key={reg} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                  <span className="text-[13px] font-bold text-slate-200">{reg}</span>
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><CheckCircle size={14}/></div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3.5 bg-white text-slate-900 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Download Audit Pack</button>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 card-shadow">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3"><FileText size={20} className="text-slate-400"/> Model Integrity</h3>
            <div className="space-y-4">
              {processes.slice(0, 4).map(p => (
                <div key={p.id} onClick={() => navigateTo('processes', p.id)} className="flex flex-col gap-2 p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</span>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 tracking-widest">V{p.version}.0</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{p.isActive ? 'Production' : 'Archive'}</span>
                    </div>
                    <span className="text-slate-200">|</span>
                    <span className="text-[10px] font-bold text-slate-400">{p.complianceLevel} Protocol</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
