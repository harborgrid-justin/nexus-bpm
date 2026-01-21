
import { produce } from 'immer';

export interface SyncAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

const STORAGE_KEY = 'nexflow_sync_queue';

class SyncService {
  private queue: SyncAction[] = [];
  private isOnline: boolean = navigator.onLine;
  private listeners: ((queue: SyncAction[], isOnline: boolean) => void)[] = [];

  constructor() {
    this.loadQueue();
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notify();
      this.processQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notify();
    });
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load sync queue', e);
    }
  }

  private saveQueue() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    this.notify();
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.queue, this.isOnline));
  }

  public subscribe(callback: (queue: SyncAction[], isOnline: boolean) => void) {
    this.listeners.push(callback);
    callback(this.queue, this.isOnline);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  public enqueue(type: string, payload: any) {
    const action: SyncAction = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      payload,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };
    this.queue.push(action);
    this.saveQueue();
    
    if (this.isOnline) {
      this.processQueue();
    }
  }

  public async processQueue() {
    if (!this.isOnline || this.queue.length === 0) return;

    const pending = this.queue.filter(q => q.status === 'pending');
    
    for (const action of pending) {
      // Optimistic update status
      this.queue = this.queue.map(q => q.id === action.id ? { ...q, status: 'syncing' } : q);
      this.notify();

      try {
        // Simulate API call with latency
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // In a real app, you would switch/case on action.type and call actual API
        console.log(`[SyncService] Processed ${action.type}`, action.payload);

        // Remove successful action
        this.queue = this.queue.filter(q => q.id !== action.id);
        this.saveQueue();
        
      } catch (error) {
        console.error('Sync failed', error);
        this.queue = this.queue.map(q => 
          q.id === action.id 
            ? { ...q, status: 'failed', retryCount: q.retryCount + 1 } 
            : q
        );
        this.saveQueue();
      }
    }
  }

  public clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  public getQueueSize() {
    return this.queue.length;
  }
}

export const syncService = new SyncService();
