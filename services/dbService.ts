
import { 
  ProcessDefinition, ProcessInstance, Task, TaskStatus, TaskPriority, 
  User, UserRole, UserGroup, Permission, BusinessRule, DecisionTable, Case, FormDefinition
} from '../types';

const DB_NAME = 'NexFlowEnterpriseDB';
const DB_VERSION = 5; // Bumped version for new store

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

class DBService {
  private db: IDBDatabase | null = null;
  // Added 'forms' to stores
  private stores = ['processes', 'instances', 'tasks', 'auditLogs', 'users', 'roles', 'groups', 'delegations', 'rules', 'decisionTables', 'cases', 'forms'];

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
    
    // Seed Rules & Tables & Forms
    for (const r of MOCK_RULES) await this.add('rules', r);
    for (const t of MOCK_TABLES) await this.add('decisionTables', t);
    for (const f of MOCK_FORMS) await this.add('forms', f);
    
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
