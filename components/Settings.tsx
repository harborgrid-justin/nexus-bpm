
import React, { useRef, useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { Database, RefreshCw, Trash2, Download, Upload, AlertTriangle, CheckCircle, Server, Monitor, Palette, Maximize, Move, Calendar } from 'lucide-react';
import { NexButton } from './shared/NexUI';

export const Settings: React.FC = () => {
  const { resetSystem, reseedSystem, exportData, importData, loading } = useBPM();
  const { scale, setScale, sidebarWidth, setSidebarWidth, headerHeight, setHeaderHeight, radius, setRadius, density, setDensity, resetTheme } = useTheme();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'system' | 'appearance' | 'calendar'>('system');

  // Calendar State
  const [workDays, setWorkDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [workHours, setWorkHours] = useState({ start: '09:00', end: '17:00' });
  const [timezone, setTimezone] = useState('UTC');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      setStatusMsg('Data imported successfully.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg('Error importing data. Check file format.');
    }
    e.target.value = '';
  };

  const handleReset = async () => {
    if(window.confirm("Are you sure you want to completely wipe the database? This cannot be undone.")) {
       await resetSystem();
    }
  };

  const handleReseed = async () => {
    if(window.confirm("This will overwrite current data with mock demo data. Continue?")) {
      await reseedSystem();
      setStatusMsg('System reseeded with demo data.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const toggleWorkDay = (day: string) => {
      setWorkDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <header className="mb-6 border-b border-slate-300 pb-4 flex items-center justify-between">
        <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Server size={24} className="text-blue-600"/> 
            Settings
            </h2>
            <p className="text-xs text-slate-500 font-medium">Platform configuration and personalization.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200">
            <button 
                onClick={() => setActiveTab('system')} 
                className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all ${activeTab === 'system' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
                System
            </button>
            <button 
                onClick={() => setActiveTab('appearance')} 
                className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all ${activeTab === 'appearance' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
                Appearance
            </button>
            <button 
                onClick={() => setActiveTab('calendar')} 
                className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all ${activeTab === 'calendar' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
                Calendar
            </button>
        </div>
      </header>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center gap-2 text-emerald-700 font-bold text-xs">
          <CheckCircle size={16} />
          {statusMsg}
        </div>
      )}

      {activeTab === 'system' && (
          <div className="space-y-6">
            {/* Data Persistence Section */}
            <section className="bg-white rounded-sm shadow-sm border border-slate-300 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Database size={16} className="text-slate-500" />
                    Backup & Restore
                </h3>
                </div>
                
                <div className="p-6 grid gap-6 md:grid-cols-2">
                <div className="p-4 border border-slate-200 rounded-sm bg-white hover:border-blue-400 transition-colors">
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Export Database</h4>
                    <p className="text-xs text-slate-500 mb-4">Download full system snapshot (JSON).</p>
                    <NexButton variant="secondary" onClick={exportData} disabled={loading} icon={Download}>Download Backup</NexButton>
                </div>

                <div className="p-4 border border-slate-200 rounded-sm bg-white hover:border-blue-400 transition-colors">
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Import Database</h4>
                    <p className="text-xs text-slate-500 mb-4">Restore state from JSON file.</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden"/>
                    <NexButton variant="primary" onClick={handleImportClick} disabled={loading} icon={Upload}>Upload Backup</NexButton>
                </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-white rounded-sm shadow-sm border border-rose-200 overflow-hidden">
                <div className="p-4 border-b border-rose-100 bg-rose-50">
                <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Danger Zone
                </h3>
                </div>
                
                <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-sm bg-white">
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">Reseed Database</h4>
                        <p className="text-xs text-slate-500">Restore default demo dataset.</p>
                    </div>
                    <NexButton variant="secondary" onClick={handleReseed} disabled={loading} icon={RefreshCw}>Reseed Data</NexButton>
                </div>

                <div className="flex items-center justify-between p-4 border border-rose-100 rounded-sm bg-rose-50/20">
                    <div>
                        <h4 className="font-bold text-rose-700 text-sm">Factory Reset</h4>
                        <p className="text-xs text-rose-500">Permanently delete all local data.</p>
                    </div>
                    <NexButton variant="danger" onClick={handleReset} disabled={loading} icon={Trash2}>Reset Database</NexButton>
                </div>
                </div>
            </section>
          </div>
      )}

      {activeTab === 'appearance' && (
          <div className="space-y-6">
              <section className="bg-white rounded-sm shadow-sm border border-slate-300 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Monitor size={16} className="text-slate-500" />
                          Display Density & Scale
                      </h3>
                      <button onClick={resetTheme} className="text-xs text-blue-600 hover:underline">Reset to Defaults</button>
                  </div>
                  
                  <div className="p-6 space-y-8">
                      {/* Scale Control */}
                      <div className="space-y-3">
                          <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <Maximize size={16} className="text-slate-400"/> Interface Scale
                              </label>
                              <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{(scale * 100).toFixed(0)}%</span>
                          </div>
                          <input 
                            type="range" min="0.75" max="1.25" step="0.05" 
                            value={scale} 
                            onChange={e => setScale(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                              <span>Compact</span>
                              <span>Default</span>
                              <span>Large</span>
                          </div>
                      </div>

                      <div className="h-px bg-slate-200"></div>

                      {/* Dimensions Control */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                      <Move size={16} className="text-slate-400"/> Sidebar Width
                                  </label>
                                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{sidebarWidth}px</span>
                              </div>
                              <input 
                                type="range" min="200" max="400" step="10" 
                                value={sidebarWidth} 
                                onChange={e => setSidebarWidth(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                          </div>

                          <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                      <Move size={16} className="text-slate-400 rotate-90"/> Header Height
                                  </label>
                                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{headerHeight}px</span>
                              </div>
                              <input 
                                type="range" min="48" max="80" step="4" 
                                value={headerHeight} 
                                onChange={e => setHeaderHeight(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                          </div>
                      </div>

                      <div className="h-px bg-slate-200"></div>

                      {/* Density Control */}
                      <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <Palette size={16} className="text-slate-400"/> Content Density
                          </label>
                          <div className="flex gap-4">
                              {['compact', 'comfortable', 'spacious'].map((d) => (
                                  <button 
                                    key={d}
                                    onClick={() => setDensity(d as any)}
                                    className={`flex-1 py-3 border rounded-sm text-xs font-bold uppercase transition-all ${density === d ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                  >
                                      {d}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      {/* Radius Control */}
                      <div className="space-y-3">
                          <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-slate-700">Corner Radius</label>
                              <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{radius}px</span>
                          </div>
                          <input 
                            type="range" min="0" max="12" step="1" 
                            value={radius} 
                            onChange={e => setRadius(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                      </div>
                  </div>
              </section>
          </div>
      )}

      {activeTab === 'calendar' && (
          <div className="space-y-6">
              <section className="bg-white rounded-sm shadow-sm border border-slate-300 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Calendar size={16} className="text-slate-500" />
                          Business Calendar & SLA
                      </h3>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="space-y-3">
                          <label className="prop-label">Working Days</label>
                          <div className="flex gap-2">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                  <button 
                                    key={day}
                                    onClick={() => toggleWorkDay(day)}
                                    className={`w-10 h-10 rounded-sm text-xs font-bold transition-all border ${workDays.includes(day) ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                  >
                                      {day}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="prop-label">Business Hours Start</label>
                              <input type="time" className="prop-input" value={workHours.start} onChange={e => setWorkHours({...workHours, start: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                              <label className="prop-label">Business Hours End</label>
                              <input type="time" className="prop-input" value={workHours.end} onChange={e => setWorkHours({...workHours, end: e.target.value})} />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="prop-label">Timezone</label>
                          <select className="prop-input" value={timezone} onChange={e => setTimezone(e.target.value)}>
                              <option value="UTC">UTC (Coordinated Universal Time)</option>
                              <option value="EST">EST (Eastern Standard Time)</option>
                              <option value="CST">CST (Central Standard Time)</option>
                              <option value="PST">PST (Pacific Standard Time)</option>
                              <option value="GMT">GMT (Greenwich Mean Time)</option>
                          </select>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm text-xs text-blue-800">
                          <h4 className="font-bold mb-1">Impact on SLAs</h4>
                          <p>Task due dates will automatically skip non-working days. E.g., a task due in "2 days" created on Friday will be due Tuesday.</p>
                      </div>
                  </div>
              </section>
          </div>
      )}
    </div>
  );
};
