
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { produce } from 'immer';
import { 
  ProcessDefinition, ProcessInstance, Task, TaskStatus, TaskPriority, 
  ViewState, AuditLog, Comment, User, UserRole, UserGroup, Permission, 
  Delegation, BusinessRule, DecisionTable, Case, CaseEvent, CasePolicy, CaseStakeholder,
  Condition, RuleAction, ProcessStep, ProcessLink
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
  
  // Navigation State
  nav: { view: ViewState; selectedId?: string; filter?: string; data?: any };
  delegations: Delegation[];
  rules: BusinessRule[];
  decisionTables: DecisionTable[];
  viewingInstanceId: string | null;
  
  // Designer Persistence
  designerDraft: { steps: ProcessStep[], links: ProcessLink[] } | null;
  setDesignerDraft: (draft: { steps: ProcessStep[], links: ProcessLink[] } | null) => void;

  navigateTo: (view: ViewState, id?: string, filter?: string, data?: any) => void;
  openInstanceViewer: (id: string) => void;
  closeInstanceViewer: () => void;
  switchUser: (userId: string) => void;
  addNotification: (type: 'success' | 'error' | 'info', message: string, deepLink?: { view: ViewState; id?: string }) => void;
  removeNotification: (id: string) => void;
  
  // Logic Engine
  executeRules: (ruleId: string, fact: any) => Promise<any>;

  // Process Management
  deployProcess: (process: Partial<ProcessDefinition>) => Promise<void>;
  updateProcess: (id: string, updates: Partial<ProcessDefinition>) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;
  toggleProcessState: (id: string) => Promise<void>;
  
  // Instance Management
  startProcess: (definitionId: string, inputData: any, caseId?: string) => Promise<string>;
  suspendInstance: (id: string) => Promise<void>;
  terminateInstance: (id: string) => Promise<void>;
  addInstanceComment: (instanceId: string, text: string) => Promise<void>;
  
  // Task Management
  completeTask: (taskId: string, action: string, comments: string) => Promise<void>;
  claimTask: (taskId: string) => Promise<void>;
  releaseTask: (taskId: string) => Promise<void>;
  reassignTask: (taskId: string, userId: string) => Promise<void>;
  updateTaskMetadata: (taskId: string, updates: Partial<Task>) => Promise<void>;
  addTaskComment: (taskId: string, text: string) => Promise<void>;
  bulkCompleteTasks: (taskIds: string[], action: 'approve' | 'reject') => Promise<void>;
  toggleTaskStar: (taskId: string) => Promise<void>;
  snoozeTask: (taskId: string, until: string) => Promise<void>;
  createAdHocTask: (title: string, priority?: TaskPriority) => Promise<void>;
  
  // Case Management
  createCase: (title: string, description: string) => Promise<string>;
  updateCase: (id: string, updates: Partial<Case>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addCaseEvent: (caseId: string, description: string) => Promise<void>;
  removeCaseEvent: (caseId: string, eventId: string) => Promise<void>;
  addCasePolicy: (caseId: string, policy: string) => Promise<void>;
  removeCasePolicy: (caseId: string, policyId: string) => Promise<void>;
  addCaseStakeholder: (caseId: string, userId: string, role: string) => Promise<void>;
  removeCaseStakeholder: (caseId: string, userId: string) => Promise<void>;
  
  // Rules Management
  saveRule: (rule: BusinessRule) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  cloneRule: (id: string) => Promise<void>;
  saveDecisionTable: (table: DecisionTable) => Promise<void>;
  deleteDecisionTable: (id: string) => Promise<void>;
  
  // Identity Management
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
  
  // System
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
    nav: { view: 'dashboard' } as { view: ViewState; selectedId?: string; filter?: string; data?: any },
    viewingInstanceId: null as string | null,
    currentUser: null as User | null,
    loading: true,
    designerDraft: null as { steps: ProcessStep[], links: ProcessLink[] } | null
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
        currentUser: prev.currentUser || u[0] || null,
        loading: false
      }));
    } catch (e) {
      console.error("Context Load Failure:", e);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const hasPermission = (perm: Permission): boolean => {
      if (!state.currentUser) return false;
      return state.currentUser.roleIds.some(rId => {
          const role = state.roles.find(r => r.id === rId);
          return role?.permissions.includes(perm) || role?.permissions.includes(Permission.ADMIN_ACCESS);
      });
  };

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

  const navigateTo = (view: ViewState, id?: string, filter?: string, data?: any) => {
    setState(produce(draft => {
      draft.nav = { view, selectedId: id, filter, data };
      draft.globalSearch = '';
    }));
  };

  // --- RECURSIVE LOGIC ENGINE ---
  const executeRules = async (ruleId: string, fact: any): Promise<any> => {
      const rule = state.rules.find(r => r.id === ruleId);
      if (!rule) return { error: 'Rule definition not found', matched: false };

      // Helper to access nested object properties (e.g. "invoice.amount")
      const getVal = (path: string, obj: any) => {
          return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      };

      const evalCondition = (cond: Condition): boolean => {
          if ('children' in cond) {
              if (!cond.children || cond.children.length === 0) return true; // Empty group is true by default
              const results = cond.children.map(evalCondition);
              return cond.type === 'AND' ? results.every(r => r) : results.some(r => r);
          } else {
              const factVal = getVal(cond.fact, fact);
              const targetVal = cond.value;
              
              // Handle undefined facts
              if (factVal === undefined) return false;

              // Type Coercion for Numeric comparison
              const numFact = Number(factVal);
              const numTarget = Number(targetVal);
              const isNumeric = !isNaN(numFact) && !isNaN(numTarget) && targetVal !== '';

              switch(cond.operator) {
                  case 'eq': return String(factVal) === String(targetVal);
                  case 'neq': return String(factVal) !== String(targetVal);
                  case 'gt': return isNumeric ? numFact > numTarget : false;
                  case 'lt': return isNumeric ? numFact < numTarget : false;
                  case 'contains': return String(factVal).toLowerCase().includes(String(targetVal).toLowerCase());
                  default: return false;
              }
          }
      };

      const isMatch = evalCondition(rule.conditions);
      
      const executionResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          timestamp: new Date().toISOString(),
          matched: isMatch,
          action: isMatch ? rule.action : null
      };

      // Only log significant rule executions
      if (isMatch) {
          addAudit('RULE_EXECUTE', 'Rule', rule.id, `Triggered: ${rule.name}`, 'Info');
      }

      return executionResult;
  };

  // --- Process Methods ---
  const deployProcess = async (p: Partial<ProcessDefinition>) => { 
    if (!hasPermission(Permission.PROCESS_DEPLOY)) { addNotification('error', 'Permission denied'); return; }
    const newDef = { ...p, id: p.id || `proc-${Date.now()}`, createdAt: new Date().toISOString(), deployedBy: state.currentUser?.name || 'System' } as ProcessDefinition;
    await dbService.add('processes', newDef); 
    addAudit('PROCESS_DEPLOY', 'Process', newDef.id, `Deployed model: ${newDef.name}`);
    loadData(); 
  };

  const updateProcess = async (id: string, updates: Partial<ProcessDefinition>) => {
    const p = state.processes.find(x => x.id === id);
    if(p) {
        const up = { ...p, ...updates };
        await dbService.add('processes', up);
        setState(produce(draft => { draft.processes = draft.processes.map(x => x.id === id ? up : x); }));
    }
  };

  const deleteProcess = async (id: string) => {
      await dbService.delete('processes', id);
      setState(produce(draft => { draft.processes = draft.processes.filter(x => x.id !== id); }));
      addAudit('PROCESS_DELETE', 'Process', id, 'Removed process definition', 'Warning');
  };

  const toggleProcessState = async (id: string) => {
      const p = state.processes.find(x => x.id === id);
      if(p) {
          const up = { ...p, isActive: !p.isActive };
          await dbService.add('processes', up);
          setState(produce(draft => { draft.processes = draft.processes.map(x => x.id === id ? up : x); }));
          addNotification('info', `Process ${up.isActive ? 'Activated' : 'Suspended'}`);
      }
  };

  // --- Instance Methods ---
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

    // Rule Evaluation at Start
    // Logic: If start node has a rule, execute it
    if (startStep?.businessRuleId) {
        await executeRules(startStep.businessRuleId, inputData);
    }

    await generateNextSteps(def, nextStepIds, newInstance);

    if (caseId) {
      await addCaseEvent(caseId, `Initiated automated workflow: ${def.name}`);
    }

    addAudit('PROCESS_START', 'Instance', instanceId, `Started instance of ${def.name}`);
    addNotification('success', 'Workflow initiated.', { view: 'processes' });
    return instanceId;
  };

  const generateNextSteps = async (def: ProcessDefinition, nextStepIds: string[], instance: ProcessInstance) => {
      const newTasks: Task[] = [];
      
      for (const nextId of nextStepIds) {
          const nextStep = def.steps.find(s => s.id === nextId);
          if (!nextStep) continue;

          // DYNAMIC RULE BINDING
          let overrideRole = nextStep.role;
          if (nextStep.businessRuleId) {
             const result = await executeRules(nextStep.businessRuleId, instance.variables);
             if (result.matched && result.action?.type === 'ROUTE_TO') {
                 if (result.action.params.role) overrideRole = result.action.params.role;
                 addNotification('info', `Logic Engine rerouted step '${nextStep.name}' to ${overrideRole}`);
             }
          }

          if (nextStep.type === 'user-task') {
              const nt: Task = {
                  id: `task-${Date.now()}-${nextId}`,
                  title: nextStep.name,
                  processName: def.name,
                  processInstanceId: instance.id,
                  assignee: 'Unassigned',
                  candidateRoles: overrideRole ? [overrideRole] : [],
                  candidateGroups: nextStep.groupId ? [nextStep.groupId] : [],
                  requiredSkills: nextStep.requiredSkills || [],
                  dueDate: new Date(Date.now() + 172800000).toISOString(),
                  status: TaskStatus.PENDING,
                  priority: TaskPriority.MEDIUM,
                  description: nextStep.description,
                  stepId: nextStep.id,
                  comments: [],
                  attachments: [],
                  isAdHoc: false,
                  caseId: instance.variables.caseId,
                  triggerSource: 'System'
              };
              newTasks.push(nt);
              await dbService.add('tasks', nt);
          }
      }

      setState(produce(draft => { draft.tasks.push(...newTasks); }));
  };

  const suspendInstance = async (id: string) => {
      const i = state.instances.find(x => x.id === id);
      if(i) {
          const up = { ...i, status: i.status === 'Active' ? 'Suspended' : 'Active' } as ProcessInstance;
          await dbService.add('instances', up);
          setState(produce(draft => { draft.instances = draft.instances.map(x => x.id === id ? up : x); }));
          addAudit('INSTANCE_SUSPEND', 'Instance', id, `Changed status to ${up.status}`);
      }
  };

  const terminateInstance = async (id: string) => {
      const i = state.instances.find(x => x.id === id);
      if(i) {
          const up = { ...i, status: 'Terminated', endDate: new Date().toISOString() } as ProcessInstance;
          await dbService.add('instances', up);
          setState(produce(draft => { draft.instances = draft.instances.map(x => x.id === id ? up : x); }));
          addAudit('INSTANCE_TERMINATE', 'Instance', id, 'Forced termination', 'Alert');
      }
  };

  const addInstanceComment = async (instanceId: string, text: string) => {
      const i = state.instances.find(x => x.id === instanceId);
      if (i && state.currentUser) {
          const comment: Comment = {
              id: `c-${Date.now()}`,
              userId: state.currentUser.id,
              userName: state.currentUser.name,
              text,
              timestamp: new Date().toISOString()
          };
          const up = { ...i, comments: [...i.comments, comment] };
          await dbService.add('instances', up);
          setState(produce(draft => { draft.instances = draft.instances.map(x => x.id === instanceId ? up : x); }));
      }
  };

  // --- Task Methods ---
  const completeTask = async (taskId: string, action: string, comments: string) => {
    if (!hasPermission(Permission.TASK_COMPLETE)) { addNotification('error', 'Permission denied'); return; }

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.isAdHoc) {
        const updatedTask = { ...task, status: TaskStatus.COMPLETED };
        await dbService.add('tasks', updatedTask);
        setState(produce(draft => { draft.tasks = draft.tasks.map(t => t.id === taskId ? updatedTask : t); }));
        addAudit('TASK_COMPLETE', 'Task', taskId, `Resolved ad-hoc task: ${task.title}`);
        addNotification('success', 'Task completed.');
        return;
    }

    const instance = state.instances.find(i => i.id === task.processInstanceId);
    if (!instance) return;

    const def = state.processes.find(p => p.id === instance.definitionId);
    if (!def) return;

    const currentStep = def.steps.find(s => s.id === task.stepId);
    const nextStepIds = currentStep?.nextStepIds || [];

    const updatedInstance = {
      ...instance,
      activeStepIds: nextStepIds,
      status: (nextStepIds.length > 0 ? 'Active' : 'Completed') as any,
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

    await generateNextSteps(def, nextStepIds, updatedInstance);

    if (task.caseId) {
       await addCaseEvent(task.caseId, `Task [${task.title}] resolved as ${action}. Comments: ${comments}`);
    }

    addAudit('TASK_COMPLETE', 'Task', taskId, `Resolved task: ${task.title} as ${action}`);
    addNotification('success', 'Operational record updated.');
  };

  const claimTask = async (id: string) => { 
      if (!state.currentUser) return;
      const t = state.tasks.find(t => t.id === id);
      if (t) {
        const ut = { ...t, assignee: state.currentUser.id, status: TaskStatus.CLAIMED };
        await dbService.add('tasks', ut);
        setState(produce(draft => { draft.tasks = draft.tasks.map(x => x.id === id ? ut : x); }));
        addAudit('TASK_CLAIM', 'Task', id, `Claimed responsibility`);
        addNotification('info', 'Task claimed.');
      }
  };

  const releaseTask = async (id: string) => {
      const t = state.tasks.find(t => t.id === id);
      if (t) {
        const ut = { ...t, assignee: 'Unassigned', status: TaskStatus.PENDING };
        await dbService.add('tasks', ut);
        setState(produce(draft => { draft.tasks = draft.tasks.map(x => x.id === id ? ut : x); }));
        addNotification('info', 'Task released to pool.');
      }
  };

  const reassignTask = async (taskId: string, userId: string) => {
    const t = state.tasks.find(t => t.id === taskId);
    if (t) {
      const ut = { ...t, assignee: userId, status: TaskStatus.PENDING };
      await dbService.add('tasks', ut);
      setState(produce(draft => { draft.tasks = draft.tasks.map(x => x.id === taskId ? ut : x); }));
      addAudit('TASK_REASSIGN', 'Task', taskId, `Reassigned to ${userId}`);
      addNotification('info', 'Task ownership transferred.');
    }
  };

  const updateTaskMetadata = async (taskId: string, updates: Partial<Task>) => {
    const t = state.tasks.find(t => t.id === taskId);
    if (t) {
      const ut = { ...t, ...updates };
      await dbService.add('tasks', ut);
      setState(produce(draft => { draft.tasks = draft.tasks.map(x => x.id === taskId ? ut : x); }));
      addAudit('TASK_UPDATE', 'Task', taskId, 'Updated metadata');
    }
  };

  const addTaskComment = async (tid: string, text: string) => {
      if (!state.currentUser) return;
      const t = state.tasks.find(t => t.id === tid);
      if (t) {
        const c: Comment = { id: `c-${Date.now()}`, userId: state.currentUser.id, userName: state.currentUser.name, text, timestamp: new Date().toISOString() };
        const ut = { ...t, comments: [...t.comments, c] };
        await dbService.add('tasks', ut);
        setState(produce(draft => { draft.tasks = draft.tasks.map(x => x.id === tid ? ut : x); }));
      }
  };

  const bulkCompleteTasks = async (taskIds: string[], action: 'approve' | 'reject') => {
      for (const id of taskIds) {
          await completeTask(id, action, `Bulk ${action} applied.`);
      }
      addNotification('success', `Bulk action processed for ${taskIds.length} tasks.`);
  };

  const toggleTaskStar = async (taskId: string) => {
      const t = state.tasks.find(t => t.id === taskId);
      if(t) {
          const ut = { ...t, isStarred: !t.isStarred };
          await dbService.add('tasks', ut);
          setState(produce(draft => { draft.tasks = draft.tasks.map(x => x.id === taskId ? ut : x); }));
      }
  };

  const snoozeTask = async (taskId: string, until: string) => {
      const t = state.tasks.find(t => t.id === taskId);
      if(t) {
          const ut = { ...t, snoozeUntil: until };
          await dbService.add('tasks', ut);
          setState(produce(draft => { draft.tasks = draft.tasks.map(x => x.id === taskId ? ut : x); }));
          addNotification('info', 'Task snoozed.');
      }
  };

  const createAdHocTask = async (title: string, priority: TaskPriority = TaskPriority.MEDIUM) => {
      if(!state.currentUser) return;
      const newTask: Task = {
          id: `task-adhoc-${Date.now()}`,
          title,
          processName: 'Ad-Hoc',
          processInstanceId: 'adhoc',
          assignee: state.currentUser.id,
          candidateRoles: [], candidateGroups: [], requiredSkills: [],
          dueDate: new Date(Date.now() + 86400000).toISOString(), 
          status: TaskStatus.PENDING,
          priority,
          description: 'Quick task created by user',
          stepId: 'adhoc',
          comments: [], attachments: [], isAdHoc: true
      };
      await dbService.add('tasks', newTask);
      setState(produce(draft => { draft.tasks.unshift(newTask); }));
      addNotification('success', 'Task created');
  };

  // --- Case Methods ---
  const createCase = async (t: string, d: string) => {
    if (!state.currentUser) return 'error';
    const nc: Case = {
      id: `case-${Date.now()}`, title: t, description: d, status: 'Open', priority: TaskPriority.MEDIUM, createdAt: new Date().toISOString(),
      stakeholders: [{ userId: state.currentUser.id, role: 'Owner' }], data: {}, timeline: [{ id: 'evt-1', timestamp: new Date().toISOString(), type: 'Manual', description: 'Case opened.', author: state.currentUser.name }],
      attachments: [], policies: [], domainId: state.currentUser.domainId
    };
    await dbService.add('cases', nc);
    setState(produce(draft => { draft.cases.push(nc); }));
    addAudit('CASE_CREATE', 'Case', nc.id, `Initialized case file: ${t}`);
    return nc.id;
  };

  const updateCase = async (id: string, updates: Partial<Case>) => {
      const c = state.cases.find(x => x.id === id);
      if(c) {
          const up = { ...c, ...updates };
          await dbService.add('cases', up);
          setState(produce(draft => { draft.cases = draft.cases.map(x => x.id === id ? up : x); }));
          addAudit('CASE_UPDATE', 'Case', id, 'Updated properties');
      }
  };

  const deleteCase = async (id: string) => {
      await dbService.delete('cases', id);
      setState(produce(draft => { draft.cases = draft.cases.filter(x => x.id !== id); }));
      addNotification('info', 'Case file deleted.');
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

  const removeCaseEvent = async (caseId: string, eventId: string) => {
      const c = state.cases.find(cs => cs.id === caseId);
      if (c) {
          const updatedCase = { ...c, timeline: c.timeline.filter(e => e.id !== eventId) };
          await dbService.add('cases', updatedCase);
          setState(produce(draft => { draft.cases = draft.cases.map(x => x.id === caseId ? updatedCase : x); }));
      }
  };

  const addCasePolicy = async (caseId: string, policy: string) => {
    const c = state.cases.find(cs => cs.id === caseId);
    if (c) {
      const pol: CasePolicy = { id: `pol-${Date.now()}`, description: policy, isEnforced: true };
      const updatedCase = { ...c, policies: [...c.policies, pol] };
      await dbService.add('cases', updatedCase);
      setState(produce(draft => { draft.cases = draft.cases.map(cs => cs.id === caseId ? updatedCase : cs); }));
      addAudit('CASE_UPDATE', 'Case', caseId, 'Added policy');
    }
  };

  const removeCasePolicy = async (caseId: string, policyId: string) => {
      const c = state.cases.find(cs => cs.id === caseId);
      if (c) {
          const updatedCase = { ...c, policies: c.policies.filter(p => p.id !== policyId) };
          await dbService.add('cases', updatedCase);
          setState(produce(draft => { draft.cases = draft.cases.map(x => x.id === caseId ? updatedCase : x); }));
      }
  };

  const addCaseStakeholder = async (caseId: string, userId: string, role: string) => {
    const c = state.cases.find(cs => cs.id === caseId);
    if (c) {
      const sh: CaseStakeholder = { userId, role: role as any };
      const updatedCase = { ...c, stakeholders: [...c.stakeholders, sh] };
      await dbService.add('cases', updatedCase);
      setState(produce(draft => { draft.cases = draft.cases.map(cs => cs.id === caseId ? updatedCase : cs); }));
      addAudit('CASE_UPDATE', 'Case', caseId, `Added stakeholder: ${userId}`);
    }
  };

  const removeCaseStakeholder = async (caseId: string, userId: string) => {
      const c = state.cases.find(cs => cs.id === caseId);
      if (c) {
          const updatedCase = { ...c, stakeholders: c.stakeholders.filter(s => s.userId !== userId) };
          await dbService.add('cases', updatedCase);
          setState(produce(draft => { draft.cases = draft.cases.map(x => x.id === caseId ? updatedCase : x); }));
      }
  };

  // --- Identity Methods ---
  const createUser = async (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `u-${Date.now()}` };
    await dbService.add('users', newUser);
    setState(produce(draft => { draft.users.push(newUser); }));
    addAudit('USER_CREATE', 'User', newUser.id, `Provisioned identity: ${user.email}`);
    addNotification('success', 'Principal provisioned.');
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
      const u = state.users.find(x => x.id === id);
      if(u) {
          const up = { ...u, ...updates };
          await dbService.add('users', up);
          setState(produce(draft => { draft.users = draft.users.map(x => x.id === id ? up : x); }));
          addAudit('USER_UPDATE', 'User', id, 'Updated profile');
      }
  };

  const deleteUser = async (id: string) => {
      await dbService.delete('users', id);
      setState(produce(draft => { draft.users = draft.users.filter(x => x.id !== id); }));
      addAudit('USER_DELETE', 'User', id, 'Deprovisioned identity', 'Alert');
  };

  const createRole = async (role: Omit<UserRole, 'id'>) => {
    const newRole = { ...role, id: `role-${Date.now()}` };
    await dbService.add('roles', newRole);
    setState(produce(draft => { draft.roles.push(newRole); }));
    addAudit('ROLE_CREATE', 'System', newRole.id, `Created role: ${role.name}`);
    addNotification('success', 'Role definition created.');
  };

  const updateRole = async (id: string, updates: Partial<UserRole>) => {
      const r = state.roles.find(x => x.id === id);
      if(r) {
          const up = { ...r, ...updates };
          await dbService.add('roles', up);
          setState(produce(draft => { draft.roles = draft.roles.map(x => x.id === id ? up : x); }));
      }
  };

  const deleteRole = async (id: string) => {
      await dbService.delete('roles', id);
      setState(produce(draft => { draft.roles = draft.roles.filter(x => x.id !== id); }));
  };

  const createGroup = async (group: Omit<UserGroup, 'id'>) => {
    const newGroup = { ...group, id: `grp-${Date.now()}` };
    await dbService.add('groups', newGroup);
    setState(produce(draft => { draft.groups.push(newGroup); }));
    addAudit('GROUP_CREATE', 'System', newGroup.id, `Created group: ${group.name}`);
    addNotification('success', 'Directory group created.');
  };

  const updateGroup = async (id: string, updates: Partial<UserGroup>) => {
      const g = state.groups.find(x => x.id === id);
      if(g) {
          const up = { ...g, ...updates };
          await dbService.add('groups', up);
          setState(produce(draft => { draft.groups = draft.groups.map(x => x.id === id ? up : x); }));
      }
  };

  const deleteGroup = async (id: string) => {
      await dbService.delete('groups', id);
      setState(produce(draft => { draft.groups = draft.groups.filter(x => x.id !== id); }));
  };

  const createDelegation = async (toUserId: string, scope: 'All' | 'Critical Only') => {
    if (!state.currentUser) return;
    const newDel: Delegation = {
      id: `del-${Date.now()}`,
      fromUserId: state.currentUser.id,
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

  // --- Rules Methods ---
  const saveRule = async (r: BusinessRule) => { 
      await dbService.add('rules', r); addAudit('RULE_SAVE', 'Rule', r.id, `Updated logic: ${r.name}`); loadData(); 
  };
  const deleteRule = async (id: string) => { await dbService.delete('rules', id); loadData(); };
  const cloneRule = async (id: string) => {
      const r = state.rules.find(x => x.id === id);
      if(r) {
          const nr = { ...r, id: `rule-${Date.now()}`, name: `${r.name} (Copy)` };
          await saveRule(nr);
          addNotification('success', 'Rule cloned successfully.');
      }
  };
  const saveDecisionTable = async (t: DecisionTable) => { await dbService.add('decisionTables', t); loadData(); };
  const deleteDecisionTable = async (id: string) => { await dbService.delete('decisionTables', id); loadData(); };

  const contextValue: BPMContextType = {
    ...state,
    setGlobalSearch: (s) => setState(prev => ({ ...prev, globalSearch: s })),
    setDesignerDraft: (draft) => setState(prev => ({ ...prev, designerDraft: draft })),
    navigateTo,
    openInstanceViewer: (id) => setState(prev => ({ ...prev, viewingInstanceId: id })),
    closeInstanceViewer: () => setState(prev => ({ ...prev, viewingInstanceId: null })),
    switchUser: (id) => {
      const u = state.users.find(u => u.id === id);
      if (u) { setState(prev => ({ ...prev, currentUser: u })); navigateTo('dashboard'); }
    },
    addNotification, removeNotification,
    executeRules, // EXPOSED FOR TESTING AND RUNTIME
    deployProcess, updateProcess, deleteProcess, toggleProcessState,
    startProcess, suspendInstance, terminateInstance, addInstanceComment,
    completeTask, claimTask, releaseTask, reassignTask, updateTaskMetadata, addTaskComment, bulkCompleteTasks, toggleTaskStar, snoozeTask, createAdHocTask,
    createCase, updateCase, deleteCase, addCaseEvent, removeCaseEvent, addCasePolicy, removeCasePolicy, addCaseStakeholder, removeCaseStakeholder,
    createUser, updateUser, deleteUser, createRole, updateRole, deleteRole, createGroup, updateGroup, deleteGroup,
    createDelegation, revokeDelegation,
    saveRule, deleteRule, cloneRule, saveDecisionTable, deleteDecisionTable,
    hasPermission,
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
