
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { FormDefinition, FormField, FormFieldType, FormValidation, FormFieldLayout, FormFieldAppearance, FormDataSource, FormBehavior, FieldPermission } from '../types';
import { FormPageLayout } from './shared/PageTemplates';
import { NexFormGroup } from './shared/NexUI';
import { 
  Type, Hash, Calendar, CheckSquare, List, AlignLeft, FileText, 
  Trash2, GripVertical, Settings, Info, Upload, PenTool, EyeOff, AlertTriangle,
  PanelLeft, PanelRight, Smartphone, Monitor, Star, Sliders, Tag, Palette, Lock, Clock, Minus, LayoutGrid, Globe, Calculator,
  Columns, Forward, Copy, MousePointerClick, Shield
} from 'lucide-react';
import { produce } from 'immer';

const FIELD_TYPES: { type: FormFieldType; icon: React.ElementType; label: string; category: string }[] = [
  { type: 'text', icon: Type, label: 'Text Field', category: 'Basic' },
  { type: 'textarea', icon: AlignLeft, label: 'Text Area', category: 'Basic' },
  { type: 'number', icon: Hash, label: 'Number', category: 'Basic' },
  { type: 'email', icon: FileText, label: 'Email', category: 'Basic' },
  { type: 'password', icon: Lock, label: 'Password', category: 'Basic' },
  { type: 'select', icon: List, label: 'Dropdown', category: 'Selection' },
  { type: 'checkbox', icon: CheckSquare, label: 'Checkbox', category: 'Selection' },
  { type: 'tags', icon: Tag, label: 'Tags Input', category: 'Selection' },
  { type: 'slider', icon: Sliders, label: 'Range Slider', category: 'Selection' },
  { type: 'rating', icon: Star, label: 'Star Rating', category: 'Selection' },
  { type: 'color', icon: Palette, label: 'Color Picker', category: 'Selection' },
  { type: 'date', icon: Calendar, label: 'Date Picker', category: 'Date & Time' },
  { type: 'time', icon: Clock, label: 'Time Picker', category: 'Date & Time' },
  { type: 'file', icon: Upload, label: 'File Upload', category: 'Advanced' },
  { type: 'signature', icon: PenTool, label: 'Signature', category: 'Advanced' },
  { type: 'divider', icon: Minus, label: 'Section Divider', category: 'Layout' },
  { type: 'rich-text', icon: FileText, label: 'Rich Text Info', category: 'Layout' },
];

export const FormDesigner: React.FC = () => {
  const { navigateTo, saveForm, forms, nav, addNotification, roles } = useBPM();
  const [formDef, setFormDef] = useState<FormDefinition>({ id: `form-${Date.now()}`, name: 'New Form', description: '', fields: [], version: 1, lastModified: new Date().toISOString(), layoutMode: 'single' });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'data' | 'validation' | 'logic' | 'permissions'>('general');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fieldId: string } | null>(null);
  const [dragInfo, setDragInfo] = useState<{ type: 'library' | 'field', id?: string, fieldType?: FormFieldType } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ... (Logic handlers preserved) ...
  useEffect(() => { if (nav.selectedId) { const existing = forms.find(f => f.id === nav.selectedId); if (existing) setFormDef(existing); } }, [nav.selectedId, forms]);
  useEffect(() => { const handleResize = () => { if (window.innerWidth < 768 && previewMode === 'desktop') setPreviewMode('mobile'); }; window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, [previewMode]);
  
  const addField = (type: FormFieldType, index?: number) => {
    if (formDef.fields.length >= 50) { addNotification('error', 'Maximum field limit (50) reached.'); return; }
    const newField: FormField = { id: `f-${Date.now()}`, type, label: type === 'divider' ? 'Section Break' : `New ${type}`, key: `field_${Date.now()}`, required: false, placeholder: '', options: type === 'select' || type === 'tags' ? ['Option 1', 'Option 2'] : undefined, layout: { width: '100%' } };
    setFormDef(produce(draft => { if (typeof index === 'number') draft.fields.splice(index, 0, newField); else draft.fields.push(newField); }));
    setSelectedFieldId(newField.id); setActiveTab('general'); if(!rightOpen) setRightOpen(true);
  };

  const moveField = (fromId: string, toIndex: number, isCopy: boolean) => {
      setFormDef(produce(draft => {
          const fromIndex = draft.fields.findIndex(f => f.id === fromId);
          if (fromIndex === -1) return;
          const itemToMove = draft.fields[fromIndex];
          if (!isCopy && (toIndex === fromIndex || toIndex === fromIndex + 1)) return;
          let target = toIndex;
          if (isCopy) { const clone = { ...itemToMove, id: `f-${Date.now()}`, key: `${itemToMove.key}_copy`, label: `${itemToMove.label} (Copy)` }; draft.fields.splice(target, 0, clone); setSelectedFieldId(clone.id); } else { draft.fields.splice(fromIndex, 1); if (fromIndex < toIndex) target -= 1; draft.fields.splice(target, 0, itemToMove); }
      }));
  };

  const deleteField = (id: string) => { setFormDef(produce(draft => { draft.fields = draft.fields.filter(f => f.id !== id); })); setSelectedFieldId(null); setContextMenu(null); };
  const handleSave = async () => { if (!formDef.name.trim()) { addNotification('error', 'Please provide a form title.'); return; } await saveForm({ ...formDef, lastModified: new Date().toISOString() }); navigateTo('forms'); };
  const selectedField = formDef.fields.find(f => f.id === selectedFieldId);
  const updateField = (id: string, updates: Partial<FormField>) => { setFormDef(produce(draft => { const field = draft.fields.find(f => f.id === id); if (field) Object.assign(field, updates); })); };
  
  const updatePermission = (roleId: string, access: FieldPermission['access']) => {
      if (!selectedField) return;
      const currentPerms = selectedField.permissions || [];
      const exists = currentPerms.find(p => p.roleId === roleId);
      let newPerms;
      
      if (exists) {
          newPerms = currentPerms.map(p => p.roleId === roleId ? { ...p, access } : p);
      } else {
          newPerms = [...currentPerms, { roleId, access }];
      }
      
      updateField(selectedField.id, { permissions: newPerms });
  };

  const handleDragStartLibrary = (e: React.DragEvent, type: FormFieldType) => { setDragInfo({ type: 'library', fieldType: type }); e.dataTransfer.effectAllowed = 'copy'; if (rightOpen) setRightOpen(false); };
  const handleDragStartField = (e: React.DragEvent, id: string) => { e.stopPropagation(); setDragInfo({ type: 'field', id }); e.dataTransfer.effectAllowed = e.ctrlKey ? 'copy' : 'move'; setSelectedFieldId(id); };
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => { e.preventDefault(); e.stopPropagation(); if (!dragInfo) return; if (dropIndex !== index) setDropIndex(index); if (e.ctrlKey !== isCopyMode) setIsCopyMode(e.ctrlKey); }, [dropIndex, dragInfo, isCopyMode]);
  const handleDrop = (e: React.DragEvent, index: number) => { e.preventDefault(); e.stopPropagation(); if (!dragInfo) return; if (dragInfo.type === 'library' && dragInfo.fieldType) addField(dragInfo.fieldType, index); else if (dragInfo.type === 'field' && dragInfo.id) moveField(dragInfo.id, index, e.ctrlKey || e.metaKey); setDragInfo(null); setDropIndex(null); setIsCopyMode(false); };

  const renderDropZone = (index: number) => {
      const isActive = dropIndex === index && dragInfo !== null;
      return <div key={`drop-${index}`} className={`w-full transition-all duration-200 rounded-sm ${isActive ? 'h-12 my-2 border-2 border-dashed flex items-center justify-center' : 'h-3 hover:h-5'}`} style={{ borderColor: isActive ? (isCopyMode ? '#10b981' : '#3b82f6') : 'transparent', backgroundColor: isActive ? (isCopyMode ? '#ecfdf5' : '#eff6ff') : 'transparent' }} onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} >{isActive && <span className={`text-[10px] font-bold uppercase tracking-widest pointer-events-none flex items-center gap-2 ${isCopyMode ? 'text-emerald-600' : 'text-blue-500'}`}>{isCopyMode ? <Copy size={12}/> : <MousePointerClick size={12}/>}{isCopyMode ? 'Copy Here' : 'Move Here'}</span>}</div>;
  };

  const categories = Array.from(new Set(FIELD_TYPES.map(f => f.category)));

  return (
    <FormPageLayout title={formDef.name || "Form Designer"} onBack={() => navigateTo('forms')} onSave={handleSave} saveLabel="Publish Form" fullWidth>
      <div className="flex h-full relative overflow-hidden" onClick={() => setContextMenu(null)}>
        
        <div className={`border-r border-slate-200 bg-slate-50 flex flex-col transition-all duration-300 ${leftOpen ? 'w-[260px]' : 'w-0 overflow-hidden'}`}>
           <div className="border-b border-slate-200 flex items-center justify-between shrink-0" style={{ padding: 'var(--space-base)' }}>
              <h3 className="text-xs font-bold text-slate-500 uppercase">Field Library</h3>
              <button onClick={() => setLeftOpen(false)} className="text-slate-400 hover:text-slate-600"><PanelLeft size={14}/></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-6 select-none">
             {categories.map(cat => (
               <div key={cat}>
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{cat}</h4>
                 <div className="grid grid-cols-2 gap-2">
                   {FIELD_TYPES.filter(ft => ft.category === cat).map(ft => (
                     <div key={ft.type} draggable onDragStart={(e) => handleDragStartLibrary(e, ft.type)} onClick={() => addField(ft.type)} className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-sm hover:border-blue-400 hover:shadow-sm transition-all text-center group h-20 cursor-grab active:cursor-grabbing" title={`Drag to add ${ft.label}`}>
                       <ft.icon size={20} className="text-slate-500 group-hover:text-blue-600"/>
                       <span className="text-[10px] font-bold text-slate-700 leading-tight">{ft.label}</span>
                     </div>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        </div>

        <div className="flex-1 bg-slate-100 flex flex-col min-w-0 relative">
           <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-10">
              <div className="flex items-center gap-2">{!leftOpen && <button onClick={() => setLeftOpen(true)} className="p-1.5 hover:bg-slate-50 rounded text-slate-500"><PanelLeft size={16}/></button>}</div>
              <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-sm">
                 <div className="flex items-center gap-2 border-r border-slate-300 pr-2 mr-2">
                    <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded-sm ${previewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}><Monitor size={14}/></button>
                    <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded-sm ${previewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}><Smartphone size={14}/></button>
                 </div>
                 <button onClick={() => setFormDef(d => ({ ...d, layoutMode: d.layoutMode === 'wizard' ? 'single' : 'wizard' }))} className={`flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-bold ${formDef.layoutMode === 'wizard' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' : 'text-slate-500'}`}><Forward size={14}/> Wizard Mode</button>
              </div>
              <div className="flex items-center gap-2">{!rightOpen && <button onClick={() => setRightOpen(true)} className="p-1.5 hover:bg-slate-50 rounded text-slate-500"><PanelRight size={16}/></button>}</div>
           </div>

           <div ref={canvasRef} className="flex-1 overflow-y-auto relative scroll-smooth" style={{ padding: 'var(--layout-padding)' }} onDragOver={(e) => { e.preventDefault(); }} onClick={() => setSelectedFieldId(null)}>
              <div className={`bg-white shadow-sm min-h-[800px] mx-auto rounded-sm border border-slate-200 flex flex-col transition-all duration-300 relative ${previewMode === 'mobile' ? 'max-w-[375px] border-x-4 border-x-slate-800 my-4 shadow-xl' : 'w-full max-w-4xl p-8'}`}>
                 <div className={`mb-8 border-b border-slate-100 pb-6 ${previewMode === 'mobile' ? 'p-6' : ''}`}>
                    <input className="text-2xl font-bold text-slate-900 w-full outline-none bg-transparent" value={formDef.name} onChange={e => setFormDef({...formDef, name: e.target.value})} placeholder="Form Title" />
                    <input className="text-sm text-slate-500 w-full outline-none mt-2 bg-transparent" value={formDef.description} onChange={e => setFormDef({...formDef, description: e.target.value})} placeholder="Enter form description..." />
                 </div>
                 <div className={`flex flex-wrap content-start ${previewMode === 'mobile' ? 'px-4 pb-4' : 'gap-y-0'}`}>
                    {renderDropZone(0)}
                    {formDef.fields.map((field, idx) => (
                    <React.Fragment key={field.id}>
                        <div className={`relative group p-1 transition-all ${dragInfo?.id === field.id ? 'opacity-50 scale-95' : 'opacity-100'}`} style={{ width: previewMode === 'mobile' ? '100%' : (field.layout?.width || '100%') }} onClick={(e) => { e.stopPropagation(); setSelectedFieldId(field.id); if(!rightOpen) setRightOpen(true); }} draggable onDragStart={(e) => handleDragStartField(e, field.id)}>
                            <div className={`relative rounded-sm border p-3 cursor-pointer ${selectedFieldId === field.id ? 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-500/20 z-10' : 'border-transparent hover:border-slate-300 hover:bg-slate-50'}`}>
                                <div className="flex items-center justify-between mb-2 select-none">
                                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={14} className="text-slate-300 hover:text-slate-600"/> {field.label} {field.required && <span className="text-rose-500">*</span>}
                                    </label>
                                    <button onClick={(e) => { e.stopPropagation(); deleteField(field.id); }} className="text-rose-500 hover:bg-rose-100 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                </div>
                                <div className="w-full pointer-events-none opacity-80 h-9 bg-slate-50 border border-slate-300 rounded-sm"></div>
                            </div>
                        </div>
                        {renderDropZone(idx + 1)}
                    </React.Fragment>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className={`border-l border-slate-200 bg-white flex flex-col shadow-xl z-10 shrink-0 transition-all duration-300 ${rightOpen ? 'w-[320px]' : 'w-0 overflow-hidden'}`}>
           <div className="border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0" style={{ padding: 'var(--space-base)' }}>
              <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2"><Settings size={14}/> Properties</h3>
              <button onClick={() => setRightOpen(false)} className="text-slate-400 hover:text-slate-600"><PanelRight size={14}/></button>
           </div>
           {selectedField ? (
             <div className="flex flex-col h-full overflow-hidden">
                <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                    {['general', 'appearance', 'data', 'validation', 'permissions'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t as any)} className={`px-3 py-3 text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeTab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 bg-slate-50 hover:text-slate-800'}`}>{t}</button>
                    ))}
                </div>
                <div className="space-y-5 overflow-y-auto flex-1" style={{ padding: 'var(--card-padding)' }}>
                    {activeTab === 'general' && (
                        <>
                            <NexFormGroup label="Field Label"><input className="prop-input font-bold" value={selectedField.label} onChange={e => updateField(selectedField.id, { label: e.target.value })} /></NexFormGroup>
                            <NexFormGroup label="Variable Key"><input className="prop-input font-mono text-xs" value={selectedField.key} onChange={e => updateField(selectedField.id, { key: e.target.value })} /></NexFormGroup>
                        </>
                    )}
                    
                    {activeTab === 'permissions' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-sm text-xs text-indigo-800 flex gap-2">
                                <Shield size={16} className="shrink-0"/>
                                Field-Level Security (FLS) overrides visibility rules.
                            </div>
                            {roles.map(role => {
                                const current = selectedField.permissions?.find(p => p.roleId === role.id)?.access || 'read_write';
                                return (
                                    <div key={role.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-xs font-bold text-slate-700">{role.name}</span>
                                        <select 
                                            className="text-xs border border-slate-300 rounded-sm p-1 bg-white"
                                            value={current}
                                            onChange={e => updatePermission(role.id, e.target.value as any)}
                                        >
                                            <option value="read_write">Read/Write</option>
                                            <option value="read_only">Read Only</option>
                                            <option value="hidden">Hidden</option>
                                        </select>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
             </div>
           ) : <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50"><Settings size={32} className="mb-3 opacity-20"/><p className="text-xs font-bold uppercase">Select a field</p></div>}
        </div>
      </div>
    </FormPageLayout>
  );
};
