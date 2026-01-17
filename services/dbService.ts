
import { 
  ProcessDefinition, ProcessInstance, Task, TaskStatus, TaskPriority, 
  User, UserRole, UserGroup, Permission, BusinessRule, DecisionTable, Case
} from '../types';

const DB_NAME = 'NexFlowEnterpriseDB';
const DB_VERSION = 4;

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
      { id: 'start', name: 'Initiate Request', type: 'start', description: 'Request created', nextStepIds: ['manager-rev'], position: { x: 50, y: 100 } },
      { id: 'manager-rev', name: 'Managerial Review', type: 'user-task', role: 'manager', description: 'Immediate supervisor review', nextStepIds: ['fin-check'], position: { x: 300, y: 100 }, requiredSkills: ['Leadership'] },
      { id: 'fin-check', name: 'Finance Integrity Check', type: 'user-task', groupId: 'finance-dept', description: 'Controller verification', nextStepIds: ['pay-proc'], position: { x: 300, y: 300 }, requiredSkills: ['Accounting'] },
      { id: 'pay-proc', name: 'Auto-Disbursement', type: 'service-task', description: 'SAP ERP Integration', nextStepIds: ['end'], position: { x: 600, y: 300 } },
      { id: 'end', name: 'Settlement Finalized', type: 'end', description: 'Process Archive', nextStepIds: [], position: { x: 900, y: 300 } }
    ],
    links: [
      { id: 'l1', sourceId: 'start', targetId: 'manager-rev' },
      { id: 'l2', sourceId: 'manager-rev', targetId: 'fin-check' },
      { id: 'l3', sourceId: 'fin-check', targetId: 'pay-proc' },
      { id: 'l4', sourceId: 'pay-proc', targetId: 'end' }
    ]
  }
];

// --- 50 BUSINESS RULES ---
export const MOCK_RULES: BusinessRule[] = [
  // FINANCE & PROCUREMENT
  {
    id: 'rule-fin-001', name: 'High Value CAPEX', description: 'Route expenses > $50k to CFO', priority: 1,
    conditions: { id: 'g1', type: 'AND', children: [{ id: 'c1', fact: 'request.amount', operator: 'gt', value: 50000 }] },
    action: { type: 'ROUTE_TO', params: { role: 'CFO' } }
  },
  {
    id: 'rule-fin-002', name: 'Auto-Approve Software', description: 'Auto-approve software under $500', priority: 2,
    conditions: { id: 'g2', type: 'AND', children: [{ id: 'c2', fact: 'category', operator: 'eq', value: 'Software' }, { id: 'c3', fact: 'amount', operator: 'lt', value: 500 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'autoApproved', value: true } }
  },
  {
    id: 'rule-fin-003', name: 'Vendor Risk Check', description: 'Flag new vendors for audit', priority: 3,
    conditions: { id: 'g3', type: 'AND', children: [{ id: 'c4', fact: 'vendor.isNew', operator: 'eq', value: true }] },
    action: { type: 'ROUTE_TO', params: { group: 'risk-compliance' } }
  },
  {
    id: 'rule-fin-004', name: 'Travel Policy EU', description: 'Business class allowed for EU flights > 6h', priority: 4,
    conditions: { id: 'g4', type: 'AND', children: [{ id: 'c5', fact: 'flight.duration', operator: 'gt', value: 6 }, { id: 'c6', fact: 'destination.region', operator: 'eq', value: 'EU' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'classAllowed', value: 'Business' } }
  },
  {
    id: 'rule-fin-005', name: 'Invoice Variance', description: 'Alert if invoice exceeds PO by 10%', priority: 5,
    conditions: { id: 'g5', type: 'AND', children: [{ id: 'c7', fact: 'invoice.variancePct', operator: 'gt', value: 10 }] },
    action: { type: 'SEND_NOTIFICATION', params: { template: 'variance_alert' } }
  },
  {
    id: 'rule-fin-006', name: 'Tax Haven Check', description: 'Block payments to high-risk jurisdictions', priority: 1,
    conditions: { id: 'g6', type: 'OR', children: [{ id: 'c8', fact: 'vendor.country', operator: 'eq', value: 'Cayman' }, { id: 'c9', fact: 'vendor.country', operator: 'eq', value: 'Panama' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'complianceBlock', value: true } }
  },
  {
    id: 'rule-fin-007', name: 'Q4 Budget Freeze', description: 'Route all non-essential spend to CEO in Q4', priority: 2,
    conditions: { id: 'g7', type: 'AND', children: [{ id: 'c10', fact: 'date.quarter', operator: 'eq', value: 4 }, { id: 'c11', fact: 'category', operator: 'neq', value: 'Utility' }] },
    action: { type: 'ROUTE_TO', params: { user: 'ceo@nexflow.com' } }
  },
  {
    id: 'rule-fin-008', name: 'Duplicate Invoice', description: 'Detect potential duplicate invoice IDs', priority: 1,
    conditions: { id: 'g8', type: 'AND', children: [{ id: 'c12', fact: 'invoice.isDuplicate', operator: 'eq', value: true }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'status', value: 'Rejected' } }
  },
  {
    id: 'rule-fin-009', name: 'Petty Cash Limit', description: 'Reject petty cash requests > $100', priority: 5,
    conditions: { id: 'g9', type: 'AND', children: [{ id: 'c13', fact: 'type', operator: 'eq', value: 'PettyCash' }, { id: 'c14', fact: 'amount', operator: 'gt', value: 100 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'valid', value: false } }
  },
  {
    id: 'rule-fin-010', name: 'Contract Renewal', description: 'Notify Legal 60 days before expiry', priority: 4,
    conditions: { id: 'g10', type: 'AND', children: [{ id: 'c15', fact: 'contract.daysToExpiry', operator: 'lt', value: 60 }] },
    action: { type: 'SEND_NOTIFICATION', params: { group: 'Legal' } }
  },

  // HR & ONBOARDING
  {
    id: 'rule-hr-001', name: 'Exec Onboarding', description: 'Assign VIP IT kit for VP+', priority: 2,
    conditions: { id: 'g11', type: 'AND', children: [{ id: 'c16', fact: 'candidate.level', operator: 'contains', value: 'VP' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'equipmentProfile', value: 'Executive' } }
  },
  {
    id: 'rule-hr-002', name: 'Remote Work Stipend', description: 'Grant $500 for fully remote employees', priority: 3,
    conditions: { id: 'g12', type: 'AND', children: [{ id: 'c17', fact: 'contract.location', operator: 'eq', value: 'Remote' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'stipend', value: 500 } }
  },
  {
    id: 'rule-hr-003', name: 'Visa Sponsorship', description: 'Trigger legal review for sponsorship', priority: 1,
    conditions: { id: 'g13', type: 'AND', children: [{ id: 'c18', fact: 'candidate.needsVisa', operator: 'eq', value: true }] },
    action: { type: 'ROUTE_TO', params: { group: 'immigration-legal' } }
  },
  {
    id: 'rule-hr-004', name: 'Probation Extension', description: 'Extend probation if rating < 3', priority: 3,
    conditions: { id: 'g14', type: 'AND', children: [{ id: 'c19', fact: 'review.rating', operator: 'lt', value: 3 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'probationExtendMonths', value: 3 } }
  },
  {
    id: 'rule-hr-005', name: 'Engineering Laptop', description: 'Assign MacBook Pro to Devs', priority: 5,
    conditions: { id: 'g15', type: 'AND', children: [{ id: 'c20', fact: 'dept', operator: 'eq', value: 'Engineering' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'hardware', value: 'MacBook Pro 16' } }
  },
  {
    id: 'rule-hr-006', name: 'Exit Interview', description: 'Schedule interview for voluntary exits', priority: 4,
    conditions: { id: 'g16', type: 'AND', children: [{ id: 'c21', fact: 'termination.type', operator: 'eq', value: 'Voluntary' }] },
    action: { type: 'SEND_NOTIFICATION', params: { recipient: 'hr-bp' } }
  },
  {
    id: 'rule-hr-007', name: 'Referral Bonus', description: 'Calculate referral bonus based on level', priority: 3,
    conditions: { id: 'g17', type: 'AND', children: [{ id: 'c22', fact: 'source', operator: 'eq', value: 'Referral' }, { id: 'c23', fact: 'level', operator: 'gt', value: 4 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'bonus', value: 2000 } }
  },
  {
    id: 'rule-hr-008', name: 'Maternity Leave', description: 'Validate tenure > 1 year for full pay', priority: 2,
    conditions: { id: 'g18', type: 'AND', children: [{ id: 'c24', fact: 'tenure.years', operator: 'gt', value: 1 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'payGrade', value: 'Full' } }
  },
  {
    id: 'rule-hr-009', name: 'Background Check', description: 'Required for Finance & Security roles', priority: 1,
    conditions: { id: 'g19', type: 'OR', children: [{ id: 'c25', fact: 'dept', operator: 'eq', value: 'Finance' }, { id: 'c26', fact: 'dept', operator: 'eq', value: 'Security' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'bgCheckRequired', value: true } }
  },
  {
    id: 'rule-hr-010', name: 'Training Overdue', description: 'Lock access if compliance training overdue > 7 days', priority: 1,
    conditions: { id: 'g20', type: 'AND', children: [{ id: 'c27', fact: 'training.daysOverdue', operator: 'gt', value: 7 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'accountStatus', value: 'Locked' } }
  },

  // SALES & CRM
  {
    id: 'rule-sales-001', name: 'Hot Lead Scoring', description: 'Score > 80 if C-Level and Budget > 10k', priority: 2,
    conditions: { id: 'g21', type: 'AND', children: [{ id: 'c28', fact: 'lead.title', operator: 'contains', value: 'C-' }, { id: 'c29', fact: 'lead.budget', operator: 'gt', value: 10000 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'leadScore', value: 90 } }
  },
  {
    id: 'rule-sales-002', name: 'Enterprise Discount', description: 'Max discount 15% without VP approval', priority: 1,
    conditions: { id: 'g22', type: 'AND', children: [{ id: 'c30', fact: 'deal.discount', operator: 'gt', value: 15 }] },
    action: { type: 'ROUTE_TO', params: { role: 'VP Sales' } }
  },
  {
    id: 'rule-sales-003', name: 'Territory Assignment APAC', description: 'Assign Japan leads to APAC team', priority: 3,
    conditions: { id: 'g23', type: 'AND', children: [{ id: 'c31', fact: 'lead.country', operator: 'eq', value: 'Japan' }] },
    action: { type: 'ROUTE_TO', params: { group: 'APAC Sales' } }
  },
  {
    id: 'rule-sales-004', name: 'Churn Risk', description: 'Alert CS if usage drops 50%', priority: 1,
    conditions: { id: 'g24', type: 'AND', children: [{ id: 'c32', fact: 'usage.dropPct', operator: 'gt', value: 50 }] },
    action: { type: 'SEND_NOTIFICATION', params: { template: 'churn_alert' } }
  },
  {
    id: 'rule-sales-005', name: 'Upsell Opportunity', description: 'Flag users near storage limit', priority: 4,
    conditions: { id: 'g25', type: 'AND', children: [{ id: 'c33', fact: 'usage.storagePct', operator: 'gt', value: 90 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'upsellFlag', value: true } }
  },
  {
    id: 'rule-sales-006', name: 'Auto-Renewal', description: 'Renew if NPS > 8 and no tickets', priority: 3,
    conditions: { id: 'g26', type: 'AND', children: [{ id: 'c34', fact: 'nps', operator: 'gt', value: 8 }, { id: 'c35', fact: 'openTickets', operator: 'eq', value: 0 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'autoRenew', value: true } }
  },
  {
    id: 'rule-sales-007', name: 'Deal Stalled', description: 'Alert Manager if Stage 3 > 14 days', priority: 3,
    conditions: { id: 'g27', type: 'AND', children: [{ id: 'c36', fact: 'deal.stage', operator: 'eq', value: 'Negotiation' }, { id: 'c37', fact: 'stage.days', operator: 'gt', value: 14 }] },
    action: { type: 'SEND_NOTIFICATION', params: { recipient: 'manager' } }
  },
  {
    id: 'rule-sales-008', name: 'Partner Commission', description: 'Set 20% for Gold Partners', priority: 2,
    conditions: { id: 'g28', type: 'AND', children: [{ id: 'c38', fact: 'partner.tier', operator: 'eq', value: 'Gold' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'commissionRate', value: 0.2 } }
  },
  {
    id: 'rule-sales-009', name: 'Competitor Mention', description: 'Flag leads mentioning competitors', priority: 2,
    conditions: { id: 'g29', type: 'AND', children: [{ id: 'c39', fact: 'notes', operator: 'contains', value: 'CompetitorX' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'competitiveIntel', value: true } }
  },
  {
    id: 'rule-sales-010', name: 'Gov Contract', description: 'Require compliance review for Gov deals', priority: 1,
    conditions: { id: 'g30', type: 'AND', children: [{ id: 'c40', fact: 'sector', operator: 'eq', value: 'Government' }] },
    action: { type: 'ROUTE_TO', params: { group: 'Compliance' } }
  },

  // IT & OPS
  {
    id: 'rule-it-001', name: 'P1 Incident', description: 'Page on-call if system down', priority: 1,
    conditions: { id: 'g31', type: 'AND', children: [{ id: 'c41', fact: 'severity', operator: 'eq', value: 'P1' }] },
    action: { type: 'SEND_NOTIFICATION', params: { channel: 'pagerduty' } }
  },
  {
    id: 'rule-it-002', name: 'Auto-Scale', description: 'Scale up if CPU > 80%', priority: 1,
    conditions: { id: 'g32', type: 'AND', children: [{ id: 'c42', fact: 'cpu.load', operator: 'gt', value: 80 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'scaleAction', value: 'ScaleUp' } }
  },
  {
    id: 'rule-it-003', name: 'Access Request', description: 'Auto-grant read-only access', priority: 3,
    conditions: { id: 'g33', type: 'AND', children: [{ id: 'c43', fact: 'access.type', operator: 'eq', value: 'ReadOnly' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'approved', value: true } }
  },
  {
    id: 'rule-it-004', name: 'Password Rotation', description: 'Force reset if > 90 days', priority: 2,
    conditions: { id: 'g34', type: 'AND', children: [{ id: 'c44', fact: 'pwd.age', operator: 'gt', value: 90 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'forceReset', value: true } }
  },
  {
    id: 'rule-it-005', name: 'Data Breach Protocol', description: 'Lockdown if anomaly > 99%', priority: 1,
    conditions: { id: 'g35', type: 'AND', children: [{ id: 'c45', fact: 'anomaly.score', operator: 'gt', value: 99 }] },
    action: { type: 'ROUTE_TO', params: { group: 'SecOps' } }
  },
  {
    id: 'rule-it-006', name: 'Legacy OS', description: 'Block devices on Windows 7', priority: 1,
    conditions: { id: 'g36', type: 'AND', children: [{ id: 'c46', fact: 'device.os', operator: 'eq', value: 'Win7' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'networkAccess', value: 'Deny' } }
  },
  {
    id: 'rule-it-007', name: 'Cloud Spend', description: 'Alert if dev env > $500/mo', priority: 3,
    conditions: { id: 'g37', type: 'AND', children: [{ id: 'c47', fact: 'env', operator: 'eq', value: 'Dev' }, { id: 'c48', fact: 'cost', operator: 'gt', value: 500 }] },
    action: { type: 'SEND_NOTIFICATION', params: { recipient: 'dev-lead' } }
  },
  {
    id: 'rule-it-008', name: 'VPN Location', description: 'Flag logins from unexpected geo', priority: 2,
    conditions: { id: 'g38', type: 'AND', children: [{ id: 'c49', fact: 'geo.match', operator: 'eq', value: false }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'mfaChallenge', value: true } }
  },
  {
    id: 'rule-it-009', name: 'Software License', description: 'Reclaim license if unused 30 days', priority: 4,
    conditions: { id: 'g39', type: 'AND', children: [{ id: 'c50', fact: 'lastUsedDays', operator: 'gt', value: 30 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'reclaim', value: true } }
  },
  {
    id: 'rule-it-010', name: 'Change Management', description: 'Require CAB approval for Prod DB changes', priority: 1,
    conditions: { id: 'g40', type: 'AND', children: [{ id: 'c51', fact: 'target', operator: 'eq', value: 'ProdDB' }] },
    action: { type: 'ROUTE_TO', params: { group: 'CAB' } }
  },

  // RISK & COMPLIANCE
  {
    id: 'rule-risk-001', name: 'GDPR Data Subject', description: 'Identify PII in payloads', priority: 1,
    conditions: { id: 'g41', type: 'OR', children: [{ id: 'c52', fact: 'field', operator: 'eq', value: 'SSN' }, { id: 'c53', fact: 'field', operator: 'eq', value: 'Passport' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'isPII', value: true } }
  },
  {
    id: 'rule-risk-002', name: 'AML Threshold', description: 'Report cash transactions > 10k', priority: 1,
    conditions: { id: 'g42', type: 'AND', children: [{ id: 'c54', fact: 'trans.type', operator: 'eq', value: 'Cash' }, { id: 'c55', fact: 'amount', operator: 'gt', value: 10000 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'reportAML', value: true } }
  },
  {
    id: 'rule-risk-003', name: 'Conflict of Interest', description: 'Flag if vendor shares address with employee', priority: 2,
    conditions: { id: 'g43', type: 'AND', children: [{ id: 'c56', fact: 'vendor.address', operator: 'eq', value: 'employee.address' }] },
    action: { type: 'ROUTE_TO', params: { group: 'Internal Audit' } }
  },
  {
    id: 'rule-risk-004', name: 'Export Control', description: 'Block shipment to embargoed nations', priority: 1,
    conditions: { id: 'g44', type: 'AND', children: [{ id: 'c57', fact: 'ship.country', operator: 'eq', value: 'North Korea' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'blockShipment', value: true } }
  },
  {
    id: 'rule-risk-005', name: 'Gift Policy', description: 'Register gifts > $50', priority: 3,
    conditions: { id: 'g45', type: 'AND', children: [{ id: 'c58', fact: 'gift.value', operator: 'gt', value: 50 }] },
    action: { type: 'ROUTE_TO', params: { group: 'Compliance' } }
  },
  {
    id: 'rule-risk-006', name: 'Data Retention', description: 'Purge user data after 7 years', priority: 4,
    conditions: { id: 'g46', type: 'AND', children: [{ id: 'c59', fact: 'record.ageYears', operator: 'gt', value: 7 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'action', value: 'Purge' } }
  },
  {
    id: 'rule-risk-007', name: 'Insider Trading', description: 'Monitor trades during blackout period', priority: 1,
    conditions: { id: 'g47', type: 'AND', children: [{ id: 'c60', fact: 'period', operator: 'eq', value: 'Blackout' }, { id: 'c61', fact: 'action', operator: 'eq', value: 'Trade' }] },
    action: { type: 'SEND_NOTIFICATION', params: { recipient: 'legal-counsel' } }
  },
  {
    id: 'rule-risk-008', name: 'Supplier Audit', description: 'Audit if quality score < 90', priority: 3,
    conditions: { id: 'g48', type: 'AND', children: [{ id: 'c62', fact: 'qualityScore', operator: 'lt', value: 90 }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'auditRequired', value: true } }
  },
  {
    id: 'rule-risk-009', name: 'SoD Violation', description: 'Prevent Creator from being Approver', priority: 1,
    conditions: { id: 'g49', type: 'AND', children: [{ id: 'c63', fact: 'creator.id', operator: 'eq', value: 'approver.id' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'violation', value: true } }
  },
  {
    id: 'rule-risk-010', name: 'HIPAA Access', description: 'Log access to PHI', priority: 1,
    conditions: { id: 'g50', type: 'AND', children: [{ id: 'c64', fact: 'data.type', operator: 'eq', value: 'PHI' }] },
    action: { type: 'SET_VARIABLE', params: { variableName: 'logAccess', value: true } }
  }
];

// --- 50 DECISION TABLES ---
export const MOCK_TABLES: DecisionTable[] = [
  // CREDIT & FINANCE
  { id: 'dt-001', name: 'Credit Score Rating', inputs: ['CreditScore'], outputs: ['Rating', 'Limit'], rules: [['< 600', 'Poor', 0], ['600-700', 'Fair', 5000], ['700-800', 'Good', 15000], ['> 800', 'Excellent', 50000]] },
  { id: 'dt-002', name: 'Loan Interest Rate', inputs: ['Term', 'Score'], outputs: ['Rate'], rules: [['10yr', '>700', 3.5], ['10yr', '<700', 5.5], ['30yr', '>700', 4.5], ['30yr', '<700', 6.5]] },
  { id: 'dt-003', name: 'Expense Category Map', inputs: ['MerchantCode'], outputs: ['GLCode'], rules: [['5812', '7001-Meals'], ['3000', '7002-Travel'], ['5734', '7003-Software']] },
  { id: 'dt-004', name: 'Tax Region Rate', inputs: ['State', 'ProductType'], outputs: ['TaxRate'], rules: [['CA', 'Digital', 0], ['CA', 'Physical', 0.0725], ['NY', 'All', 0.088]] },
  { id: 'dt-005', name: 'Per Diem Rates', inputs: ['City', 'Season'], outputs: ['DailyAllowance'], rules: [['London', 'Summer', 250], ['London', 'Winter', 200], ['Tokyo', 'All', 300]] },
  { id: 'dt-006', name: 'Depreciation Sched', inputs: ['AssetType'], outputs: ['Years'], rules: [['Laptop', 3], ['Furniture', 7], ['Building', 30]] },
  { id: 'dt-007', name: 'Vendor Payment Terms', inputs: ['VendorTier'], outputs: ['NetDays'], rules: [['Strategic', 30], ['Standard', 60], ['Probation', 0]] },
  { id: 'dt-008', name: 'Bonus Multiplier', inputs: ['Performance', 'CompanyRev'], outputs: ['Multiplier'], rules: [['Exceeds', 'Target', 1.5], ['Meets', 'Target', 1.0], ['Below', 'Target', 0]] },
  { id: 'dt-009', name: 'Procurement Path', inputs: ['Amount', 'Category'], outputs: ['Process'], rules: [['<100', 'Any', 'P-Card'], ['>100', 'IT', 'PO-Req'], ['>10k', 'Any', 'RFP']] },
  { id: 'dt-010', name: 'Currency Risk', inputs: ['Pair', 'Volatility'], outputs: ['Hedging'], rules: [['USD-EUR', 'High', 'Required'], ['USD-GBP', 'Low', 'Optional']] },

  // SHIPPING & LOGISTICS
  { id: 'dt-011', name: 'Shipping Cost', inputs: ['Weight', 'Zone'], outputs: ['Cost'], rules: [['<1kg', 'Zone1', 5], ['<1kg', 'Zone2', 8], ['>10kg', 'Zone1', 20]] },
  { id: 'dt-012', name: 'Carrier Selection', inputs: ['Speed', 'Destination'], outputs: ['Carrier'], rules: [['Overnight', 'Domestic', 'FedEx'], ['Standard', 'Domestic', 'UPS'], ['Any', 'Intl', 'DHL']] },
  { id: 'dt-013', name: 'Inventory Reorder', inputs: ['Stock', 'LeadTime'], outputs: ['Action'], rules: [['<10', '>2wks', 'UrgentOrder'], ['<20', '<1wk', 'StandardOrder']] },
  { id: 'dt-014', name: 'Warehouse Bin', inputs: ['SKU_Type', 'Temp'], outputs: ['Zone'], rules: [['Food', 'Frozen', 'Freezer-A'], ['Food', 'Ambient', 'Shelf-B'], ['Elec', 'Any', 'Secure-C']] },
  { id: 'dt-015', name: 'Return Policy', inputs: ['Reason', 'DaysSince'], outputs: ['RefundType'], rules: [['Defect', 'Any', 'FullCash'], ['ChangeMind', '<30', 'StoreCredit'], ['ChangeMind', '>30', 'None']] },
  { id: 'dt-016', name: 'Hazmat Labeling', inputs: ['Class', 'Volume'], outputs: ['Label'], rules: [['Flammable', '>1L', 'Class3-Red'], ['Corrosive', 'Any', 'Class8-White']] },
  { id: 'dt-017', name: 'Duty Calculation', inputs: ['HSCode', 'Origin'], outputs: ['DutyRate'], rules: [['8517.62', 'CN', 0.25], ['8517.62', 'VN', 0], ['6109.10', 'TR', 0.12]] },
  { id: 'dt-018', name: 'Packaging Type', inputs: ['Fragility', 'Size'], outputs: ['BoxType'], rules: [['High', 'Small', 'Bubble+BoxS'], ['Low', 'Large', 'PolyBag']] },
  { id: 'dt-019', name: 'Freight Class', inputs: ['Density'], outputs: ['Class'], rules: [['>50', 50], ['30-35', 60], ['<1', 400]] },
  { id: 'dt-020', name: 'Delivery Promise', inputs: ['OrderTime', 'Stock'], outputs: ['DeliveryDate'], rules: [['<12pm', 'InStock', 'Tomorrow'], ['>12pm', 'InStock', 'DayAfter']] },

  // HR & ADMIN
  { id: 'dt-021', name: 'Leave Entitlement', inputs: ['Tenure', 'Region'], outputs: ['Days'], rules: [['<1yr', 'US', 10], ['>5yr', 'US', 20], ['Any', 'UK', 25]] },
  { id: 'dt-022', name: 'Onboarding Plan', inputs: ['Dept', 'Level'], outputs: ['PlanID'], rules: [['Eng', 'Junior', 'Bootcamp'], ['Eng', 'Senior', 'Architecture'], ['Sales', 'Any', 'SalesAcademy']] },
  { id: 'dt-023', name: 'Severance Calc', inputs: ['Years', 'Role'], outputs: ['WeeksPay'], rules: [['1', 'Any', 2], ['5', 'Exec', 26], ['10', 'Staff', 12]] },
  { id: 'dt-024', name: 'Interview Panel', inputs: ['RoleLevel'], outputs: ['Interviewers'], rules: [['L3', 'Peer+Mgr'], ['L6', 'Peer+Mgr+Dir'], ['L8', 'Peer+VP+CEO']] },
  { id: 'dt-025', name: 'Benefit Tier', inputs: ['Grade'], outputs: ['Package'], rules: [['1-3', 'Bronze'], ['4-6', 'Silver'], ['7+', 'Gold']] },
  { id: 'dt-026', name: 'Office Alloc', inputs: ['Level', 'Function'], outputs: ['Space'], rules: [['VP', 'Any', 'PrivateOffice'], ['Dir', 'Sales', 'SharedOffice'], ['Staff', 'Any', 'Cube']] },
  { id: 'dt-027', name: 'Relocation Pkg', inputs: ['Distance', 'Family'], outputs: ['Allowance'], rules: [['>500mi', 'Single', 5000], ['>500mi', 'Family', 10000]] },
  { id: 'dt-028', name: 'Visa Type', inputs: ['Citizenship', 'Dest'], outputs: ['VisaClass'], rules: [['UK', 'US', 'E-2'], ['India', 'US', 'H-1B'], ['US', 'EU', 'Schengen']] },
  { id: 'dt-029', name: 'Perf Rating', inputs: ['Score'], outputs: ['Label'], rules: [['1', 'Improvement'], ['3', 'Meets'], ['5', 'Outstanding']] },
  { id: 'dt-030', name: 'IT Access', inputs: ['Role'], outputs: ['Groups'], rules: [['Dev', 'GitHub,AWS'], ['Sales', 'Salesforce,Slack'], ['HR', 'Workday,Zoom']] },

  // MARKETING & SALES
  { id: 'dt-031', name: 'Lead Grading', inputs: ['Industry', 'EmpSize'], outputs: ['Grade'], rules: [['Tech', '>1000', 'A'], ['Retail', '<50', 'C'], ['Tech', '<50', 'B']] },
  { id: 'dt-032', name: 'Email Send Time', inputs: ['Timezone', 'Persona'], outputs: ['SendHour'], rules: [['EST', 'Exec', '6am'], ['PST', 'Dev', '10am']] },
  { id: 'dt-033', name: 'Discount Matrix', inputs: ['Product', 'Qty'], outputs: ['DiscPct'], rules: [['SaaS', '1-10', 0], ['SaaS', '11-50', 5], ['SaaS', '50+', 15]] },
  { id: 'dt-034', name: 'Territory Map', inputs: ['ZipCode'], outputs: ['Rep'], rules: [['10001', 'John Doe'], ['90210', 'Jane Smith']] },
  { id: 'dt-035', name: 'Ad Bid Strategy', inputs: ['CPC', 'ConvRate'], outputs: ['Action'], rules: [['>5', '<1%', 'Pause'], ['<2', '>2%', 'Increase']] },
  { id: 'dt-036', name: 'Churn Prediction', inputs: ['LastLogin', 'Tickets'], outputs: ['Risk'], rules: [['>30d', '>0', 'High'], ['<7d', '0', 'Low']] },
  { id: 'dt-037', name: 'Content Rec', inputs: ['Stage', 'Role'], outputs: ['Asset'], rules: [['Awareness', 'CTO', 'Whitepaper'], ['Decision', 'CFO', 'ROI_Calc']] },
  { id: 'dt-038', name: 'Event Invite', inputs: ['Location', 'Title'], outputs: ['Invite'], rules: [['NYC', 'VP', 'VIP_Dinner'], ['SF', 'Dev', 'Hackathon']] },
  { id: 'dt-039', name: 'SDR Assignment', inputs: ['Source', 'Score'], outputs: ['Team'], rules: [['Inbound', '>50', 'RapidResponse'], ['Outbound', 'Any', 'Strategic']] },
  { id: 'dt-040', name: 'Partner Tier', inputs: ['Revenue'], outputs: ['Level'], rules: [['>1M', 'Platinum'], ['>100k', 'Gold'], ['<100k', 'Silver']] },

  // COMPLIANCE & LEGAL
  { id: 'dt-041', name: 'KYC Risk', inputs: ['Country', 'PEP'], outputs: ['RiskLevel'], rules: [['US', 'No', 'Low'], ['Iran', 'Any', 'Prohibited'], ['Any', 'Yes', 'High']] },
  { id: 'dt-042', name: 'Data Retention', inputs: ['DataType'], outputs: ['Years'], rules: [['Tax', 7], ['Contract', 10], ['ChatLog', 1]] },
  { id: 'dt-043', name: 'Incident Sev', inputs: ['Impact', 'Urgency'], outputs: ['Priority'], rules: [['High', 'High', 'P1'], ['Low', 'Low', 'P4']] },
  { id: 'dt-044', name: 'Approval Matrix', inputs: ['Dept', 'Amount'], outputs: ['Approver'], rules: [['IT', '>50k', 'CIO'], ['Sales', '>10k', 'CRO']] },
  { id: 'dt-045', name: 'Contract Type', inputs: ['Value', 'Term'], outputs: ['Template'], rules: [['<10k', '<1yr', 'Standard_MSA'], ['>1M', 'Any', 'Custom_Enterprise']] },
  { id: 'dt-046', name: 'GDPR Action', inputs: ['Request', 'Region'], outputs: ['ResponseTime'], rules: [['Deletion', 'EU', '30days'], ['Access', 'CA', '45days']] },
  { id: 'dt-047', name: 'Password Policy', inputs: ['Privilege'], outputs: ['Complexity'], rules: [['Admin', '20char+MFA'], ['User', '12char']] },
  { id: 'dt-048', name: 'Audit Freq', inputs: ['RiskScore'], outputs: ['Months'], rules: [['High', 3], ['Med', 12], ['Low', 24]] },
  { id: 'dt-049', name: 'Insurance Req', inputs: ['VendorType'], outputs: ['LiabilityAmt'], rules: [['Construction', '5M'], ['Consultant', '1M']] },
  { id: 'dt-050', name: 'Signature Authority', inputs: ['Title'], outputs: ['Limit'], rules: [['CEO', 'Unlimited'], ['VP', '100k'], ['Director', '10k']] }
];

class DBService {
  private db: IDBDatabase | null = null;
  // Centralized list of all object stores to prevent desync errors
  private stores = ['processes', 'instances', 'tasks', 'auditLogs', 'users', 'roles', 'groups', 'delegations', 'rules', 'decisionTables', 'cases'];

  private notify(action: string, detail: any, type: 'read' | 'write' | 'delete' | 'error' = 'read') {
    const event = new CustomEvent('nexflow-db-log', {
      detail: { action, detail, type }
    });
    window.dispatchEvent(event);
  }

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.stores.forEach(s => {
          if (!db.objectStoreNames.contains(s)) {
            db.createObjectStore(s, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        this.notify('DB_OPEN_ERROR', error?.message, 'error');
        reject(error);
      };
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => {
          this.notify('READ_ALL', `Fetched ${request.result.length} from ${storeName}`);
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
      } catch (e) {
        this.notify('TRANSACTION_ERROR', (e as Error).message, 'error');
        reject(e);
      }
    });
  }

  async add<T>(storeName: string, item: T): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = () => {
          this.notify('WRITE', `Saved to ${storeName}`, 'write');
          resolve();
        };
        request.onerror = () => reject(request.error);
      } catch (e) {
        this.notify('TRANSACTION_ERROR', (e as Error).message, 'error');
        reject(e);
      }
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => {
          this.notify('DELETE', `Removed ${id} from ${storeName}`, 'delete');
          resolve();
        };
        request.onerror = () => reject(request.error);
      } catch (e) {
        this.notify('TRANSACTION_ERROR', (e as Error).message, 'error');
        reject(e);
      }
    });
  }

  async clearStore(storeName: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async reseed(): Promise<void> {
    for (const s of this.stores) await this.clearStore(s);

    for (const r of MOCK_ROLES) await this.add('roles', r);
    for (const g of MOCK_GROUPS) await this.add('groups', g);
    for (const u of MOCK_USERS) await this.add('users', u);
    for (const p of MOCK_PROCESSES) await this.add('processes', p);
    
    // Seed Rules & Tables
    for (const r of MOCK_RULES) await this.add('rules', r);
    for (const t of MOCK_TABLES) await this.add('decisionTables', t);
    
    this.notify('RESEED', 'System reseeded with baseline mocks', 'write');
  }

  async resetDB(): Promise<void> {
    if (this.db) { this.db.close(); this.db = null; }
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async exportData(): Promise<string> {
    const dump: any = { timestamp: new Date().toISOString(), data: {} };
    for (const s of this.stores) dump.data[s] = await this.getAll(s);
    return JSON.stringify(dump, null, 2);
  }

  async importData(jsonString: string): Promise<void> {
    const parsed = JSON.parse(jsonString);
    for (const s of this.stores) {
      await this.clearStore(s);
      if (parsed.data && parsed.data[s]) {
        for (const item of parsed.data[s]) await this.add(s, item);
      }
    }
  }
}

export const dbService = new DBService();
