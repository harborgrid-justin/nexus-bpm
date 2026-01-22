
import React, { useState, useEffect } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { useTheme } from '../contexts/ThemeContext';
import { Plus, Layout, Edit, Trash2, Copy, FileText, Settings, GripVertical } from 'lucide-react';
import { NexButton, NexCard } from './shared/NexUI';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const FormRepository: React.FC = () => {
  const { forms, navigateTo, deleteForm, saveForm, setToolbarConfig } = useBPM();
  const { gridConfig } = useTheme();
  const [isEditable, setIsEditable] = useState(false);

  const defaultLayouts = {
      lg: [
          { i: 'header', x: 0, y: 0, w: 12, h: 4 },
          { i: 'grid', x: 0, y: 4, w: 12, h: 20 }
      ],
      md: [
          { i: 'header', x: 0, y: 0, w: 10, h: 4 },
          { i: 'grid', x: 0, y: 4, w: 10, h: 20 }
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

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-4 px-4 pb-10">
        <ResponsiveGridLayout className="layout" layouts={layouts} breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }} rowHeight={gridConfig.rowHeight} margin={gridConfig.margin} isDraggable={isEditable} isResizable={isEditable} draggableHandle=".drag-handle" onLayoutChange={(curr, all) => setLayouts(all)}>
            <NexCard key="header" dragHandle={isEditable} className="p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Form Registry</h2>
                    <p className="text-xs text-slate-500 font-medium">Manage user interaction interfaces.</p>
                </div>
                <NexButton variant="primary" icon={Plus} onClick={() => navigateTo('form-designer')}>New Form</NexButton>
            </NexCard>

            <div key="grid" className="overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {forms.map(form => (
                    <div key={form.id} className="bg-white border border-slate-300 rounded-sm p-5 shadow-sm hover:shadow-md transition-all group flex flex-col h-48">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-sm border border-blue-100"><Layout size={20}/></div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => navigateTo('form-designer', form.id)} className="p-1.5 hover:bg-slate-100 rounded text-blue-600" title="Edit"><Edit size={14}/></button>
                                <button onClick={() => handleDuplicate(form)} className="p-1.5 hover:bg-slate-100 rounded text-indigo-600" title="Duplicate"><Copy size={14}/></button>
                                <button onClick={() => { if(confirm('Delete this form?')) deleteForm(form.id); }} className="p-1.5 hover:bg-slate-100 rounded text-rose-600" title="Delete"><Trash2 size={14}/></button>
                            </div>
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">{form.name}</h3>
                        <p className="text-xs text-slate-500 leading-snug line-clamp-2 flex-1">{form.description || "No description provided."}</p>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1"><FileText size={12}/> {form.fields.length} Fields</span>
                            <span>v{form.version}.0</span>
                        </div>
                    </div>
                    ))}
                    {forms.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-sm bg-slate-50"><p className="text-xs font-bold uppercase">No forms defined yet.</p></div>}
                </div>
            </div>
        </ResponsiveGridLayout>
    </div>
  );
};
