import React, { useState, useEffect, useMemo } from 'react';
import { FormDefinition, FormField } from '../../types';
import { NexFormGroup, NexButton } from './NexUI';
import { Check, X, PenTool, Info, Star, Upload, ArrowRight, ArrowLeft } from 'lucide-react';

interface FormRendererProps {
  form: FormDefinition;
  data: Record<string, any>;
  onChange: (key: string, value: any) => void;
  readOnly?: boolean;
  errors?: Record<string, string>;
}

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

const FieldWrapper: React.FC<{ field: FormField; children: React.ReactNode }> = ({ field, children }) => (
    <div className="relative w-full">
        {field.appearance?.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{field.appearance.prefix}</span>}
        {children}
        {field.appearance?.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{field.appearance.suffix}</span>}
    </div>
);

const SignatureField = ({ value, onChange, readOnly }: { value: string, onChange: (v: string) => void, readOnly?: boolean }) => {
    const isSigned = !!value;
    
    const handleSign = () => {
        if(readOnly) return;
        const hash = `SIGNED_${new Date().toISOString()}_${Math.random().toString(36).substr(2, 9)}`;
        onChange(hash);
    };

    const handleClear = () => {
        if(readOnly) return;
        onChange('');
    };

    return (
        <div className={`border rounded-sm p-4 flex items-center justify-between transition-colors w-full ${isSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-300'}`}>
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

type FieldValue = string | number | boolean | string[] | undefined;

const FieldInput: React.FC<{ field: FormField; value: FieldValue; onChange: (k: string, v: FieldValue) => void; readOnly?: boolean }> = ({ field, value, onChange, readOnly }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onChange(field.key, e.target.value);
  };

  // Safe value handling to avoid [object Object]
  const safeValue = (val: any) => {
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          try { return JSON.stringify(val); } catch(e) { return ''; }
      }
      if (typeof val === 'boolean') return '';
      return val as string | number | string[];
  };

  const commonProps = {
    className: `prop-input w-full ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-dashed' : ''} ${field.appearance?.prefix ? 'pl-8' : ''} ${field.appearance?.suffix ? 'pr-12' : ''}`,
    disabled: readOnly,
    value: safeValue(value),
    onChange: handleChange,
    placeholder: field.placeholder,
    readOnly: readOnly
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
    case 'password':
      return <FieldWrapper field={field}><input type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'} {...commonProps} /></FieldWrapper>;
    
    case 'textarea':
      return <FieldWrapper field={field}><textarea {...commonProps} className={`${commonProps.className} h-24 resize-y py-2`} /></FieldWrapper>;
    
    case 'date':
      return <FieldWrapper field={field}><input type="date" {...commonProps} /></FieldWrapper>;

    case 'time':
      return <FieldWrapper field={field}><input type="time" {...commonProps} /></FieldWrapper>;
    
    case 'select':
      return (
        <FieldWrapper field={field}>
            <select {...commonProps}>
            <option value="">Select...</option>
            {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
            </select>
        </FieldWrapper>
      );
    
    case 'checkbox':
      return (
        <div className="flex items-center gap-2 p-2 border border-transparent hover:bg-slate-50 rounded-sm -ml-2 transition-colors">
          <input 
            type="checkbox" 
            checked={!!value} 
            disabled={readOnly}
            onChange={(e) => onChange(field.key, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm text-slate-700 font-medium cursor-pointer" onClick={() => !readOnly && onChange(field.key, !value)}>{field.placeholder || 'Yes'}</span>
        </div>
      );
      
    case 'file':
      return (
        <div className="border border-dashed border-slate-300 rounded-sm p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer w-full relative">
           <Upload size={20} className="mx-auto text-slate-400 mb-2"/>
           <span className="text-sm font-medium text-slate-600 block">Click to upload</span>
           <p className="text-[10px] text-slate-400 mt-1">{field.validation?.accept || 'All files'} (Max {field.validation?.maxSize ? field.validation.maxSize / 1024 / 1024 + 'MB' : 'Unlimited'})</p>
           <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" disabled={readOnly} />
        </div>
      );

    case 'signature':
        return <SignatureField value={value as string} onChange={(v) => onChange(field.key, v)} readOnly={readOnly} />;

    case 'rating':
        return (
            <div className="flex gap-1">
                {[1,2,3,4,5].map(v => (
                    <button type="button" key={v} onClick={() => !readOnly && onChange(field.key, v)} className={`transition-all hover:scale-110 ${Number(value) >= v ? 'text-amber-400' : 'text-slate-200'}`}>
                        <Star fill="currentColor" size={24} />
                    </button>
                ))}
            </div>
        );

    case 'slider':
        return (
            <div className="flex items-center gap-4">
                <input 
                    type="range" 
                    min={field.validation?.min || 0} 
                    max={field.validation?.max || 100} 
                    value={Number(value) || 0} 
                    onChange={e => onChange(field.key, Number(e.target.value))}
                    disabled={readOnly}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <span className="text-sm font-mono font-bold text-slate-700 w-8 text-right">{Number(value) || 0}</span>
            </div>
        );

    case 'color':
        return (
            <div className="flex items-center gap-2">
                <input type="color" value={(value as string) || '#000000'} onChange={e => onChange(field.key, e.target.value)} disabled={readOnly} className="h-9 w-16 p-0 border-0 rounded-sm cursor-pointer"/>
                <input type="text" value={(value as string) || ''} onChange={e => onChange(field.key, e.target.value)} className="prop-input flex-1" placeholder="#RRGGBB" disabled={readOnly}/>
            </div>
        );

    case 'tags':
        return (
            <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-2">
                    {Array.isArray(value) && value.map((tag: string) => (
                        <span key={tag} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-sm text-xs font-bold flex items-center gap-1">
                            {tag}
                            {!readOnly && <button type="button" onClick={() => onChange(field.key, value.filter((t: string) => t !== tag))}><X size={12}/></button>}
                        </span>
                    ))}
                </div>
                {!readOnly && (
                    <select 
                        className="prop-input" 
                        onChange={e => { 
                            const val = e.target.value; 
                            const currentTags = Array.isArray(value) ? value : [];
                            if(val && !currentTags.includes(val)) onChange(field.key, [...currentTags, val]); 
                            e.target.value = '';
                        }}
                    >
                        <option value="">Add Tag...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                )}
            </div>
        );

    default:
      return <input type="text" {...commonProps} />;
  }
};

export const FormRenderer: React.FC<FormRendererProps> = ({ form, data, onChange, readOnly, errors = {} }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(() => {
      const grouped: FormField[][] = [];
      let currentGroup: FormField[] = [];
      
      form.fields.forEach(field => {
          if (field.type === 'divider' && form.layoutMode === 'wizard') {
              if (currentGroup.length > 0) grouped.push(currentGroup);
              currentGroup = [];
          } else {
              currentGroup.push(field);
          }
      });
      if (currentGroup.length > 0) grouped.push(currentGroup);
      
      if (form.layoutMode !== 'wizard' || grouped.length === 0) return [form.fields];
      
      return grouped;
  }, [form.fields, form.layoutMode]);

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

  useEffect(() => {
      form.fields.forEach(field => {
          if (field.behavior?.calculation) {
              let calc = field.behavior.calculation;
              let hasVar = false;
              for(const key in data) {
                  if (calc.includes(`{{${key}}}`)) {
                      calc = calc.replace(new RegExp(`{{${key}}}`, 'g'), String(Number(data[key]) || 0));
                      hasVar = true;
                  }
              }
              if (hasVar) {
                  try {
                      // eslint-disable-next-line no-eval
                      const result = eval(calc); 
                      if (data[field.key] !== result) onChange(field.key, result);
                  } catch(e) {}
              }
          }
      });
  }, [data, form.fields]);

  const visibleFields = steps[currentStep] || [];

  return (
    <div className="flex flex-col h-full">
      {form.layoutMode === 'wizard' && steps.length > 1 && (
          <div className="flex items-center justify-between mb-6 px-2">
              {steps.map((_, idx) => (
                  <div key={idx} className="flex items-center flex-1 last:flex-none">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${idx <= currentStep ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {idx + 1}
                      </div>
                      {idx < steps.length - 1 && (
                          <div className={`flex-1 h-1 mx-2 rounded-full ${idx < currentStep ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                      )}
                  </div>
              ))}
          </div>
      )}

      <div className="flex flex-wrap -mx-2 flex-1 content-start">
        {visibleFields.map(field => {
            if (!isFieldVisible(field)) return null;
            
            const width = field.layout?.width || '100%';
            const isDisabled = readOnly || field.behavior?.disabled || field.behavior?.readOnly;

            if (field.type === 'divider') {
                return (
                    <div key={field.id} className="w-full px-2 my-4">
                        <div className="h-px bg-slate-200 flex items-center justify-center">
                            <span className="bg-white px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{field.label}</span>
                        </div>
                    </div>
                );
            }

            if (field.type === 'rich-text') {
                return (
                    <div key={field.id} className="w-full px-2 mb-4">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-sm text-sm text-blue-900" dangerouslySetInnerHTML={{__html: field.defaultValue || field.helpText || ''}} />
                    </div>
                )
            }
            
            return (
                <div key={field.id} className="px-2 mb-4" style={{ width }}>
                    <NexFormGroup 
                        label={field.label} 
                        helpText={field.required ? undefined : '(Optional)'}
                    >
                        <FieldInput field={field} value={data[field.key]} onChange={onChange} readOnly={isDisabled} />
                    </NexFormGroup>
                    
                    {field.helpText && (
                        <div className="mt-1 text-xs text-slate-500 flex items-start gap-1.5">
                            <Info size={12} className="shrink-0 mt-0.5 text-slate-400"/>
                            {field.helpText}
                        </div>
                    )}

                    {errors[field.key] && (
                        <div className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1 animate-pulse">
                            <X size={12}/> {errors[field.key]}
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      {form.layoutMode === 'wizard' && steps.length > 1 && (
          <div className="flex justify-between pt-4 border-t border-slate-200 mt-4">
              <NexButton 
                variant="secondary" 
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} 
                disabled={currentStep === 0} 
                icon={ArrowLeft}
              >
                  Back
              </NexButton>
              <NexButton 
                variant="primary" 
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))} 
                disabled={currentStep === steps.length - 1} 
                icon={ArrowRight}
              >
                  Next Step
              </NexButton>
          </div>
      )}
    </div>
  );
};