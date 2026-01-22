
import { 
  ProcessDefinition, ProcessInstance, Task, AuditLog, 
  User, UserRole, UserGroup, Delegation, BusinessRule, DecisionTable, Case, FormDefinition, Integration, ApiClient, SystemSettings, SavedView
} from '../types';
import { 
  MOCK_ROLES, MOCK_GROUPS, MOCK_USERS, MOCK_PROCESSES, MOCK_RULES, MOCK_TABLES, 
  MOCK_FORMS, MOCK_INTEGRATIONS, MOCK_API_CLIENTS, DEFAULT_SETTINGS, MOCK_VIEWS 
} from '../data/seeds';

export { DEFAULT_SETTINGS };

const DB_NAME = 'NexFlowEnterpriseDB';
const DB_VERSION = 9;

class DBService {
  private db: IDBDatabase | null = null;
  private stores = ['processes', 'instances', 'tasks', 'auditLogs', 'users', 'roles', 'groups', 'delegations', 'rules', 'decisionTables', 'cases', 'forms', 'integrations', 'apiClients', 'systemSettings', 'savedViews'];

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

  // --- ATOMIC AUDIT TRANSACTION ---
  async auditTransaction<T>(storeName: string, item: T, auditEntry: AuditLog): Promise<void> {
      const db = await this.open();
      return new Promise((resolve, reject) => {
          try {
              // Open transaction spanning both the target store AND auditLogs
              const transaction = db.transaction([storeName, 'auditLogs'], 'readwrite');
              
              transaction.oncomplete = () => {
                  this.notify('TX_COMMIT', `Updated ${storeName} + Audit Log`, 'write');
                  resolve();
              };
              
              transaction.onerror = (e) => {
                  this.notify('TX_ROLLBACK', (e.target as any).error?.message, 'error');
                  reject((e.target as any).error);
              }

              const dataStore = transaction.objectStore(storeName);
              const auditStore = transaction.objectStore('auditLogs');

              dataStore.put(item);
              auditStore.add(auditEntry);

          } catch (e) {
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
    
    // Seed Rules & Tables & Forms & Integrations & Settings
    for (const r of MOCK_RULES) await this.add('rules', r);
    for (const t of MOCK_TABLES) await this.add('decisionTables', t);
    for (const f of MOCK_FORMS) await this.add('forms', f);
    for (const i of MOCK_INTEGRATIONS) await this.add('integrations', i);
    for (const c of MOCK_API_CLIENTS) await this.add('apiClients', c);
    
    await this.add('systemSettings', DEFAULT_SETTINGS);
    for (const v of MOCK_VIEWS) await this.add('savedViews', v);
    
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
