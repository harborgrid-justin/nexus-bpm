
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { produce } from 'immer';
import { 
  ProcessDefinition, ProcessInstance, Task, TaskStatus, TaskPriority, 
  ViewState, AuditLog, Comment, User, UserRole, UserGroup, Permission, 
  Delegation, BusinessRule, DecisionTable, Case, CaseEvent
} from '../types';
import { dbService } from '../services/dbService';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  action?: () => void;
  deepLink?: { view: ViewState; id?: string };
}

interface BPMContextType {
  processes: ProcessDefinition[];
  instances: ProcessInstance[];
  tasks: Task[];
  cases: Case[];
  auditLogs: AuditLog[];
  users: User[];
  roles: UserRole[];
  groups: UserGroup[];
  notifications: Notification[];
  currentUser: User | null;
  loading: boolean;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  nav: { view: ViewState; selectedId?: string; filter?: string };
  delegations: Delegation[];
  rules: BusinessRule[];
  decisionTables: DecisionTable[];
  viewingInstanceId: string | null;
  
  navigateTo: (view: ViewState, id?: string, filter?: string) => void;
  openInstanceViewer: (id: string) => void;
  closeInstanceViewer: () => void;
  switchUser: (userId: string) => void;
  addNotification: (type: 'success' | 'error' | 'info', message: string, deepLink?: { view: ViewState; id?: string }) => void;
  removeNotification: (id: string) => void;
  
  deployProcess: (process: Partial<ProcessDefinition>) => Promise<void>;
  startProcess: (definitionId: string, inputData: any, caseId?: string) => Promise<string>;
  completeTask: (taskId: string, action: string, comments: string) => Promise<void>;
  claimTask: (taskId: string) => Promise<void>;
  releaseTask: (taskId: string) => Promise<void>;
  addTaskComment: (taskId: string, text: string) => Promise<void>;
  
  createCase: (title: string, description: string) => Promise<string>;
  addCaseEvent: (caseId: string, description: string) => Promise<void>;
  
  saveRule: (rule: BusinessRule) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  saveDecisionTable: (table: DecisionTable) => Promise<void>;
  deleteDecisionTable: (id: string) => Promise<void>;
  executeRules: (ruleId: string, fact: any) => Promise<any>;
  
  createDelegation: (toUserId: string, scope: 'All' | 'Critical Only') => Promise<void>;
  revokeDelegation: (id: string) => Promise<void>;
  
  hasPermission: (perm: Permission) => boolean;
  reseedSystem: () => Promise<void>;
  resetSystem: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: (file: File) => Promise<void>;
}

const BPMContext = createContext<BPMContextType | undefined>(undefined);

export const BPMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState({
    processes: [] as ProcessDefinition[],
    instances: [] as ProcessInstance[],
    tasks: [] as Task[],
    cases: [] as Case[],
    auditLogs: [] as AuditLog[],
    users: [] as User[],
    roles: [] as UserRole[],
    groups: [] as UserGroup[],
    delegations: [] as Delegation[],
    rules: [] as BusinessRule[],
    decisionTables: [] as DecisionTable[],
    notifications: [] as Notification[],
    globalSearch: '',
    nav: { view: 'dashboard' } as { view: ViewState; selectedId?: string; filter?: string },
    viewingInstanceId: null as string | null,
    currentUser: null as User | null,
    loading: true
  });

  const loadData = useCallback(async () => {
    try {
      const [p, inst, t, c, logs, u, r, g, d, bRules, tables] = await Promise.all([
        dbService.getAll<ProcessDefinition>('processes'),
        dbService.getAll<ProcessInstance>('instances'),
        dbService.getAll<Task>('tasks'),
        dbService.getAll<Case>('cases'),
        dbService.getAll<AuditLog>('auditLogs'),
        dbService.getAll<User>('users'),
        dbService.getAll<UserRole>('roles'),
        dbService.getAll<UserGroup>('groups'),
        dbService.getAll<Delegation>('delegations'),
        dbService.getAll<BusinessRule>('rules'),
        dbService.getAll<DecisionTable>('decisionTables'),
      ]);

      setState(prev => ({
        ...prev,
        processes: p,
        instances: inst,
        tasks: t,
        cases: c,
        auditLogs: logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        users: u,
        roles: r,
        groups: g,
        delegations: d,
        rules: bRules,
        decisionTables: tables,
        currentUser: prev.currentUser || u[0],
        loading: false
      }));
    } catch (e) {
      console.error("Context Load Failure:", e);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addAudit = async (action: string, type: AuditLog['entityType'], id: string, details: string, severity: AuditLog['severity'] = 'Info') => {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId: state.currentUser?.name || 'System',
      action, entityType: type, entityId: id, details, severity
    };
    await dbService.add('auditLogs', log);
    setState(produce(draft => { draft.auditLogs.unshift(log); }));
  };

  const addNotification = (type: 'success' | 'error' | 'info', message: string, deepLink?: { view: ViewState; id?: string }) => {
    const n: Notification = { id: `n-${Date.now()}`, type, message, deepLink };
    setState(produce(draft => { draft.notifications.push(n); }));
    setTimeout(() => removeNotification(n.id), 5000);
  };

  const removeNotification = (id: string) => setState(produce(draft => { draft.notifications = draft.notifications.filter(n => n.id !== id); }));

  const navigateTo = (view: ViewState, id?: string, filter?: string) => {
    setState(produce(draft => {
      draft.nav = { view, selectedId: id, filter };
      draft.globalSearch = '';
    }));
  };

  const startProcess = async (definitionId: string, inputData: any, caseId?: string) => {
    const def = state.processes.find(p => p.id === definitionId);
    if (!def) throw new Error("Registry entry not found.");
    
    const instanceId = `inst-${Date.now()}`;
    const startStep = def.steps.find(s => s.type === 'start');
    const nextStepIds = startStep?.nextStepIds || [];

    const newInstance: ProcessInstance = {
      id: instanceId,
      definitionId,
      definitionName: def.name,
      status: 'Active',
      activeStepIds: nextStepIds,
      startDate: new Date().toISOString(),
      variables: { ...inputData, caseId },
      priority: TaskPriority.MEDIUM,
      history: [{ id: 'h-1', stepName: 'Start', action: 'Initiated', performer: state.currentUser?.name || 'System', timestamp: new Date().toISOString() }],
      comments: [],
      complianceVerified: true,
      domainId: state.currentUser?.domainId || 'GLOBAL'
    };

    await dbService.add('instances', newInstance);
    setState(produce(draft => { draft.instances.push(newInstance); }));

    for (const stepId of nextStepIds) {
      const step = def.steps.find(s => s.id === stepId);
      if (step && step.type === 'user-task') {
        const newTask: Task = {
          id: `task-${Date.now()}-${stepId}`,
          title: step.name,
          processName: def.name,
          processInstanceId: instanceId,
          assignee: 'Unassigned',
          candidateRoles: step.role ? [step.role] : [],
          candidateGroups: step.groupId ? [step.groupId] : [],
          requiredSkills: step.requiredSkills || [],
          dueDate: new Date(Date.now() + 172800000).toISOString(),
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          description: step.description,
          stepId: step.id,
          comments: [],
          attachments: [],
          isAdHoc: false,
          caseId
        };
        await dbService.add('tasks', newTask);
        setState(produce(draft => { draft.tasks.push(newTask); }));
      }
    }

    if (caseId) {
      await addCaseEvent(caseId, `Initiated automated workflow: ${def.name}`);
    }

    addAudit('PROCESS_START', 'Instance', instanceId, `Started instance of ${def.name}`);
    addNotification('success', 'Workflow initiated.', { view: 'processes' });
    return instanceId;
  };

  const completeTask = async (taskId: string, action: string, comments: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const instance = state.instances.find(i => i.id === task.processInstanceId);
    if (!instance) return;

    const def = state.processes.find(p => p.id === instance.definitionId);
    if (!def) return;

    const currentStep = def.steps.find(s => s.id === task.stepId);
    const nextStepIds = currentStep?.nextStepIds || [];

    const updatedInstance = {
      ...instance,
      activeStepIds: nextStepIds,
      status: nextStepIds.length > 0 ? 'Active' : 'Completed',
      history: [...instance.history, { 
        id: `h-${Date.now()}`, stepName: task.title, action: action, performer: state.currentUser?.name || 'Unknown', timestamp: new Date().toISOString(), comments
      }]
    };
    await dbService.add('instances', updatedInstance);

    const updatedTask = { ...task, status: TaskStatus.COMPLETED };
    await dbService.add('tasks', updatedTask);

    setState(produce(draft => {
      draft.instances = draft.instances.map(i => i.id === instance.id ? updatedInstance : i);
      draft.tasks = draft.tasks.map(t => t.id === taskId ? updatedTask : t);
    }));

    if (task.caseId) {
       await addCaseEvent(task.caseId, `Task [${task.title}] resolved as ${action}. Comments: ${comments}`);
    }

    addAudit('TASK_COMPLETE', 'Task', taskId, `Resolved task: ${task.title} as ${action}`);
    addNotification('success', 'Operational record updated.');
  };

  const createCase = async (t: string, d: string) => {
    const nc: Case = {
      id: `case-${Date.now()}`, title: t, description: d, status: 'Open', priority: TaskPriority.MEDIUM, createdAt: new Date().toISOString(),
      stakeholders: [{ userId: state.currentUser!.id, role: 'Owner' }], data: {}, timeline: [{ id: 'evt-1', timestamp: new Date().toISOString(), type: 'Manual', description: 'Case opened.', author: state.currentUser!.name }],
      attachments: [], policies: [], domainId: state.currentUser!.domainId
    };
    await dbService.add('cases', nc);
    setState(produce(draft => { draft.cases.push(nc); }));
    addAudit('CASE_CREATE', 'Case', nc.id, `Initialized case file: ${t}`);
    return nc.id;
  };

  const addCaseEvent = async (caseId: string, description: string) => {
    const c = state.cases.find(cs => cs.id === caseId);
    if (c) {
      const event: CaseEvent = { id: `evt-${Date.now()}`, timestamp: new Date().toISOString(), type: 'Manual', author: state.currentUser?.name || 'System', description };
      const updatedCase = { ...c, timeline: [event, ...c.timeline] };
      await dbService.add('cases', updatedCase);
      setState(produce(draft => {
        draft.cases = draft.cases.map(cs => cs.id === caseId ? updatedCase : cs);
      }));
    }
  };

  const createDelegation = async (toUserId: string, scope: 'All' | 'Critical Only') => {
    const newDel: Delegation = {
      id: `del-${Date.now()}`,
      fromUserId: state.currentUser!.id,
      toUserId,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      isActive: true,
      scope
    };
    await dbService.add('delegations', newDel);
    setState(produce(draft => { draft.delegations.push(newDel); }));
    addAudit('DELEGATION_CREATE', 'User', toUserId, `Delegated task authority to ${toUserId}`);
    addNotification('success', 'Authority delegation activated.');
  };

  const revokeDelegation = async (id: string) => {
    await dbService.delete('delegations', id);
    setState(produce(draft => { draft.delegations = draft.delegations.filter(d => d.id !== id); }));
    addAudit('DELEGATION_REVOKE', 'User', id, `Revoked delegation record`);
    addNotification('info', 'Authority delegation terminated.');
  };

  const contextValue: BPMContextType = {
    ...state,
    setGlobalSearch: (s) => setState(prev => ({ ...prev, globalSearch: s })),
    navigateTo,
    openInstanceViewer: (id) => setState(prev => ({ ...prev, viewingInstanceId: id })),
    closeInstanceViewer: () => setState(prev => ({ ...prev, viewingInstanceId: null })),
    switchUser: (id) => {
      const u = state.users.find(u => u.id === id);
      if (u) { setState(prev => ({ ...prev, currentUser: u })); navigateTo('dashboard'); }
    },
    addNotification, removeNotification,
    deployProcess: async (p) => { 
      const newDef = { ...p, id: p.id || `proc-${Date.now()}`, createdAt: new Date().toISOString(), deployedBy: state.currentUser?.name || 'System' } as ProcessDefinition;
      await dbService.add('processes', newDef); 
      addAudit('PROCESS_DEPLOY', 'Process', newDef.id, `Deployed model: ${newDef.name}`);
      loadData(); 
    },
    startProcess, completeTask,
    claimTask: async (id) => { 
      const t = state.tasks.find(t => t.id === id);
      if (t) {
        const ut = { ...t, assignee: state.currentUser!.id, status: TaskStatus.CLAIMED };
        await dbService.add('tasks', ut);
        setState(produce(draft => { draft.tasks = draft.tasks.map(x => x.id === id ? ut : x); }));
        addAudit('TASK_CLAIM', 'Task', id, `Claimed responsibility`);
      }
    },
    releaseTask: async (id) => {
      const t = state.tasks.find(t => t.id === id);
      if (t) {
        const ut = { ...t, assignee: 'Unassigned', status: TaskStatus.PENDING };
        await dbService.add('tasks', ut);
        setState(produce(draft => { draft.tasks = draft.tasks.map(x => x.id === id ? ut : x); }));
      }
    },
    addTaskComment: async (tid, text) => {
      const t = state.tasks.find(t => t.id === tid);
      if (t) {
        const c: Comment = { id: `c-${Date.now()}`, userId: state.currentUser!.id, userName: state.currentUser!.name, text, timestamp: new Date().toISOString() };
        const ut = { ...t, comments: [...t.comments, c] };
        await dbService.add('tasks', ut);
        setState(produce(draft => { draft.tasks = draft.tasks.map(x => x.id === tid ? ut : x); }));
      }
    },
    createCase,
    addCaseEvent,
    saveRule: async (r) => { await dbService.add('rules', r); addAudit('RULE_SAVE', 'Rule', r.id, `Updated logic: ${r.name}`); loadData(); },
    deleteRule: async (id) => { await dbService.delete('rules', id); loadData(); },
    saveDecisionTable: async (t) => { await dbService.add('decisionTables', t); loadData(); },
    deleteDecisionTable: async (id) => { await dbService.delete('decisionTables', id); loadData(); },
    executeRules: async (id, fact) => fact,
    createDelegation,
    revokeDelegation,
    hasPermission: (p) => state.currentUser?.roleIds.some(r => state.roles.find(x => x.id === r)?.permissions.includes(p)) || false,
    reseedSystem: async () => { await dbService.reseed(); loadData(); },
    resetSystem: async () => { await dbService.resetDB(); window.location.reload(); },
    exportData: async () => { /* Logic in dbService */ },
    importData: async (f) => { /* Logic in dbService */ },
  };

  return <BPMContext.Provider value={contextValue}>{children}</BPMContext.Provider>;
};

export const useBPM = () => {
  const context = useContext(BPMContext);
  if (!context) throw new Error('useBPM must be used within a BPMProvider');
  return context;
};
