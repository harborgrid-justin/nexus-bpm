
import { 
  ProcessDefinition, ProcessInstance, Task, TaskStatus, TaskPriority, 
  User, UserRole, UserGroup, Permission, BusinessRule, DecisionTable, Case
} from '../types';

const DB_NAME = 'NexFlowEnterpriseDB';
const DB_VERSION = 4; // Incremented to 4 to include the 'cases' store

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
