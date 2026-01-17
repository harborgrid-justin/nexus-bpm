
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, CheckSquare, PenTool, BarChart3, Menu, X, Bell, 
  Search, Layers, Settings as SettingsIcon, ShieldCheck, 
  Fingerprint, Briefcase, FunctionSquare, Info, CheckCircle, AlertCircle, ChevronRight, Loader2,
  Plus, Zap, MoreHorizontal, UserCircle, Sparkles, ChevronDown
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TaskInbox } from './components/TaskInbox';
import { TaskExplorer } from './components/TaskExplorer';
import { ProcessDesigner } from './components/ProcessDesigner';
import { ProcessRepository } from './components/ProcessRepository';
import { AnalyticsView } from './components/AnalyticsView';
import { GovernanceView } from './components/GovernanceView';
import { Settings } from './components/Settings';
import { IdentityView } from './components/IdentityView';
import { DevToolbar } from './components/DevToolbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProcessInstanceViewer } from './components/ProcessInstanceViewer';
import { CaseManagerView } from './components/CaseManagerView';
import { CaseViewer } from './components/CaseViewer';
import { RulesEngineView } from './components/RulesEngineView';
import { ViewState } from './types';
import { BPMProvider, useBPM } from './contexts/BPMContext';

const ToastContainer = () => {
  const { notifications, removeNotification, navigateTo } = useBPM();
  return (
    <div className="fixed bottom-28 md:bottom-8 right-4 md:right-8 z-[200] space-y-3 pointer-events-none max-w-[calc(100vw-2rem)]">
      {notifications.map(n => (
        <div 
          key={n.id} 
          onClick={() => n.deepLink && navigateTo(n.deepLink.view, n.deepLink.id)}
          className={`flex items-center gap-4 p-4 md:p-5 rounded-2xl border pointer-events-auto animate-slide-up shadow-lg transition-all cursor-pointer ${
            n.type === 'success' ? 'bg-white border-emerald-200 text-emerald-900' :
            n.type === 'error' ? 'bg-white border-rose-200 text-rose-900' : 'bg-white border-blue-200 text-blue-900'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${
            n.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
            n.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {n.type === 'success' ? <CheckCircle size={18}/> : n.type === 'error' ? <AlertCircle size={18}/> : <Info size={18}/>}
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold tracking-tight">{n.message}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={16}/></button>
        </div>
      ))}
    </div>
  );
};

const NavItem = ({ view, icon: Icon, label, active }: { view: ViewState; icon: React.ElementType; label: string; active: boolean }) => {
  const { navigateTo } = useBPM();
  return (
    <button
      onClick={() => navigateTo(view)}
      className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-xl text-[14px] font-bold transition-all duration-200 group ${
        active
          ? 'bg-slate-900 text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'} transition-colors`} />
      <span className="flex-1 text-left tracking-tight">{label}</span>
    </button>
  );
};

const AppContent: React.FC = () => {
  const { nav, navigateTo, viewingInstanceId, closeInstanceViewer, currentUser, loading } = useBPM();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderCurrentView = () => {
    switch (nav.view) {
      case 'dashboard': return <Dashboard />;
      case 'inbox': return <TaskInbox />;
      case 'explorer': return <TaskExplorer />;
      case 'processes': return <ProcessRepository />;
      case 'designer': return <ProcessDesigner />;
      case 'analytics': return <AnalyticsView />;
      case 'governance': return <GovernanceView />;
      case 'identity': return <IdentityView />;
      case 'settings': return <Settings />;
      case 'cases': return <CaseManagerView />;
      case 'case-viewer': return nav.selectedId ? <CaseViewer caseId={nav.selectedId} /> : <CaseManagerView />;
      case 'rules': return <RulesEngineView />;
      default: return <Dashboard />;
    }
  }

  if (loading && !currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 flex-col gap-6">
        <Loader2 className="animate-spin text-blue-600" size={56} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Enterprise Fabric</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-[300px] p-6 h-full shrink-0">
        <div className="bg-white rounded-3xl border border-slate-200/80 h-full flex flex-col overflow-hidden card-shadow">
          <div className="h-24 flex items-center px-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl">N</div>
              <span className="text-xl font-black tracking-tightest text-slate-900">NexFlow</span>
            </div>
          </div>
          <nav className="flex-1 px-5 space-y-1 overflow-y-auto no-scrollbar pb-8">
            <div className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Domain</div>
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" active={nav.view === 'dashboard'} />
            <NavItem view="inbox" icon={CheckSquare} label="Task Queue" active={nav.view === 'inbox'} />
            <NavItem view="cases" icon={Briefcase} label="Complex Cases" active={nav.view === 'cases'} />
            
            <div className="px-5 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Architectural</div>
            <NavItem view="processes" icon={Layers} label="Registry" active={nav.view === 'processes'} />
            <NavItem view="designer" icon={PenTool} label="Modeler" active={nav.view === 'designer'} />
            <NavItem view="rules" icon={FunctionSquare} label="Logic" active={nav.view === 'rules'} />
            
            <div className="px-5 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Core</div>
            <NavItem view="identity" icon={Fingerprint} label="Directory" active={nav.view === 'identity'} />
            <NavItem view="governance" icon={ShieldCheck} label="Audit" active={nav.view === 'governance'} />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 md:h-24 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 flex items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-3 bg-white border border-slate-200 rounded-xl active:scale-95 transition-all"><Menu size={20} /></button>
            
            <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-full cursor-pointer hover:bg-slate-50 transition-all card-shadow">
               <span className="text-[13px] font-bold text-slate-700 whitespace-nowrap">DMH-24 - Downtown Metro Hub</span>
               <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-3 text-amber-500 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all">
              <Sparkles size={18} />
            </button>
            <div 
              onClick={() => navigateTo('identity')}
              className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center font-bold text-xs card-shadow cursor-pointer overflow-hidden"
            >
               <UserCircle size={28} className="text-slate-500" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10">
          <div className="max-w-[1400px] mx-auto">
            {renderCurrentView()}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] h-16 bg-white border border-slate-200/80 rounded-3xl flex items-center justify-around px-2 z-50 shadow-2xl">
           {[
             { view: 'dashboard', icon: LayoutDashboard },
             { view: 'inbox', icon: CheckSquare },
             { view: 'designer', icon: PenTool },
             { view: 'cases', icon: Briefcase }
           ].map((item) => {
             const isActive = nav.view === item.view || (item.view === 'cases' && nav.view === 'case-viewer');
             return (
               <button 
                 key={item.view}
                 onClick={() => navigateTo(item.view as ViewState)} 
                 className={`p-3 rounded-xl transition-all ${isActive ? 'bg-[#0F172A] text-white' : 'text-slate-400'}`}
               >
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
               </button>
             );
           })}
           <button onClick={() => setMobileMenuOpen(true)} className="p-3 text-slate-400 hover:text-slate-900 transition-all">
              <MoreHorizontal size={20} />
           </button>
        </nav>
      </main>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" onClick={() => setMobileMenuOpen(false)}>
           <aside className="w-[300px] h-full bg-white shadow-2xl animate-slide-in flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="h-20 flex items-center justify-between px-8 border-b border-slate-100">
                <span className="text-lg font-black tracking-tightest">NexFlow</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2"><X size={20} /></button>
              </div>
              <div className="flex-1 p-6 space-y-1">
                <NavItem view="processes" icon={Layers} label="Registry" active={nav.view === 'processes'} />
                <NavItem view="analytics" icon={BarChart3} label="Intelligence" active={nav.view === 'analytics'} />
                <NavItem view="identity" icon={Fingerprint} label="Directory" active={nav.view === 'identity'} />
                <NavItem view="governance" icon={ShieldCheck} label="Audit" active={nav.view === 'governance'} />
              </div>
           </aside>
        </div>
      )}

      <DevToolbar />
      <ToastContainer />
      {viewingInstanceId && <ProcessInstanceViewer instanceId={viewingInstanceId} onClose={closeInstanceViewer} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BPMProvider>
        <AppContent />
      </BPMProvider>
    </ErrorBoundary>
  );
};

export default App;
