
import React, { useState, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  Globe, Server, Key, Activity, Play, Copy, RefreshCw, 
  Database, Lock, Zap, CheckCircle, XCircle, Terminal, Plus
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
  const [selectedEndpoint, setSelectedEndpoint] = useState<{type: 'Rule' | 'Table', id: string, name: string, endpoint: string, status: string} | null>(null);
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
                   className={`px-6 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                 >
                   {tab}
                 </button>
              ))}
           </div>

           {/* Tab Content */}
           {activeTab === 'endpoints' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
                   {/* Endpoint List */}
                   <div className="lg:col-span-1 border border-default rounded-sm bg-white flex flex-col overflow-hidden">
                       <div className="p-3 border-b border-subtle bg-slate-50">
                           <h4 className="text-xs font-bold text-slate-700 uppercase">Available Routes</h4>
                       </div>
                       <div className="flex-1 overflow-y-auto">
                           {registry.map((item) => (
                               <div 
                                 key={item.id} 
                                 onClick={() => setSelectedEndpoint(item)}
                                 className={`p-3 border-b border-subtle cursor-pointer transition-colors hover:bg-slate-50 ${selectedEndpoint?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                               >
                                   <div className="flex justify-between items-center mb-1">
                                       <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${item.type === 'Rule' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.type}</span>
                                       <NexBadge variant={item.status === 'Active' ? 'emerald' : 'slate'}>{item.status}</NexBadge>
                                   </div>
                                   <div className="font-bold text-sm text-slate-800 truncate">{item.name}</div>
                                   <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">{item.endpoint}</div>
                               </div>
                           ))}
                       </div>
                   </div>

                   {/* Test Console */}
                   <div className="lg:col-span-2 border border-default rounded-sm bg-white flex flex-col overflow-hidden">
                       {selectedEndpoint ? (
                           <>
                               <div className="p-4 border-b border-subtle bg-slate-50 flex justify-between items-center">
                                   <div>
                                       <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                           <span className="px-2 py-0.5 bg-slate-200 rounded-sm text-[10px]">POST</span>
                                           {selectedEndpoint.endpoint}
                                       </h4>
                                   </div>
                                   <button onClick={() => handleCopyUrl(selectedEndpoint.endpoint)} className="text-blue-600 hover:underline text-xs flex items-center gap-1"><Copy size={12}/> Copy URL</button>
                               </div>
                               <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
                                   <div className="flex-1 flex flex-col">
                                       <label className="text-xs font-bold text-slate-500 uppercase mb-2">Request Body (JSON)</label>
                                       <textarea 
                                           className="flex-1 w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-sm outline-none resize-none border border-slate-700 focus:border-blue-500"
                                           value={testPayload}
                                           onChange={e => setTestPayload(e.target.value)}
                                           spellCheck={false}
                                       />
                                   </div>
                                   <div className="flex justify-between items-center">
                                       <div className="flex gap-2">
                                            {/* Auth Header Mock */}
                                            <div className="px-2 py-1 bg-slate-100 rounded-sm text-[10px] font-mono text-slate-600 border border-slate-200">Authorization: Bearer sk_live_...</div>
                                       </div>
                                       <NexButton variant="primary" icon={Play} onClick={handleTest} disabled={isTesting}>
                                           {isTesting ? 'Sending...' : 'Send Request'}
                                       </NexButton>
                                   </div>
                                   <div className="flex-1 flex flex-col h-1/2">
                                       <label className="text-xs font-bold text-slate-500 uppercase mb-2">Response Output</label>
                                       <div className="flex-1 w-full font-mono text-xs p-3 bg-slate-50 text-slate-800 rounded-sm border border-slate-200 overflow-auto whitespace-pre-wrap">
                                           {testResponse || <span className="text-slate-400 italic">// Response will appear here...</span>}
                                       </div>
                                   </div>
                               </div>
                           </>
                       ) : (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400">
                               <Server size={32} className="mb-2 opacity-50"/>
                               <p className="text-xs font-bold uppercase">Select an endpoint to test</p>
                           </div>
                       )}
                   </div>
               </div>
           )}

           {activeTab === 'clients' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {MOCK_CLIENTS.map(client => (
                       <NexCard key={client.id} className="p-4 flex flex-col justify-between h-40">
                           <div className="flex justify-between items-start">
                               <div className="p-2 bg-blue-50 text-blue-600 rounded-sm border border-blue-100">
                                   <Terminal size={20}/>
                               </div>
                               <NexBadge variant={client.status === 'Active' ? 'emerald' : 'rose'}>{client.status}</NexBadge>
                           </div>
                           <div>
                               <h4 className="font-bold text-slate-900">{client.name}</h4>
                               <div className="flex items-center gap-2 mt-1">
                                   <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-mono border border-slate-200">{client.clientId}</code>
                                   <button className="text-slate-400 hover:text-blue-600"><Copy size={12}/></button>
                               </div>
                           </div>
                           <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                               <span>Last used: {client.lastUsed}</span>
                               <span className="font-bold">{client.reqCount.toLocaleString()} reqs</span>
                           </div>
                       </NexCard>
                   ))}
                   <button className="border-2 border-dashed border-slate-300 rounded-sm flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all h-40">
                       <Plus size={24} className="mb-2"/>
                       <span className="text-xs font-bold uppercase">Register Client</span>
                   </button>
               </div>
           )}

           {activeTab === 'logs' && (
               <div className="bg-white border border-default rounded-sm shadow-sm flex flex-col h-[500px]">
                   <div className="p-3 border-b border-subtle bg-slate-50 flex justify-between items-center">
                       <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                           <Database size={14}/> Access Logs
                       </h3>
                       <button className="text-blue-600 hover:text-blue-800"><RefreshCw size={14}/></button>
                   </div>
                   <div className="flex-1 flex items-center justify-center text-slate-400 italic text-xs">
                       Connect to ElasticSearch/Splunk to view real-time logs.
                   </div>
               </div>
           )}

        </main>
      </div>
    </div>
  );
};
