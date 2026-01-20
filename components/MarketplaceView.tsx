
import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  Search, Cloud, Database, MessageSquare, Briefcase, Sparkles, 
  Settings, Download, CheckCircle, ExternalLink, ShieldCheck, 
  CreditCard, Server, Box
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

export const MarketplaceView: React.FC = () => {
  const { integrations, installIntegration, uninstallIntegration } = useBPM();
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const filteredIntegrations = integrations.filter(i => 
      (activeCat === 'All' || i.category === activeCat) &&
      (i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenConfig = (integration: Integration) => {
      setSelectedIntegration(integration);
      setConfigValues(integration.config || {});
      setConfigModalOpen(true);
  };

  const handleInstall = async () => {
      if (!selectedIntegration) return;
      await installIntegration(selectedIntegration.id, configValues);
      setConfigModalOpen(false);
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
                  <div key={int.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col group h-64">
                      <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-lg ${int.isInstalled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                              <Icon size={24}/>
                          </div>
                          {int.isInstalled && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 flex items-center gap-1"><CheckCircle size={10}/> Installed</span>}
                      </div>
                      
                      <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-sm mb-1">{int.name}</h3>
                          <p className="text-xs text-slate-500 leading-snug line-clamp-3">{int.description}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
                          <div className="text-[10px] text-slate-400 font-medium">v{int.version} • {int.provider}</div>
                          {int.isInstalled ? (
                              <button onClick={() => handleOpenConfig(int)} className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded-sm hover:bg-slate-50" title="Configure"><Settings size={16}/></button>
                          ) : (
                              <button onClick={() => handleOpenConfig(int)} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-sm transition-colors uppercase tracking-wide">
                                  Get <Download size={12}/>
                              </button>
                          )}
                      </div>
                  </div>
              );
          })}
      </div>

      {selectedIntegration && (
          <NexModal isOpen={configModalOpen} onClose={() => setConfigModalOpen(false)} title={`Configure ${selectedIntegration.name}`} size="lg">
              <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 flex items-start gap-4">
                      <div className="p-2 bg-white rounded border border-slate-200 text-slate-600">
                          {React.createElement(ICONS[selectedIntegration.iconName] || Box, { size: 24 })}
                      </div>
                      <div className="flex-1">
                          <p className="text-sm text-slate-600 leading-relaxed">{selectedIntegration.description}</p>
                          <div className="mt-2 flex gap-4 text-xs font-bold text-slate-500">
                              <span className="flex items-center gap-1"><ShieldCheck size={12}/> SOC2 Compliant</span>
                              <span className="flex items-center gap-1"><ExternalLink size={12}/> Vendor Documentation</span>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-2">Connection Settings</h4>
                      {selectedIntegration.id === 'int-salesforce' && (
                          <>
                            <NexFormGroup label="Instance URL">
                                <input className="prop-input" placeholder="https://na1.salesforce.com" value={configValues['instanceUrl'] || ''} onChange={e => setConfigValues({...configValues, instanceUrl: e.target.value})} />
                            </NexFormGroup>
                            <NexFormGroup label="Consumer Key (OAuth)">
                                <input className="prop-input" type="password" value={configValues['consumerKey'] || ''} onChange={e => setConfigValues({...configValues, consumerKey: e.target.value})} />
                            </NexFormGroup>
                          </>
                      )}
                      {selectedIntegration.id === 'int-openai' && (
                          <NexFormGroup label="API Key">
                                <input className="prop-input" type="password" placeholder="sk-..." value={configValues['apiKey'] || ''} onChange={e => setConfigValues({...configValues, apiKey: e.target.value})} />
                          </NexFormGroup>
                      )}
                      {/* Default Generic Config */}
                      {!['int-salesforce', 'int-openai'].includes(selectedIntegration.id) && (
                          <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded border border-dashed border-slate-200">
                              No advanced configuration parameters required for this version.
                          </div>
                      )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      {selectedIntegration.isInstalled ? (
                          <NexButton variant="danger" onClick={() => { uninstallIntegration(selectedIntegration.id); setConfigModalOpen(false); }}>Uninstall</NexButton>
                      ) : (
                          <NexButton variant="secondary" onClick={() => setConfigModalOpen(false)}>Cancel</NexButton>
                      )}
                      <NexButton variant="primary" onClick={handleInstall}>{selectedIntegration.isInstalled ? 'Save Changes' : 'Install Connector'}</NexButton>
                  </div>
              </div>
          </NexModal>
      )}
    </div>
  );
};
