
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, CheckSquare, PenTool, BarChart3, Menu, X, Bell, 
  Search, Layers, Settings as SettingsIcon, ShieldCheck, 
  Fingerprint, Briefcase, FunctionSquare, Info, CheckCircle, AlertCircle, ChevronRight, Loader2,
  Plus, Zap, MoreHorizontal, UserCircle, Sparkles, ChevronDown, Database, LogIn, Command, Home, Calendar, Globe, FormInput,
  PanelLeftClose, PanelLeftOpen, LogOut, ShoppingBag, Smartphone
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
import { ApiGatewayView } from './components/ApiGatewayView'; 
import { FormRepository } from './components/FormRepository'; 
import { FormDesigner } from './components/FormDesigner'; 
import { CommandPalette } from './components/CommandPalette';
// Import New Pages
import { UserFormView, RoleFormView, GroupFormView, DelegationFormView } from './components/pages/IdentityPages';
import { CaseCreateView, CaseEditView, CasePolicyView, CaseStakeholderView, CaseLaunchView } from './components/pages/CasePages';
import { TaskReassignView, TaskMetadataView } from './components/pages/TaskPages';
import { SimulationPage } from './components/pages/SimulationPage';
import { RuleGenPage } from './components/pages/RuleGenPage';
import { ResourcePlanner } from './components/pages/ResourcePlanner';
import { MarketplaceView } from './components/MarketplaceView';
import { MobileFieldView } from './components/MobileFieldView';

import { ViewState } from './types';
import { BPMProvider, useBPM } from './contexts/BPMContext';
import { NexButton } from './components/shared/NexUI';
import { ThemeProvider } from './contexts/ThemeContext';

const ToastContainer = () => {
  const { notifications, removeNotification, navigateTo } = useBPM();
  return (
    <div className="fixed bottom-4 right-4 z-toast space-y-2 pointer-events-none max-w-sm w-full">
      {notifications.map(n => (
        <div 
          key={n.id} 
          onClick={() => n.deepLink && navigateTo(n.deepLink.view, n.deepLink.id)}
          className={`flex items-center gap-3 p-3 rounded-base border pointer-events-auto animate-slide-up shadow-md cursor-pointer text-sm ${
            n.type === 'success' ? 'bg-panel border-l-4 border-l-emerald-500 border-default' :
            n.type === 'error' ? 'bg-panel border-l-4 border-l-rose-500 border-default' : 'bg-panel border-l-4 border-l-blue-500 border-default'
          }`}
        >
          {n.type === 'success' ? <CheckCircle size={16} className="text-emerald-600"/> : n.type === 'error' ? <AlertCircle size={16} className="text-rose-600"/> : <Info size={16} className="text-blue-600"/>}
          <div className="flex-1">
            <p className="font-medium text-primary">{n.message}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }} className="text-tertiary hover:text-primary"><X size={14}/></button>
        </div>
      ))}
    </div>
  );
};

const NavItem = ({ view, icon: Icon, label, active, collapsed }: { view: ViewState; icon: React.ElementType; label: string; active: boolean; collapsed: boolean }) => {
  const { navigateTo } = useBPM();
  
  return (
    <button
      onClick={() => navigateTo(view)}
      title={collapsed ? label : undefined}
      className={`
        relative flex items-center transition-all duration-200 ease-out group outline-none
        ${collapsed ? 'justify-center w-10 h-10 mx-auto rounded-xl' : 'w-full px-3 py-2.5 mx-0 rounded-lg'}
        ${active 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
      `}
    >
      <Icon 
        size={20} 
        strokeWidth={active ? 2.5 : 2}
        className={`transition-transform duration-200 shrink-0 ${!collapsed && 'mr-3'} ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} 
      />
      
      {!collapsed && (
        <span className={`text-sm font-medium tracking-tight truncate flex-1 text-left ${active ? 'font-semibold' : ''}`}>
          {label}
        </span>
      )}
      
      {/* Active Indicator for collapsed state */}
      {collapsed && active && (
        <span className="absolute right-0.5 top-0.5 w-2 h-2 bg-blue-400 border-2 border-white rounded-full"></span>
      )}
    </button>
  );
};

const NavGroup = ({ title, children, collapsed }: { title: string, children?: React.ReactNode, collapsed: boolean }) => {
  if (collapsed) {
    return <div className="space-y-1 mb-2 pt-2 border-t border-slate-100 first:border-0">{children}</div>;
  }
  return (
    <div className="mb-6 px-3">
      <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
};

// --- Rule 10: Breadcrumb Automation ---
const Breadcrumbs = ({ nav }: { nav: { view: ViewState, selectedId?: string } }) => {
    const { addNotification } = useBPM();
    const copyId = () => {
        if(nav.selectedId) {
            navigator.clipboard.writeText(nav.selectedId);
            addNotification('info', `Copied ID: ${nav.selectedId}`);
        }
    };

    const getViewName = (v: string) => {
        const map: Record<string, string> = {
            'dashboard': 'Operational Overview',
            'inbox': 'Task Management',
            'cases': 'Case Management',
            'designer': 'Workflow Studio',
            'processes': 'Process Registry',
            'forms': 'Form Builder',
            'rules': 'Decision Logic',
            'identity': 'Access Control',
            'analytics': 'Intelligence',
            'governance': 'Audit & Compliance'
        };
        return map[v] || v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, ' ');
    };

    const parentMap: Record<string, ViewState> = {
        'case-viewer': 'cases',
        'create-case': 'cases',
        'edit-case': 'cases',
        'form-designer': 'forms',
        'edit-user': 'identity',
        'create-user': 'identity',
        'create-role': 'identity',
        'edit-role': 'identity',
    };

    const parent = parentMap[nav.view];

    return (
        <div 
          className="flex items-center gap-2 py-2 bg-subtle border-b border-default text-xs text-secondary"
          style={{ paddingLeft: 'var(--layout-padding)', paddingRight: 'var(--layout-padding)' }}
        >
            <Home size={12} className="text-tertiary"/>
            <ChevronRight size={10} className="text-tertiary"/>
            
            {parent && (
                <>
                    <span className="font-medium text-slate-500 hover:text-primary cursor-pointer" onClick={() => window.location.hash = parent}>{getViewName(parent)}</span>
                    <ChevronRight size={10} className="text-tertiary"/>
                </>
            )}

            <span className="font-bold text-primary">{getViewName(nav.view)}</span>
            
            {nav.selectedId && (
                <>
                    <ChevronRight size={10} className="text-tertiary"/>
                    <button onClick={copyId} className="font-mono text-blue-600 hover:underline hover:text-blue-800 flex items-center gap-1" title="Click to Copy ID">
                        <span className="opacity-50">ID:</span> {nav.selectedId.split('-').pop()}
                    </button>
                </>
            )}
        </div>
    );
};

const AppContent: React.FC = () => {
  const { nav, navigateTo, viewingInstanceId, closeInstanceViewer, currentUser, loading, reseedSystem, notifications } = useBPM();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      case 'api-gateway': return <ApiGatewayView />;
      case 'resource-planner': return <ResourcePlanner />;
      case 'forms': return <FormRepository />;
      case 'form-designer': return <FormDesigner />;
      case 'marketplace': return <MarketplaceView />;
      case 'field-ops': return <MobileFieldView />;
      
      // Full Page Forms
      case 'create-user':
      case 'edit-user': return <UserFormView />;
      case 'create-role':
      case 'edit-role': return <RoleFormView />;
      case 'create-group':
      case 'edit-group': return <GroupFormView />;
      case 'create-delegation': return <DelegationFormView />;
      
      case 'create-case': return <CaseCreateView />;
      case 'edit-case': return <CaseEditView />;
      case 'case-policy': return <CasePolicyView />;
      case 'case-stakeholder': return <CaseStakeholderView />;
      case 'case-launch': return <CaseLaunchView />;
      
      case 'task-reassign': return <TaskReassignView />;
      case 'task-metadata': return <TaskMetadataView />;
      
      case 'simulation-report': return <SimulationPage />;
      case 'ai-rule-gen': return <RuleGenPage />;
      
      default: return <Dashboard />;
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-app flex-col gap-4">
        <Loader2 className="animate-spin text-blue-700" size={32} />
        <p className="text-secondary font-medium text-xs">Initializing Enterprise Environment...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canvas">
        <div className="bg-panel p-8 rounded-base shadow-xl border border-default max-w-md w-full text-center space-y-6">
           <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
              <LogIn size={32} />
           </div>
           <div>
             <h2 className="text-xl font-bold text-primary mb-2">Welcome to NexFlow</h2>
             <p className="text-sm text-secondary">The system appears to be fresh. Please initialize the database to begin.</p>
           </div>
           <NexButton variant="primary" onClick={reseedSystem} className="w-full justify-center py-3" icon={Database}>Initialize Demo Data</NexButton>
        </div>
      </div>
    );
  }

  // --- FIELD OPS SPECIAL VIEW ---
  if (nav.view === 'field-ops') {
      return (
          <>
            <MobileFieldView />
            <button 
                onClick={() => navigateTo('dashboard')} 
                className="fixed top-2 right-2 z-[250] bg-black/30 hover:bg-black/50 text-white rounded-full p-2 backdrop-blur-sm transition-all"
                title="Exit Field Mode"
            >
                <X size={20}/>
            </button>
          </>
      );
  }

  return (
    <div className="flex h-screen bg-app overflow-hidden">
      {/* Sidebar - Enterprise Style */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-dropdown bg-panel border-r border-default flex flex-col 
          transform transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] 
          ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:static'}
        `}
        style={{ width: sidebarCollapsed ? '72px' : 'var(--sidebar-width)' }}
      >
        <div 
          className={`h-header flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'} border-b border-default bg-subtle shrink-0 transition-all overflow-hidden`}
          style={{ gap: 'var(--space-base)' }}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-600/20 shrink-0">N</div>
          <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <h1 className="text-sm font-bold text-primary tracking-tight leading-none">NexFlow</h1>
            <p className="text-[10px] text-secondary font-semibold mt-0.5 tracking-wide">ENTERPRISE</p>
          </div>
          {!sidebarCollapsed && (
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden ml-auto text-secondary hover:text-primary"><X size={18}/></button>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 overflow-x-hidden no-scrollbar" style={{ gap: 'var(--space-base)', display: 'flex', flexDirection: 'column' }}>
          <NavGroup title="Operations" collapsed={sidebarCollapsed}>
            <NavItem view="dashboard" icon={LayoutDashboard} label="Overview" active={nav.view === 'dashboard'} collapsed={sidebarCollapsed} />
            <NavItem view="inbox" icon={CheckSquare} label="Task List" active={nav.view === 'inbox'} collapsed={sidebarCollapsed} />
            <NavItem view="cases" icon={Briefcase} label="Case Management" active={nav.view === 'cases'} collapsed={sidebarCollapsed} />
            <NavItem view="field-ops" icon={Smartphone} label="Field Ops Mode" active={nav.view === 'field-ops'} collapsed={sidebarCollapsed} />
          </NavGroup>
          
          <NavGroup title="Configuration" collapsed={sidebarCollapsed}>
            <NavItem view="processes" icon={Layers} label="Process Registry" active={nav.view === 'processes'} collapsed={sidebarCollapsed} />
            <NavItem view="designer" icon={PenTool} label="Workflow Designer" active={nav.view === 'designer'} collapsed={sidebarCollapsed} />
            <NavItem view="forms" icon={FormInput} label="Form Builder" active={nav.view === 'forms'} collapsed={sidebarCollapsed} />
            <NavItem view="resource-planner" icon={Calendar} label="Resource Planner" active={nav.view === 'resource-planner'} collapsed={sidebarCollapsed} />
            <NavItem view="rules" icon={FunctionSquare} label="Business Rules" active={nav.view === 'rules'} collapsed={sidebarCollapsed} />
            <NavItem view="api-gateway" icon={Globe} label="API Gateway" active={nav.view === 'api-gateway'} collapsed={sidebarCollapsed} />
            <NavItem view="marketplace" icon={ShoppingBag} label="Marketplace" active={nav.view === 'marketplace'} collapsed={sidebarCollapsed} />
          </NavGroup>
          
          <NavGroup title="Administration" collapsed={sidebarCollapsed}>
            <NavItem view="analytics" icon={BarChart3} label="Analytics & KPI" active={nav.view === 'analytics'} collapsed={sidebarCollapsed} />
            <NavItem view="identity" icon={Fingerprint} label="Access Control" active={nav.view === 'identity'} collapsed={sidebarCollapsed} />
            <NavItem view="governance" icon={ShieldCheck} label="Audit Logs" active={nav.view === 'governance'} collapsed={sidebarCollapsed} />
            <NavItem view="settings" icon={Database} label="System" active={nav.view === 'settings'} collapsed={sidebarCollapsed} />
          </NavGroup>
        </nav>

        {/* Footer User Profile */}
        <div className={`border-t border-default bg-subtle shrink-0 transition-all ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} transition-all`}>
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            
            <div className={`min-w-0 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 flex-1'}`}>
              <p className="text-sm font-bold text-primary truncate">{currentUser.name}</p>
              <p className="text-xs text-secondary truncate">{currentUser.email}</p>
            </div>

            {!sidebarCollapsed && (
               <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
                  <PanelLeftClose size={16} />
               </button>
            )}
          </div>
          {sidebarCollapsed && (
             <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full mt-2 py-2 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-all">
                <PanelLeftOpen size={16} />
             </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Enterprise Header */}
        <header 
          className="h-header bg-panel border-b border-default flex items-center justify-between sticky top-0 z-sticky shadow-sm shrink-0 transition-all"
          style={{ paddingLeft: 'var(--layout-padding)', paddingRight: 'var(--layout-padding)' }}
        >
          <div className="flex items-center" style={{ gap: 'var(--space-base)' }}>
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-secondary p-1 hover:bg-slate-100 rounded-md"><Menu size={20}/></button>
            <div 
              className="flex items-center px-3 py-1.5 bg-subtle border border-default rounded-md hover:border-slate-300 transition-colors cursor-pointer group"
              style={{ gap: 'var(--space-base)' }}
            >
               <span className="text-xs font-semibold text-secondary group-hover:text-primary">Domain:</span>
               <span className="text-xs text-primary font-mono font-bold">{currentUser.domainId || 'GLOBAL'}</span>
               <ChevronDown size={12} className="text-tertiary group-hover:text-secondary" />
            </div>
          </div>
          
          <div className="flex items-center" style={{ gap: 'var(--space-base)' }}>
            <div className="relative hidden md:block group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"/>
              <input className="pl-9 pr-3 py-1.5 text-sm bg-subtle border border-default rounded-md w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Global Search..." />
            </div>
            <div className="h-5 w-px bg-default hidden lg:block"></div>
            <div className="flex items-center gap-2 text-xs text-tertiary font-medium px-2 py-1 bg-subtle rounded border border-default hidden lg:flex">
               <Command size={12} /> <span className="font-sans">K</span>
            </div>
            <button className="text-secondary hover:text-blue-600 transition-colors relative p-1.5 hover:bg-slate-50 rounded-full">
              <Bell size={20}/>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <button className="text-secondary hover:text-blue-600 transition-colors p-1.5 hover:bg-slate-50 rounded-full" onClick={() => navigateTo('settings')}><SettingsIcon size={20}/></button>
          </div>
        </header>

        {/* Breadcrumbs Navigation */}
        <Breadcrumbs nav={nav} />

        {/* Content Canvas */}
        <main 
          className="flex-1 overflow-y-auto bg-app" 
          style={{ padding: 'var(--layout-padding)' }}
        >
          <div 
            className="max-w-[1600px] mx-auto h-full flex flex-col"
            style={{ gap: 'var(--layout-gap)' }}
          >
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
      <ThemeProvider>
        <BPMProvider>
          <AppContent />
        </BPMProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
