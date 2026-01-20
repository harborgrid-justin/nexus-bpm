
import React, { useRef, useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { Database, RefreshCw, Trash2, Download, Upload, AlertTriangle, CheckCircle, Server, Monitor, Palette, Maximize, Move, Calendar, Moon, Sun } from 'lucide-react';
import { NexButton } from './shared/NexUI';

export const Settings: React.FC = () => {
  const { resetSystem, reseedSystem, exportData, importData, loading, settings, updateSystemSettings } = useBPM();
  const { scale, setScale, sidebarWidth, setSidebarWidth, headerHeight, setHeaderHeight, radius, setRadius, density, setDensity, themeMode, setThemeMode, resetTheme } = useTheme();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'system' | 'appearance' | 'calendar'>('system');

  const handleExport = async () => {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `nexflow_backup_${new Date().toISOString()}.json`; a.click();
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in flex flex-col" style={{ gap: 'var(--section-gap)' }}>
      <header className="border-b border-slate-300 flex items-center justify-between" style={{ paddingBottom: 'var(--space-base)' }}>
        <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Server size={24} className="text-blue-600"/> Settings</h2>
            <p className="text-xs text-slate-500 font-medium">Platform configuration and personalization.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200">
            {['system', 'appearance', 'calendar'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all ${activeTab === t ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
        </div>
      </header>

      {statusMsg && <div className="bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-700 font-bold text-xs" style={{ padding: 'var(--space-base)', borderRadius: 'var(--radius-base)' }}><CheckCircle size={16} />{statusMsg}</div>}

      {activeTab === 'system' && (
          <div className="flex flex-col" style={{ gap: 'var(--layout-gap)' }}>
            <section className="bg-white shadow-sm border border-slate-300 overflow-hidden" style={{ borderRadius: 'var(--radius-base)' }}>
                <div className="border-b border-slate-200 bg-slate-50" style={{ padding: 'var(--card-padding)' }}>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Database size={16} className="text-slate-500" /> Backup & Restore</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2" style={{ padding: 'var(--card-padding)', gap: 'var(--layout-gap)' }}>
                    <div className="border border-slate-200 bg-white" style={{ padding: 'var(--space-base)', borderRadius: 'var(--radius-base)' }}>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">Export Database</h4>
                        <NexButton variant="secondary" onClick={handleExport} icon={Download}>Download Backup</NexButton>
                    </div>
                    <div className="border border-slate-200 bg-white" style={{ padding: 'var(--space-base)', borderRadius: 'var(--radius-base)' }}>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">System Reset</h4>
                        <NexButton variant="danger" onClick={() => { if(confirm('Reset all data?')) resetSystem(); }} icon={Trash2}>Factory Reset</NexButton>
                    </div>
                </div>
            </section>
          </div>
      )}

      {activeTab === 'appearance' && (
          <div className="flex flex-col" style={{ gap: 'var(--layout-gap)' }}>
              <section className="bg-white shadow-sm border border-slate-300 overflow-hidden" style={{ borderRadius: 'var(--radius-base)' }}>
                  <div className="border-b border-slate-200 bg-slate-50 flex justify-between items-center" style={{ padding: 'var(--card-padding)' }}>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Monitor size={16} className="text-slate-500" /> Interface Preferences</h3>
                      <button onClick={resetTheme} className="text-xs text-blue-600 hover:underline">Reset to Defaults</button>
                  </div>
                  <div className="flex flex-col" style={{ padding: 'var(--card-padding)', gap: 'var(--layout-gap)' }}>
                      
                      <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Sun size={16} className="text-slate-400"/> Color Mode</label>
                          <div className="flex gap-4">
                              <button onClick={() => setThemeMode('light')} className={`flex-1 py-3 border rounded-sm text-xs font-bold uppercase transition-all ${themeMode === 'light' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>Light</button>
                              <button onClick={() => setThemeMode('dark')} className={`flex-1 py-3 border rounded-sm text-xs font-bold uppercase transition-all ${themeMode === 'dark' ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>Dark</button>
                          </div>
                      </div>

                      <div className="h-px bg-slate-100"></div>

                      <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Palette size={16} className="text-slate-400"/> Content Density</label>
                          <div className="flex gap-4">
                              {['compact', 'comfortable', 'spacious'].map((d) => (
                                  <button key={d} onClick={() => setDensity(d as any)} className={`flex-1 py-3 border rounded-sm text-xs font-bold uppercase transition-all ${density === d ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>{d}</button>
                              ))}
                          </div>
                      </div>
                  </div>
              </section>
          </div>
      )}
    </div>
  );
};
