
import React, { useRef, useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Database, RefreshCw, Trash2, Download, Upload, AlertTriangle, CheckCircle, Server } from 'lucide-react';
import { NexButton } from './shared/NexUI';

export const Settings: React.FC = () => {
  const { resetSystem, reseedSystem, exportData, importData, loading } = useBPM();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState('');

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

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <header className="mb-6 border-b border-slate-300 pb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Server size={24} className="text-blue-600"/> 
          System Administration
        </h2>
        <p className="text-xs text-slate-500 font-medium">Database management and recovery.</p>
      </header>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center gap-2 text-emerald-700 font-bold text-xs">
          <CheckCircle size={16} />
          {statusMsg}
        </div>
      )}

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
  );
};
