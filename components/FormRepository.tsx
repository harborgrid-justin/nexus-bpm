
import React from 'react';
import { useBPM } from '../contexts/BPMContext';
import { Plus, Layout, Edit, Trash2, Copy, FileText } from 'lucide-react';
import { NexButton } from './shared/NexUI';

export const FormRepository: React.FC = () => {
  const { forms, navigateTo, deleteForm, saveForm } = useBPM();

  const handleDuplicate = async (form: any) => {
      await saveForm({
          ...form,
          id: `form-${Date.now()}`,
          name: `${form.name} (Copy)`,
          lastModified: new Date().toISOString()
      });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex items-center justify-between border-b border-slate-300 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Form Registry</h2>
          <p className="text-xs text-slate-500 font-medium">Manage user interaction interfaces.</p>
        </div>
        <NexButton variant="primary" icon={Plus} onClick={() => navigateTo('form-designer')}>New Form</NexButton>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {forms.map(form => (
           <div key={form.id} className="bg-white border border-slate-300 rounded-sm p-5 shadow-sm hover:shadow-md transition-all group flex flex-col h-48">
              <div className="flex items-start justify-between mb-3">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-sm border border-blue-100">
                    <Layout size={20}/>
                 </div>
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
         {forms.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-sm bg-slate-50">
               <p className="text-xs font-bold uppercase">No forms defined yet.</p>
            </div>
         )}
      </div>
    </div>
  );
};
