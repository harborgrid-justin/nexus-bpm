import React, { useEffect, useState, useRef } from 'react';
import { Database, Activity, ChevronUp, ChevronDown, X, Terminal } from 'lucide-react';

interface DBLog {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  type: 'read' | 'write' | 'delete' | 'error';
}

export const DevToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // Default closed to not obstruct
  const [logs, setLogs] = useState<DBLog[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLog = (e: CustomEvent) => {
      const newLog: DBLog = {
        id: Math.random().toString(36).substr(2, 9),
        action: e.detail.action,
        detail: JSON.stringify(e.detail.detail),
        timestamp: new Date().toLocaleTimeString(),
        type: e.detail.type || 'read'
      };
      
      setLogs(prev => {
        const updated = [...prev, newLog];
        if (updated.length > 50) return updated.slice(updated.length - 50);
        return updated;
      });
    };

    window.addEventListener('nexflow-db-log' as any, handleLog);
    return () => window.removeEventListener('nexflow-db-log' as any, handleLog);
  }, []);

  useEffect(() => {
    if (isOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  return (
    <>
        {!isOpen && (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:bg-slate-700 transition-all z-50 border border-slate-600"
                title="Open Dev Tools"
            >
                <Terminal size={20} />
            </button>
        )}

        {isOpen && (
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-2xl z-50 animate-slide-up font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-brand-400 font-bold">
                    <Database size={14} />
                    <span>DB Activity Monitor</span>
                </div>
                <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                    {logs.length} events
                </span>
                </div>
                <div className="flex items-center gap-2">
                <button 
                    onClick={() => setLogs([])}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Clear Logs"
                >
                    <X size={14} />
                </button>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                >
                    <ChevronDown size={14} />
                </button>
                </div>
            </div>

            <div className="h-48 overflow-y-auto p-2 space-y-1 bg-slate-950/50 backdrop-blur">
                {logs.length === 0 ? (
                <div className="text-slate-600 italic p-4 text-center">Waiting for database operations...</div>
                ) : (
                logs.map(log => (
                    <div key={log.id} className="flex gap-2 hover:bg-slate-800/50 p-1 rounded transition-colors group">
                    <span className="text-slate-500 w-16 shrink-0">{log.timestamp}</span>
                    <span className={`w-16 font-bold shrink-0 ${
                        log.type === 'write' ? 'text-green-400' : 
                        log.type === 'delete' ? 'text-red-400' : 
                        log.type === 'error' ? 'text-red-500 bg-red-900/20' : 'text-blue-400'
                    }`}>
                        {log.action}
                    </span>
                    <span className="text-slate-300 truncate font-sans opacity-80 group-hover:opacity-100">{log.detail}</span>
                    </div>
                ))
                )}
                <div ref={logsEndRef} />
            </div>
            </div>
        )}
    </>
  );
};