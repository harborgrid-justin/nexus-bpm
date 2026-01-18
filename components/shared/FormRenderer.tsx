
import React from 'react';
import { FormDefinition, FormField } from '../../types';
import { NexFormGroup } from './NexUI';

interface FormRendererProps {
  form: FormDefinition;
  data: Record<string, any>;
  onChange: (key: string, value: any) => void;
  readOnly?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({ form, data, onChange, readOnly }) => {
  return (
    <div className="space-y-5">
      {form.fields.map(field => (
        <NexFormGroup key={field.id} label={field.label} helpText={field.required ? undefined : '(Optional)'}>
          {renderField(field, data[field.key] || '', onChange, readOnly)}
        </NexFormGroup>
      ))}
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

    default:
      return <input type="text" {...commonProps} />;
  }
};
