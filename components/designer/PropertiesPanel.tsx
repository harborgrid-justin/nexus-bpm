
import React from 'react';
import { ProcessStep, UserRole } from '../../types';
import { useBPM } from '../../contexts/BPMContext';
import { MousePointer2, Trash2, Info, UserCheck, Cpu, Compass, X, ChevronDown, FunctionSquare, ExternalLink } from 'lucide-react';

const FormField = ({ label, children }: { label: string, children?: React.ReactNode }) => (
  <div className="space-y-3">
    <label className="prop-label">{label}</label>
    {children}
  </div>
);

export const PropertiesPanel = ({ 
  step, 
  onUpdate, 
  onDelete, 
  roles 
}: { 
  step: ProcessStep | undefined; 
  onUpdate: (step: ProcessStep) => void; 
  onDelete: (id: string) => void; 
  roles: UserRole[]; 
}) => {
    const { rules, decisionTables, navigateTo } = useBPM();
    
    if (!step) {
      return (
        <aside className="hidden md:flex w-full md:w-[400px] bg-white border-l border-slate-100 flex-col items-center justify-center text-center p-12 shrink-0">
          <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 relative group border border-slate-200">
            <Compass size={48} strokeWidth={1} className="text-slate-200 group-hover:text-blue-400 group-hover:rotate-12 transition-all duration-700" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tightest">Inspector</h3>
          <p className="text-[14px] font-medium text-slate-400 mt-4 leading-relaxed max-w-[240px]">Select a component on the canvas to configure its operational parameters.</p>
        </aside>
      );
    }
  
    const updateField = (field: keyof ProcessStep, value: any) => { onUpdate({ ...step, [field]: value }); };
    const updateDataField = (field: string, value: any) => { onUpdate({ ...step, data: { ...step.data, [field]: value } }); };
    const toggleSkill = (skill: string) => {
        const skills = step.requiredSkills || [];
        const newSkills = skills.includes(skill) ? skills.filter(sk => sk !== skill) : [...skills, skill];
        onUpdate({ ...step, requiredSkills: newSkills });
    };
  
    return (
      <aside className="fixed inset-0 md:relative md:inset-auto z-[200] md:z-20 w-full h-full md:w-[420px] bg-white border-l border-slate-100 flex flex-col shadow-2xl md:shadow-none animate-slide-in">
        <div className="h-24 flex items-center justify-between px-8 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Context</h3>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tightest leading-none">Inspector</h2>
          </div>
          <button 
            onClick={() => onUpdate({ ...step, id: step.id } as any)} 
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 active:scale-90 transition-all"
          >
            <X size={20}/>
          </button>
        </div>

        <div className="flex-1 p-8 space-y-10 overflow-y-auto no-scrollbar">
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-900">
               <Cpu size={16} className="text-blue-600" />
               <h4 className="text-[11px] font-black uppercase tracking-widest">Blueprint</h4>
            </div>
            <FormField label="Identity">
              <input 
                type="text" 
                className="prop-input" 
                value={step.name} 
                onChange={e => updateField('name', e.target.value)} 
              />
            </FormField>
            <FormField label="Directive">
              <textarea 
                className="prop-input h-28 resize-none"
                value={step.description} 
                onChange={e => updateField('description', e.target.value)} 
                placeholder="Operational requirements..."
              />
            </FormField>
          </section>

          {step.type === 'rules-engine-task' && (
              <section className="space-y-6 pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between text-slate-900">
                  <div className="flex items-center gap-3">
                    <FunctionSquare size={16} className="text-blue-600" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest">Logic Node</h4>
                  </div>
                  {step.data?.ruleId && (
                    <button 
                      onClick={() => navigateTo('rules', step.data.ruleId)}
                      className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline"
                    >
                      Open Editor <ExternalLink size={12}/>
                    </button>
                  )}
                </div>
                <FormField label="Linked Asset">
                  <select 
                    className="prop-input appearance-none" 
                    value={step.data?.ruleId || ''} 
                    onChange={e => updateDataField('ruleId', e.target.value)}
                  >
                    <option value="">Standard Execution</option>
                    <optgroup label="Logic Trees">
                        {rules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </optgroup>
                    <optgroup label="Tables">
                        {decisionTables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                  </select>
                </FormField>
              </section>
          )}

          <section className="space-y-6 pt-8 border-t border-slate-100 pb-10">
             <div className="flex items-center gap-3 text-slate-900">
               <UserCheck size={16} className="text-blue-600" />
               <h4 className="text-[11px] font-black uppercase tracking-widest">Governance</h4>
             </div>
             <FormField label="Execution Role">
                <select 
                  className="prop-input appearance-none" 
                  value={step.role || ''} 
                  onChange={e => updateField('role', e.target.value)}
                >
                  <option value="">Global Unassigned</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
             </FormField>
             <FormField label="Capabilities">
                <div className="flex flex-wrap gap-2 pt-2">
                   {['BPMN', 'Leadership', 'Accounting', 'Logistics', 'Audit'].map(skill => (
                     <button 
                       key={skill} 
                       onClick={() => toggleSkill(skill)} 
                       className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                         step.requiredSkills?.includes(skill) 
                           ? 'bg-slate-900 text-white border-slate-900' 
                           : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                       }`}
                     >
                       {skill}
                     </button>
                   ))}
                </div>
             </FormField>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => onDelete(step.id)} 
            className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-rose-100 text-rose-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95"
          >
            <Trash2 size={16}/> Wipe Component
          </button>
        </div>
      </aside>
    );
};
