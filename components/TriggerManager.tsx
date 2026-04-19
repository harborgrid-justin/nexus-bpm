
import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  Zap, Plus, Play, Pause, Trash2, Settings, 
  Bell, Mail, Globe, Database, ArrowRight, ShieldCheck,
  AlertCircle, Activity
} from 'lucide-react';
import { NexBadge, NexButton, NexCard, NexStatusBadge, NexModal, NexFormGroup } from './shared/NexUI';
import { AutomationTrigger, TaskPriority } from '../types';

export const TriggerManager: React.FC = () => {
  const { triggers, navigateTo, createTrigger, deleteTrigger, updateTrigger, addNotification } = useBPM();
  const [isAdding, setIsAdding] = useState(false);
  const [newTrigger, setNewTrigger] = useState<Omit<AutomationTrigger, 'id'>>({
    name: '',
    isEnabled: true,
    eventSource: 'Task',
    eventType: 'TASK_COMPLETE',
    conditions: { id: 'root', type: 'AND', children: [] },
    actionType: 'CreateTask',
    actionParams: {},
    cooldownPeriod: 5
  });

  const handleSave = async () => {
    if (!newTrigger.name) return;
    await createTrigger(newTrigger);
    setIsAdding(false);
    addNotification('success', 'Automation trigger established.');
  };

  const toggleTrigger = async (t: AutomationTrigger) => {
    await updateTrigger(t.id, { isEnabled: !t.isEnabled });
    addNotification('info', `Trigger ${t.isEnabled ? 'disabled' : 'enabled'}`);
  };

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between border-b border-default pb-04 mb-04 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight">Enterprise Orchestrator</h2>
          <p className="text-xs text-secondary font-medium">Configure cross-module event triggers and autonomous responders.</p>
        </div>
        <NexButton variant="primary" icon={Plus} onClick={() => setIsAdding(true)}>New Trigger</NexButton>
      </header>

      <div className="flex-1 overflow-y-auto space-y-04 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-04">
          {triggers.map(trigger => (
            <NexCard key={trigger.id} className="group relative overflow-hidden transition-all hover:shadow-lg border-l-4" style={{ borderLeftColor: trigger.isEnabled ? '#3b82f6' : '#94a3b8' }}>
              <div className="p-04">
                <div className="flex items-center justify-between mb-03">
                  <div className="flex items-center gap-02">
                    <div className={`p-1.5 rounded-sm ${trigger.isEnabled ? 'bg-blue-50 text-blue-600' : 'bg-subtle text-tertiary'}`}>
                      <Zap size={16} />
                    </div>
                    <h3 className="font-bold text-sm text-primary">{trigger.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteTrigger(trigger.id)} className="p-1.5 hover:bg-rose-50 text-tertiary hover:text-rose-600 rounded-sm">
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => toggleTrigger(trigger)} className="p-1.5 hover:bg-subtle text-tertiary hover:text-primary rounded-sm">
                      {trigger.isEnabled ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-03">
                    <div className="flex items-center gap-04">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Event Source</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Activity size={12} className="text-blue-500" />
                                <span className="text-xs font-medium text-secondary">{trigger.eventSource}</span>
                            </div>
                        </div>
                        <ArrowRight size={12} className="text-tertiary mx-2" />
                        <div className="flex flex-col text-right ml-auto">
                            <span className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Autonomous Action</span>
                            <div className="flex items-center gap-1 mt-0.5 justify-end">
                                <span className="text-xs font-bold text-blue-700">{trigger.actionType}</span>
                                <Globe size={12} className="text-emerald-500" />
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-subtle rounded-sm border border-default">
                        <div className="flex items-center gap-2 mb-2">
                             <ShieldCheck size={12} className="text-emerald-600" />
                             <span className="text-[10px] font-bold text-secondary">Conditions Met</span>
                        </div>
                        <p className="text-[11px] text-tertiary italic">
                            Evaluated logic: {trigger.conditions.children.length === 0 ? "Implicit firing on all events." : `${trigger.conditions.children.length} rule segments established.`}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-default border-dashed">
                        <div className="flex items-center gap-2 text-[10px] text-tertiary font-mono">
                            <AlertCircle size={10} />
                            Cooldown: {trigger.cooldownPeriod}m
                        </div>
                        {trigger.lastTriggered && (
                            <span className="text-[10px] text-tertiary italic">Last: {new Date(trigger.lastTriggered).toLocaleTimeString()}</span>
                        )}
                    </div>
                </div>
              </div>
            </NexCard>
          ))}
          {triggers.length === 0 && (
             <div className="col-span-full py-20 text-center bg-panel border-2 border-dashed border-default rounded-base opacity-60">
                <Zap size={48} className="mx-auto text-tertiary mb-4" />
                <h3 className="text-lg font-bold text-secondary uppercase tracking-widest">No Active Responders</h3>
                <p className="text-sm text-tertiary">Initiate an automation trigger to begin autonomous orchestration.</p>
             </div>
          )}
        </div>
      </div>

      <NexModal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Establish New Automation Responder" size="lg">
         <div className="space-y-6">
            <NexFormGroup label="Trigger Identity">
                <input className="prop-input" placeholder="e.g. Critical SLA Breach Auto-Escalation" value={newTrigger.name} onChange={e => setNewTrigger(prev => ({ ...prev, name: e.target.value }))} />
            </NexFormGroup>
            
            <div className="grid grid-cols-2 gap-4">
                <NexFormGroup label="Event Payload Source">
                    <select className="prop-input" value={newTrigger.eventSource} onChange={e => setNewTrigger(prev => ({ ...prev, eventSource: e.target.value as any }))}>
                        <option value="Task">Task Operational Data</option>
                        <option value="Case">Adaptive Case Lifecycle</option>
                        <option value="Instance">BPM Execution State</option>
                        <option value="System">Platform Telemetry</option>
                    </select>
                </NexFormGroup>
                <NexFormGroup label="Specific Event Type">
                    <select className="prop-input" value={newTrigger.eventType} onChange={e => setNewTrigger(prev => ({ ...prev, eventType: e.target.value }))}>
                        <option value="TASK_COMPLETE">On Task Finalization</option>
                        <option value="CASE_RESOLVED">On Resolution Achieved</option>
                        <option value="INSTANCE_START">On Execution Boot</option>
                        <option value="SLA_WARNING">On SLA Proximity Warning</option>
                    </select>
                </NexFormGroup>
            </div>

            <NexFormGroup label="Autonomous Action Type">
                <select className="prop-input font-bold" value={newTrigger.actionType} onChange={e => setNewTrigger(prev => ({ ...prev, actionType: e.target.value as any }))}>
                    <option value="CreateTask">Generate Follow-up Task</option>
                    <option value="StartProcess">Instantiate Process Model</option>
                    <option value="ExecuteRule">Evaluate Logic Policy</option>
                    <option value="SendEmail">Dispatch External Notification</option>
                    <option value="Webhook">Invoke Webhook URI</option>
                </select>
            </NexFormGroup>
            
            <NexButton variant="primary" className="w-full justify-center py-3" onClick={handleSave}>Activate Responder</NexButton>
         </div>
      </NexModal>
    </div>
  );
};
