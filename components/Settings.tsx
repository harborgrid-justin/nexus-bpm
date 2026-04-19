
import React from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { Trash2, Download, Sun, Palette, ZoomIn, ZoomOut, ShieldCheck } from 'lucide-react';
import { NexButton, NexCard, NexBadge } from './shared/NexUI';
import { PageGridLayout } from './shared/PageGridLayout';

export const Settings: React.FC = () => {
  const { settings, updateSystemSettings, resetSystem, exportData } = useBPM();
  const { scale, setScale, density, setDensity, themeMode, setThemeMode, resetTheme } = useTheme();
  
  const defaultLayouts = {
      lg: [
          { i: 'system', x: 0, y: 0, w: 6, h: 8 },
          { i: 'appearance', x: 6, y: 0, w: 6, h: 8 },
          { i: 'security', x: 0, y: 8, w: 4, h: 8 },
          { i: 'sso', x: 4, y: 8, w: 4, h: 8 },
          { i: 'compliance', x: 8, y: 8, w: 4, h: 8 },
          { i: 'health', x: 0, y: 16, w: 12, h: 6 }
      ],
      md: [
          { i: 'system', x: 0, y: 0, w: 12, h: 7 },
          { i: 'appearance', x: 0, y: 7, w: 12, h: 8 },
          { i: 'security', x: 0, y: 15, w: 6, h: 8 },
          { i: 'sso', x: 6, y: 15, w: 6, h: 8 },
          { i: 'compliance', x: 0, y: 23, w: 12, h: 8 },
          { i: 'health', x: 0, y: 31, w: 12, h: 6 }
      ]
  };

  const handleExport = async () => {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `nexflow_backup_${new Date().toISOString()}.json`; a.click();
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <PageGridLayout defaultLayouts={defaultLayouts}>
            {({ isEditable }) => [
                <NexCard key="system" dragHandle={isEditable} title="System Operations" className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border border-default rounded-sm bg-subtle">
                            <div><h4 className="font-bold text-sm text-primary">Export Database</h4><p className="text-xs text-secondary">Download a full JSON dump.</p></div>
                            <NexButton variant="secondary" onClick={handleExport} icon={Download}>Backup</NexButton>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-default rounded-sm bg-subtle">
                            <div><h4 className="font-bold text-sm text-primary">Factory Reset</h4><p className="text-xs text-secondary">Clear all local data.</p></div>
                            <NexButton variant="danger" onClick={() => { if(confirm('Reset all data?')) resetSystem(); }} icon={Trash2}>Reset</NexButton>
                        </div>
                    </div>
                </NexCard>,

                <NexCard key="appearance" dragHandle={isEditable} title="Interface Preferences" className="p-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><Sun size={14}/> Theme Mode</label>
                            <div className="flex bg-subtle p-1 rounded-sm border border-default">
                                {['light', 'dark'].map(m => (
                                    <button key={m} onClick={() => setThemeMode(m as any)} className={`flex-1 py-1 text-xs font-bold uppercase rounded-sm transition-all ${themeMode === m ? 'bg-panel shadow-sm text-blue-600' : 'text-secondary'}`}>{m}</button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><Palette size={14}/> Density</label>
                            <div className="flex bg-subtle p-1 rounded-sm border border-default">
                                {['compact', 'comfortable', 'spacious'].map(d => (
                                    <button key={d} onClick={() => setDensity(d as any)} className={`flex-1 py-1 text-xs font-bold uppercase rounded-sm transition-all ${density === d ? 'bg-panel shadow-sm text-blue-600' : 'text-secondary'}`}>{d}</button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-secondary uppercase flex items-center gap-2"><ZoomIn size={14}/> Interface Scale</label>
                                <span className="text-xs font-mono text-primary font-bold">{Math.round(scale * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <ZoomOut size={14} className="text-tertiary"/>
                                <input 
                                    type="range" 
                                    min="0.75" 
                                    max="1.25" 
                                    step="0.05" 
                                    value={scale} 
                                    onChange={e => setScale(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-subtle rounded-lg appearance-none cursor-pointer accent-blue-600 border border-default"
                                />
                                <ZoomIn size={14} className="text-tertiary"/>
                            </div>
                        </div>

                        <button onClick={resetTheme} className="text-xs text-blue-600 hover:underline w-full text-center mt-4">Reset to Defaults</button>
                    </div>
                </NexCard>,

                <NexCard key="security" dragHandle={isEditable} title="Enterprise Security" className="p-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-tertiary uppercase">Min Password Length</label>
                            <input 
                                type="number" 
                                className="prop-input w-full" 
                                value={settings.security.minPasswordLength}
                                onChange={e => updateSystemSettings({ security: { ...settings.security, minPasswordLength: parseInt(e.target.value) }})}
                            />
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-default">
                            <span className="text-xs font-semibold text-secondary">Enforce MFA</span>
                            <button 
                                onClick={() => updateSystemSettings({ security: { ...settings.security, mfaEnabled: !settings.security.mfaEnabled }})}
                                className={`w-8 h-4 rounded-full transition-colors relative ${settings.security.mfaEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.security.mfaEnabled ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 py-2 border-b border-default">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={settings.security.requireUppercase || false} onChange={e => updateSystemSettings({ security: { ...settings.security, requireUppercase: e.target.checked }})} className="rounded-sm accent-blue-600" />
                                <span className="text-xs font-semibold text-secondary">Require Uppercase</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={settings.security.requireSymbols || false} onChange={e => updateSystemSettings({ security: { ...settings.security, requireSymbols: e.target.checked }})} className="rounded-sm accent-blue-600" />
                                <span className="text-xs font-semibold text-secondary">Require Symbols</span>
                            </label>
                        </div>
                         <div className="space-y-1.5 pt-2">
                            <label className="text-[11px] font-bold text-tertiary uppercase">IP Whitelist (CSV)</label>
                            <input 
                                type="text" 
                                className="prop-input w-full text-xs font-mono" 
                                placeholder="e.g. 192.168.1.1, 10.0.0.0/8"
                                value={settings.security.ipWhitelist?.join(', ') || ''}
                                onChange={e => updateSystemSettings({ security: { ...settings.security, ipWhitelist: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }})}
                            />
                        </div>
                        <div className="text-[10px] text-tertiary italic flex items-center gap-1">
                            <ShieldCheck size={10} /> Active encryption: AES-256-GCM
                        </div>
                    </div>
                </NexCard>,

                <NexCard key="sso" dragHandle={isEditable} title="Global SSO Provider" className="p-6">
                    <div className="space-y-4">
                        {(['ldap', 'okta', 'workspace'] as const).map(key => (
                            <div key={key} className="flex items-center justify-between p-2 border border-default rounded-sm bg-subtle">
                                <span className="text-xs font-bold text-secondary uppercase">{key}</span>
                                <button 
                                    onClick={() => updateSystemSettings({ sso: { ...settings.sso, [key]: !settings.sso[key] }})}
                                    className={`w-8 h-4 rounded-full transition-colors relative ${settings.sso[key] ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.sso[key] ? 'left-4.5' : 'left-0.5'}`} />
                                </button>
                            </div>
                        ))}
                        
                        {/* SAML Enterprise Support */}
                        <div className="border border-default rounded-sm bg-subtle p-3 space-y-3 mt-4">
                           <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-700 uppercase">Enterprise SAML 2.0</span>
                                <button 
                                    onClick={() => updateSystemSettings({ sso: { ...settings.sso, saml: { enabled: !(settings.sso.saml?.enabled), idpUrl: settings.sso.saml?.idpUrl || '' } }})}
                                    className={`w-8 h-4 rounded-full transition-colors relative ${settings.sso.saml?.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.sso.saml?.enabled ? 'left-4.5' : 'left-0.5'}`} />
                                </button>
                           </div>
                           {settings.sso.saml?.enabled && (
                               <input 
                                   type="url" 
                                   className="prop-input w-full text-xs font-mono" 
                                   placeholder="IdP SSO URL (e.g. https://idp.example.com/sso)"
                                   value={settings.sso.saml.idpUrl}
                                   onChange={e => updateSystemSettings({ sso: { ...settings.sso, saml: { ...settings.sso.saml!, idpUrl: e.target.value } }})}
                               />
                           )}
                        </div>
                    </div>
                </NexCard>,

                <NexCard key="compliance" dragHandle={isEditable} title="Governance & Compliance" className="p-6">
                    <div className="space-y-4">
                       <div className="space-y-2">
                           <label className="text-[11px] font-bold text-tertiary uppercase">Active Standards</label>
                           <div className="flex flex-wrap gap-2">
                               {['SOC2', 'GDPR', 'HIPAA', 'ISO27001', 'PCI-DSS'].map(s => {
                                   const active = settings.compliance.standards.includes(s);
                                   return (
                                       <button 
                                           key={s} 
                                           onClick={() => {
                                               const next = active 
                                                   ? settings.compliance.standards.filter(x => x !== s)
                                                   : [...settings.compliance.standards, s];
                                               updateSystemSettings({ compliance: { ...settings.compliance, standards: next }});
                                           }}
                                           className={`px-2 py-1 rounded-sm text-[10px] font-bold border transition-all ${active ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-subtle border-default text-tertiary hover:border-secondary'}`}
                                       >
                                           {s}
                                       </button>
                                   );
                               })}
                           </div>
                       </div>
                       
                        <div className="space-y-1.5 pt-2 border-t border-default">
                            <label className="text-[11px] font-bold text-tertiary uppercase flex justify-between">Data Retention Policy <span>{settings.compliance.dataRetentionDays || 365} Days</span></label>
                             <input 
                                type="range" 
                                min="30" 
                                max="3650" 
                                step="30" 
                                value={settings.compliance.dataRetentionDays || 365} 
                                onChange={e => updateSystemSettings({ compliance: { ...settings.compliance, dataRetentionDays: parseInt(e.target.value) }})}
                                className="flex-1 h-2 bg-subtle rounded-lg appearance-none cursor-pointer accent-blue-600 border border-default w-full"
                            />
                            <div className="flex justify-between text-[9px] text-tertiary font-mono"><span>30D</span><span>10Y</span></div>
                        </div>

                       <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-sm">
                           <p className="text-[10px] text-emerald-700 font-bold uppercase mb-1">Last System Audit</p>
                           <p className="text-xs text-emerald-800 font-mono">{new Date(settings.compliance.lastAudit).toLocaleString()}</p>
                       </div>
                    </div>
                </NexCard>,

                <NexCard key="health" dragHandle={isEditable} title="Live System Telemetry" className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-subtle border border-default rounded-sm">
                            <span className="text-[10px] text-tertiary font-bold uppercase block mb-1">Process Core</span>
                            <span className="text-sm font-bold text-emerald-600 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Operational</span>
                        </div>
                        <div className="p-3 bg-subtle border border-default rounded-sm">
                            <span className="text-[10px] text-tertiary font-bold uppercase block mb-1">DB Latency</span>
                            <span className="text-sm font-mono font-bold text-primary">12ms</span>
                        </div>
                        <div className="p-3 bg-subtle border border-default rounded-sm">
                            <span className="text-[10px] text-tertiary font-bold uppercase block mb-1">Cloud Run Instance</span>
                            <span className="text-sm font-mono font-bold text-primary">v1.4.2-std</span>
                        </div>
                        <div className="p-3 bg-subtle border border-default rounded-sm">
                            <span className="text-[10px] text-tertiary font-bold uppercase block mb-1">Node Version</span>
                            <span className="text-sm font-mono font-bold text-primary">v20.x ESM</span>
                        </div>
                    </div>
                </NexCard>
            ]}
        </PageGridLayout>
    </div>
  );
};
