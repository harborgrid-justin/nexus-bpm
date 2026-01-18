
import React, { useState, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { FormDefinition, FormField, FormFieldType, FormValidation, FormVisibilityRule } from '../types';
import { FormPageLayout } from './shared/PageTemplates';
import { NexFormGroup, NexButton } from './shared/NexUI';
import { 
  Type, Hash, Calendar, CheckSquare, List, AlignLeft, FileText, 
  Trash2, GripVertical, Settings, Plus, Info, Upload, PenTool, EyeOff, AlertTriangle
} from 'lucide-react';
import { produce } from 'immer';

const FIELD_TYPES: { type: FormFieldType; icon: React.ElementType; label: string }[] = [
  { type: 'text', icon: Type, label: 'Text Field' },
  { type: 'number', icon: Hash, label: 'Number' },
  { type: 'textarea', icon: AlignLeft, label: 'Text Area' },
  { type: 'date', icon: Calendar, label: 'Date Picker' },
  { type: 'select', icon: List, label: 'Dropdown' },
  { type: 'checkbox', icon: CheckSquare, label: 'Checkbox' },
  { type: 'email', icon: FileText, label: 'Email' },
  { type: 'file', icon: Upload, label: 'File Upload' },
  { type: 'signature', icon: PenTool, label: 'Signature' }
];

export const FormDesigner: React.FC = () => {
  const { navigateTo, saveForm, forms, nav } = useBPM();
  const [formDef, setFormDef] = useState<FormDefinition>({
    id: `form-${Date.now()}`,
    name: 'New Form',
    description: '',
    fields: [],
    version: 1,
    lastModified: new Date().toISOString()
  });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'validation' | 'logic'>('general');

  useEffect(() => {
    if (nav.selectedId) {
      const existing = forms.find(f => f.id === nav.selectedId);
      if (existing) setFormDef(existing);
    }
  }, [nav.selectedId, forms]);

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `f-${Date.now()}`,
      type,
      label: `New ${type}`,
      key: `field_${Date.now()}`,
      required: false,
      placeholder: '',
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined
    };
    setFormDef(produce(draft => { draft.fields.push(newField); }));
    setSelectedFieldId(newField.id);
    setActiveTab('general');
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormDef(produce(draft => {
      const field = draft.fields.find(f => f.id === id);
      if (field) Object.assign(field, updates);
    }));
  };

  const deleteField = (id: string) => {
    setFormDef(produce(draft => { draft.fields = draft.fields.filter(f => f.id !== id); }));
    setSelectedFieldId(null);
  };

  const handleSave = async () => {
    await saveForm({ ...formDef, lastModified: new Date().toISOString() });
    navigateTo('forms');
  };

  const selectedField = formDef.fields.find(f => f.id === selectedFieldId);

  // --- Helpers for Complex Objects ---
  const updateValidation = (val: Partial<FormValidation>) => {
      if (!selectedField) return;
      const current = selectedField.validation || {};
      updateField(selectedField.id, { validation: { ...current, ...val } });
  };

  const updateVisibility = (rule: Partial<FormVisibilityRule>) => {
      if (!selectedField) return;
      // If clearing, we might pass empty object or check logic
      const current = selectedField.visibility || { targetFieldKey: '', operator: 'eq' };
      updateField(selectedField.id, { visibility: { ...current, ...rule } as FormVisibilityRule });
  };

  const toggleVisibilityRule = (enabled: boolean) => {
      if (!selectedField) return;
      if (enabled) {
          updateField(selectedField.id, { visibility: { targetFieldKey: '', operator: 'eq', value: '' } });
      } else {
          updateField(selectedField.id, { visibility: undefined });
      }
  }

  return (
    <FormPageLayout title={formDef.name || "Form Designer"} onBack={() => navigateTo('forms')} onSave={handleSave} saveLabel="Publish Form">
      <div className="flex h-[calc(100vh-200px)] gap-6">
        
        {/* Left: Palette */}
        <div className="w-64 bg-slate-50 border border-slate-200 rounded-sm p-4 flex flex-col gap-2 shrink-0">
           <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Field Library</h3>
           {FIELD_TYPES.map(ft => (
             <button 
               key={ft.type} 
               onClick={() => addField(ft.type)}
               className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-sm hover:border-blue-400 hover:shadow-sm transition-all text-left"
             >
               <ft.icon size={16} className="text-slate-500"/>
               <span className="text-xs font-bold text-slate-700">{ft.label}</span>
               <Plus size={14} className="ml-auto text-slate-300"/>
             </button>
           ))}
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-slate-100 border border-dashed border-slate-300 rounded-sm p-8 overflow-y-auto">
           <div className="bg-white shadow-lg min-h-[500px] max-w-2xl mx-auto rounded-sm p-8 border border-slate-200">
              <div className="mb-6 border-b border-slate-100 pb-4">
                 <input 
                   className="text-2xl font-bold text-slate-900 w-full outline-none placeholder:text-slate-300" 
                   value={formDef.name} 
                   onChange={e => setFormDef({...formDef, name: e.target.value})}
                   placeholder="Form Title"
                 />
                 <input 
                   className="text-sm text-slate-500 w-full outline-none mt-1" 
                   value={formDef.description} 
                   onChange={e => setFormDef({...formDef, description: e.target.value})}
                   placeholder="Form description..."
                 />
              </div>

              {formDef.fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                   <Type size={48} className="mb-4 opacity-50"/>
                   <p className="text-sm font-medium">Drag or click fields to build your form</p>
                </div>
              ) : (
                <div className="space-y-4">
                   {formDef.fields.map(field => (
                     <div 
                       key={field.id} 
                       onClick={() => setSelectedFieldId(field.id)}
                       className={`relative group p-4 rounded-sm border-2 transition-all cursor-pointer ${selectedFieldId === field.id ? 'border-blue-500 bg-blue-50/20' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                     >
                        <div className="flex items-center justify-between mb-1">
                           <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                             {field.label} 
                             {field.required && <span className="text-rose-500">*</span>}
                             {field.visibility && <EyeOff size={12} className="text-amber-500"/>}
                             {field.validation?.pattern && <AlertTriangle size={12} className="text-blue-500"/>}
                           </label>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); deleteField(field.id); }} className="text-rose-500 hover:bg-rose-100 p-1 rounded"><Trash2 size={14}/></button>
                           </div>
                        </div>
                        <div className="h-8 bg-slate-100 rounded border border-slate-200 w-full flex items-center px-3 text-xs text-slate-400">
                           {field.type === 'signature' ? '[ Signature Pad Area ]' : (field.placeholder || `Enter ${field.label}...`)}
                        </div>
                        {field.id === selectedFieldId && <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-full"></div>}
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>

        {/* Right: Properties */}
        <div className="w-80 bg-white border border-slate-200 rounded-sm flex flex-col shadow-sm shrink-0">
           <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                 <Settings size={14}/> Field Properties
              </h3>
           </div>
           
           {selectedField ? (
             <div className="flex flex-col h-full overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button onClick={() => setActiveTab('general')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 bg-slate-50'}`}>General</button>
                    <button onClick={() => setActiveTab('validation')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all ${activeTab === 'validation' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 bg-slate-50'}`}>Valid</button>
                    <button onClick={() => setActiveTab('logic')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all ${activeTab === 'logic' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 bg-slate-50'}`}>Logic</button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {activeTab === 'general' && (
                        <>
                            <NexFormGroup label="Label">
                                <input className="prop-input" value={selectedField.label} onChange={e => updateField(selectedField.id, { label: e.target.value })} />
                            </NexFormGroup>
                            <NexFormGroup label="Variable Key" helpText="Used in process variables (e.g., amount)">
                                <input className="prop-input font-mono" value={selectedField.key} onChange={e => updateField(selectedField.id, { key: e.target.value })} />
                            </NexFormGroup>
                            <NexFormGroup label="Placeholder">
                                <input className="prop-input" value={selectedField.placeholder || ''} onChange={e => updateField(selectedField.id, { placeholder: e.target.value })} />
                            </NexFormGroup>
                            
                            {selectedField.type === 'select' && (
                                <NexFormGroup label="Options (CSV)">
                                    <textarea 
                                        className="prop-input h-20" 
                                        value={selectedField.options?.join(',')} 
                                        onChange={e => updateField(selectedField.id, { options: e.target.value.split(',').map(s => s.trim()) })} 
                                    />
                                </NexFormGroup>
                            )}

                            <div className="pt-4 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={selectedField.required} onChange={e => updateField(selectedField.id, { required: e.target.checked })} className="text-blue-600 rounded-sm" />
                                    <span className="text-sm font-medium text-slate-700">Required Field</span>
                                </label>
                            </div>
                        </>
                    )}

                    {activeTab === 'validation' && (
                        <div className="space-y-4">
                            {(selectedField.type === 'number' || selectedField.type === 'text') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <NexFormGroup label="Min Length/Val">
                                        <input type="number" className="prop-input" value={selectedField.validation?.min || ''} onChange={e => updateValidation({ min: parseInt(e.target.value) || undefined })} />
                                    </NexFormGroup>
                                    <NexFormGroup label="Max Length/Val">
                                        <input type="number" className="prop-input" value={selectedField.validation?.max || ''} onChange={e => updateValidation({ max: parseInt(e.target.value) || undefined })} />
                                    </NexFormGroup>
                                </div>
                            )}
                            {(selectedField.type === 'text' || selectedField.type === 'email') && (
                                <NexFormGroup label="Regex Pattern">
                                    <input className="prop-input font-mono" placeholder="^[A-Z]+$" value={selectedField.validation?.pattern || ''} onChange={e => updateValidation({ pattern: e.target.value })} />
                                </NexFormGroup>
                            )}
                            <NexFormGroup label="Error Message">
                                <input className="prop-input" placeholder="Invalid input..." value={selectedField.validation?.message || ''} onChange={e => updateValidation({ message: e.target.value })} />
                            </NexFormGroup>
                        </div>
                    )}

                    {activeTab === 'logic' && (
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 cursor-pointer mb-4">
                                <input type="checkbox" checked={!!selectedField.visibility} onChange={e => toggleVisibilityRule(e.target.checked)} className="text-blue-600 rounded-sm" />
                                <span className="text-sm font-bold text-slate-700">Conditional Visibility</span>
                            </label>

                            {selectedField.visibility && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm space-y-3">
                                    <NexFormGroup label="Depending On Field">
                                        <select className="prop-input" value={selectedField.visibility.targetFieldKey} onChange={e => updateVisibility({ targetFieldKey: e.target.value })}>
                                            <option value="">Select Field...</option>
                                            {formDef.fields.filter(f => f.id !== selectedField.id).map(f => (
                                                <option key={f.key} value={f.key}>{f.label} ({f.key})</option>
                                            ))}
                                        </select>
                                    </NexFormGroup>
                                    <div className="grid grid-cols-2 gap-2">
                                        <NexFormGroup label="Operator">
                                            <select className="prop-input" value={selectedField.visibility.operator} onChange={e => updateVisibility({ operator: e.target.value as any })}>
                                                <option value="eq">Equals</option>
                                                <option value="neq">Not Equals</option>
                                                <option value="contains">Contains</option>
                                                <option value="truthy">Is Checked/True</option>
                                            </select>
                                        </NexFormGroup>
                                        {(selectedField.visibility.operator !== 'truthy' && selectedField.visibility.operator !== 'falsy') && (
                                            <NexFormGroup label="Value">
                                                <input className="prop-input" value={selectedField.visibility.value || ''} onChange={e => updateVisibility({ value: e.target.value })} />
                                            </NexFormGroup>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-amber-700 italic">This field will only show if the condition above is met.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
             </div>
           ) : (
             <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                <Info size={32} className="mb-2 opacity-50"/>
                <p className="text-xs font-medium">Select a field to configure properties.</p>
             </div>
           )}
        </div>

      </div>
    </FormPageLayout>
  );
};
