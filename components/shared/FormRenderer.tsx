
import React, { useState, useEffect } from 'react';
import { FormDefinition, FormField, FormVisibilityRule } from '../../types';
import { NexFormGroup } from './NexUI';
import { Check, X, PenTool } from 'lucide-react';

interface FormRendererProps {
  form: FormDefinition;
  data: Record<string, any>;
  onChange: (key: string, value: any) => void;
  readOnly?: boolean;
  errors?: Record<string, string>; // Errors passed from parent or internal
}

// Utility to validate form logic
export const validateForm = (form: FormDefinition, data: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    // Helper to check visibility (don't validate hidden fields)
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

        const val = data[field.key];
        const isEmpty = val === undefined || val === null || val === '';

        if (field.required && isEmpty) {
            errors[field.key] = 'This field is required.';
        }

        if (!isEmpty && field.validation) {
            const { min, max, pattern, message } = field.validation;
            
            if (field.type === 'number') {
                const num = Number(val);
                if (min !== undefined && num < min) errors[field.key] = message || `Minimum value is ${min}`;
                if (max !== undefined && num > max) errors[field.key] = message || `Maximum value is ${max}`;
            }
            if (field.type === 'text' || field.type === 'textarea') {
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

export const FormRenderer: React.FC<FormRendererProps> = ({ form, data, onChange, readOnly, errors = {} }) => {
  // Check visibility for all fields
  const isFieldVisible = (field: FormField): boolean => {
      if (!field.visibility) return true;
      const { targetFieldKey, operator, value } = field.visibility;
      const targetValue = data[targetFieldKey];
      
      switch (operator) {
          case 'eq': return String(targetValue) === String(value);
          case 'neq': return String(targetValue) !== String(value);
          case 'contains': return String(targetValue || '').includes(String(value || ''));
          case 'truthy': return !!targetValue;
          case 'falsy': return !targetValue;
          default: return true;
      }
  };

  return (
    <div className="space-y-5">
      {form.fields.map(field => {
        if (!isFieldVisible(field)) return null;
        
        return (
            <div key={field.id}>
                <NexFormGroup 
                    label={field.label} 
                    helpText={field.required ? undefined : '(Optional)'}
                >
                    {renderField(field, data[field.key] || '', onChange, readOnly)}
                </NexFormGroup>
                {errors[field.key] && (
                    <div className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <X size={12}/> {errors[field.key]}
                    </div>
                )}
            </div>
        );
      })}
    </div>
  );
};

const renderField = (field: FormField, value: any, onChange: (k: string, v: any) => void, readOnly?: boolean) => {
  const commonProps = {
    className: `prop-input ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`,
    disabled: readOnly,
    value: value,
    onChange: (e: any) => onChange(field.key, e.target.value),
    placeholder: field.placeholder
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
      return <input type={field.type} {...commonProps} />;
    
    case 'textarea':
      return <textarea {...commonProps} className={`${commonProps.className} h-24 resize-none`} />;
    
    case 'date':
      return <input type="date" {...commonProps} />;
    
    case 'select':
      return (
        <select {...commonProps}>
          <option value="">Select...</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={!!value} 
            disabled={readOnly}
            onChange={(e) => onChange(field.key, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600">{field.placeholder || 'Yes'}</span>
        </div>
      );
      
    case 'file':
      return (
        <div className="border border-dashed border-slate-300 rounded-sm p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
           <span className="text-xs text-slate-500">File upload simulation</span>
        </div>
      );

    case 'signature':
        return <SignatureField value={value} onChange={(v) => onChange(field.key, v)} readOnly={readOnly} />;

    default:
      return <input type="text" {...commonProps} />;
  }
};

// --- Signature Field Component ---
const SignatureField = ({ value, onChange, readOnly }: { value: string, onChange: (v: string) => void, readOnly?: boolean }) => {
    const isSigned = !!value;
    
    const handleSign = () => {
        if(readOnly) return;
        // Simulate digital signature hash
        const hash = `SIGNED_${new Date().toISOString()}_${Math.random().toString(36).substr(2, 9)}`;
        onChange(hash);
    };

    const handleClear = () => {
        if(readOnly) return;
        onChange('');
    };

    return (
        <div className={`border rounded-sm p-4 flex items-center justify-between transition-colors ${isSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-300'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSigned ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {isSigned ? <Check size={20}/> : <PenTool size={20}/>}
                </div>
                <div>
                    <p className={`text-xs font-bold ${isSigned ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {isSigned ? 'Digitally Signed' : 'Signature Required'}
                    </p>
                    {isSigned && <p className="text-[9px] font-mono text-emerald-600 mt-0.5">{value}</p>}
                </div>
            </div>
            {!readOnly && (
                <button 
                    onClick={isSigned ? handleClear : handleSign}
                    className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-all ${isSigned ? 'text-rose-600 hover:bg-rose-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {isSigned ? 'Clear' : 'Sign Now'}
                </button>
            )}
        </div>
    );
};
