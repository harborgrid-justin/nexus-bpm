
import { TaskPriority, FormDefinition, FormField } from './types';

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

// --- Rule 15: Centralized Form Validation ---
export const validateForm = (form: FormDefinition, data: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const isVisible = (field: FormField) => {
        if (!field.visibility) return true;
        const { targetFieldKey, operator, value } = field.visibility;
        const targetValue = data[targetFieldKey];
        
        switch (operator) {
            case 'eq': return String(targetValue) === String(value);
            case 'neq': return String(targetValue) !== String(value);
            case 'contains': return String(targetValue).includes(String(value));
            case 'truthy': return !!targetValue;
            case 'falsy': return !targetValue;
            default: return true;
        }
    };

    form.fields.forEach(field => {
        if (!isVisible(field)) return;
        if (field.behavior?.readOnly || field.behavior?.disabled) return;

        const val = data[field.key];
        const isEmpty = val === undefined || val === null || val === '';

        if (field.required && isEmpty) {
            errors[field.key] = 'This field is required.';
        }

        if (!isEmpty && field.validation) {
            const { min, max, pattern, message } = field.validation;
            
            if (field.type === 'number' || field.type === 'slider' || field.type === 'rating') {
                const num = Number(val);
                if (min !== undefined && num < min) errors[field.key] = message || `Minimum value is ${min}`;
                if (max !== undefined && num > max) errors[field.key] = message || `Maximum value is ${max}`;
            }
            if (field.type === 'text' || field.type === 'textarea' || field.type === 'password') {
                if (min !== undefined && val.length < min) errors[field.key] = message || `Minimum length is ${min}`;
                if (max !== undefined && val.length > max) errors[field.key] = message || `Maximum length is ${max}`;
            }
            if (pattern) {
                const regex = new RegExp(pattern);
                if (!regex.test(String(val))) errors[field.key] = message || 'Invalid format.';
            }
        }
    });

    return errors;
};

// --- Rule 24: Filter Predicate Builder ---
export type FilterConfig<T> = {
    [K in keyof T]?: string | number | boolean | ((val: T[K]) => boolean);
};

export const createFilterPredicate = <T>(config: FilterConfig<T>, searchTerm: string = '', searchFields: (keyof T)[] = []) => {
    return (item: T): boolean => {
        // 1. Check exact matches from config
        for (const key in config) {
            const filterVal = config[key];
            const itemVal = item[key];
            if (filterVal === undefined || filterVal === 'All' || filterVal === '') continue; // Skip empty filters

            if (typeof filterVal === 'function') {
                if (!filterVal(itemVal)) return false;
            } else if (itemVal !== filterVal) {
                return false;
            }
        }

        // 2. Check search term
        if (searchTerm && searchFields.length > 0) {
            const lowerSearch = searchTerm.toLowerCase();
            const matchesSearch = searchFields.some(field => {
                const val = item[field];
                return String(val).toLowerCase().includes(lowerSearch);
            });
            if (!matchesSearch) return false;
        }

        return true;
    };
};
