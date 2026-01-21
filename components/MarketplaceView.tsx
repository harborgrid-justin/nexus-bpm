
import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  Search, Cloud, Database, MessageSquare, Briefcase, Sparkles, 
  Settings, Download, CheckCircle, ExternalLink, ShieldCheck, 
  CreditCard, Server, Box, Star, Info, Lock, Zap, Globe
} from 'lucide-react';
import { NexButton, NexBadge, NexModal, NexFormGroup } from './shared/NexUI';
import { Integration } from '../types';

const CATEGORIES = [
    { id: 'All', icon: Box },
    { id: 'CRM', icon: Cloud },
    { id: 'ERP', icon: Database },
    { id: 'Communication', icon: MessageSquare },
    { id: 'AI', icon: Sparkles },
    { id: 'Productivity', icon: Briefcase }
];

const ICONS: Record<string, React.ElementType> = {
    Cloud, Database, MessageSquare, Sparkles, Server, CheckSquare: Briefcase, CreditCard
};

const IntegrationDetails: React.FC<{ integration: Integration, onInstall: () => void, isConfiguring: boolean }> = ({ integration, onInstall, isConfiguring }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'reviews'>('overview');
    
    const Icon = ICONS[integration.iconName] || Box;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-start gap-4 mb-6">
                <div className={`p-4 rounded-xl ${integration.isInstalled ? 'bg-emerald-50 border-2 border-emerald-100' : 'bg-blue-50 border-2 border-blue-100'}`}>
                    <Icon size={40} className={integration.isInstalled ? 'text-emerald-600' : 'text-blue-600'}/>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{integration.name}</h2>
                    <p className="text-sm text-slate-500 mb-2">{integration.provider} • v{integration.version}</p>
                    <div className="flex items-center gap-2">
                        {integration.isInstalled ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Installed</span>
                        ) : (
                            <NexButton size="sm" variant="primary" onClick={onInstall}>Install Now</NexButton>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">Enterprise Ready</span>
                    </div>
                </div>
            </div>

            <div className="flex border-b border-slate-200 mb-4">
                {['overview', 'permissions', 'reviews'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{tab}</button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {activeTab === 'overview' && (
                    <div className="space-y-4 text-sm text-slate-600">
                        <p>{integration.description}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Zap size={14}/> Triggers</h4>
                                <ul className="list-disc list-inside text-xs space-y-1">
                                    <li>Record Created</li>
                                    <li>Status Updated</li>
                                    <li>Webhook Received</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Server size={14}/> Actions</h4>
                                <ul className="list-disc list-inside text-xs space-y-1">
                                    <li>Create Record</li>
                                    <li>Sync Data</li>
                                    <li>Query Object</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'permissions' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-sm">
                            <ShieldCheck size={20} className="text-emerald-500"/>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Data Access</h4>
                                <p className="text-xs text-slate-500">Read/Write access to process variables and case data.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-sm">
                            <Globe size={20} className="text-blue-500"/>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">External Connectivity</h4>
                                <p className="text-xs text-slate-500">Outbound HTTPS traffic to provider endpoints.</p>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'reviews' && (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                        <Star size={24} className="mx-auto mb-2 text-amber-400 fill-amber-400"/>
                        4.9/5 Average Rating (Enterprise Customers)
                    </div>
                )}
            </div>
        </div>
    );
};

export const MarketplaceView: React.FC = () => {
  const { integrations, installIntegration, uninstallIntegration } = useBPM();
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  const filteredIntegrations = integrations.filter(i => 
      (activeCat === 'All' || i.category === activeCat) &&
      (i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpen = (integration: Integration) => {
      setSelectedIntegration(integration);
      setConfigValues(integration.config || {});
      setIsConfiguring(integration.isInstalled); // If installed, go straight to config
      setModalOpen(true);
  };

  const handleConnect = async () => {
      setIsConnecting(true);
      // Simulate OAuth Popup
      await new Promise(r => setTimeout(r, 2000));
      setIsConnecting(false);
      setConfigValues(prev => ({ ...prev, _connected: 'true', _account: 'demo@nexflow.io' }));
  };

  const handleInstall = async () => {
      if (!selectedIntegration) return;
      await installIntegration(selectedIntegration.id, configValues);
      setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-300 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Connector Marketplace</h2>
          <p className="text-xs text-slate-500 font-medium">Extend platform capabilities with enterprise integrations.</p>
        </div>
        <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
            <input 
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-sm text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none" 
                placeholder="Search connectors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
        </div>
      </header>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => setActiveCat(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${activeCat === cat.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
              >
                  <cat.icon size={14}/> {cat.id}
              </button>
          ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredIntegrations.map(int => {
              const Icon = ICONS[int.iconName] || Box;
              return (
                  <div key={int.id} onClick={() => handleOpen(int)} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col group h-64 cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-lg ${int.isInstalled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                              <Icon size={24}/>
                          </div>
                          {int.isInstalled && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 flex items-center gap-1"><CheckCircle size={10}/> Installed</span>}
                      </div>
                      
                      <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">{int.name}</h3>
                          <p className="text-xs text-slate-500 leading-snug line-clamp-3">{int.description}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
                          <div className="text-[10px] text-slate-400 font-medium">v{int.version} • {int.provider}</div>
                          {int.isInstalled ? (
                              <Settings size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors"/>
                          ) : (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                                  Get <Download size={12}/>
                              </div>
                          )}
                      </div>
                  </div>
              );
          })}
      </div>

      {selectedIntegration && (
          <NexModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Connector Details" size="lg">
              {!isConfiguring ? (
                  <IntegrationDetails 
                    integration={selectedIntegration} 
                    onInstall={() => setIsConfiguring(true)} 
                    isConfiguring={isConfiguring}
                  />
              ) : (
                  <div className="space-y-6">
                      <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 flex items-center gap-4">
                          {React.createElement(ICONS[selectedIntegration.iconName] || Box, { size: 32, className: 'text-slate-600' })}
                          <div>
                              <h3 className="text-lg font-bold text-slate-900">Configure {selectedIntegration.name}</h3>
                              <p className="text-sm text-slate-500">Provide authentication credentials to enable this connector.</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-2">Authentication</h4>
                          
                          {/* OAuth Simulator */}
                          {['int-salesforce', 'int-slack', 'int-jira'].includes(selectedIntegration.id) ? (
                              <div className="p-6 border border-slate-200 rounded-sm bg-white text-center">
                                  {configValues._connected ? (
                                      <div className="text-emerald-600 flex flex-col items-center gap-2">
                                          <CheckCircle size={32}/>
                                          <p className="font-bold">Connected as {configValues._account}</p>
                                          <button onClick={() => setConfigValues({...configValues, _connected: ''})} className="text-xs text-slate-400 hover:text-rose-600 underline">Disconnect</button>
                                      </div>
                                  ) : (
                                      <NexButton variant="primary" onClick={handleConnect} disabled={isConnecting} className="mx-auto">
                                          {isConnecting ? 'Connecting...' : `Connect ${selectedIntegration.name} Account`}
                                      </NexButton>
                                  )}
                              </div>
                          ) : selectedIntegration.id === 'int-openai' ? (
                              <NexFormGroup label="API Key">
                                    <input className="prop-input" type="password" placeholder="sk-..." value={configValues['apiKey'] || ''} onChange={e => setConfigValues({...configValues, apiKey: e.target.value})} />
                              </NexFormGroup>
                          ) : (
                              <div className="grid grid-cols-2 gap-4">
                                  <NexFormGroup label="Username"><input className="prop-input" /></NexFormGroup>
                                  <NexFormGroup label="Password"><input className="prop-input" type="password" /></NexFormGroup>
                              </div>
                          )}

                          {/* Specific Configs */}
                          {selectedIntegration.id === 'int-salesforce' && (
                            <NexFormGroup label="Instance URL">
                                <input className="prop-input" placeholder="https://na1.salesforce.com" value={configValues['instanceUrl'] || ''} onChange={e => setConfigValues({...configValues, instanceUrl: e.target.value})} />
                            </NexFormGroup>
                          )}
                      </div>

                      <div className="flex justify-between pt-4 border-t border-slate-100">
                          <button onClick={() => setIsConfiguring(false)} className="text-slate-500 text-sm hover:underline">Back to Details</button>
                          <div className="flex gap-3">
                            {selectedIntegration.isInstalled && (
                                <NexButton variant="danger" onClick={() => { uninstallIntegration(selectedIntegration.id); setModalOpen(false); }}>Uninstall</NexButton>
                            )}
                            <NexButton variant="primary" onClick={handleInstall}>{selectedIntegration.isInstalled ? 'Save Changes' : 'Complete Installation'}</NexButton>
                          </div>
                      </div>
                  </div>
              )}
          </NexModal>
      )}
    </div>
  );
};
