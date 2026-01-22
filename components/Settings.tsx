
import React, { useRef, useState, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { Database, RefreshCw, Trash2, Download, Upload, AlertTriangle, CheckCircle, Server, Monitor, Palette, Maximize, Move, Calendar, Moon, Sun, Settings as SettingsIcon, GripVertical } from 'lucide-react';
import { NexButton, NexCard } from './shared/NexUI';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const Settings: React.FC = () => {
  const { resetSystem, reseedSystem, exportData, importData, loading, settings, updateSystemSettings, setToolbarConfig } = useBPM();
  const { scale, setScale, sidebarWidth, setSidebarWidth, headerHeight, setHeaderHeight, radius, setRadius, density, setDensity, themeMode, setThemeMode, resetTheme, gridConfig } = useTheme();
  
  const [statusMsg, setStatusMsg] = useState('');
  const [isEditable, setIsEditable] = useState(false);

  const defaultLayouts = {
      lg: [
          { i: 'system', x: 0, y: 0, w: 6, h: 8 },
          { i: 'appearance', x: 6, y: 0, w: 6, h: 8 }
      ],
      md: [
          { i: 'system', x: 0, y: 0, w: 10, h: 8 },
          { i: 'appearance', x: 0, y: 8, w: 10, h: 8 }
      ]
  };
  const [layouts, setLayouts] = useState(defaultLayouts);

  useEffect(() => {
      setToolbarConfig({
          view: [
              { label: isEditable ? 'Lock Dashboard' : 'Edit Dashboard', action: () => setIsEditable(!isEditable), icon: SettingsIcon },
              { label: 'Reset Layout', action: () => setLayouts(defaultLayouts) }
          ]
      });
  }, [setToolbarConfig, isEditable]);

  const handleExport = async () => {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `nexflow_backup_${new Date().toISOString()}.json`; a.click();
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <ResponsiveGridLayout className="layout" layouts={layouts} breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }} rowHeight={gridConfig.rowHeight} margin={gridConfig.margin} isDraggable={isEditable} isResizable={isEditable} draggableHandle=".drag-handle" onLayoutChange={(curr, all) => setLayouts(all)}>
            <NexCard key="system" dragHandle={isEditable} title="System Operations" className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-sm bg-slate-50">
                        <div><h4 className="font-bold text-sm text-slate-800">Export Database</h4><p className="text-xs text-slate-500">Download a full JSON dump.</p></div>
                        <NexButton variant="secondary" onClick={handleExport} icon={Download}>Backup</NexButton>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-sm bg-slate-50">
                        <div><h4 className="font-bold text-sm text-slate-800">Factory Reset</h4><p className="text-xs text-slate-500">Clear all local data.</p></div>
                        <NexButton variant="danger" onClick={() => { if(confirm('Reset all data?')) resetSystem(); }} icon={Trash2}>Reset</NexButton>
                    </div>
                </div>
            </NexCard>

            <NexCard key="appearance" dragHandle={isEditable} title="Interface Preferences" className="p-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Sun size={14}/> Theme Mode</label>
                        <div className="flex bg-slate-100 p-1 rounded-sm">
                            {['light', 'dark'].map(m => (
                                <button key={m} onClick={() => setThemeMode(m as any)} className={`flex-1 py-1 text-xs font-bold uppercase rounded-sm transition-all ${themeMode === m ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}>{m}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Palette size={14}/> Density</label>
                        <div className="flex bg-slate-100 p-1 rounded-sm">
                            {['compact', 'comfortable', 'spacious'].map(d => (
                                <button key={d} onClick={() => setDensity(d as any)} className={`flex-1 py-1 text-xs font-bold uppercase rounded-sm transition-all ${density === d ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}>{d}</button>
                            ))}
                        </div>
                    </div>
                    <button onClick={resetTheme} className="text-xs text-blue-600 hover:underline w-full text-center">Reset to Defaults</button>
                </div>
            </NexCard>
        </ResponsiveGridLayout>
    </div>
  );
};
