
import React, { useState, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { Plus, Layout, Edit, Trash2, Copy, FileText, Settings, GripVertical, Search } from 'lucide-react';
import { NexButton } from './shared/NexUI';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const FormRepository: React.FC = () => {
  const { forms, navigateTo, deleteForm, saveForm, setToolbarConfig } = useBPM();
  const { gridConfig } = useTheme();
  const [isEditable, setIsEditable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const defaultLayouts = {
      lg: [
          { i: 'grid', x: 0, y: 0, w: 12, h: 20 }
      ],
      md: [
          { i: 'grid', x: 0, y: 0, w: 10, h: 20 }
      ]
  };
  const [layouts, setLayouts] = useState(defaultLayouts);

  useEffect(() => {
      setToolbarConfig({
          view: [
              { label: isEditable ? 'Lock Layout' : 'Edit Layout', action: () => setIsEditable(!isEditable), icon: Settings },
              { label: 'Reset Layout', action: () => setLayouts(defaultLayouts) }
          ]
      });
  }, [setToolbarConfig, isEditable]);

  const handleDuplicate = async (form: any) => {
      await saveForm({
          ...form,
          id: `form-${Date.now()}`,
          name: `${form.name} (Copy)`,
          lastModified: new Date().toISOString()
      });
  };

  const filteredForms = forms.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
        {/* Standardized Header matching ProcessRegistry */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-default pb-4 shrink-0 mb-2">
            <div>
                <h2 className="text-xl font-bold text-primary tracking-tight">Form Builder</h2>
                <p className="text-xs text-secondary font-medium">Design and manage user interaction interfaces.</p>
            </div>
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={14}/>
                    <input 
                        className="w-48 pl-9 pr-3 py-1.5 bg-subtle border border-default rounded-sm text-xs outline-none text-primary" 
                        placeholder="Search forms..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <NexButton variant="primary" icon={Plus} onClick={() => navigateTo('form-designer')}>New Form</NexButton>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
            <ResponsiveGridLayout className="layout" layouts={layouts} breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }} rowHeight={gridConfig.rowHeight} margin={gridConfig.margin} isDraggable={isEditable} isResizable={isEditable} draggableHandle=".drag-handle" onLayoutChange={(curr, all) => setLayouts(all)}>
                <div key="grid" className="overflow-y-auto p-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredForms.map(form => (
                        <div key={form.id} className="bg-panel border border-default rounded-sm p-5 shadow-sm hover:shadow-md hover:border-active transition-all group flex flex-col h-48 cursor-pointer" onClick={() => !isEditable && navigateTo('form-designer', form.id)}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-sm border border-blue-100"><Layout size={20}/></div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); navigateTo('form-designer', form.id); }} className="p-1.5 hover:bg-subtle rounded text-blue-600" title="Edit"><Edit size={14}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDuplicate(form); }} className="p-1.5 hover:bg-subtle rounded text-indigo-600" title="Duplicate"><Copy size={14}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete this form?')) deleteForm(form.id); }} className="p-1.5 hover:bg-subtle rounded text-rose-600" title="Delete"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-primary text-sm mb-1">{form.name}</h3>
                            <p className="text-xs text-secondary leading-snug line-clamp-2 flex-1">{form.description || "No description provided."}</p>
                            <div className="pt-3 border-t border-default flex items-center justify-between text-[10px] text-tertiary font-medium">
                                <span className="flex items-center gap-1"><FileText size={12}/> {form.fields.length} Fields</span>
                                <span>v{form.version}.0</span>
                            </div>
                        </div>
                        ))}
                        {forms.length === 0 && <div className="col-span-full py-12 text-center text-tertiary border-2 border-dashed border-default rounded-sm bg-subtle"><p className="text-xs font-bold uppercase">No forms defined yet.</p></div>}
                    </div>
                </div>
            </ResponsiveGridLayout>
        </div>
    </div>
  );
};
