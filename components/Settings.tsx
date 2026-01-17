import React, { useRef, useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Database, RefreshCw, Trash2, Download, Upload, AlertTriangle, CheckCircle, Server } from 'lucide-react';

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
    // clear input
    e.target.value = '';
  };

  const handleReset = async () => {
    if(window.confirm("Are you sure you want to completely wipe the database? This cannot be undone.")) {
       await resetSystem();
       setStatusMsg('Database reset complete.');
       setTimeout(() => setStatusMsg(''), 3000);
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
    <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Server size={28} className="text-brand-600"/> 
          System Administration
        </h2>
        <p className="text-slate-500">Manage local database, backups, and system reset options.</p>
      </header>

      {statusMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 font-medium">
          <CheckCircle size={20} />
          {statusMsg}
        </div>
      )}

      {/* Data Persistence Section */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <Database size={20} className="text-slate-500" />
             Local Storage & Backup
           </h3>
        </div>
        
        <div className="p-6 grid gap-6 md:grid-cols-2">
          <div className="p-5 border border-slate-200 rounded-lg bg-slate-50 hover:border-brand-300 transition-colors">
            <h4 className="font-semibold text-slate-800 mb-2">Export Database</h4>
            <p className="text-sm text-slate-500 mb-4">Download a JSON snapshot of all processes, instances, and tasks.</p>
            <button 
              onClick={exportData}
              disabled={loading}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 flex items-center gap-2 transition-all"
            >
              <Download size={16} /> Download Backup
            </button>
          </div>

          <div className="p-5 border border-slate-200 rounded-lg bg-slate-50 hover:border-brand-300 transition-colors">
            <h4 className="font-semibold text-slate-800 mb-2">Import Database</h4>
            <p className="text-sm text-slate-500 mb-4">Restore system state from a previously exported JSON file.</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden"
            />
            <button 
              onClick={handleImportClick}
              disabled={loading}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2 transition-all shadow-sm"
            >
              <Upload size={16} /> Upload Backup
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-6 border-b border-red-50 bg-red-50/30">
           <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
             <AlertTriangle size={20} />
             Danger Zone
           </h3>
        </div>
        
        <div className="p-6 space-y-4">
           <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-white">
             <div>
                <h4 className="font-medium text-slate-800">Reseed Database</h4>
                <p className="text-sm text-slate-500">Clear all data and restore standard demo data.</p>
             </div>
             <button 
                onClick={handleReseed}
                disabled={loading}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-brand-600 hover:border-brand-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
             >
               <RefreshCw size={16} /> Reseed Data
             </button>
           </div>

           <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50/10">
             <div>
                <h4 className="font-medium text-red-700">Factory Reset</h4>
                <p className="text-sm text-red-500/80">Permanently delete the IndexedDB database and all local data.</p>
             </div>
             <button 
                onClick={handleReset}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
             >
               <Trash2 size={16} /> Reset Database
             </button>
           </div>
        </div>
      </section>
    </div>
  );
};
