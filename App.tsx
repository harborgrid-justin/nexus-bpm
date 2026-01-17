
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, CheckSquare, PenTool, BarChart3, Menu, X, Bell, 
  Search, Layers, Settings as SettingsIcon, ShieldCheck, 
  Fingerprint, Briefcase, FunctionSquare, Info, CheckCircle, AlertCircle, ChevronRight, Loader2,
  Plus, Zap, MoreHorizontal, UserCircle, Sparkles, ChevronDown, Database, LogIn, Command
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
import { CommandPalette } from './components/CommandPalette';
import { ViewState } from './types';
import { BPMProvider, useBPM } from './contexts/BPMContext';
import { NexButton } from './components/shared/NexUI';

const ToastContainer = () => {
  const { notifications, removeNotification, navigateTo } = useBPM();
  return (
    <div className="fixed bottom-4 right-4 z-[200] space-y-2 pointer-events-none max-w-sm w-full">
      {notifications.map(n => (
        <div 
          key={n.id} 
          onClick={() => n.deepLink && navigateTo(n.deepLink.view, n.deepLink.id)}
          className={`flex items-center gap-3 p-3 rounded-sm border pointer-events-auto animate-slide-up shadow-md cursor-pointer text-sm ${
            n.type === 'success' ? 'bg-white border-l-4 border-l-emerald-500 border-slate-200' :
            n.type === 'error' ? 'bg-white border-l-4 border-l-rose-500 border-slate-200' : 'bg-white border-l-4 border-l-blue-500 border-slate-200'
          }`}
        >
          {n.type === 'success' ? <CheckCircle size={16} className="text-emerald-600"/> : n.type === 'error' ? <AlertCircle size={16} className="text-rose-600"/> : <Info size={16} className="text-blue-600"/>}
          <div className="flex-1">
            <p className="font-medium text-slate-800">{n.message}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
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
      className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] font-medium transition-colors border-l-4 ${
        active
          ? 'bg-blue-50 text-blue-700 border-blue-600'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent'
      }`}
    >
      <Icon size={16} className={active ? 'text-blue-600' : 'text-slate-400'} />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};

const AppContent: React.FC = () => {
  const { nav, navigateTo, viewingInstanceId, closeInstanceViewer, currentUser, loading, reseedSystem, notifications } = useBPM();
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

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#eaebef] flex-col gap-4">
        <Loader2 className="animate-spin text-blue-700" size={32} />
        <p className="text-slate-600 font-medium text-xs">Initializing Enterprise Environment...</p>
      </div>
    );
  }

  // Handle case where database is empty and no user exists (e.g. after reset)
  if (!currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f0f2f5]">
        <div className="bg-white p-8 rounded-sm shadow-xl border border-slate-300 max-w-md w-full text-center space-y-6">
           <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
              <LogIn size={32} />
           </div>
           <div>
             <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome to NexFlow</h2>
             <p className="text-sm text-slate-500">The system appears to be fresh. Please initialize the database to begin.</p>
           </div>
           <NexButton variant="primary" onClick={reseedSystem} className="w-full justify-center py-3" icon={Database}>Initialize Demo Data</NexButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#eaebef] overflow-hidden">
      {/* Sidebar - Enterprise Style */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-300 transform transition-transform duration-200 lg:translate-x-0 lg:static flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-14 flex items-center px-4 border-b border-slate-200 bg-slate-50">
          <div className="w-6 h-6 bg-blue-700 rounded-sm flex items-center justify-center text-white font-bold text-xs mr-3">N</div>
          <span className="text-sm font-bold text-slate-800 tracking-tight">NexFlow Enterprise</span>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden ml-auto text-slate-500"><X size={18}/></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 space-y-6">
          <div>
            <div className="px-4 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operations</div>
            <NavItem view="dashboard" icon={LayoutDashboard} label="Overview" active={nav.view === 'dashboard'} />
            <NavItem view="inbox" icon={CheckSquare} label="Task List" active={nav.view === 'inbox'} />
            <NavItem view="cases" icon={Briefcase} label="Case Management" active={nav.view === 'cases'} />
          </div>
          
          <div>
            <div className="px-4 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Configuration</div>
            <NavItem view="processes" icon={Layers} label="Process Registry" active={nav.view === 'processes'} />
            <NavItem view="designer" icon={PenTool} label="Workflow Designer" active={nav.view === 'designer'} />
            <NavItem view="rules" icon={FunctionSquare} label="Business Rules" active={nav.view === 'rules'} />
          </div>
          
          <div>
            <div className="px-4 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Administration</div>
            <NavItem view="analytics" icon={BarChart3} label="Analytics & KPI" active={nav.view === 'analytics'} />
            <NavItem view="identity" icon={Fingerprint} label="Access Control" active={nav.view === 'identity'} />
            <NavItem view="governance" icon={ShieldCheck} label="Audit Logs" active={nav.view === 'governance'} />
            <NavItem view="settings" icon={Database} label="System" active={nav.view === 'settings'} />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Enterprise Header */}
        <header className="h-14 bg-white border-b border-slate-300 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-slate-500"><Menu size={20}/></button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-sm">
               <span className="text-xs font-semibold text-slate-700">Domain:</span>
               <span className="text-xs text-slate-900 font-mono">{currentUser.domainId || 'GLOBAL'}</span>
               <ChevronDown size={12} className="text-slate-400" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-sm w-64 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Global Search (ID, Task, Case)..." />
            </div>
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded border border-slate-200 hidden lg:flex">
               <Command size={10} /> + K
            </div>
            <button className="text-slate-500 hover:text-blue-600 transition-colors relative">
              <Bell size={18}/>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border border-white"></span>
              )}
            </button>
            <button className="text-slate-500 hover:text-blue-600 transition-colors"><SettingsIcon size={18}/></button>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#eaebef]">
          <div className="max-w-[1600px] mx-auto">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      <DevToolbar />
      <CommandPalette />
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
