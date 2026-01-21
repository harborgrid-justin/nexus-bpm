
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  MapPin, CheckSquare, RefreshCw, Wifi, WifiOff, List, 
  Map as MapIcon, User, Camera, Calendar, ArrowRight, CheckCircle, Clock,
  UploadCloud, Navigation, X, PenTool, Image as ImageIcon, Crosshair
} from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { syncService, SyncAction } from '../services/syncService';
import { NexButton, NexModal } from './shared/NexUI';

// --- SUB-COMPONENTS ---

const SignaturePad: React.FC<{ onSave: (data: string) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if(canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 300;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#0f172a';
            }
        }
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const start = (e: any) => { setIsDrawing(true); draw(e); };
    const end = () => { setIsDrawing(false); const ctx = canvasRef.current?.getContext('2d'); ctx?.beginPath(); };
    const draw = (e: any) => {
        if (!isDrawing) return;
        const { x, y } = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if(ctx) { ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); }
    };

    const handleSave = () => {
        const data = canvasRef.current?.toDataURL() || '';
        onSave(data);
    };

    return (
        <div className="bg-white p-4 rounded-t-xl fixed bottom-0 left-0 right-0 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-safe animate-slide-up">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">Customer Sign-off</h3>
                <button onClick={onCancel}><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg mb-4 touch-none">
                <canvas 
                    ref={canvasRef}
                    onMouseDown={start} onMouseUp={end} onMouseMove={draw}
                    onTouchStart={start} onTouchEnd={end} onTouchMove={draw}
                    className="w-full h-[200px]"
                />
            </div>
            <p className="text-xs text-slate-400 mb-4 text-center">By signing above, you accept the service completion terms.</p>
            <NexButton variant="primary" onClick={handleSave} className="w-full justify-center py-3 text-lg">Confirm Signature</NexButton>
        </div>
    );
};

const EvidenceCapture: React.FC<{ onCapture: (file: File) => void }> = ({ onCapture }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div 
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg h-24 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 transition-all"
        >
            <Camera size={24} className="mb-1"/>
            <span className="text-xs font-bold uppercase">Add Photo Evidence</span>
            <input 
                ref={inputRef} 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={e => e.target.files?.[0] && onCapture(e.target.files[0])}
            />
        </div>
    );
};

const MockMap: React.FC<{ tasks: Task[], userLoc: { lat: number, lng: number } | null, onSelect: (id: string) => void }> = ({ tasks, userLoc, onSelect }) => {
    // Generate deterministic mock coordinates relative to a center point
    const center = userLoc || { lat: 40.7128, lng: -74.0060 };
    
    const pins = useMemo(() => tasks.map((t, i) => {
        // Pseudo-random offset based on task ID char codes
        const offsetLat = (t.id.charCodeAt(t.id.length - 1) % 10 - 5) * 0.002;
        const offsetLng = (t.id.charCodeAt(t.id.length - 2) % 10 - 5) * 0.002;
        return { ...t, lat: center.lat + offsetLat, lng: center.lng + offsetLng };
    }), [tasks, center]);

    return (
        <div className="relative w-full h-full bg-[#e5e7eb] overflow-hidden rounded-xl shadow-inner border border-slate-300 group">
            {/* Fake Map Grid Background */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#6b7280 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* User Location */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            </div>

            {/* Task Pins */}
            {pins.map(t => (
                <div 
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform z-20"
                    style={{ 
                        top: `calc(50% + ${(t.lat - center.lat) * 10000}px)`, 
                        left: `calc(50% + ${(t.lng - center.lng) * 10000}px)` 
                    }}
                >
                    <div className={`flex flex-col items-center`}>
                        <div className={`px-2 py-1 bg-white rounded-md shadow-md text-[10px] font-bold whitespace-nowrap mb-1 border ${t.priority === 'Critical' ? 'border-rose-500 text-rose-600' : 'border-slate-200 text-slate-700'}`}>
                            {t.title.substring(0, 15)}...
                        </div>
                        <MapPin size={32} className={`${t.priority === 'Critical' ? 'text-rose-500' : 'text-slate-700'} drop-shadow-md`}/>
                    </div>
                </div>
            ))}

            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg text-[10px] shadow-sm border border-slate-200">
                <div className="font-bold flex items-center gap-1"><Navigation size={10}/> {userLoc ? 'GPS Active' : 'Locating...'}</div>
            </div>
        </div>
    );
};

// --- MAIN VIEW ---

export const MobileFieldView: React.FC = () => {
  const { tasks, currentUser, completeTask, updateTaskLocation } = useBPM();
  const [activeTab, setActiveTab] = useState<'tasks' | 'map' | 'sync'>('tasks');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Interaction State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [evidence, setEvidence] = useState<File[]>([]);

  const myTasks = tasks.filter(t => t.assignee === currentUser?.id && t.status !== TaskStatus.COMPLETED);
  const selectedTask = myTasks.find(t => t.id === selectedTaskId);

  useEffect(() => {
      const unsub = syncService.subscribe((queue, online) => {
          setSyncQueue(queue);
          setIsOffline(!online);
      });
      return unsub;
  }, []);

  useEffect(() => {
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

  const handleCompleteFlow = async () => {
      if (!selectedTaskId) return;
      
      const payload = { 
          taskId: selectedTaskId, 
          action: 'approve', 
          evidence: evidence.length, // In real app, upload blobs first
          signature: true 
      };

      if (isOffline) {
          syncService.enqueue('COMPLETE_TASK', payload);
      } else {
          await completeTask(selectedTaskId, 'approve', 'Field Completion');
      }
      
      setShowSignature(false);
      setSelectedTaskId(null);
      setEvidence([]);
  };

  const handleManualSync = () => syncService.processQueue();

  return (
    <div className="fixed inset-0 bg-slate-100 z-[200] flex flex-col font-sans max-w-md mx-auto border-x border-slate-300 shadow-2xl">
        {/* Mobile Header */}
        <div className={`px-4 py-3 flex items-center justify-between text-white shadow-md transition-colors z-20 ${isOffline ? 'bg-slate-800' : 'bg-blue-600'}`}>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-slate-50">
            {activeTab === 'tasks' && !selectedTask && (
                <>
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="text-2xl font-black text-slate-800">My Route</h2>
                        <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-full">{myTasks.length} Stops</span>
                    </div>
                    {myTasks.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <CheckCircle size={48} className="mb-4 text-emerald-200"/>
                            <p className="font-bold">All clear!</p>
                            <p className="text-xs">No active field tasks assigned.</p>
                        </div>
                    ) : (
                        myTasks.map(task => (
                            <div key={task.id} onClick={() => setSelectedTaskId(task.id)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 active:scale-[0.98] transition-transform cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Crosshair size={10}/> {Math.floor(Math.random() * 5) + 1}km Away</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.priority === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{task.priority}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{task.title}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description || "No description provided."}</p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                                        <Clock size={14}/> 
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <ArrowRight size={16}/>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {/* Task Detail View (Overlay) */}
            {selectedTask && (
                <div className="absolute inset-0 bg-slate-50 z-30 flex flex-col overflow-y-auto animate-slide-up">
                    <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center gap-3 shadow-sm z-10">
                        <button onClick={() => setSelectedTaskId(null)}><ArrowRight size={20} className="rotate-180 text-slate-500"/></button>
                        <h2 className="font-bold text-slate-800 truncate">{selectedTask.title}</h2>
                    </div>
                    <div className="p-4 space-y-6 pb-32">
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Instructions</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">{selectedTask.description || "Perform standard site inspection and maintenance routine."}</p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 pl-2">1. Arrival</h4>
                            <button 
                                onClick={() => handleCheckIn(selectedTask.id)}
                                className="w-full bg-white border border-blue-200 text-blue-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:bg-blue-50 transition-colors"
                            >
                                <MapPin size={18}/> Log Location Check-in
                            </button>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 pl-2">2. Evidence</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {evidence.map((f, i) => (
                                    <div key={i} className="h-24 bg-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                                        <ImageIcon size={24} className="text-slate-400"/>
                                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/50 text-white px-1 rounded">IMG_{i+1}</span>
                                    </div>
                                ))}
                                <EvidenceCapture onCapture={(f) => setEvidence([...evidence, f])} />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 pl-2">3. Completion</h4>
                            <NexButton variant="primary" onClick={() => setShowSignature(true)} className="w-full justify-center py-4 text-base shadow-lg shadow-blue-600/20">
                                Sign & Complete Job
                            </NexButton>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'map' && (
                <div className="absolute inset-0 z-0">
                    <MockMap tasks={myTasks} userLoc={location} onSelect={(id) => { setActiveTab('tasks'); setSelectedTaskId(id); }} />
                </div>
            )}

            {activeTab === 'sync' && (
                <div className="space-y-4 pt-2">
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

        {/* Signature Overlay */}
        {showSignature && (
            <>
                <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setShowSignature(false)}></div>
                <SignaturePad onSave={handleCompleteFlow} onCancel={() => setShowSignature(false)} />
            </>
        )}

        {/* Bottom Nav */}
        <div className="h-16 bg-white border-t border-slate-200 flex justify-around items-center shrink-0 pb-safe z-40">
            <button onClick={() => { setActiveTab('tasks'); setSelectedTaskId(null); }} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'tasks' ? 'text-blue-600' : 'text-slate-400'}`}>
                <List size={20} strokeWidth={activeTab === 'tasks' ? 3 : 2}/>
                <span className="text-[10px] font-bold">Tasks</span>
            </button>
            <button onClick={() => { setActiveTab('map'); setSelectedTaskId(null); }} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'map' ? 'text-blue-600' : 'text-slate-400'}`}>
                <MapIcon size={20} strokeWidth={activeTab === 'map' ? 3 : 2}/>
                <span className="text-[10px] font-bold">Map</span>
            </button>
            <button onClick={() => { setActiveTab('sync'); setSelectedTaskId(null); }} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'sync' ? 'text-blue-600' : 'text-slate-400'}`}>
                <RefreshCw size={20} strokeWidth={activeTab === 'sync' ? 3 : 2}/>
                <span className="text-[10px] font-bold">Sync</span>
            </button>
        </div>
    </div>
  );
};
