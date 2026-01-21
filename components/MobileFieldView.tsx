
import React, { useState, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  MapPin, CheckSquare, RefreshCw, Wifi, WifiOff, List, 
  Map as MapIcon, User, Camera, Calendar, ArrowRight, CheckCircle, Clock,
  UploadCloud
} from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { syncService, SyncAction } from '../services/syncService';

export const MobileFieldView: React.FC = () => {
  const { tasks, currentUser, completeTask, updateTaskLocation } = useBPM();
  const [activeTab, setActiveTab] = useState<'tasks' | 'map' | 'sync'>('tasks');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  const myTasks = tasks.filter(t => t.assignee === currentUser?.id && t.status !== TaskStatus.COMPLETED);

  useEffect(() => {
      const unsub = syncService.subscribe((queue, online) => {
          setSyncQueue(queue);
          setIsOffline(!online);
      });
      return unsub;
  }, []);

  useEffect(() => {
      // Mock Geolocation Watch
      const watchId = navigator.geolocation.watchPosition(
          (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => console.error(err),
          { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleCheckIn = async (taskId: string) => {
      if (isOffline) {
          syncService.enqueue('CHECK_IN', { taskId, location });
          return;
      }
      if (location) {
          await updateTaskLocation(taskId, location.lat, location.lng);
      }
  };

  const handleComplete = async (taskId: string) => {
      if (isOffline) {
          syncService.enqueue('COMPLETE_TASK', { taskId, action: 'approve' });
          // Optimistic update could be handled in context, but for now we rely on queue feedback
          return;
      }
      await completeTask(taskId, 'approve', 'Completed via Field App');
  };

  const handleManualSync = () => {
      syncService.processQueue();
  };

  return (
    <div className="fixed inset-0 bg-slate-100 z-[200] flex flex-col font-sans max-w-md mx-auto border-x border-slate-300 shadow-2xl">
        {/* Mobile Header */}
        <div className={`px-4 py-3 flex items-center justify-between text-white shadow-md transition-colors ${isOffline ? 'bg-slate-800' : 'bg-blue-600'}`}>
            <h1 className="text-lg font-bold flex items-center gap-2">
                NexFlow <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Field Ops</span>
            </h1>
            <div className="flex items-center gap-2">
                {syncQueue.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-500/80 px-2 py-1 rounded-full animate-pulse">
                        <UploadCloud size={10}/> {syncQueue.length}
                    </span>
                )}
                <div className="flex items-center gap-1.5 text-xs font-bold bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {isOffline ? <WifiOff size={14}/> : <Wifi size={14}/>}
                    {isOffline ? 'Offline' : 'Online'}
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'tasks' && (
                <>
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="text-2xl font-black text-slate-800">My Route</h2>
                        <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-full">{myTasks.length} Pending</span>
                    </div>
                    {myTasks.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                            <CheckCircle size={48} className="mb-4 text-emerald-200"/>
                            <p className="font-bold">All clear!</p>
                            <p className="text-xs">No active field tasks assigned.</p>
                        </div>
                    ) : (
                        myTasks.map(task => (
                            <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 active:scale-[0.98] transition-transform">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.processName}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.priority === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{task.priority}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{task.title}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description || "No description provided."}</p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                                        <Clock size={14}/> 
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleCheckIn(task.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300" title="Check In">
                                            <MapPin size={18}/>
                                        </button>
                                        <button onClick={() => handleComplete(task.id)} className={`h-10 px-4 flex items-center gap-2 rounded-full text-white font-bold text-sm shadow-sm active:bg-opacity-90 ${isOffline ? 'bg-slate-600' : 'bg-blue-600'}`}>
                                            Complete <ArrowRight size={16}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {activeTab === 'map' && (
                <div className="h-full bg-slate-200 rounded-xl flex items-center justify-center border-2 border-slate-300 border-dashed text-slate-400 font-bold flex-col gap-2">
                    <MapPin size={48} className="animate-bounce"/>
                    <p>Map Service Unavailable</p>
                    <p className="text-xs font-normal">GPS Location: {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Acquiring...'}</p>
                </div>
            )}

            {activeTab === 'sync' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-black text-slate-800">Sync Manager</h2>
                    <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-slate-600">Pending Actions</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${syncQueue.length > 0 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{syncQueue.length}</span>
                        </div>
                        {syncQueue.length === 0 ? (
                            <div className="text-center py-4">
                                <CheckCircle size={32} className="mx-auto text-emerald-300 mb-2"/>
                                <p className="text-xs text-slate-400 italic">All data synchronized.</p>
                            </div>
                        ) : (
                            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
                                {syncQueue.map((action) => (
                                    <li key={action.id} className="text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-lg flex items-center justify-between border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {action.status === 'syncing' ? <RefreshCw size={12} className="animate-spin text-blue-500"/> : <Clock size={12} className="text-slate-400"/>}
                                            <div className="flex flex-col">
                                                <span className="font-bold">{action.type}</span>
                                                <span className="text-[9px] text-slate-400">{new Date(action.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                        {action.status === 'failed' && <span className="text-[9px] text-red-500 font-bold">Failed</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {syncQueue.length > 0 && !isOffline && (
                            <button onClick={handleManualSync} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-bold text-sm active:scale-[0.98] transition-transform shadow-sm hover:bg-blue-700">
                                Force Sync Now
                            </button>
                        )}
                    </div>
                    
                    <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg">
                            {currentUser?.name[0]}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">{currentUser?.name}</h4>
                            <p className="text-xs text-slate-500">{currentUser?.email}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Bottom Nav */}
        <div className="h-16 bg-white border-t border-slate-200 flex justify-around items-center shrink-0 pb-safe">
            <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'tasks' ? 'text-blue-600' : 'text-slate-400'}`}>
                <List size={20} strokeWidth={activeTab === 'tasks' ? 3 : 2}/>
                <span className="text-[10px] font-bold">Tasks</span>
            </button>
            <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'map' ? 'text-blue-600' : 'text-slate-400'}`}>
                <MapIcon size={20} strokeWidth={activeTab === 'map' ? 3 : 2}/>
                <span className="text-[10px] font-bold">Map</span>
            </button>
            <button onClick={() => setActiveTab('sync')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'sync' ? 'text-blue-600' : 'text-slate-400'}`}>
                <RefreshCw size={20} strokeWidth={activeTab === 'sync' ? 3 : 2}/>
                <span className="text-[10px] font-bold">Sync</span>
            </button>
        </div>
    </div>
  );
};
