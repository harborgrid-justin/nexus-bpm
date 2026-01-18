
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  Globe, Server, Shield, Key, Activity, Play, Copy, RefreshCw, 
  ChevronRight, BarChart3, Database, Lock, Zap, CheckCircle, XCircle, Terminal
} from 'lucide-react';
import { NexCard, NexButton, NexBadge } from './shared/NexUI';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ApiClient {
  id: string;
  name: string;
  clientId: string;
  status: 'Active' | 'Revoked';
  lastUsed: string;
  reqCount: number;
}

const MOCK_CLIENTS: ApiClient[] = [
  { id: 'c1', name: 'CRM Integration', clientId: 'client_94a...x82', status: 'Active', lastUsed: '2 mins ago', reqCount: 14502 },
  { id: 'c2', name: 'Legacy ERP', clientId: 'client_b21...99a', status: 'Active', lastUsed: '1 hour ago', reqCount: 890 },
  { id: 'c3', name: 'Mobile App v2', clientId: 'client_77c...11b', status: 'Active', lastUsed: 'Just now', reqCount: 45200 },
  { id: 'c4', name: 'Dev Portal', clientId: 'client_test...001', status: 'Revoked', lastUsed: '2 days ago', reqCount: 120 }
];

const TRAFFIC_DATA = [
  { time: '00:00', reqs: 400 }, { time: '04:00', reqs: 300 },
  { time: '08:00', reqs: 2400 }, { time: '12:00', reqs: 3800 },
  { time: '16:00', reqs: 3200 }, { time: '20:00', reqs: 1800 },
  { time: '23:59', reqs: 900 },
];

export const ApiGatewayView: React.FC = () => {
  const { rules, decisionTables, executeRules, addNotification } = useBPM();
  const [activeTab, setActiveTab] = useState<'endpoints' | 'clients' | 'logs'>('endpoints');
  const [selectedEndpoint, setSelectedEndpoint] = useState<{type: 'Rule' | 'Table', id: string, name: string} | null>(null);
  const [testPayload, setTestPayload] = useState('{\n  "amount": 5000,\n  "category": "Software"\n}');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Combine Rules and Tables into a single registry list
  const registry = useMemo(() => {
    const rItems = rules.map(r => ({ ...r, type: 'Rule' as const, method: 'POST', endpoint: `/v1/execute/rule/${r.id}` }));
    const tItems = decisionTables.map(t => ({ ...t, type: 'Table' as const, method: 'POST', endpoint: `/v1/execute/table/${t.id}` }));
    return [...rItems, ...tItems];
  }, [rules, decisionTables]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(`https://api.nexflow.io${url}`);
    addNotification('info', 'Endpoint URL copied to clipboard');
  };

  // Local interpreter for Decision Tables since Context might only have Rule logic
  // (Simplified for demo, real implementation would be in Context)
  const evaluateTableLocally = (tableId: string, input: any) => {
    const table = decisionTables.find(t => t.id === tableId);
    if (!table) return { error: 'Table not found' };

    for (const row of table.rules) {
        let match = true;
        for (let i = 0; i < table.inputs.length; i++) {
            const colName = table.inputs[i];
            const ruleVal = row[i];
            const inputVal = input[colName]; 
            
            if (ruleVal !== 'Any' && ruleVal !== inputVal && String(ruleVal) !== String(inputVal)) {
                if (typeof ruleVal === 'string' && (ruleVal.startsWith('<') || ruleVal.startsWith('>'))) {
                    const op = ruleVal.startsWith('<') ? 'lt' : 'gt';
                    const num = parseFloat(ruleVal.substring(1));
                    if (op === 'lt' && !(Number(inputVal) < num)) match = false;
                    if (op === 'gt' && !(Number(inputVal) > num)) match = false;
                } else {
                    match = false;
                }
            }
            if (!match) break;
        }

        if (match) {
            const result: any = { matched: true, rowId: table.rules.indexOf(row) + 1 };
            table.outputs.forEach((outCol, idx) => {
                result[outCol] = row[table.inputs.length + idx];
            });
            return result;
        }
    }
    return { matched: false, reason: 'No matching row found' };
  };

  const handleTest = async () => {
    if (!selectedEndpoint) return;
    setIsTesting(true);
    setTestResponse(null);
    
    try {
        const payload = JSON.parse(testPayload);
        let result;
        
        await new Promise(r => setTimeout(r, 600)); // Sim Network Latency

        if (selectedEndpoint.type === 'Rule') {
            // WIRE: Call the actual context logic
            result = await executeRules(selectedEndpoint.id, payload);
        } else {
            result = evaluateTableLocally(selectedEndpoint.id, payload);
        }
        
        setTestResponse(JSON.stringify(result, null, 2));
    } catch (e) {
        setTestResponse(JSON.stringify({ error: 'Invalid JSON Payload' }, null, 2));
    } finally {
        setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-app animate-fade-in pb-20">
      {/* Header */}
      <header className="bg-panel border-b border-default px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <Globe size={24} className="text-blue-600"/> API Gateway
          </h1>
          <p className="text-xs text-secondary mt-1">Manage external access to business logic microservices.</p>
        </div>
        <div className="flex gap-4">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-secondary uppercase">Global Latency</p>
              <p className="text-lg font-mono font-bold text-primary">42ms</p>
           </div>
           <div className="h-8 w-px bg-default hidden sm:block"></div>
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-secondary uppercase">Success Rate</p>
              <p className="text-lg font-mono font-bold text-emerald-600">99.98%</p>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6">
           
           {/* Traffic Chart */}
           <NexCard className="mb-6 p-0 overflow-hidden shrink-0">
              <div className="px-4 py-3 border-b border-subtle bg-subtle flex justify-between items-center">
                 <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2">
                    <Activity size={14}/> Traffic Volume (24h)
                 </h3>
                 <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-base border border-blue-100">Live</span>
              </div>
              <div className="h-48 p-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TRAFFIC_DATA}>
                       <defs>
                          <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                       <Tooltip contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px'}} />
                       <Area type="monotone" dataKey="reqs" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReqs)" strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </NexCard>

           {/* Tabs */}
           <div className="flex border-b border-default mb-4">
              {['endpoints', 'clients', 'logs'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={`px-6 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-secondary hover:text-primary'}`}
                 >
                    {tab}
                 </button>
              ))}
           </div>

           {/* Endpoint Registry Tab */}
           {activeTab === 'endpoints' && (
              <div className="space-y-4">
                 <div className="bg-panel rounded-base border border-default shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                       <thead className="bg-subtle border-b border-default">
                          <tr className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                             <th className="px-4 py-3">Method</th>
                             <th className="px-4 py-3">Endpoint Resource</th>
                             <th className="px-4 py-3">Type</th>
                             <th className="px-4 py-3">Status</th>
                             <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-subtle">
                          {registry.map(item => (
                             <tr key={item.id} className={`group hover:bg-subtle transition-colors cursor-pointer ${selectedEndpoint?.id === item.id ? 'bg-active' : ''}`} onClick={() => setSelectedEndpoint({type: item.type, id: item.id, name: item.name})}>
                                <td className="px-4 py-3">
                                   <span className="px-2 py-1 rounded-base bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">POST</span>
                                </td>
                                <td className="px-4 py-3">
                                   <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-primary">{item.endpoint}</span>
                                      <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(item.endpoint); }} className="text-tertiary hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12}/></button>
                                   </div>
                                   <div className="text-[10px] text-secondary mt-0.5">{item.name}</div>
                                </td>
                                <td className="px-4 py-3">
                                   <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${item.type === 'Rule' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                      {item.type}
                                   </span>
                                </td>
                                <td className="px-4 py-3">
                                   <NexBadge variant={item.status === 'Active' ? 'emerald' : 'slate'}>{item.status}</NexBadge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                   <NexButton size="sm" variant="ghost" icon={Play} onClick={() => setSelectedEndpoint({type: item.type, id: item.id, name: item.name})}>Test</NexButton>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {/* Clients Tab */}
           {activeTab === 'clients' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {MOCK_CLIENTS.map(client => (
                    <NexCard key={client.id} className="p-4 flex flex-col justify-between group">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-base bg-slate-100 flex items-center justify-center border border-slate-200">
                                <Server size={20} className="text-slate-500"/>
                             </div>
                             <div>
                                <h4 className="font-bold text-sm text-primary">{client.name}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-secondary font-mono mt-0.5">
                                   <Key size={10}/> {client.clientId}
                                </div>
                             </div>
                          </div>
                          <NexBadge variant={client.status === 'Active' ? 'blue' : 'rose'}>{client.status}</NexBadge>
                       </div>
                       
                       <div className="pt-4 border-t border-subtle flex justify-between items-center">
                          <div className="text-[10px] font-bold text-secondary uppercase">
                             {client.reqCount.toLocaleString()} Requests
                          </div>
                          <div className="text-[10px] text-tertiary">
                             Last used: {client.lastUsed}
                          </div>
                       </div>
                    </NexCard>
                 ))}
                 
                 <button className="border-2 border-dashed border-default rounded-base p-4 flex flex-col items-center justify-center text-secondary hover:border-active hover:text-blue-600 transition-all hover:bg-active">
                    <Zap size={24} className="mb-2"/>
                    <span className="text-xs font-bold uppercase">Generate New Key</span>
                 </button>
              </div>
           )}
           
           {/* Logs Tab Mock */}
           {activeTab === 'logs' && (
               <div className="text-center py-20 text-secondary bg-panel border border-default rounded-base">
                   <Database size={32} className="mx-auto mb-4 opacity-50"/>
                   <p className="text-xs font-bold uppercase">Access Logs are archived to S3</p>
                   <NexButton variant="secondary" className="mt-4" icon={Lock}>View Secure Logs</NexButton>
               </div>
           )}
        </main>

        {/* Right Panel: API Console */}
        <aside className={`w-full md:w-96 bg-panel border-l border-default flex flex-col transition-all duration-300 ${selectedEndpoint ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none'}`}>
           <div className="p-4 border-b border-default bg-subtle flex justify-between items-center">
              <h3 className="text-xs font-bold text-primary uppercase flex items-center gap-2">
                 <Terminal size={14}/> Test Console
              </h3>
              <button onClick={() => setSelectedEndpoint(null)} className="text-secondary hover:text-primary"><XCircle size={16}/></button>
           </div>
           
           {selectedEndpoint ? (
               <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-secondary uppercase">Target Resource</label>
                     <div className="p-2 bg-subtle border border-default rounded-base text-xs font-mono break-all">
                        <span className="text-emerald-600 font-bold">POST</span> /v1/execute/{selectedEndpoint.type.toLowerCase()}/{selectedEndpoint.id}
                     </div>
                  </div>

                  <div className="space-y-1 flex-1 flex flex-col">
                     <label className="text-[10px] font-bold text-secondary uppercase flex justify-between">
                        <span>Request Body</span>
                        <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setTestPayload('{\n  "amount": 1000,\n  "category": "Travel"\n}')}>Load Sample</span>
                     </label>
                     <textarea 
                        className="flex-1 w-full bg-slate-900 text-slate-100 p-3 rounded-base font-mono text-xs outline-none border border-slate-700 resize-none min-h-[150px]"
                        value={testPayload}
                        onChange={e => setTestPayload(e.target.value)}
                     />
                  </div>

                  <NexButton variant="primary" onClick={handleTest} disabled={isTesting} icon={isTesting ? RefreshCw : Play} className={isTesting ? 'animate-pulse' : ''}>
                     {isTesting ? 'Sending Request...' : 'Send Request'}
                  </NexButton>

                  <div className="space-y-1 flex-1 flex flex-col">
                     <label className="text-[10px] font-bold text-secondary uppercase">Response</label>
                     <div className={`flex-1 w-full bg-subtle p-3 rounded-base font-mono text-xs border border-default overflow-auto min-h-[150px] ${testResponse ? 'text-primary' : 'text-tertiary italic'}`}>
                        {testResponse ? (
                            <>
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-default text-emerald-600 font-bold">
                                    <CheckCircle size={12}/> 200 OK <span className="text-tertiary font-normal ml-auto">45ms</span>
                                </div>
                                <pre>{testResponse}</pre>
                            </>
                        ) : 'Ready to execute...'}
                     </div>
                  </div>
               </div>
           ) : (
               <div className="flex-1 flex items-center justify-center text-center p-8 text-secondary">
                   <div>
                       <Globe size={32} className="mx-auto mb-2 opacity-20"/>
                       <p className="text-xs">Select an endpoint from the registry to test.</p>
                   </div>
               </div>
           )}
        </aside>
      </div>
    </div>
  );
};
