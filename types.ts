
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

export interface ToolbarAction {
  label: string;
  action?: () => void;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
}

export interface ToolbarConfig {
  file?: ToolbarAction[];
  edit?: ToolbarAction[];
  view?: ToolbarAction[];
  tools?: ToolbarAction[];
  help?: ToolbarAction[];
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

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  required: boolean;
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
  checklist?: ChecklistItem[]; // New
  isAdHoc: boolean;
  caseId?: string;
  triggerSource?: 'Manual' | 'Rule' | 'System' | 'Escalation';
  // New Features
  tags?: string[];
  isStarred?: boolean;
  snoozeUntil?: string;
  formId?: string; // Phase 2: Link to Form Definition
  location?: { lat: number; lng: number; address?: string }; // Phase 8: Field Ops
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

export interface IOMapping {
  source: string; // e.g. "variables.orderId" or "result.id"
  target: string; // e.g. "api.params.id" or "variables.externalId"
  transform?: string; // Optional JS one-liner
}

export interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  strategy: 'fixed' | 'exponential' | 'linear';
  delayMs: number;
}

export interface EscalationRule {
  enabled: boolean;
  daysAfterDue: number;
  action: 'notify_manager' | 'reassign' | 'auto_complete' | 'trigger_bot';
  targetId?: string; // Role ID or User ID
}

export interface StepMetrics {
  avgDuration: number; // in seconds
  errorRate: number; // percentage 0-100
  executionCount: number;
}

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
  
  // LOGIC WIRING
  businessRuleId?: string; // Bind a rule to run on entry
  onEntryAction?: string; // Script or Action
  onExitAction?: string; // Script or Action
  
  // DATA WIRING
  inputs?: IOMapping[];
  outputs?: IOMapping[];
  
  // EXECUTION POLICY
  retryPolicy?: RetryPolicy;
  escalation?: EscalationRule; // Phase 3: SLA Escalation
  metrics?: StepMetrics;       // Phase 3: Analytics Overlay
  
  isMultiInstance?: boolean;
  formId?: string; // Phase 2: Form Binding
}

export interface ProcessLink {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  condition?: string; // CEL Expression
  isDefault?: boolean;
}

export interface Swimlane {
  id: string;
  name: string;
  roleId?: string; // Auto-assign steps in this lane to this role
  height: number;
  color: 'blue' | 'slate' | 'emerald' | 'amber';
}

export interface ProcessVersionSnapshot {
  version: number;
  timestamp: string;
  author: string;
  definition: Partial<ProcessDefinition>; // Snapshot of steps/links/lanes
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
  history?: ProcessVersionSnapshot[]; // Full version history
  domainId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entityType: 'Process' | 'Task' | 'Instance' | 'System' | 'User' | 'Case' | 'Rule' | 'Form' | 'Integration';
  entityId: string;
  details: string;
  severity: 'Info' | 'Warning' | 'Alert';
}

export interface TaskHistory {
  id: string;
  stepName: string;
  stepId?: string; // Added for path tracing
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
  type: 'Manual' | 'System' | 'Task Completion' | 'Rule Trigger';
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
  version: number; // Added: v1.0
  status: 'Draft' | 'Active' | 'Deprecated'; // Added: Lifecycle
  tags: string[]; // Added: Categorization
  lastModified: string; // Added: Audit
}

export interface DecisionTable {
  id: string;
  name: string;
  inputs: string[]; // Fact names
  outputs: string[]; // Action param names
  rules: (string | number)[][]; // Matrix of values
  version: number;
  status: 'Draft' | 'Active' | 'Deprecated';
  tags: string[];
  lastModified: string;
}

// ---- FORMS ENGINE (PHASE 2 & 3) ----
export type FormFieldType = 
  | 'text' | 'number' | 'date' | 'time' | 'password' 
  | 'select' | 'checkbox' | 'textarea' | 'email' 
  | 'file' | 'signature' | 'rating' | 'slider' 
  | 'tags' | 'color' | 'rich-text' | 'divider';

export interface FormValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
  accept?: string; // For files
  maxSize?: number; // For files (bytes)
}

export interface FormVisibilityRule {
  targetFieldKey: string;
  operator: 'eq' | 'neq' | 'contains' | 'truthy' | 'falsy';
  value?: string;
}

export interface FormFieldLayout {
  width: '100%' | '50%' | '33%';
}

export interface FormFieldAppearance {
  prefix?: string;
  suffix?: string;
  icon?: string;
}

export interface FormDataSource {
  type: 'static' | 'api';
  endpoint?: string;
  labelKey?: string;
  valueKey?: string;
}

export interface FormBehavior {
  readOnly?: boolean;
  disabled?: boolean;
  calculation?: string; // e.g. "price * qty"
}

// --- ENTERPRISE FEATURE: Field Level Security (FLS) ---
export interface FieldPermission {
  roleId: string;
  access: 'read_write' | 'read_only' | 'hidden';
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  key: string; // The variable name this binds to
  placeholder?: string;
  required: boolean;
  helpText?: string;
  options?: string[]; // CSV for select options
  defaultValue?: string;
  
  // Advanced Config
  validation?: FormValidation;
  visibility?: FormVisibilityRule;
  layout?: FormFieldLayout;
  appearance?: FormFieldAppearance;
  dataSource?: FormDataSource;
  behavior?: FormBehavior;
  
  // FLS
  permissions?: FieldPermission[];
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  version: number;
  lastModified: string;
  layoutMode?: 'single' | 'wizard'; // Added for Wizard Support
}

// ---- MARKETPLACE & INTEGRATIONS (Phase 9) ----
export interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'CRM' | 'ERP' | 'Productivity' | 'AI' | 'Cloud' | 'Communication';
  iconName: string; // Lucide icon name
  provider: string;
  isInstalled: boolean;
  config?: Record<string, string>; // API Keys, URLs
  version: string;
}

// ---- API GATEWAY (Phase 10) ----
export interface ApiClient {
  id: string;
  name: string;
  clientId: string;
  status: 'Active' | 'Revoked';
  lastUsed: string;
  reqCount: number;
}

// ---- GLOBAL CONFIGURATION (Phase 2) ----
export interface SystemSettings {
  id: string; // 'global-settings'
  sso: {
    ldap: boolean;
    okta: boolean;
    workspace: boolean;
  };
  security: {
    minPasswordLength: number;
    mfaEnabled: boolean;
    sessionTimeout: number; // minutes
    geoFencing: boolean;
  };
  compliance: {
    standards: string[]; // ['SOC2', 'GDPR']
    lastAudit: string;
  };
  calendar: {
    workDays: string[];
    workHours: { start: string; end: string };
    timezone: string;
  };
}

// ---- ANALYTICS & GOVERNANCE ----
export interface AlertRule {
  id: string;
  name: string;
  condition: RuleCondition;
  notifyUserId: string;
  cooldownMinutes: number;
}

// ---- SAVED VIEWS (Enterprise Feature) ----
export interface SavedView {
  id: string;
  name: string;
  filters: {
    status?: string;
    priority?: string;
    assignee?: string;
    search?: string;
  };
  type: 'Task' | 'Case';
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
  | 'rules'
  | 'api-gateway' 
  | 'resource-planner'
  | 'forms'         
  | 'form-designer' 
  | 'marketplace'   // Phase 9
  | 'field-ops'     // Phase 8
  // --- Form Pages (Replaces Modals) ---
  | 'create-user' | 'edit-user'
  | 'create-role' | 'edit-role'
  | 'create-group' | 'edit-group'
  | 'create-delegation'
  | 'create-case' | 'edit-case'
  | 'case-policy' | 'case-stakeholder' | 'case-launch'
  | 'task-reassign' | 'task-metadata'
  | 'simulation-report'
  | 'ai-rule-gen';
