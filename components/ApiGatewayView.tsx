
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  Globe, Server, Activity, Play, Copy, RefreshCw, 
  Database, Terminal, Plus, ShieldAlert, Wifi, WifiOff, Settings, Zap, PauseCircle, Lock, Webhook
} from 'lucide-react';
import { NexCard, NexButton, NexBadge, NexSwitch, NexModal, NexFormGroup } from './shared/NexUI';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockStreamService, StreamEvent } from '../services/mockStreamService';

interface LiveLog extends StreamEvent {
    // Extending stream event
}

interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    events: string[];
    secret: string;
    active: boolean;
}

export const ApiGatewayView: React.FC = () => {
  const { rules, decisionTables, executeRules, addNotification, apiClients, toggleApiClient, auditLogs } = useBPM();
  const [activeTab, setActiveTab] = useState<'endpoints' | 'clients' | 'webhooks' | 'logs'>('endpoints');
  const [selectedEndpoint, setSelectedEndpoint] = useState<{type: 'Rule' | 'Table', id: string, name: string, endpoint: string, status: string, circuitOpen: boolean} | null>(null);
  const [testPayload, setTestPayload] = useState('{\n  "amount": 5000,\n  "category": "Software"\n}');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
      { id: 'wh-1', name: 'Slack Notifications', url: 'https://hooks.slack.com/services/T000/B000/XXXX', events: ['task.completed'], secret: 'whsec_...', active: true },
      { id: 'wh-2', name: 'ERP Sync', url: 'https://api.sap.corp/v2/events', events: ['case.created', 'case.updated'], secret: 'whsec_...', active: false }
  ]);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState<Partial<WebhookConfig>>({});

  // Log Streaming State
  const [liveLogs, setLiveLogs] = useState<LiveLog[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const registry = useMemo(() => {
    const rItems = rules.map(r => ({ ...r, type: 'Rule' as const, method: 'POST', endpoint: `/v1/execute/rule/${r.id}`, circuitOpen: false }));
    const tItems = decisionTables.map(t => ({ ...t, type: 'Table' as const, method: 'POST', endpoint: `/v1/execute/table/${t.id}`, circuitOpen: false }));
    return [...rItems, ...tItems];
  }, [rules, decisionTables]);

  const trafficData = useMemo(() => {
      const hours = 24;
      const data = [];
      const now = new Date();
      for (let i = hours - 1; i >= 0; i--) {
          const startTime = new Date(now.getTime() - (i * 60 * 60 * 1000));
          const endTime = new Date(startTime.getTime() + (60 * 60 * 1000));
          const count = auditLogs.filter(l => {
              const t = new Date(l.timestamp);
              return t >= startTime && t < endTime;
          }).length;
          data.push({
              time: startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              reqs: count + 10
          });
      }
      return data;
  }, [auditLogs]);

  useEffect(() => {
      if (activeTab === 'logs') {
          const unsub = mockStreamService.subscribe((event) => {
              setLiveLogs(prev => [event as LiveLog, ...prev].slice(0, 100));
          });
          return unsub;
      }
  }, [activeTab]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(`https://api.nexflow.io${url}`);
    addNotification('info', 'Endpoint URL copied to clipboard');
  };

  const evaluateTableLocally = (tableId: string, input: Record<string, any>) => {
    const table = decisionTables.find(t => t.id === tableId);
    if (!table) return { error: 'Table not found' };
    for (const row of table.rules) {
        let match = true;
        for (let i = 0; i < table.inputs.length; i++) {
            const colName = table.inputs[i];
            const ruleVal = row[i];
            const inputVal = input[colName]; 
            if (ruleVal !== 'Any' && ruleVal !== inputVal && String(ruleVal) !== String(inputVal)) {
                match = false; 
            }
            if (!match) break;
        }
        if (match) {
            const result: Record<string, any> = { matched: true, rowId: table.rules.indexOf(row) + 1 };
            table.outputs.forEach((outCol, idx) => { result[outCol] = row[table.inputs.length + idx]; });
            return result;
        }
    }
    return { matched: false, reason: 'No matching row found' };
  };

  const handleTest = async () => {
    if (!selectedEndpoint) return;
    if (selectedEndpoint.circuitOpen) { setTestResponse(JSON.stringify({ error: 'Circuit Open: Service Unavailable' }, null, 2)); return; }
    setIsTesting(true); setTestResponse(null);
    try {
        const payload = JSON.parse(testPayload);
        let result;
        await new Promise(r => setTimeout(r, 600));
        if (selectedEndpoint.type === 'Rule') { result = await executeRules(selectedEndpoint.id, payload); } 
        else { result = evaluateTableLocally(selectedEndpoint.id, payload); }
        setTestResponse(JSON.stringify(result, null, 2));
    } catch (e) { setTestResponse(JSON.stringify({ error: 'Invalid JSON Payload' }, null, 2)); } 
    finally { setIsTesting(false); }
  };

  const saveWebhook = () => {
      if(newWebhook.name && newWebhook.url) {
          const wh: WebhookConfig = {
              id: `wh-${Date.now()}`,
              name: newWebhook.name,
              url: newWebhook.url,
              events: newWebhook.events || ['task.completed'],
              secret: `whsec_${Math.random().toString(36).substr(2)}`,
              active: true
          };
          setWebhooks([...webhooks, wh]);
          setWebhookModalOpen(false);
          setNewWebhook({});
      }
  };

  return (
    <div className="flex flex-col h-full bg-app animate-fade-in pb-20">
      <header className="bg-panel border-b border-default px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2"><Globe size={24} className="text-blue-600"/> API Gateway</h1>
          <p className="text-xs text-secondary mt-1">Manage external access to business logic microservices.</p>
        </div>
        <div className="flex gap-6">
           <div className="text-right hidden sm:block"><p className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-end gap-1"><Zap size={10}/> Latency</p><p className="text-lg font-mono font-bold text-primary">42ms</p></div>
           <div className="h-8 w-px bg-default hidden sm:block"></div>
           <div className="text-right hidden sm:block"><p className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-end gap-1"><Activity size={10}/> Success Rate</p><p className="text-lg font-mono font-bold text-emerald-600">99.98%</p></div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6">
           <NexCard className="mb-6 p-0 overflow-hidden shrink-0">
              <div className="px-4 py-3 border-b border-subtle bg-subtle flex justify-between items-center">
                 <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><Activity size={14}/> Traffic Volume (24h)</h3>
                 <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-base border border-blue-100 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Live</span>
              </div>
              <div className="h-48 p-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficData}>
                       <defs><linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                       <Tooltip contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px'}} />
                       <Area type="monotone" dataKey="reqs" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReqs)" strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </NexCard>

           <div className="flex border-b border-default mb-4">
              {['endpoints', 'clients', 'webhooks', 'logs'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{tab}</button>
              ))}
           </div>

           {activeTab === 'endpoints' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
                   <div className="lg:col-span-1 border border-default rounded-sm bg-white flex flex-col overflow-hidden shadow-sm">
                       <div className="p-3 border-b border-subtle bg-slate-50"><h4 className="text-xs font-bold text-slate-700 uppercase">Available Routes</h4></div>
                       <div className="flex-1 overflow-y-auto">
                           {registry.map((item) => (
                               <div key={item.id} onClick={() => setSelectedEndpoint(item)} className={`p-3 border-b border-subtle cursor-pointer transition-colors hover:bg-slate-50 ${selectedEndpoint?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                                   <div className="flex justify-between items-center mb-1">
                                       <div className="flex gap-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${item.type === 'Rule' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.type}</span></div>
                                       <NexBadge variant={item.status === 'Active' ? 'emerald' : 'slate'}>{item.status}</NexBadge>
                                   </div>
                                   <div className="font-bold text-sm text-slate-800 truncate">{item.name}</div>
                               </div>
                           ))}
                       </div>
                   </div>
                   <div className="lg:col-span-2 border border-default rounded-sm bg-white flex flex-col overflow-hidden shadow-sm">
                       {selectedEndpoint ? (
                           <>
                               <div className="p-4 border-b border-subtle bg-slate-50 flex justify-between items-center">
                                   <div><h4 className="font-bold text-slate-800 flex items-center gap-2"><span className="px-2 py-0.5 bg-slate-200 rounded-sm text-[10px]">POST</span>{selectedEndpoint.endpoint}</h4></div>
                                   <div className="flex items-center gap-3">
                                       <button onClick={() => handleCopyUrl(selectedEndpoint.endpoint)} className="text-blue-600 hover:underline text-xs flex items-center gap-1"><Copy size={12}/> Copy URL</button>
                                   </div>
                               </div>
                               <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
                                   <div className="flex-1 flex flex-col">
                                       <label className="text-xs font-bold text-slate-500 uppercase mb-2">Request Body</label>
                                       <textarea className="flex-1 w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-sm outline-none resize-none" value={testPayload} onChange={e => setTestPayload(e.target.value)}/>
                                   </div>
                                   <div className="flex justify-between items-center"><NexButton variant="primary" icon={Play} onClick={handleTest} disabled={isTesting}>{isTesting ? 'Sending...' : 'Send Request'}</NexButton></div>
                                   <div className="flex-1 flex flex-col h-1/2 min-h-[150px]">
                                       <label className="text-xs font-bold text-slate-500 uppercase mb-2">Response</label>
                                       <div className="flex-1 w-full font-mono text-xs p-3 bg-slate-50 text-slate-800 rounded-sm border border-slate-200 overflow-auto whitespace-pre-wrap">{testResponse}</div>
                                   </div>
                               </div>
                           </>
                       ) : (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400"><Server size={48} className="mb-4 opacity-50"/><p className="text-sm font-bold uppercase">Select an endpoint</p></div>
                       )}
                   </div>
               </div>
           )}

           {activeTab === 'clients' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {apiClients.map(client => (
                       <NexCard key={client.id} className="p-4 flex flex-col justify-between h-40 group hover:border-blue-300 transition-all">
                           <div className="flex justify-between items-start"><div className="p-2 bg-blue-50 text-blue-600 rounded-sm"><Terminal size={20}/></div><button onClick={() => toggleApiClient(client.id)}><NexBadge variant={client.status === 'Active' ? 'emerald' : 'rose'}>{client.status}</NexBadge></button></div>
                           <div><h4 className="font-bold text-slate-900 text-sm">{client.name}</h4><code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-mono mt-1 block w-fit">{client.clientId}</code></div>
                       </NexCard>
                   ))}
                   <button className="border-2 border-dashed border-slate-300 rounded-sm flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all h-40"><Plus size={24} className="mb-2"/><span className="text-xs font-bold uppercase">Register Client</span></button>
               </div>
           )}

           {activeTab === 'webhooks' && (
               <div className="flex flex-col gap-4">
                   <div className="flex justify-end">
                       <NexButton variant="primary" icon={Plus} onClick={() => setWebhookModalOpen(true)}>Register Webhook</NexButton>
                   </div>
                   {webhooks.length === 0 ? (
                       <div className="p-12 border-2 border-dashed border-slate-200 rounded-sm bg-slate-50 flex flex-col items-center justify-center gap-3">
                           <Webhook size={32} className="text-slate-300"/>
                           <p className="text-sm font-bold text-slate-500">No outbound webhooks configured.</p>
                           <NexButton variant="primary" onClick={() => setWebhookModalOpen(true)} icon={Plus}>Create First Webhook</NexButton>
                       </div>
                   ) : (
                       <div className="space-y-3">
                           {webhooks.map(wh => (
                               <NexCard key={wh.id} className="p-4 flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                       <div className={`p-2 rounded-sm ${wh.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                           <Webhook size={20}/>
                                       </div>
                                       <div>
                                           <h4 className="text-sm font-bold text-slate-900">{wh.name}</h4>
                                           <p className="text-xs text-slate-500 font-mono">{wh.url}</p>
                                       </div>
                                   </div>
                                   <div className="flex items-center gap-4">
                                       <div className="flex gap-1">
                                           {wh.events.map(ev => <span key={ev} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100">{ev}</span>)}
                                       </div>
                                       <NexSwitch checked={wh.active} onChange={() => {}} label="" />
                                   </div>
                               </NexCard>
                           ))}
                       </div>
                   )}
               </div>
           )}

           {activeTab === 'logs' && (
               <div className="bg-slate-900 border border-slate-800 rounded-sm shadow-sm flex flex-col h-[600px] font-mono text-xs overflow-hidden relative">
                   <div className="p-2 border-b border-slate-800 bg-slate-950 flex justify-between items-center text-slate-400"><h3 className="font-bold uppercase flex items-center gap-2"><Terminal size={12}/> Live Stream</h3><div className="flex gap-2 items-center"><span className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Connected</span></div></div>
                   <div className="flex-1 overflow-y-auto p-2 space-y-1" ref={logContainerRef}>
                       {liveLogs.map(log => (
                           <div key={log.id} className="flex gap-3 hover:bg-slate-800/50 p-0.5 rounded text-slate-300 animate-slide-up">
                               <span className="text-slate-600 w-16 shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                               <span className={`w-12 font-bold ${log.source === 'API Gateway' ? 'text-amber-400' : 'text-blue-400'}`}>{log.source}</span>
                               <span className={`w-8 font-bold ${log.severity === 'error' ? 'text-rose-500' : log.severity === 'warn' ? 'text-orange-400' : 'text-emerald-400'}`}>{log.severity}</span>
                               <span className="flex-1 truncate text-slate-400">{log.message}</span>
                           </div>
                       ))}
                   </div>
               </div>
           )}
        </main>
      </div>

      <NexModal isOpen={webhookModalOpen} onClose={() => setWebhookModalOpen(false)} title="Register Outbound Webhook" size="md">
          <div className="space-y-4">
              <NexFormGroup label="System Name">
                  <input className="prop-input" placeholder="e.g. Production ERP" value={newWebhook.name || ''} onChange={e => setNewWebhook({...newWebhook, name: e.target.value})} />
              </NexFormGroup>
              <NexFormGroup label="Target URL">
                  <input className="prop-input" placeholder="https://..." value={newWebhook.url || ''} onChange={e => setNewWebhook({...newWebhook, url: e.target.value})} />
              </NexFormGroup>
              <NexFormGroup label="Events to Subscribe">
                  <div className="flex flex-wrap gap-2">
                      {['task.created', 'task.completed', 'case.updated', 'process.started'].map(ev => (
                          <label key={ev} className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border cursor-pointer">
                              <input type="checkbox" checked={newWebhook.events?.includes(ev)} onChange={(e) => {
                                  const current = newWebhook.events || [];
                                  setNewWebhook({ ...newWebhook, events: e.target.checked ? [...current, ev] : current.filter(x => x !== ev) });
                              }}/>
                              <span className="text-xs">{ev}</span>
                          </label>
                      ))}
                  </div>
              </NexFormGroup>
              <div className="flex justify-end pt-4">
                  <NexButton variant="primary" onClick={saveWebhook}>Register Hook</NexButton>
              </div>
          </div>
      </NexModal>
    </div>
  );
};
