
export enum TaskStatus {
  PENDING = 'Pending',
  CLAIMED = 'Claimed',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum Permission {
  PROCESS_VIEW = 'process:view',
  PROCESS_DEPLOY = 'process:deploy',
  PROCESS_START = 'process:start',
  TASK_COMPLETE = 'task:complete',
  TASK_OVERRIDE = 'task:override',
  ADMIN_ACCESS = 'admin:access',
  USER_MANAGE = 'user:manage',
  SYSTEM_CONFIG = 'system:config',
  CASE_MANAGE = 'case:manage',
  RULES_MANAGE = 'rules:manage',
  ANALYTICS_VIEW_ALL = 'analytics:view_all'
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface UserGroup {
  id: string;
  name: string;
  parentGroupId?: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roleIds: string[];
  groupIds: string[];
  skills: string[];
  location: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  delegateToId?: string; 
  lastLogin?: string;
  domainId: string;
}

export interface Delegation {
  id: string;
  fromUserId: string;
  toUserId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  scope: 'All' | 'Critical Only';
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'internal' | 'external-link';
  size?: number;
  uploadDate: string;
  url?: string; // For external CMIS links
}

export interface Task {
  id:string;
  title: string;
  processName: string; // "Ad-Hoc" if case task
  processInstanceId: string; // or caseId
  assignee: string; 
  candidateRoles: string[]; 
  candidateGroups: string[];
  requiredSkills: string[];
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  description?: string;
  stepId: string; // or 'adhoc'
  data?: any;
  comments: Comment[];
  attachments: Attachment[];
  isAdHoc: boolean;
  caseId?: string;
}

export type ProcessStepType = 
  // --- CORE ---
  | 'start' | 'end' | 'user-task' | 'service-task' | 'sub-process' | 'script-task'
  // --- GATEWAYS ---
  | 'exclusive-gateway' | 'parallel-gateway' | 'inclusive-gateway' | 'complex-gateway' | 'event-gateway'
  // --- EVENTS ---
  | 'timer-event' | 'message-event' | 'signal-event' | 'error-event' | 'escalation-event' | 'compensation-event'
  // --- COMMUNICATION ---
  | 'email-send' | 'slack-post' | 'teams-message' | 'sms-twilio' | 'whatsapp-msg' | 'push-notification' | 'sendgrid-email' | 'mailchimp-add'
  // --- DOCUMENTS ---
  | 'pdf-generate' | 'doc-sign' | 'ocr-extract' | 's3-upload' | 'gdrive-save' | 'sharepoint-store' | 'dropbox-save' | 'template-render'
  // --- CRM & SALES ---
  | 'salesforce-create' | 'salesforce-update' | 'hubspot-add' | 'zoho-lead' | 'pipedrive-deal' | 'dynamics-record' | 'zendesk-ticket' | 'intercom-msg'
  // --- DEV TOOLS ---
  | 'jira-issue' | 'github-pr' | 'gitlab-merge' | 'bitbucket-commit' | 'trello-card' | 'asana-task' | 'linear-issue' | 'pagerduty-alert'
  // --- CLOUD INFRA ---
  | 'aws-lambda' | 'azure-func' | 'gcp-function' | 'kubernetes-job' | 'vm-provision' | 'db-provision' | 'dns-update' | 'cdn-purge'
  // --- DATA & INTEGRATION ---
  | 'sql-query' | 'rest-api' | 'graphql-query' | 'soap-call' | 'kafka-publish' | 'rabbit-mq' | 'ftp-upload' | 'csv-parse' | 'xml-transform' | 'json-map'
  // --- AI & ML ---
  | 'ai-text-gen' | 'ai-summarize' | 'ai-sentiment' | 'ai-vision' | 'ai-translate' | 'ai-classify' | 'automl-predict' | 'vector-embed'
  // --- FINANCE ---
  | 'stripe-charge' | 'paypal-payout' | 'quickbooks-invoice' | 'xero-bill' | 'sap-posting' | 'oracle-ledger' | 'expensify-report'
  // --- LOGIC & RULES ---
  | 'business-rule' | 'decision-table' | 'wait-state' | 'terminate-end' | 'loop-container';


export interface ProcessStep {
  id: string;
  name: string;
  type: ProcessStepType;
  description: string;
  role?: string; 
  groupId?: string; 
  requiredSkills?: string[];
  laneId?: string;
  slaDays?: number;
  nextStepIds?: string[];
  position?: { x: number; y: number };
  isCollapsed?: boolean;
  data?: Record<string, any>; // For custom component properties
}

export interface ProcessLink {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  condition?: string;
}

export interface Swimlane {
  id: string;
  name: string;
  height: number;
}

export interface ProcessDefinition {
  id: string;
  name: string;
  description: string;
  steps: ProcessStep[];
  links?: ProcessLink[];
  lanes?: Swimlane[];
  createdAt: string;
  deployedBy: string;
  version: number;
  isActive: boolean;
  complianceLevel: 'Standard' | 'Strict' | 'Critical';
  history?: { timestamp: string; author: string; message: string }[];
  domainId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entityType: 'Process' | 'Task' | 'Instance' | 'System' | 'User' | 'Case' | 'Rule';
  entityId: string;
  details: string;
  severity: 'Info' | 'Warning' | 'Alert';
}

export interface TaskHistory {
  id: string;
  stepName: string;
  action: string;
  performer: string;
  timestamp: string;
  comments?: string;
}

export interface ProcessInstance {
  id: string;
  definitionId: string;
  definitionName: string;
  status: 'Active' | 'Completed' | 'Terminated' | 'Suspended';
  activeStepIds: string[];
  startDate: string;
  endDate?: string;
  dueDate?: string;
  variables: Record<string, any>;
  priority: TaskPriority;
  history: TaskHistory[];
  comments: Comment[];
  complianceVerified: boolean;
  domainId: string; 
}

// ---- ADAPTIVE CASE MANAGEMENT ----
export interface CaseStakeholder {
  userId: string;
  role: 'Owner' | 'Consultant' | 'Approver' | 'Auditor';
}
export interface CaseEvent {
  id: string;
  timestamp: string;
  type: 'Manual' | 'System' | 'Task Completion';
  description: string;
  author: string;
}
export interface CasePolicy {
  id: string;
  description: string;
  isEnforced: boolean;
}
export interface Case {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Pending Review' | 'Resolved' | 'Closed';
  priority: TaskPriority;
  createdAt: string;
  resolvedAt?: string;
  stakeholders: CaseStakeholder[];
  data: Record<string, any>;
  timeline: CaseEvent[];
  policies: CasePolicy[];
  attachments: Attachment[];
  domainId: string;
}

// ---- BUSINESS RULES ENGINE ----
export interface RuleCondition {
  id: string;
  fact: string; // e.g., 'task.priority'
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
  value: any;
}

export type Condition = RuleCondition | ConditionGroup;

export interface ConditionGroup {
  id: string;
  type: 'AND' | 'OR';
  children: Condition[];
}

export interface RuleAction {
  type: 'SET_VARIABLE' | 'SEND_NOTIFICATION' | 'ROUTE_TO';
  params: Record<string, any>;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  conditions: ConditionGroup;
  action: RuleAction;
  priority: number; // For execution order
}

export interface DecisionTable {
  id: string;
  name: string;
  inputs: string[]; // Fact names
  outputs: string[]; // Action param names
  rules: (string | number)[][]; // Matrix of values
}

// ---- ANALYTICS & GOVERNANCE ----
export interface AlertRule {
  id: string;
  name: string;
  condition: RuleCondition;
  notifyUserId: string;
  cooldownMinutes: number;
}


export type ViewState = 
  | 'dashboard' 
  | 'inbox' 
  | 'explorer' 
  | 'processes' 
  | 'designer' 
  | 'analytics' 
  | 'governance' 
  | 'settings' 
  | 'identity' 
  | 'instance-viewer'
  | 'cases'
  | 'case-viewer'
  | 'rules';
