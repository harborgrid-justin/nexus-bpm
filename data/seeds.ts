
import { User, UserRole, UserGroup, Permission, ProcessDefinition, FormDefinition, BusinessRule, DecisionTable, Integration, ApiClient, SystemSettings, SavedView } from '../types';

export const MOCK_ROLES: UserRole[] = [
  { id: 'admin', name: 'Principal Administrator', permissions: Object.values(Permission) },
  { id: 'manager', name: 'Line Manager', permissions: [Permission.PROCESS_VIEW, Permission.PROCESS_START, Permission.TASK_COMPLETE] },
  { id: 'ops', name: 'Operations Associate', permissions: [Permission.PROCESS_VIEW, Permission.TASK_COMPLETE] },
  { id: 'finance', name: 'Finance Controller', permissions: [Permission.PROCESS_VIEW, Permission.TASK_COMPLETE] }
];

export const MOCK_GROUPS: UserGroup[] = [
  { id: 'hq', name: 'Global HQ', description: 'Central corporate operations' },
  { id: 'finance-dept', name: 'Finance & Accounting', description: 'Budgeting and reimbursement control', parentGroupId: 'hq' },
  { id: 'ops-dept', name: 'Supply Chain Operations', description: 'Logistics and fulfillment', parentGroupId: 'hq' }
];

export const MOCK_USERS: User[] = [
  { 
    id: 'u-1', name: 'John Doe', email: 'john.doe@nexflow.com', location: 'London', 
    roleIds: ['admin'], groupIds: ['hq'], status: 'Active', skills: ['BPMN', 'Leadership'],
    domainId: 'EUROPE-PROD'
  },
  { 
    id: 'u-2', name: 'Jane Smith', email: 'jane.smith@nexflow.com', location: 'New York', 
    roleIds: ['manager'], groupIds: ['ops-dept'], status: 'Active', skills: ['Logistics', 'Planning'],
    domainId: 'AMER-PROD'
  },
  { 
    id: 'u-3', name: 'Robert Finance', email: 'robert.f@nexflow.com', location: 'London', 
    roleIds: ['finance'], groupIds: ['finance-dept'], status: 'Active', skills: ['Accounting', 'Audit'],
    domainId: 'EUROPE-PROD'
  }
];

export const MOCK_FORMS: FormDefinition[] = [
  {
    id: 'form-expense',
    name: 'Expense Reimbursement',
    description: 'Standard travel and equipment expense claim form.',
    version: 1,
    lastModified: new Date().toISOString(),
    fields: [
      { id: 'f1', type: 'text', label: 'Expense Title', key: 'title', required: true, placeholder: 'e.g. Client Dinner' },
      { id: 'f2', type: 'number', label: 'Amount (USD)', key: 'amount', required: true, placeholder: '0.00' },
      { id: 'f3', type: 'date', label: 'Date Incurred', key: 'date', required: true },
      { id: 'f4', type: 'select', label: 'Category', key: 'category', required: true, options: ['Travel', 'Meals', 'Software', 'Equipment'] },
      { id: 'f5', type: 'textarea', label: 'Justification', key: 'reason', required: false, placeholder: 'Why was this expense necessary?' }
    ]
  },
  {
    id: 'form-onboarding',
    name: 'Employee Onboarding',
    description: 'IT provisioning and access setup for new hires.',
    version: 1,
    lastModified: new Date().toISOString(),
    fields: [
      { id: 'f1', type: 'text', label: 'Legal Name', key: 'employeeName', required: true },
      { id: 'f2', type: 'select', label: 'Department', key: 'dept', required: true, options: ['Engineering', 'Sales', 'HR', 'Finance'] },
      { id: 'f3', type: 'checkbox', label: 'Requires Laptop?', key: 'needsLaptop', required: false },
      { id: 'f4', type: 'checkbox', label: 'Requires VPN?', key: 'needsVPN', required: false },
      { id: 'f5', type: 'select', label: 'Access Level', key: 'accessLevel', required: true, options: ['Standard', 'Admin', 'ReadOnly'] }
    ]
  }
];

export const MOCK_PROCESSES: ProcessDefinition[] = [
  {
    id: 'proc-1',
    name: 'Strategic Expense Approval',
    description: 'Tiered enterprise expense approval with budget validation',
    deployedBy: 'System',
    createdAt: new Date().toISOString(),
    version: 1,
    isActive: true,
    complianceLevel: 'Strict',
    domainId: 'GLOBAL-CORE',
    steps: [
      { id: 'start', name: 'Initiate Request', type: 'start', description: 'Request created', nextStepIds: ['submit-claim'], position: { x: 50, y: 100 } },
      { id: 'submit-claim', name: 'Submit Expense', type: 'user-task', role: 'ops', description: 'Employee submits claim', formId: 'form-expense', nextStepIds: ['manager-rev'], position: { x: 250, y: 100 } },
      { id: 'manager-rev', name: 'Managerial Review', type: 'user-task', role: 'manager', description: 'Immediate supervisor review', nextStepIds: ['fin-check'], position: { x: 450, y: 100 }, requiredSkills: ['Leadership'] },
      { id: 'fin-check', name: 'Finance Integrity Check', type: 'user-task', groupId: 'finance-dept', description: 'Controller verification', nextStepIds: ['pay-proc'], position: { x: 650, y: 100 }, requiredSkills: ['Accounting'] },
      { id: 'pay-proc', name: 'Auto-Disbursement', type: 'service-task', description: 'SAP ERP Integration', nextStepIds: ['end'], position: { x: 850, y: 100 } },
      { id: 'end', name: 'Settlement Finalized', type: 'end', description: 'Process Archive', nextStepIds: [], position: { x: 1050, y: 100 } }
    ],
    links: [
      { id: 'l0', sourceId: 'start', targetId: 'submit-claim' },
      { id: 'l1', sourceId: 'submit-claim', targetId: 'manager-rev' },
      { id: 'l2', sourceId: 'manager-rev', targetId: 'fin-check' },
      { id: 'l3', sourceId: 'fin-check', targetId: 'pay-proc' },
      { id: 'l4', sourceId: 'pay-proc', targetId: 'end' }
    ]
  }
];

// Helper to create full BusinessRule
const r = (rule: Omit<BusinessRule, 'version' | 'status' | 'tags' | 'lastModified'>, tags: string[] = ['General']): BusinessRule => ({
  version: 1, status: 'Active', lastModified: new Date().toISOString(), tags, ...rule
});

// Helper to create full DecisionTable
const t = (table: Omit<DecisionTable, 'version' | 'status' | 'tags' | 'lastModified'>, tags: string[] = ['General']): DecisionTable => ({
  version: 1, status: 'Active', lastModified: new Date().toISOString(), tags, ...table
});

export const MOCK_RULES: BusinessRule[] = [
  r({
    id: 'rule-fin-001', name: 'High Value CAPEX', description: 'Route expenses > $50k to CFO', priority: 1,
    conditions: { id: 'g1', type: 'AND', children: [{ id: 'c1', fact: 'request.amount', operator: 'gt', value: 50000 }] },
    action: { type: 'ROUTE_TO', params: { role: 'CFO' } }
  }, ['Finance']),
];

export const MOCK_TABLES: DecisionTable[] = [
  t({ id: 'dt-001', name: 'Credit Score Rating', inputs: ['CreditScore'], outputs: ['Rating', 'Limit'], rules: [['< 600', 'Poor', 0], ['600-700', 'Fair', 5000], ['700-800', 'Good', 15000], ['> 800', 'Excellent', 50000]] }, ['Finance']),
];

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'int-salesforce', name: 'Salesforce CRM', description: 'Sync leads, contacts, and opportunities with Salesforce Sales Cloud.', category: 'CRM', iconName: 'Cloud', provider: 'Salesforce', isInstalled: true, version: '2.4.0', config: { instanceUrl: 'https://na1.salesforce.com' } },
  { id: 'int-slack', name: 'Slack', description: 'Send channel notifications and handle interactive approval requests.', category: 'Communication', iconName: 'MessageSquare', provider: 'Slack Technologies', isInstalled: true, version: '1.2.1' },
  { id: 'int-sap', name: 'SAP S/4HANA', description: 'Enterprise resource planning connection for financial posting.', category: 'ERP', iconName: 'Database', provider: 'SAP SE', isInstalled: false, version: '3.0.0' },
  { id: 'int-openai', name: 'OpenAI GPT-4', description: 'Enable AI-driven text summarization, sentiment analysis, and generation.', category: 'AI', iconName: 'Sparkles', provider: 'OpenAI', isInstalled: true, version: '1.0.0', config: { model: 'gpt-4' } },
  { id: 'int-aws', name: 'AWS Lambda', description: 'Invoke serverless functions as process steps.', category: 'Cloud', iconName: 'Server', provider: 'Amazon Web Services', isInstalled: false, version: '1.5.0' },
  { id: 'int-jira', name: 'Atlassian Jira', description: 'Create and update issues based on process events.', category: 'Productivity', iconName: 'CheckSquare', provider: 'Atlassian', isInstalled: false, version: '2.1.0' },
  { id: 'int-stripe', name: 'Stripe Payments', description: 'Process charges and handle subscription events.', category: 'ERP', iconName: 'CreditCard', provider: 'Stripe', isInstalled: false, version: '1.1.0' },
];

export const MOCK_API_CLIENTS: ApiClient[] = [
  { id: 'c1', name: 'CRM Integration', clientId: 'client_94a...x82', status: 'Active', lastUsed: '2 mins ago', reqCount: 14502 },
  { id: 'c2', name: 'Legacy ERP', clientId: 'client_b21...99a', status: 'Active', lastUsed: '1 hour ago', reqCount: 890 },
  { id: 'c3', name: 'Mobile App v2', clientId: 'client_77c...11b', status: 'Active', lastUsed: 'Just now', reqCount: 45200 },
  { id: 'c4', name: 'Dev Portal', clientId: 'client_test...001', status: 'Revoked', lastUsed: '2 days ago', reqCount: 120 }
];

export const DEFAULT_SETTINGS: SystemSettings = {
  id: 'global-settings',
  sso: { ldap: true, okta: false, workspace: true },
  security: { minPasswordLength: 12, mfaEnabled: true, sessionTimeout: 60, geoFencing: false },
  compliance: { standards: ['SOC2 Type II', 'GDPR / CCPA', 'HIPAA compliant'], lastAudit: new Date().toISOString() },
  calendar: { workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], workHours: { start: '09:00', end: '17:00' }, timezone: 'UTC' }
};

export const MOCK_VIEWS: SavedView[] = [
    { id: 'v1', name: 'High Priority My Tasks', type: 'Task', filters: { priority: 'High', assignee: 'u-1' } }
];
