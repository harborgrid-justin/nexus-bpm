import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { FormDefinition, FormField, FormFieldType, FormValidation, FormVisibilityRule, FormFieldLayout, FormFieldAppearance, FormDataSource, FormBehavior } from '../types';
import { FormPageLayout } from './shared/PageTemplates';
import { NexFormGroup, NexButton } from './shared/NexUI';
import { 
  Type, Hash, Calendar, CheckSquare, List, AlignLeft, FileText, 
  Trash2, GripVertical, Settings, Plus, Info, Upload, PenTool, EyeOff, AlertTriangle,
  PanelLeft, PanelRight, Smartphone, Monitor, Maximize, Star, Sliders, Tag, Palette, Lock, Key, Clock, Minus, LayoutGrid, Globe, Calculator,
  Columns, Box, ToggleLeft, Copy, MoreVertical, MousePointerClick, Forward
} from 'lucide-react';
import { produce } from 'immer';

// ... (Keep FIELD_TYPES constant as is)
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
  const { navigateTo, saveForm, forms, nav, addNotification } = useBPM();
  const [formDef, setFormDef] = useState<FormDefinition>({
    id: `form-${Date.now()}`,
    name: 'New Form',
    description: '',
    fields: [],
    version: 1,
    lastModified: new Date().toISOString(),
    layoutMode: 'single'
  });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'data' | 'validation' | 'logic'>('general');
  
  // UI State
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fieldId: string } | null>(null);

  // Drag and Drop State
  const [dragInfo, setDragInfo] = useState<{ type: 'library' | 'field', id?: string, fieldType?: FormFieldType } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);

  // DOM Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (nav.selectedId) {
      const existing = forms.find(f => f.id === nav.selectedId);
      if (existing) setFormDef(existing);
    }
  }, [nav.selectedId, forms]);

  // Window Resize Listener
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth < 768 && previewMode === 'desktop') {
              setPreviewMode('mobile');
          }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, [previewMode]);

  // Keyboard Listener
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              setDragInfo(null);
              setContextMenu(null);
              setSelectedFieldId(null);
          }
          if (e.key === 'Delete' && selectedFieldId && !document.activeElement?.tagName.match(/INPUT|TEXTAREA|SELECT/)) {
              deleteField(selectedFieldId);
          }
          if (e.key === 'Control' || e.key === 'Meta') {
              setIsCopyMode(true);
          }
      };
      
      const handleKeyUp = (e: KeyboardEvent) => {
          if (e.key === 'Control' || e.key === 'Meta') {
              setIsCopyMode(false);
          }
      }

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      }
  }, [selectedFieldId]);

  // Auto-Scroll Cleanup
  useEffect(() => {
      return () => {
          if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
      };
  }, []);

  const addField = (type: FormFieldType, index?: number) => {
    if (formDef.fields.length >= 50) {
        addNotification('error', 'Maximum field limit (50) reached.');
        return;
    }

    const newField: FormField = {
      id: `f-${Date.now()}`,
      type,
      label: type === 'divider' ? 'Section Break' : `New ${type}`,
      key: `field_${Date.now()}`,
      required: false,
      placeholder: '',
      options: type === 'select' || type === 'tags' ? ['Option 1', 'Option 2'] : undefined,
      layout: { width: '100%' }
    };
    
    setFormDef(produce(draft => { 
        if (typeof index === 'number') {
            draft.fields.splice(index, 0, newField);
        } else {
            draft.fields.push(newField); 
        }
    }));
    
    setSelectedFieldId(newField.id);
    setActiveTab('general');
    if(!rightOpen) setRightOpen(true);
  };

  const moveField = (fromId: string, toIndex: number, isCopy: boolean) => {
      setFormDef(produce(draft => {
          const fromIndex = draft.fields.findIndex(f => f.id === fromId);
          if (fromIndex === -1) return;
          
          const itemToMove = draft.fields[fromIndex];

          if (!isCopy && (toIndex === fromIndex || toIndex === fromIndex + 1)) return;

          let target = toIndex;
          
          if (isCopy) {
              const clone = { ...itemToMove, id: `f-${Date.now()}`, key: `${itemToMove.key}_copy`, label: `${itemToMove.label} (Copy)` };
              draft.fields.splice(target, 0, clone);
              setSelectedFieldId(clone.id);
          } else {
              draft.fields.splice(fromIndex, 1);
              if (fromIndex < toIndex) target -= 1;
              draft.fields.splice(target, 0, itemToMove);
          }
      }));
  };

  const duplicateField = (id: string) => {
      const idx = formDef.fields.findIndex(f => f.id === id);
      if (idx !== -1) moveField(id, idx + 1, true);
      setContextMenu(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormDef(produce(draft => {
      const field = draft.fields.find(f => f.id === id);
      if (field) Object.assign(field, updates);
    }));
  };

  const deleteField = (id: string) => {
    if (formDef.fields.find(f => f.id === id)?.type === 'divider' && !window.confirm('Delete section?')) return;
    setFormDef(produce(draft => { draft.fields = draft.fields.filter(f => f.id !== id); }));
    setSelectedFieldId(null);
    setContextMenu(null);
  };

  const handleSave = async () => {
    if (!formDef.name.trim()) {
        addNotification('error', 'Please provide a form title.');
        return;
    }
    await saveForm({ ...formDef, lastModified: new Date().toISOString() });
    navigateTo('forms');
  };

  const selectedField = formDef.fields.find(f => f.id === selectedFieldId);

  const updateNested = <T,>(key: keyof FormField, nestedUpdates: Partial<T>) => {
      if (!selectedField) return;
      const current = selectedField[key] as unknown as T || {};
      updateField(selectedField.id, { [key]: { ...current, ...nestedUpdates } });
  };

  const updateValidation = (val: Partial<FormValidation>) => updateNested('validation', val);
  const updateLayout = (val: Partial<FormFieldLayout>) => updateNested('layout', val);
  const updateAppearance = (val: Partial<FormFieldAppearance>) => updateNested('appearance', val);
  const updateDataSource = (val: Partial<FormDataSource>) => updateNested('dataSource', val);
  const updateBehavior = (val: Partial<FormBehavior>) => updateNested('behavior', val);

  const toggleVisibilityRule = (enabled: boolean) => {
      if (!selectedField) return;
      if (enabled) {
          updateField(selectedField.id, { visibility: { targetFieldKey: '', operator: 'eq', value: '' } });
      } else {
          updateField(selectedField.id, { visibility: undefined });
      }
  }

  const handleDragStartLibrary = (e: React.DragEvent, type: FormFieldType) => {
      setDragInfo({ type: 'library', fieldType: type });
      e.dataTransfer.effectAllowed = 'copy';
      if (rightOpen) setRightOpen(false);
  };

  const handleDragStartField = (e: React.DragEvent, id: string) => {
      e.stopPropagation();
      setDragInfo({ type: 'field', id });
      e.dataTransfer.effectAllowed = e.ctrlKey ? 'copy' : 'move';
      setSelectedFieldId(id);
  };

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!dragInfo) return;

      const scrollThreshold = 60;
      const scrollSpeed = 10;
      if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const mouseY = e.clientY;
          
          if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = null;

          if (mouseY < rect.top + scrollThreshold) {
              scrollIntervalRef.current = setInterval(() => {
                  if (canvasRef.current) canvasRef.current.scrollTop -= scrollSpeed;
              }, 16);
          } else if (mouseY > rect.bottom - scrollThreshold) {
              scrollIntervalRef.current = setInterval(() => {
                  if (canvasRef.current) canvasRef.current.scrollTop += scrollSpeed;
              }, 16);
          }
      }

      if (dropIndex !== index) setDropIndex(index);
      if (e.ctrlKey !== isCopyMode) setIsCopyMode(e.ctrlKey);
  }, [dropIndex, dragInfo, formDef.fields, isCopyMode]);

  const handleDrop = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);

      if (!dragInfo) return;

      if (dragInfo.type === 'library' && dragInfo.fieldType) {
          addField(dragInfo.fieldType, index);
      } else if (dragInfo.type === 'field' && dragInfo.id) {
          const isCopy = e.ctrlKey || e.metaKey;
          moveField(dragInfo.id, index, isCopy);
      }

      setDragInfo(null);
      setDropIndex(null);
      setIsCopyMode(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
          setSelectedFieldId(null);
          setContextMenu(null);
      }
  };

  const handleContextMenu = (e: React.MouseEvent, fieldId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, fieldId });
      setSelectedFieldId(fieldId);
  };

  // Converted from inline component to render function
  const renderDropZone = (index: number) => {
      const isActive = dropIndex === index && dragInfo !== null;
      
      const draggedFieldIndex = dragInfo?.type === 'field' ? formDef.fields.findIndex(f => f.id === dragInfo.id) : -1;
      const isRedundant = dragInfo?.type === 'field' && !isCopyMode && (index === draggedFieldIndex || index === draggedFieldIndex + 1);

      if (isRedundant && isActive) {
          return <div key={`drop-${index}`} className="h-2 transition-all" />; 
      }

      return (
          <div 
            key={`drop-${index}`}
            className={`w-full transition-all duration-200 rounded-sm ${isActive ? 'h-12 my-2 border-2 border-dashed flex items-center justify-center' : 'h-3 hover:h-5'}`}
            style={{ 
                borderColor: isActive ? (isCopyMode ? '#10b981' : '#3b82f6') : 'transparent',
                backgroundColor: isActive ? (isCopyMode ? '#ecfdf5' : '#eff6ff') : 'transparent'
            }}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
          >
              {isActive && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest pointer-events-none flex items-center gap-2 ${isCopyMode ? 'text-emerald-600' : 'text-blue-500'}`}>
                      {isCopyMode ? <Copy size={12}/> : <MousePointerClick size={12}/>}
                      {isCopyMode ? 'Copy Here' : 'Move Here'}
                  </span>
              )}
          </div>
      );
  };

  const categories = Array.from(new Set(FIELD_TYPES.map(f => f.category)));

  return (
    <FormPageLayout title={formDef.name || "Form Designer"} onBack={() => navigateTo('forms')} onSave={handleSave} saveLabel="Publish Form" fullWidth>
      <div className="flex h-full relative overflow-hidden" onClick={() => setContextMenu(null)}>
        
        {/* Left: Palette */}
        <div className={`border-r border-slate-200 bg-slate-50 flex flex-col transition-all duration-300 ${leftOpen ? 'w-[260px]' : 'w-0 overflow-hidden'}`}>
           <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-xs font-bold text-slate-500 uppercase">Field Library</h3>
              <button onClick={() => setLeftOpen(false)} className="text-slate-400 hover:text-slate-600"><PanelLeft size={14}/></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-6 select-none">
             {categories.map(cat => (
               <div key={cat}>
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{cat}</h4>
                 <div className="grid grid-cols-2 gap-2">
                   {FIELD_TYPES.filter(ft => ft.category === cat).map(ft => (
                     <div 
                       key={ft.type} 
                       draggable
                       onDragStart={(e) => handleDragStartLibrary(e, ft.type)}
                       onClick={() => addField(ft.type)}
                       className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-sm hover:border-blue-400 hover:shadow-sm transition-all text-center group h-20 cursor-grab active:cursor-grabbing"
                       title={`Drag to add ${ft.label}`}
                     >
                       <ft.icon size={20} className="text-slate-500 group-hover:text-blue-600"/>
                       <span className="text-[10px] font-bold text-slate-700 leading-tight">{ft.label}</span>
                     </div>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-slate-100 flex flex-col min-w-0 relative">
           {/* Canvas Toolbar */}
           <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-10">
              <div className="flex items-center gap-2">
                 {!leftOpen && <button onClick={() => setLeftOpen(true)} className="p-1.5 hover:bg-slate-50 rounded text-slate-500" title="Open Library"><PanelLeft size={16}/></button>}
              </div>
              <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-sm">
                 <div className="flex items-center gap-2 border-r border-slate-300 pr-2 mr-2">
                    <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded-sm transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`} title="Desktop View"><Monitor size={14}/></button>
                    <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded-sm transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`} title="Mobile View"><Smartphone size={14}/></button>
                 </div>
                 <button 
                    onClick={() => setFormDef(d => ({ ...d, layoutMode: d.layoutMode === 'wizard' ? 'single' : 'wizard' }))} 
                    className={`flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-bold transition-all ${formDef.layoutMode === 'wizard' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                 >
                    <Forward size={14}/> Wizard Mode
                 </button>
              </div>
              <div className="flex items-center gap-2">
                 {!rightOpen && <button onClick={() => setRightOpen(true)} className="p-1.5 hover:bg-slate-50 rounded text-slate-500" title="Open Properties"><PanelRight size={16}/></button>}
              </div>
           </div>

           {/* Canvas Scroll Area */}
           <div 
             ref={canvasRef}
             className="flex-1 overflow-y-auto p-8 relative scroll-smooth"
             onDragOver={(e) => { e.preventDefault(); }} 
             onClick={handleCanvasClick}
           >
              <div 
                className={`bg-white shadow-sm min-h-[800px] mx-auto rounded-sm border border-slate-200 flex flex-col transition-all duration-300 relative ${previewMode === 'mobile' ? 'max-w-[375px] border-x-4 border-x-slate-800 my-4 shadow-xl' : 'w-full max-w-4xl p-8'}`}
              >
                 
                 <div className={`mb-8 border-b border-slate-100 pb-6 ${previewMode === 'mobile' ? 'p-6' : ''}`}>
                    <input 
                      className="text-2xl font-bold text-slate-900 w-full outline-none placeholder:text-slate-300 bg-transparent" 
                      value={formDef.name} 
                      onChange={e => setFormDef({...formDef, name: e.target.value})}
                      placeholder="Form Title"
                    />
                    <input 
                      className="text-sm text-slate-500 w-full outline-none mt-2 bg-transparent" 
                      value={formDef.description} 
                      onChange={e => setFormDef({...formDef, description: e.target.value})}
                      placeholder="Enter form description..."
                    />
                 </div>

                 {formDef.fields.length === 0 && (
                   <div 
                        className="flex flex-col items-center justify-center py-20 text-slate-300 flex-1 border-2 border-dashed border-slate-100 rounded-sm m-4"
                        onDragOver={(e) => handleDragOver(e, 0)}
                        onDrop={(e) => handleDrop(e, 0)}
                   >
                      <Type size={48} className="mb-4 opacity-50"/>
                      <p className="text-sm font-medium">Form canvas is empty.</p>
                      <p className="text-xs mt-1">Drag fields here or click library items.</p>
                   </div>
                 )}

                 <div className={`flex flex-wrap content-start ${previewMode === 'mobile' ? 'px-4 pb-4' : 'gap-y-0'}`}>
                    {/* Initial Drop Zone */}
                    {renderDropZone(0)}

                    {formDef.fields.map((field, idx) => (
                    <React.Fragment key={field.id}>
                        <div 
                            className={`relative group p-1 transition-all ${dragInfo?.id === field.id ? 'opacity-50 scale-95' : 'opacity-100'}`}
                            style={{ width: previewMode === 'mobile' ? '100%' : (field.layout?.width || '100%') }}
                            onClick={(e) => { e.stopPropagation(); setSelectedFieldId(field.id); if(!rightOpen) setRightOpen(true); }}
                            onContextMenu={(e) => handleContextMenu(e, field.id)}
                            draggable
                            onDragStart={(e) => handleDragStartField(e, field.id)}
                        >
                            <div className={`relative rounded-sm border p-3 cursor-pointer ${selectedFieldId === field.id ? 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-500/20 z-10' : 'border-transparent hover:border-slate-300 hover:bg-slate-50'}`}>
                                <div className="flex items-center justify-between mb-2 select-none">
                                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={14} className="text-slate-300 hover:text-slate-600"/>
                                        {field.label} 
                                        {field.required && <span className="text-rose-500" title="Required">*</span>}
                                        {field.visibility && <EyeOff size={14} className="text-amber-500" title="Conditional Visibility"/>}
                                        {field.validation?.pattern && <AlertTriangle size={14} className="text-blue-500" title="Custom Validation"/>}
                                        {field.behavior?.readOnly && <Lock size={12} className="text-slate-400"/>}
                                    </label>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }} className="text-slate-400 hover:bg-slate-100 hover:text-blue-600 p-1.5 rounded" title="Duplicate (Ctrl+Drag)"><Copy size={14}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteField(field.id); }} className="text-rose-500 hover:bg-rose-100 p-1.5 rounded" title="Delete"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                                
                                {/* Interactive Preview of the Field */}
                                <div className="w-full pointer-events-none opacity-80">
                                    {field.type === 'divider' ? (
                                        <div className="w-full my-4 flex items-center gap-2">
                                            <div className="h-px bg-slate-300 flex-1"></div>
                                            {formDef.layoutMode === 'wizard' && <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">PAGE BREAK</span>}
                                            <div className="h-px bg-slate-300 flex-1"></div>
                                        </div>
                                    ) :
                                    field.type === 'rating' ? <div className="flex gap-1 text-slate-300"><Star size={16} /><Star size={16} /><Star size={16} /><Star size={16} /><Star size={16} /></div> :
                                    field.type === 'slider' ? <div className="w-full h-1 bg-slate-200 rounded my-3 relative"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full"></div></div> :
                                    field.type === 'tags' ? <div className="flex gap-1"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200">Tag 1</span><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200">Tag 2</span></div> :
                                    field.type === 'rich-text' ? <div className="p-3 bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-400">Rich text content area...</div> :
                                    field.type === 'color' ? <div className="w-8 h-8 rounded border border-slate-300 bg-black"></div> :
                                    <div className={`bg-slate-50 border border-slate-300 rounded-sm w-full flex items-center px-3 text-sm text-slate-400 ${field.type === 'textarea' ? 'h-20 items-start pt-2' : 'h-9'}`}>
                                        {field.appearance?.prefix && <span className="mr-2 text-slate-500 font-bold">{field.appearance.prefix}</span>}
                                        {field.defaultValue || field.placeholder || `Enter ${field.label}...`}
                                        {field.appearance?.suffix && <span className="ml-auto text-slate-500 font-bold">{field.appearance.suffix}</span>}
                                    </div>
                                    }
                                </div>
                                
                                {field.helpText && (
                                    <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>
                                )}

                                {field.id === selectedFieldId && <div className="absolute -left-[1px] top-0 bottom-0 w-1 bg-blue-500 rounded-l-sm"></div>}
                            </div>
                        </div>
                        {/* Drop Zone After Item */}
                        {renderDropZone(idx + 1)}
                    </React.Fragment>
                    ))}
                 </div>
              </div>
           </div>
           
           {/* Context Menu Overlay */}
           {contextMenu && (
               <div 
                 className="fixed z-50 bg-white border border-slate-200 rounded-sm shadow-xl min-w-[160px] py-1 flex flex-col animate-fade-in"
                 style={{ top: contextMenu.y, left: contextMenu.x }}
               >
                   <button onClick={() => { setSelectedFieldId(contextMenu.fieldId); if(!rightOpen) setRightOpen(true); setContextMenu(null); }} className="px-4 py-2 text-xs text-left hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"><Settings size={14}/> Properties</button>
                   <button onClick={() => duplicateField(contextMenu.fieldId)} className="px-4 py-2 text-xs text-left hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"><Copy size={14}/> Duplicate</button>
                   <div className="h-px bg-slate-100 my-1"></div>
                   <button onClick={() => deleteField(contextMenu.fieldId)} className="px-4 py-2 text-xs text-left hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2"><Trash2 size={14}/> Delete</button>
               </div>
           )}
        </div>

        {/* Right: Properties */}
        <div className={`border-l border-slate-200 bg-white flex flex-col shadow-xl z-10 shrink-0 transition-all duration-300 ${rightOpen ? 'w-[320px]' : 'w-0 overflow-hidden'}`}>
           <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                 <Settings size={14}/> Properties
              </h3>
              <button onClick={() => setRightOpen(false)} className="text-slate-400 hover:text-slate-600"><PanelRight size={14}/></button>
           </div>
           
           {selectedField ? (
             <div className="flex flex-col h-full overflow-hidden">
                <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                    {['general', 'appearance', 'data', 'validation', 'logic'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setActiveTab(t as any)} 
                            className={`px-3 py-3 text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeTab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 bg-slate-50 hover:text-slate-800'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="p-5 space-y-5 overflow-y-auto flex-1">
                    {/* --- GENERAL TAB --- */}
                    {activeTab === 'general' && (
                        <>
                            <NexFormGroup label="Field Label">
                                <input className="prop-input font-bold" value={selectedField.label} onChange={e => updateField(selectedField.id, { label: e.target.value })} />
                            </NexFormGroup>
                            
                            <NexFormGroup label="Variable Key" helpText="Unique ID for data binding">
                                <input className="prop-input font-mono text-xs" value={selectedField.key} onChange={e => updateField(selectedField.id, { key: e.target.value })} />
                            </NexFormGroup>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <NexFormGroup label="Placeholder">
                                    <input className="prop-input" value={selectedField.placeholder || ''} onChange={e => updateField(selectedField.id, { placeholder: e.target.value })} />
                                </NexFormGroup>
                                <NexFormGroup label="Default Value">
                                    <input className="prop-input" value={selectedField.defaultValue || ''} onChange={e => updateField(selectedField.id, { defaultValue: e.target.value })} />
                                </NexFormGroup>
                            </div>

                            <NexFormGroup label="Help Text">
                                <input className="prop-input" value={selectedField.helpText || ''} onChange={e => updateField(selectedField.id, { helpText: e.target.value })} />
                            </NexFormGroup>
                            
                            <div className="pt-4 border-t border-slate-100">
                                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-sm">
                                    <input type="checkbox" checked={selectedField.required} onChange={e => updateField(selectedField.id, { required: e.target.checked })} className="text-blue-600 rounded-sm w-4 h-4" />
                                    <span className="text-sm font-medium text-slate-700">Required Field</span>
                                </label>
                            </div>
                        </>
                    )}

                    {/* --- APPEARANCE TAB --- */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-5">
                            <NexFormGroup label="Column Width">
                                <div className="flex gap-2">
                                    {[
                                        { l: 'Full', w: '100%', icon: LayoutGrid },
                                        { l: '1/2', w: '50%', icon: Columns },
                                        { l: '1/3', w: '33%', icon: Columns } 
                                    ].map(opt => (
                                        <button 
                                            key={opt.w}
                                            onClick={() => updateLayout({ width: opt.w as any })}
                                            className={`flex-1 py-2 rounded-sm border text-xs font-bold flex flex-col items-center gap-1 ${selectedField.layout?.width === opt.w ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <opt.icon size={14}/> {opt.l}
                                        </button>
                                    ))}
                                </div>
                            </NexFormGroup>

                            {(selectedField.type === 'text' || selectedField.type === 'number') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <NexFormGroup label="Prefix" helpText="e.g. $">
                                        <input className="prop-input" value={selectedField.appearance?.prefix || ''} onChange={e => updateAppearance({ prefix: e.target.value })} />
                                    </NexFormGroup>
                                    <NexFormGroup label="Suffix" helpText="e.g. USD">
                                        <input className="prop-input" value={selectedField.appearance?.suffix || ''} onChange={e => updateAppearance({ suffix: e.target.value })} />
                                    </NexFormGroup>
                                </div>
                            )}
                            
                            <NexFormGroup label="Icon Class" helpText="Lucide icon name">
                                <input className="prop-input" value={selectedField.appearance?.icon || ''} onChange={e => updateAppearance({ icon: e.target.value })} />
                            </NexFormGroup>
                        </div>
                    )}

                    {/* --- DATA TAB --- */}
                    {activeTab === 'data' && (
                        <div className="space-y-5">
                            {(selectedField.type === 'select' || selectedField.type === 'tags') && (
                                <>
                                    <NexFormGroup label="Data Source">
                                        <div className="flex gap-2 mb-2">
                                            <button 
                                                onClick={() => updateDataSource({ type: 'static' })} 
                                                className={`flex-1 py-1 text-xs border rounded-sm ${(!selectedField.dataSource || selectedField.dataSource.type === 'static') ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}
                                            >Static List</button>
                                            <button 
                                                onClick={() => updateDataSource({ type: 'api' })} 
                                                className={`flex-1 py-1 text-xs border rounded-sm ${(selectedField.dataSource?.type === 'api') ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}
                                            >API Endpoint</button>
                                        </div>
                                        
                                        {selectedField.dataSource?.type === 'api' ? (
                                            <div className="space-y-3 p-3 bg-slate-50 border rounded-sm">
                                                <NexFormGroup label="Endpoint URL">
                                                    <div className="flex items-center gap-1">
                                                        <Globe size={14} className="text-slate-400"/>
                                                        <input className="prop-input text-xs" placeholder="https://api..." value={selectedField.dataSource.endpoint || ''} onChange={e => updateDataSource({ endpoint: e.target.value })} />
                                                    </div>
                                                </NexFormGroup>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input className="prop-input text-xs" placeholder="Label Key" value={selectedField.dataSource.labelKey || ''} onChange={e => updateDataSource({ labelKey: e.target.value })} />
                                                    <input className="prop-input text-xs" placeholder="Value Key" value={selectedField.dataSource.valueKey || ''} onChange={e => updateDataSource({ valueKey: e.target.value })} />
                                                </div>
                                            </div>
                                        ) : (
                                            <textarea 
                                                className="prop-input h-24 font-mono text-xs" 
                                                value={selectedField.options?.join(',')} 
                                                onChange={e => updateField(selectedField.id, { options: e.target.value.split(',').map(s => s.trim()) })} 
                                                placeholder="Option 1, Option 2, Option 3"
                                            />
                                        )}
                                    </NexFormGroup>
                                </>
                            )}
                            {selectedField.type !== 'select' && selectedField.type !== 'tags' && (
                                <div className="text-center p-4 text-slate-400 italic text-xs">
                                    No data options for this field type.
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- VALIDATION TAB --- */}
                    {activeTab === 'validation' && (
                        <div className="space-y-5">
                            {(selectedField.type === 'number' || selectedField.type === 'slider' || selectedField.type === 'rating' || selectedField.type === 'text') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <NexFormGroup label="Min / Length">
                                        <input type="number" className="prop-input" value={selectedField.validation?.min || ''} onChange={e => updateValidation({ min: parseInt(e.target.value) || undefined })} />
                                    </NexFormGroup>
                                    <NexFormGroup label="Max / Length">
                                        <input type="number" className="prop-input" value={selectedField.validation?.max || ''} onChange={e => updateValidation({ max: parseInt(e.target.value) || undefined })} />
                                    </NexFormGroup>
                                </div>
                            )}
                            
                            {(selectedField.type === 'text' || selectedField.type === 'email' || selectedField.type === 'textarea') && (
                                <NexFormGroup label="Regex Pattern" helpText="JavaScript RegExp compatible">
                                    <input className="prop-input font-mono text-xs" placeholder="^[A-Z0-9._%+-]+@[A-Z0-9.-]+$" value={selectedField.validation?.pattern || ''} onChange={e => updateValidation({ pattern: e.target.value })} />
                                </NexFormGroup>
                            )}

                            {selectedField.type === 'file' && (
                                <div className="space-y-4">
                                    <NexFormGroup label="Allowed Types (Accept)">
                                        <input className="prop-input" placeholder=".pdf,.jpg,image/*" value={selectedField.validation?.accept || ''} onChange={e => updateValidation({ accept: e.target.value })} />
                                    </NexFormGroup>
                                    <NexFormGroup label="Max Size (Bytes)">
                                        <input type="number" className="prop-input" placeholder="1048576" value={selectedField.validation?.maxSize || ''} onChange={e => updateValidation({ maxSize: parseInt(e.target.value) })} />
                                    </NexFormGroup>
                                </div>
                            )}
                            
                            <NexFormGroup label="Custom Error Message">
                                <textarea className="prop-input h-20 resize-none" placeholder="Please enter a valid value..." value={selectedField.validation?.message || ''} onChange={e => updateValidation({ message: e.target.value })} />
                            </NexFormGroup>
                        </div>
                    )}

                    {/* --- LOGIC TAB --- */}
                    {activeTab === 'logic' && (
                        <div className="space-y-5">
                            {/* Behaviors */}
                            <div className="space-y-2 mb-4 p-3 bg-slate-50 rounded-sm border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Behavior</h4>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-slate-700">Read Only</span>
                                    <input type="checkbox" checked={selectedField.behavior?.readOnly || false} onChange={e => updateBehavior({ readOnly: e.target.checked })} className="rounded-sm text-blue-600"/>
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-slate-700">Disabled</span>
                                    <input type="checkbox" checked={selectedField.behavior?.disabled || false} onChange={e => updateBehavior({ disabled: e.target.checked })} className="rounded-sm text-blue-600"/>
                                </label>
                            </div>

                            <NexFormGroup label="Calculation Formula" helpText="e.g. {{price}} * {{quantity}}">
                                <div className="flex items-center gap-2">
                                    <Calculator size={16} className="text-slate-400"/>
                                    <input className="prop-input font-mono text-xs" value={selectedField.behavior?.calculation || ''} onChange={e => updateBehavior({ calculation: e.target.value })} />
                                </div>
                            </NexFormGroup>

                            <div className="h-px bg-slate-200 my-2"></div>

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-700 uppercase">Visibility Logic</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={!!selectedField.visibility} onChange={e => toggleVisibilityRule(e.target.checked)} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {selectedField.visibility ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm space-y-4 animate-slide-up">
                                    <NexFormGroup label="Dependent On Field">
                                        <select className="prop-input" value={selectedField.visibility.targetFieldKey} onChange={e => { updateField(selectedField.id, { visibility: { ...selectedField.visibility, targetFieldKey: e.target.value } as any }) }}>
                                            <option value="">Select Field...</option>
                                            {formDef.fields.filter(f => f.id !== selectedField.id).map(f => (
                                                <option key={f.key} value={f.key}>{f.label} ({f.key})</option>
                                            ))}
                                        </select>
                                    </NexFormGroup>
                                    <div className="grid grid-cols-2 gap-3">
                                        <NexFormGroup label="Operator">
                                            <select className="prop-input" value={selectedField.visibility.operator} onChange={e => updateField(selectedField.id, { visibility: { ...selectedField.visibility, operator: e.target.value as any } as any })}>
                                                <option value="eq">Equals</option>
                                                <option value="neq">Not Equals</option>
                                                <option value="contains">Contains</option>
                                                <option value="truthy">Is True/Present</option>
                                                <option value="falsy">Is False/Empty</option>
                                            </select>
                                        </NexFormGroup>
                                        {(selectedField.visibility.operator !== 'truthy' && selectedField.visibility.operator !== 'falsy') && (
                                            <NexFormGroup label="Value Match">
                                                <input className="prop-input" value={selectedField.visibility.value || ''} onChange={e => updateField(selectedField.id, { visibility: { ...selectedField.visibility, value: e.target.value } as any })} />
                                            </NexFormGroup>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-6 border border-dashed border-slate-200 rounded-sm text-slate-400 text-xs">
                                    Always visible.
                                </div>
                            )}
                        </div>
                    )}
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
                <Settings size={32} className="mb-3 opacity-20"/>
                <p className="text-xs font-bold uppercase tracking-wider">Select a field</p>
                <p className="text-[10px] mt-1">Configure properties here.</p>
             </div>
           )}
        </div>

      </div>
    </FormPageLayout>
  );
};