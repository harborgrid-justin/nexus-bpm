
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Globe, Server, Activity, Play, Copy, RefreshCw, 
  Database, Terminal, Plus, Wifi, WifiOff, Settings, Zap, PauseCircle, Lock, Webhook,
  GripVertical, GitMerge, FileCode, Workflow
} from 'lucide-react';
import { NexCard, NexButton, NexBadge, NexSwitch, NexModal, NexFormGroup } from './shared/NexUI';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockStreamService, StreamEvent } from '../services/mockStreamService';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface LiveLog extends StreamEvent {}

export const ApiGatewayView: React.FC = () => {
  const { rules, decisionTables, addNotification, apiClients, toggleApiClient, auditLogs, setToolbarConfig } = useBPM();
  const { gridConfig } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'monitor' | 'sb' | 'adapters'>('monitor');
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [liveLogs, setLiveLogs] = useState<LiveLog[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const defaultLayouts = {
      lg: [
          { i: 'traffic', x: 0, y: 0, w: 8, h: 8 },
          { i: 'clients', x: 8, y: 0, w: 4, h: 8 },
          { i: 'endpoints', x: 0, y: 8, w: 4, h: 12 },
          { i: 'logs', x: 4, y: 8, w: 8, h: 12 }
      ],
      md: [
          { i: 'traffic', x: 0, y: 0, w: 10, h: 8 },
          { i: 'clients', x: 0, y: 8, w: 10, h: 6 },
          { i: 'endpoints', x: 0, y: 14, w: 5, h: 10 },
          { i: 'logs', x: 5, y: 14, w: 5, h: 10 }
      ]
  };
  const [layouts, setLayouts] = useState(defaultLayouts);

  useEffect(() => {
      setToolbarConfig({
          view: [
              { label: isEditable ? 'Lock Dashboard' : 'Customize Dashboard', action: () => setIsEditable(!isEditable), icon: Settings },
              { label: 'Reset Layout', action: () => setLayouts(defaultLayouts) }
          ]
      });
  }, [setToolbarConfig, isEditable]);

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
          data.push({ time: startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), reqs: count + 10 });
      }
      return data;
  }, [auditLogs]);

  useEffect(() => {
      const unsub = mockStreamService.subscribe((event) => {
          setLiveLogs(prev => [event as LiveLog, ...prev].slice(0, 100));
      });
      return unsub;
  }, []);

  // --- SERVICE BUS PIPELINE MOCK ---
  const PipelineView = () => (
      <div className="flex flex-col h-full bg-app p-6 space-y-6">
          <div className="flex items-center gap-4">
              <div className="p-4 bg-panel border border-default rounded shadow-sm flex flex-col items-center min-w-[120px]">
                  <Globe size={24} className="text-blue-500 mb-2"/>
                  <span className="text-xs font-bold text-primary">Inbound HTTP</span>
              </div>
              <div className="h-0.5 bg-default flex-1 relative"><div className="absolute right-0 -top-1 w-2 h-2 bg-default rounded-full"></div></div>
              <div className="p-4 bg-panel border border-default rounded shadow-sm flex flex-col items-center min-w-[120px]">
                  <GitMerge size={24} className="text-amber-500 mb-2"/>
                  <span className="text-xs font-bold text-primary">Mediator</span>
              </div>
              <div className="h-0.5 bg-default flex-1 relative"><div className="absolute right-0 -top-1 w-2 h-2 bg-default rounded-full"></div></div>
              <div className="p-4 bg-panel border border-default rounded shadow-sm flex flex-col items-center min-w-[120px]">
                  <FileCode size={24} className="text-purple-500 mb-2"/>
                  <span className="text-xs font-bold text-primary">XSLT Trans</span>
              </div>
              <div className="h-0.5 bg-default flex-1 relative"><div className="absolute right-0 -top-1 w-2 h-2 bg-default rounded-full"></div></div>
              <div className="p-4 bg-panel border border-default rounded shadow-sm flex flex-col items-center min-w-[120px]">
                  <Database size={24} className="text-emerald-500 mb-2"/>
                  <span className="text-xs font-bold text-primary">SAP Adapter</span>
              </div>
          </div>
          <div className="bg-slate-900 rounded p-4 font-mono text-xs text-green-400 overflow-y-auto max-h-48 border border-slate-700 shadow-inner">
              {">"} Pipeline active. Listening on port 7001...<br/>
              {">"} [Mediator] Routing based on header 'X-Region'<br/>
              {">"} [Transform] Applied 'OrderToSAP.xsl'<br/>
              {">"} [JCA] Connection pool: 5/20 active<br/>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-default pb-4 shrink-0 mb-2">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2"><Workflow size={24} className="text-blue-600"/> Integration & SOA</h1>
          <p className="text-xs text-secondary mt-1">Oracle Service Bus (OSB) & API Gateway Console.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setActiveTab('monitor')} className={`px-4 py-2 text-xs font-bold rounded-sm border ${activeTab === 'monitor' ? 'bg-slate-800 text-white' : 'bg-panel text-secondary border-default'}`}>Monitor</button>
            <button onClick={() => setActiveTab('sb')} className={`px-4 py-2 text-xs font-bold rounded-sm border ${activeTab === 'sb' ? 'bg-slate-800 text-white' : 'bg-panel text-secondary border-default'}`}>Service Bus</button>
            <button onClick={() => setActiveTab('adapters')} className={`px-4 py-2 text-xs font-bold rounded-sm border ${activeTab === 'adapters' ? 'bg-slate-800 text-white' : 'bg-panel text-secondary border-default'}`}>JCA Adapters</button>
        </div>
      </header>

      {activeTab === 'sb' && <PipelineView />}
      
      {activeTab === 'adapters' && (
          <div className="p-4 grid grid-cols-3 gap-4">
              <div className="p-4 bg-panel border border-default rounded shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center"><span className="font-bold text-sm text-primary">SAP ERP (JCA)</span><span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold">Active</span></div>
                  <p className="text-xs text-secondary">Connecting to S/4HANA via RFC.</p>
              </div>
              <div className="p-4 bg-panel border border-default rounded shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center"><span className="font-bold text-sm text-primary">Salesforce (REST)</span><span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold">Active</span></div>
                  <p className="text-xs text-secondary">Bidirectional sync for Opportunities.</p>
              </div>
              <div className="p-4 bg-panel border border-default rounded shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center"><span className="font-bold text-sm text-primary">EDIFACT (B2B)</span><span className="bg-subtle text-secondary text-[10px] px-2 py-0.5 rounded font-bold border border-default">Idle</span></div>
                  <p className="text-xs text-secondary">Trading partner gateway (X12/EDIFACT).</p>
              </div>
          </div>
      )}

      {activeTab === 'monitor' && (
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={gridConfig.rowHeight}
            margin={gridConfig.margin}
            isDraggable={isEditable}
            isResizable={isEditable}
            draggableHandle=".drag-handle"
            onLayoutChange={(curr, all) => setLayouts(all)}
        >
            <NexCard key="traffic" dragHandle={isEditable} className="p-0 overflow-hidden flex flex-col h-full">
                <div className="px-4 py-3 border-b border-default bg-subtle flex justify-between items-center">
                    <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><Activity size={14}/> Traffic Volume (24h)</h3>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-base border border-blue-100 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Live</span>
                </div>
                <div className="flex-1 p-4">
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

            <NexCard key="clients" dragHandle={isEditable} title="API Clients" className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {apiClients.map(client => (
                        <div key={client.id} className="p-3 border border-default rounded-sm flex items-center justify-between group hover:border-active transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-sm"><Terminal size={16}/></div>
                                <div>
                                    <h4 className="font-bold text-primary text-xs">{client.name}</h4>
                                    <code className="text-[10px] text-secondary font-mono">{client.clientId}</code>
                                </div>
                            </div>
                            <button onClick={() => !isEditable && toggleApiClient(client.id)}><NexBadge variant={client.status === 'Active' ? 'emerald' : 'rose'}>{client.status}</NexBadge></button>
                        </div>
                    ))}
                </div>
            </NexCard>

            <NexCard key="endpoints" dragHandle={isEditable} className="p-0 overflow-hidden flex flex-col h-full">
                <div className="p-3 border-b border-default bg-subtle"><h4 className="text-xs font-bold text-secondary uppercase">Route Registry</h4></div>
                <div className="flex-1 overflow-y-auto">
                    {registry.map((item) => (
                        <div key={item.id} onClick={() => !isEditable && setSelectedEndpoint(item)} className={`p-3 border-b border-default cursor-pointer transition-colors hover:bg-subtle ${selectedEndpoint?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex gap-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${item.type === 'Rule' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.type}</span></div>
                                <NexBadge variant={item.status === 'Active' ? 'emerald' : 'slate'}>{item.status}</NexBadge>
                            </div>
                            <div className="font-bold text-sm text-primary truncate">{item.name}</div>
                        </div>
                    ))}
                </div>
            </NexCard>

            <NexCard key="logs" dragHandle={isEditable} className="p-0 overflow-hidden flex flex-col h-full border-slate-800 bg-slate-900 shadow-lg">
                <div className="p-2 border-b border-slate-800 bg-slate-950 flex justify-between items-center text-slate-400">
                    <h3 className="font-bold uppercase flex items-center gap-2 text-xs"><Terminal size={12}/> Live Stream</h3>
                    <span className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Connected</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs" ref={logContainerRef}>
                    {liveLogs.map(log => (
                        <div key={log.id} className="flex gap-3 hover:bg-slate-800/50 p-0.5 rounded text-slate-300">
                            <span className="text-slate-600 w-16 shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                            <span className={`w-12 font-bold ${log.source === 'API Gateway' ? 'text-amber-400' : 'text-blue-400'}`}>{log.source}</span>
                            <span className="flex-1 truncate text-slate-400">{log.message}</span>
                        </div>
                    ))}
                </div>
            </NexCard>
        </ResponsiveGridLayout>
      </div>
      )}
    </div>
  );
};
