
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { produce } from 'immer';
import { 
  ProcessDefinition, ProcessInstance, Task, TaskStatus, TaskPriority, 
  ViewState, AuditLog, Comment, User, UserRole, UserGroup, Permission, 
  Delegation, BusinessRule, DecisionTable, Case, CaseEvent, CasePolicy, CaseStakeholder,
  Condition, RuleAction, ProcessStep, ProcessLink, FormDefinition, ProcessVersionSnapshot, ChecklistItem,
  Integration, ApiClient, SystemSettings, SavedView, ToolbarConfig, TaskHistory
} from '../types';
import { dbService, DEFAULT_SETTINGS } from '../services/dbService';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  action?: () => void;
  deepLink?: { view: ViewState; id?: string };
}

interface BPMContextType {
  // State
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
  nav: { view: ViewState; selectedId?: string; filter?: string; data?: any };
  delegations: Delegation[];
  rules: BusinessRule[];
  decisionTables: DecisionTable[];
  forms: FormDefinition[];
  integrations: Integration[]; 
  apiClients: ApiClient[]; 
  settings: SystemSettings;
  savedViews: SavedView[];
  viewingInstanceId: string | null;
  toolbarConfig: ToolbarConfig;
  designerDraft: { steps: ProcessStep[], links: ProcessLink[] } | null;

  // Actions
  setGlobalSearch: (s: string) => void;
  setToolbarConfig: (config: ToolbarConfig) => void;
  setDesignerDraft: (draft: { steps: ProcessStep[], links: ProcessLink[] } | null) => void;
  navigateTo: (view: ViewState, id?: string, filter?: string, data?: any) => void;
  openInstanceViewer: (id: string) => void;
  closeInstanceViewer: () => void;
  switchUser: (userId: string) => void;
  addNotification: (type: 'success' | 'error' | 'info', message: string, deepLink?: { view: ViewState; id?: string }) => void;
  removeNotification: (id: string) => void;
  executeRules: (ruleId: string, fact: any) => Promise<any>;
  deployProcess: (process: Partial<ProcessDefinition>) => Promise<void>;
  updateProcess: (id: string, updates: Partial<ProcessDefinition>) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;
  toggleProcessState: (id: string) => Promise<void>;
  getStepStatistics: (defId: string, stepName: string) => { avgDuration: number, errorRate: number, totalExecutions: number };
  startProcess: (definitionId: string, inputData: any, caseId?: string) => Promise<string>;
  suspendInstance: (id: string) => Promise<void>;
  terminateInstance: (id: string) => Promise<void>;
  compensateTransaction: (id: string) => Promise<void>;
  addInstanceComment: (instanceId: string, text: string) => Promise<void>;
  completeTask: (taskId: string, action: string, comments: string, formData?: any) => Promise<void>;
  claimTask: (taskId: string) => Promise<void>;
  releaseTask: (taskId: string) => Promise<void>;
  reassignTask: (taskId: string, userId: string) => Promise<void>;
  updateTaskMetadata: (taskId: string, updates: Partial<Task>) => Promise<void>;
  addTaskComment: (taskId: string, text: string) => Promise<void>;
  updateTaskChecklist: (taskId: string, items: ChecklistItem[]) => Promise<void>;
  bulkCompleteTasks: (taskIds: string[], action: 'approve' | 'reject') => Promise<void>;
  toggleTaskStar: (taskId: string) => Promise<void>;
  snoozeTask: (taskId: string, until: string) => Promise<void>;
  createAdHocTask: (title: string, priority?: TaskPriority) => Promise<void>;
  updateTaskLocation: (taskId: string, lat: number, lng: number) => Promise<void>; 
  createCase: (title: string, description: string, options?: { priority?: TaskPriority, data?: any, ownerId?: string }) => Promise<string>;
  updateCase: (id: string, updates: Partial<Case>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addCaseEvent: (caseId: string, description: string) => Promise<void>;
  removeCaseEvent: (caseId: string, eventId: string) => Promise<void>;
  addCasePolicy: (caseId: string, policy: string) => Promise<void>;
  removeCasePolicy: (caseId: string, policyId: string) => Promise<void>;
  addCaseStakeholder: (caseId: string, userId: string, role: string) => Promise<void>;
  removeCaseStakeholder: (caseId: string, userId: string) => Promise<void>;
  saveRule: (rule: BusinessRule) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  cloneRule: (id: string) => Promise<void>;
  saveDecisionTable: (table: DecisionTable) => Promise<void>;
  deleteDecisionTable: (id: string) => Promise<void>;
  saveForm: (form: FormDefinition) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  createUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  createRole: (role: Omit<UserRole, 'id'>) => Promise<void>;
  updateRole: (id: string, updates: Partial<UserRole>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  createGroup: (group: Omit<UserGroup, 'id'>) => Promise<void>;
  updateGroup: (id: string, updates: Partial<UserGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  createDelegation: (toUserId: string, scope: 'All' | 'Critical Only') => Promise<void>;
  revokeDelegation: (id: string) => Promise<void>;
  installIntegration: (id: string, config: Record<string, string>) => Promise<void>;
  uninstallIntegration: (id: string) => Promise<void>;
  toggleApiClient: (id: string) => Promise<void>;
  saveView: (view: SavedView) => Promise<void>;
  deleteView: (id: string) => Promise<void>;
  updateSystemSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  hasPermission: (perm: Permission) => boolean;
  reseedSystem: () => Promise<void>;
  resetSystem: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: (file: File) => Promise<void>;
  getActiveUsersOnRecord: (recordId: string) => User[];
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
    forms: [] as FormDefinition[],
    integrations: [] as Integration[],
    apiClients: [] as ApiClient[],
    settings: DEFAULT_SETTINGS,
    savedViews: [] as SavedView[],
    notifications: [] as Notification[],
    globalSearch: '',
    nav: { view: 'dashboard' } as { view: ViewState; selectedId?: string; filter?: string; data?: any },
    viewingInstanceId: null as string | null,
    currentUser: null as User | null,
    loading: true,
    designerDraft: null as { steps: ProcessStep[], links: ProcessLink[] } | null
  });

  const [toolbarConfig, setToolbarConfigState] = useState<ToolbarConfig>({});
  const setToolbarConfig = useCallback((config: ToolbarConfig) => { setToolbarConfigState(config); }, []);
  const [activePresence, setActivePresence] = useState<Record<string, string[]>>({}); 

  // --- REFS for Engine Access to Latest State (Simulates Backend DB Access) ---
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const loadData = useCallback(async () => {
    try {
      const [p, inst, t, c, logs, u, r, g, d, bRules, tables, f, ints, apis, setts, views] = await Promise.all([
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
        dbService.getAll<FormDefinition>('forms'),
        dbService.getAll<Integration>('integrations'),
        dbService.getAll<ApiClient>('apiClients'),
        dbService.getAll<SystemSettings>('systemSettings'),
        dbService.getAll<SavedView>('savedViews')
      ]);

      setState(prev => ({
        ...prev,
        processes: p, instances: inst, tasks: t, cases: c,
        auditLogs: logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        users: u, roles: r, groups: g, delegations: d,
        rules: bRules, decisionTables: tables, forms: f,
        integrations: ints, apiClients: apis, settings: setts[0] || DEFAULT_SETTINGS, savedViews: views,
        currentUser: prev.currentUser || u[0] || null,
        loading: false
      }));
    } catch (e) {
      console.error("Context Load Failure:", e);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // --- HELPERS ---
  const addAudit = useCallback(async (action: string, type: AuditLog['entityType'], id: string, details: string, severity: AuditLog['severity'] = 'Info') => {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId: stateRef.current.currentUser?.name || 'System',
      action, entityType: type, entityId: id, details, severity
    };
    await dbService.add('auditLogs', log);
    setState(produce(draft => { draft.auditLogs.unshift(log); }));
  }, []);

  const addNotification = useCallback((type: 'success' | 'error' | 'info', message: string, deepLink?: { view: ViewState; id?: string }) => {
    const n: Notification = { id: `n-${Date.now()}`, type, message, deepLink };
    setState(produce(draft => { draft.notifications.push(n); }));
    setTimeout(() => setState(produce(draft => { draft.notifications = draft.notifications.filter(x => x.id !== n.id); })), 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setState(produce(draft => { draft.notifications = draft.notifications.filter(x => x.id !== id); }));
  }, []);

  const navigateTo = useCallback((view: ViewState, id?: string, filter?: string, data?: any) => {
    setState(produce(draft => { draft.nav = { view, selectedId: id, filter, data }; draft.globalSearch = ''; }));
    setToolbarConfig({});
  }, [setToolbarConfig]);

  // --- ORACLE BPM ENGINE SIMULATION ---

  // SLA MONITOR (Runs every minute)
  useEffect(() => {
      const interval = setInterval(() => {
          const now = new Date();
          stateRef.current.tasks.forEach(t => {
              if (t.status !== TaskStatus.COMPLETED && t.dueDate && new Date(t.dueDate) < now && t.priority !== TaskPriority.CRITICAL) {
                  // Escalation Logic
                  console.log(`[SLA Engine] Escalating Task: ${t.id}`);
                  // In a real app, this would be a DB update
                  // Simulating local state update for UI reflection
                  setState(produce(draft => {
                      const task = draft.tasks.find(x => x.id === t.id);
                      if (task && task.priority !== TaskPriority.CRITICAL) {
                          task.priority = TaskPriority.CRITICAL;
                          draft.notifications.push({ id: `esc-${t.id}`, type: 'error', message: `SLA Breach: ${t.title} escalated to CRITICAL` });
                      }
                  }));
              }
          });
      }, 60000); // Check every minute
      return () => clearInterval(interval);
  }, []);

  const evaluateCondition = (condition: string, variables: any) => {
      try {
          // Simple safe eval for demo purposes. 
          // Replaces variable names with values from instance payload
          let expr = condition;
          Object.keys(variables).forEach(key => {
              const val = typeof variables[key] === 'string' ? `'${variables[key]}'` : variables[key];
              // Basic regex replace for whole words matching variable keys
              expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
          });
          // eslint-disable-next-line no-eval
          return eval(expr); 
      } catch (e) {
          console.warn('Condition Eval Failed:', condition, e);
          return false;
      }
  };

  const proceedWorkflow = async (instanceId: string, currentStepId: string) => {
      const instance = stateRef.current.instances.find(i => i.id === instanceId);
      if (!instance) return;
      const def = stateRef.current.processes.find(p => p.id === instance.definitionId);
      if (!def) return;

      const currentStep = def.steps.find(s => s.id === currentStepId);
      
      // 1. Audit / Flow Trace
      const historyEntry: TaskHistory = {
          id: `h-${Date.now()}`, stepName: currentStep?.name || 'Unknown', stepId: currentStepId,
          action: 'Completed', performer: 'System', timestamp: new Date().toISOString()
      };
      
      // 2. Token Navigation Logic
      const outgoingLinks = def.links?.filter(l => l.sourceId === currentStepId) || [];
      let nextStepIds: string[] = [];

      if (currentStep?.type === 'exclusive-gateway') {
          // XOR Gateway: Find first true condition
          const match = outgoingLinks.find(l => l.condition && evaluateCondition(l.condition, instance.variables));
          if (match) nextStepIds.push(match.targetId);
          else {
              // Default path
              const defaultLink = outgoingLinks.find(l => l.isDefault) || outgoingLinks[0];
              if (defaultLink) nextStepIds.push(defaultLink.targetId);
          }
      } else if (currentStep?.type === 'parallel-gateway') {
          // AND Gateway: Split token
          nextStepIds = outgoingLinks.map(l => l.targetId);
      } else {
          // Standard Sequence Flow
          nextStepIds = outgoingLinks.map(l => l.targetId);
      }

      // 3. Update Instance State
      const updates: Partial<ProcessInstance> = {
          activeStepIds: nextStepIds,
          history: [...instance.history, historyEntry]
      };

      // 4. Activate Next Nodes
      for (const nextId of nextStepIds) {
          const nextStep = def.steps.find(s => s.id === nextId);
          if (!nextStep) continue;

          if (nextStep.type === 'user-task') {
              // Human Workflow: Create Task
              const newTask: Task = {
                  id: `task-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
                  title: nextStep.name, processName: def.name, processInstanceId: instanceId,
                  assignee: nextStep.role ? '' : (stateRef.current.currentUser?.id || ''), // Auto-assign if no role
                  candidateRoles: nextStep.role ? [nextStep.role] : [],
                  candidateGroups: nextStep.groupId ? [nextStep.groupId] : [],
                  requiredSkills: nextStep.requiredSkills || [],
                  dueDate: new Date(Date.now() + (nextStep.slaDays || 3) * 86400000).toISOString(),
                  status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM,
                  description: nextStep.description, stepId: nextId, data: {}, comments: [], attachments: [], isAdHoc: false, formId: nextStep.formId
              };
              await dbService.add('tasks', newTask);
              setState(produce(draft => { draft.tasks.unshift(newTask); }));
              addNotification('info', `New Task Assigned: ${newTask.title}`);
          } else if (nextStep.type === 'end') {
              updates.status = 'Completed';
              updates.endDate = new Date().toISOString();
              updates.activeStepIds = []; // Clear active steps
              addNotification('success', `Process Completed: ${def.name}`);
          } else if (['service-task', 'script-task', 'start', 'exclusive-gateway', 'parallel-gateway'].includes(nextStep.type)) {
              // Service Integration / System Tasks: Auto-execute
              // Simulating OSB/BPEL execution latency
              setTimeout(() => proceedWorkflow(instanceId, nextId), 500); 
          }
      }

      await dbService.add('instances', { ...instance, ...updates });
      setState(produce(draft => { 
          const idx = draft.instances.findIndex(i => i.id === instanceId);
          if (idx !== -1) draft.instances[idx] = { ...draft.instances[idx], ...updates };
      }));
  };

  const startProcess = useCallback(async (definitionId: string, inputData: any, caseId?: string) => {
      const def = stateRef.current.processes.find(p => p.id === definitionId);
      if(!def) throw new Error('Process definition not found');

      const startNode = def.steps.find(s => s.type === 'start');
      if (!startNode) { addNotification('error', 'Process has no start event'); return ''; }

      const newInstance: ProcessInstance = {
          id: `inst-${Date.now()}`,
          definitionId: def.id,
          definitionName: def.name,
          status: 'Active',
          startDate: new Date().toISOString(),
          activeStepIds: [startNode.id],
          variables: { ...inputData, sys_startedBy: stateRef.current.currentUser?.id, sys_caseId: caseId },
          priority: TaskPriority.MEDIUM,
          history: [], comments: [], complianceVerified: false, domainId: def.domainId
      };

      await dbService.add('instances', newInstance);
      setState(produce(draft => { draft.instances.unshift(newInstance); }));
      addNotification('success', `Started ${def.name}`);
      addAudit('PROCESS_START', 'Instance', newInstance.id, `Started process ${def.name}`);

      // Kick off the engine
      proceedWorkflow(newInstance.id, startNode.id);
      
      return newInstance.id;
  }, [addNotification, addAudit]);

  const completeTask = useCallback(async (taskId: string, action: string, comments: string, formData?: any) => {
      const task = stateRef.current.tasks.find(t => t.id === taskId);
      if (!task) return;

      // 1. Update Task Status
      const updates: Partial<Task> = { status: TaskStatus.COMPLETED, data: { ...task.data, ...formData } };
      await dbService.add('tasks', { ...task, ...updates });
      setState(produce(draft => {
          const t = draft.tasks.find(x => x.id === taskId);
          if (t) { t.status = TaskStatus.COMPLETED; t.data = { ...t.data, ...formData }; }
      }));

      // 2. Update Instance Payload (Form Data Merging)
      if (task.processInstanceId) {
          const instance = stateRef.current.instances.find(i => i.id === task.processInstanceId);
          if (instance) {
              const updatedVariables = { ...instance.variables, ...formData };
              await dbService.add('instances', { ...instance, variables: updatedVariables });
              setState(produce(draft => {
                  const i = draft.instances.find(x => x.id === task.processInstanceId);
                  if (i) i.variables = updatedVariables;
              }));

              // 3. Move Token Forward
              proceedWorkflow(task.processInstanceId, task.stepId);
          }
      }

      addAudit('TASK_COMPLETE', 'Task', taskId, `Completed task ${task.title} with action: ${action}`);
  }, [addAudit]);

  // BPEL-style Compensation
  const compensateTransaction = useCallback(async (id: string) => {
      const instance = stateRef.current.instances.find(i => i.id === id);
      if (instance) {
          await dbService.add('instances', { ...instance, status: 'Suspended' });
          setState(produce(draft => {
              const i = draft.instances.find(x => x.id === id);
              if (i) { 
                  i.status = 'Suspended'; 
                  i.history.push({ 
                      id: `h-${Date.now()}`, stepName: 'Compensation Handler', action: 'Rollback', 
                      performer: 'System', timestamp: new Date().toISOString(), comments: 'Transaction reversed due to fault.' 
                  });
              }
          }));
          addNotification('info', 'Instance compensated and suspended.');
      }
  }, [addNotification]);

  const deployProcess = useCallback(async (process: Partial<ProcessDefinition>) => {
      const newProc = { 
          ...process, 
          id: process.id || `proc-${Date.now()}`,
          deployedBy: stateRef.current.currentUser?.name || 'System',
          createdAt: process.createdAt || new Date().toISOString()
      } as ProcessDefinition;
      await dbService.add('processes', newProc);
      setState(produce(draft => {
          const idx = draft.processes.findIndex(p => p.id === newProc.id);
          if(idx !== -1) draft.processes[idx] = newProc;
          else draft.processes.push(newProc);
      }));
  }, []);

  const deleteProcess = useCallback(async (id: string) => {
      await dbService.delete('processes', id);
      setState(produce(draft => {
          draft.processes = draft.processes.filter(p => p.id !== id);
      }));
  }, []);

  const createCase = useCallback(async (title: string, description: string, options?: { priority?: TaskPriority, data?: any, ownerId?: string }) => {
      const newCase: Case = {
          id: `case-${Date.now()}`,
          title,
          description,
          status: 'Open',
          priority: options?.priority || TaskPriority.MEDIUM,
          createdAt: new Date().toISOString(),
          stakeholders: options?.ownerId ? [{ userId: options.ownerId, role: 'Owner' }] : [],
          data: options?.data || {},
          timeline: [{
              id: `evt-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: 'Manual',
              description: 'Case initialized',
              author: stateRef.current.currentUser?.name || 'System'
          }],
          policies: [],
          attachments: [],
          domainId: stateRef.current.currentUser?.domainId || 'GLOBAL'
      };
      await dbService.add('cases', newCase);
      setState(produce(draft => { draft.cases.unshift(newCase); }));
      addNotification('success', `Case created: ${title}`);
      return newCase.id;
  }, [addNotification]);

  // --- ACTIONS MEMOIZATION ---
  const actions = useMemo(() => ({
    setGlobalSearch: (s: string) => setState(prev => ({ ...prev, globalSearch: s })),
    setDesignerDraft: (draft: any) => setState(prev => ({ ...prev, designerDraft: draft })),
    setToolbarConfig,
    navigateTo, 
    openInstanceViewer: (id: string) => setState(prev => ({ ...prev, viewingInstanceId: id })),
    closeInstanceViewer: () => setState(prev => ({ ...prev, viewingInstanceId: null })),
    switchUser: (id: string) => { const u = stateRef.current.users.find(u => u.id === id); if (u) { setState(prev => ({ ...prev, currentUser: u })); navigateTo('dashboard'); } },
    addNotification, removeNotification,
    
    startProcess, completeTask, compensateTransaction,
    
    executeRules: async (ruleId: string, fact: any) => { return { matched: false }; }, 
    
    deployProcess, 
    updateProcess: async (id: string, updates: Partial<ProcessDefinition>) => {
      const p = stateRef.current.processes.find(x => x.id === id);
      if(p) {
          const up = { ...p, ...updates };
          await dbService.add('processes', up);
          setState(produce(draft => { draft.processes = draft.processes.map(x => x.id === id ? up : x); }));
      }
    },
    deleteProcess,
    toggleProcessState: async (id: string) => {},
    
    suspendInstance: async (id: string) => {}, 
    terminateInstance: async (id: string) => {}, 
    addInstanceComment: async (id: string, txt: string) => {
        const inst = stateRef.current.instances.find(i => i.id === id);
        if(inst) {
            const comment = { id: `c-${Date.now()}`, userId: stateRef.current.currentUser?.id || '', userName: stateRef.current.currentUser?.name || 'User', text: txt, timestamp: new Date().toISOString() };
            const up = { ...inst, comments: [...inst.comments, comment] };
            await dbService.add('instances', up);
            setState(produce(draft => { const idx = draft.instances.findIndex(x => x.id === id); if(idx !== -1) draft.instances[idx].comments.push(comment); }));
        }
    },
    claimTask: async (id: string) => {}, 
    releaseTask: async (id: string) => {}, 
    reassignTask: async (id: string, userId: string) => {}, 
    updateTaskMetadata: async (id: string, updates: Partial<Task>) => {},
    addTaskComment: async (id: string, txt: string) => {
        const t = stateRef.current.tasks.find(x => x.id === id);
        if(t) {
            const c = { id: `c-${Date.now()}`, userId: stateRef.current.currentUser?.id || '', userName: stateRef.current.currentUser?.name || 'User', text: txt, timestamp: new Date().toISOString() };
            await dbService.add('tasks', { ...t, comments: [...t.comments, c] });
            setState(produce(draft => { const idx = draft.tasks.findIndex(x => x.id === id); if(idx!==-1) draft.tasks[idx].comments.push(c); }));
        }
    },
    updateTaskChecklist: async (id: string, items: ChecklistItem[]) => {
        const t = stateRef.current.tasks.find(x => x.id === id);
        if(t) {
            await dbService.add('tasks', { ...t, checklist: items });
            setState(produce(draft => { const idx = draft.tasks.findIndex(x => x.id === id); if(idx!==-1) draft.tasks[idx].checklist = items; }));
        }
    },
    bulkCompleteTasks: async () => {}, 
    toggleTaskStar: async (id: string) => {
        const t = stateRef.current.tasks.find(x => x.id === id);
        if(t) {
            await dbService.add('tasks', { ...t, isStarred: !t.isStarred });
            setState(produce(draft => { const idx = draft.tasks.findIndex(x => x.id === id); if(idx!==-1) draft.tasks[idx].isStarred = !draft.tasks[idx].isStarred; }));
        }
    },
    snoozeTask: async () => {}, 
    createAdHocTask: async (title: string) => {
        const t: Task = {
            id: `task-${Date.now()}`, title, processName: 'Ad-Hoc', processInstanceId: '', assignee: stateRef.current.currentUser?.id || '', candidateRoles: [], candidateGroups: [], requiredSkills: [],
            dueDate: new Date().toISOString(), status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, stepId: 'adhoc', data: {}, comments: [], attachments: [], isAdHoc: true
        };
        await dbService.add('tasks', t);
        setState(produce(draft => { draft.tasks.unshift(t); }));
    },
    updateTaskLocation: async (id: string, lat: number, lng: number) => {},
    createCase, 
    updateCase: async (id: string, up: Partial<Case>) => {
        const c = stateRef.current.cases.find(x => x.id === id);
        if(c) { await dbService.add('cases', { ...c, ...up }); setState(produce(draft => { const idx = draft.cases.findIndex(x => x.id === id); if(idx!==-1) Object.assign(draft.cases[idx], up); })); }
    }, 
    deleteCase: async () => {}, 
    addCaseEvent: async (id: string, desc: string) => {
        const c = stateRef.current.cases.find(x => x.id === id);
        if(c) {
            const ev = { id: `evt-${Date.now()}`, timestamp: new Date().toISOString(), type: 'Manual' as const, description: desc, author: stateRef.current.currentUser?.name || 'System' };
            await dbService.add('cases', { ...c, timeline: [ev, ...c.timeline] });
            setState(produce(draft => { const idx = draft.cases.findIndex(x => x.id === id); if(idx!==-1) draft.cases[idx].timeline.unshift(ev); }));
        }
    },
    removeCaseEvent: async () => {}, 
    addCasePolicy: async (id: string, txt: string) => {
        const c = stateRef.current.cases.find(x => x.id === id);
        if(c) {
            const p = { id: `pol-${Date.now()}`, description: txt, isEnforced: true };
            await dbService.add('cases', { ...c, policies: [...c.policies, p] });
            setState(produce(draft => { const idx = draft.cases.findIndex(x => x.id === id); if(idx!==-1) draft.cases[idx].policies.push(p); }));
        }
    },
    removeCasePolicy: async () => {}, 
    addCaseStakeholder: async (id: string, uid: string, role: string) => {
        const c = stateRef.current.cases.find(x => x.id === id);
        if(c) {
            const sh = { userId: uid, role: role as any };
            await dbService.add('cases', { ...c, stakeholders: [...c.stakeholders, sh] });
            setState(produce(draft => { const idx = draft.cases.findIndex(x => x.id === id); if(idx!==-1) draft.cases[idx].stakeholders.push(sh); }));
        }
    },
    removeCaseStakeholder: async () => {},
    saveRule: async (r: BusinessRule) => { await dbService.add('rules', r); setState(produce(draft => { const idx = draft.rules.findIndex(x => x.id === r.id); if(idx!==-1) draft.rules[idx] = r; else draft.rules.push(r); })); },
    deleteRule: async (id: string) => { await dbService.delete('rules', id); setState(produce(draft => { draft.rules = draft.rules.filter(x => x.id !== id); })); },
    cloneRule: async () => {},
    saveDecisionTable: async (t: DecisionTable) => { await dbService.add('decisionTables', t); setState(produce(draft => { const idx = draft.decisionTables.findIndex(x => x.id === t.id); if(idx!==-1) draft.decisionTables[idx] = t; else draft.decisionTables.push(t); })); },
    deleteDecisionTable: async (id: string) => { await dbService.delete('decisionTables', id); setState(produce(draft => { draft.decisionTables = draft.decisionTables.filter(x => x.id !== id); })); },
    saveForm: async (f: FormDefinition) => { await dbService.add('forms', f); setState(produce(draft => { const idx = draft.forms.findIndex(x => x.id === f.id); if(idx!==-1) draft.forms[idx] = f; else draft.forms.push(f); })); },
    deleteForm: async (id: string) => { await dbService.delete('forms', id); setState(produce(draft => { draft.forms = draft.forms.filter(x => x.id !== id); })); },
    
    createUser: async (u: Omit<User, 'id'>) => { const nu = { ...u, id: `u-${Date.now()}` }; await dbService.add('users', nu); setState(produce(draft => { draft.users.push(nu); })); }, 
    updateUser: async (id: string, up: Partial<User>) => { const u = stateRef.current.users.find(x => x.id === id); if(u) { await dbService.add('users', { ...u, ...up }); setState(produce(draft => { const idx = draft.users.findIndex(x => x.id === id); if(idx!==-1) Object.assign(draft.users[idx], up); })); } }, 
    deleteUser: async (id: string) => { await dbService.delete('users', id); setState(produce(draft => { draft.users = draft.users.filter(x => x.id !== id); })); },
    createRole: async () => {}, updateRole: async () => {}, deleteRole: async () => {},
    createGroup: async () => {}, updateGroup: async () => {}, deleteGroup: async () => {},
    createDelegation: async (uid: string, scope: 'All' | 'Critical Only') => {
        const d: Delegation = { id: `del-${Date.now()}`, fromUserId: stateRef.current.currentUser?.id || '', toUserId: uid, scope, startDate: new Date().toISOString(), endDate: new Date(Date.now()+86400000).toISOString(), isActive: true };
        await dbService.add('delegations', d);
        setState(produce(draft => { draft.delegations.push(d); }));
    },
    revokeDelegation: async (id: string) => { await dbService.delete('delegations', id); setState(produce(draft => { draft.delegations = draft.delegations.filter(x => x.id !== id); })); },
    installIntegration: async () => {}, uninstallIntegration: async () => {}, toggleApiClient: async () => {},
    saveView: async (v: SavedView) => { const nv = { ...v, id: v.id || `view-${Date.now()}` }; await dbService.add('savedViews', nv); setState(produce(draft => { draft.savedViews.push(nv); })); },
    deleteView: async () => {},
    updateSystemSettings: async (up: Partial<SystemSettings>) => { const ns = { ...stateRef.current.settings, ...up }; await dbService.add('systemSettings', ns); setState(prev => ({ ...prev, settings: ns })); },
    hasPermission: (perm: Permission) => {
        if (!stateRef.current.currentUser) return false;
        return stateRef.current.currentUser.roleIds.some(rId => {
            const role = stateRef.current.roles.find(r => r.id === rId);
            return role?.permissions.includes(perm) || role?.permissions.includes(Permission.ADMIN_ACCESS);
        });
    },
    getStepStatistics: (defId: string, stepName: string) => {
        const instances = stateRef.current.instances.filter(i => i.definitionId === defId);
        let count = 0;
        instances.forEach(i => i.history.forEach(h => { if(h.stepName === stepName) count++; }));
        return { avgDuration: 5, errorRate: 0, totalExecutions: count };
    },
    reseedSystem: async () => { await dbService.reseed(); loadData(); },
    resetSystem: async () => { await dbService.resetDB(); window.location.reload(); },
    exportData: async () => { return dbService.exportData(); },
    importData: async (f: File) => {},
    getActiveUsersOnRecord: (id: string) => { const uids = activePresence[id] || []; return stateRef.current.users.filter(u => uids.includes(u.id)); }
  }), [addNotification, removeNotification, navigateTo, setToolbarConfig, startProcess, completeTask, compensateTransaction, deployProcess, deleteProcess, createCase, loadData, activePresence]);

  const contextValue = useMemo(() => ({
      ...state,
      toolbarConfig,
      ...actions
  }), [state, toolbarConfig, actions]);

  return <BPMContext.Provider value={contextValue}>{children}</BPMContext.Provider>;
};

export const useBPM = () => {
  const context = useContext(BPMContext);
  if (!context) throw new Error('useBPM must be used within a BPMProvider');
  return context;
};
