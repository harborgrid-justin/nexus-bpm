
import { TaskPriority } from './types';

// --- Rule 12: Centralized Date Formatting ---
export const formatDate = (dateString: string | undefined, includeTime = false): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return date.toLocaleDateString(undefined, options);
};

// --- Rule 13: Currency Standardization ---
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
};

// --- Rule 19: Export Logic Centralization ---
export const exportToCSV = <T extends Record<string, any>>(data: T[], filename: string, columns?: (keyof T)[]) => {
  if (!data.length) return;
  
  const headers = columns ? (columns as string[]) : Object.keys(data[0]);
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const val = row[header];
      // Escape quotes and handle objects
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`; 
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// --- Rule 16: Task Sorting Strategy ---
export const sortEntities = <T>(data: T[], key: keyof T, direction: 'asc' | 'desc'): T[] => {
  return [...data].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    
    if (valA === valB) return 0;
    
    // Handle Dates
    const timeA = new Date(String(valA)).getTime();
    const timeB = new Date(String(valB)).getTime();
    if (!isNaN(timeA) && !isNaN(timeB)) {
       return direction === 'asc' ? timeA - timeB : timeB - timeA;
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// --- Rule 14: SLA Calculation Logic ---
export interface SLAMetrics {
  timeLeft: string;
  status: 'safe' | 'warn' | 'breach';
  isOverdue: boolean;
}

export const calculateSLA = (dueDate: string): SLAMetrics => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  if (diffMs < 0) {
    return {
      timeLeft: `${Math.abs(diffHours)}h overdue`,
      status: 'breach',
      isOverdue: true
    };
  }
  
  if (diffHours < 24) {
    return {
      timeLeft: `${diffHours}h left`,
      status: 'warn',
      isOverdue: false
    };
  }
  
  return {
    timeLeft: `${Math.ceil(diffHours / 24)}d left`,
    status: 'safe',
    isOverdue: false
  };
};

export const getPriorityColor = (p: TaskPriority) => {
  switch (p) {
    case TaskPriority.CRITICAL: return 'rose';
    case TaskPriority.HIGH: return 'amber';
    case TaskPriority.MEDIUM: return 'blue';
    default: return 'slate';
  }
};
