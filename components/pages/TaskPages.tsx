
import React, { useState, useEffect } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { FormPageLayout } from '../shared/PageTemplates';
import { NexFormGroup } from '../shared/NexUI';
import { TaskPriority } from '../../types';

export const TaskReassignView = () => {
  const { navigateTo, reassignTask, users, nav } = useBPM();
  const [targetId, setTargetId] = useState('');

  const handleSave = async () => {
    if (nav.selectedId && targetId) {
        await reassignTask(nav.selectedId, targetId);
        navigateTo('inbox');
    }
  };

  return (
    <FormPageLayout title="Transfer Ownership" subtitle="Reassign this task to another principal." onBack={() => navigateTo('inbox')} onSave={handleSave} saveLabel="Transfer">
        <NexFormGroup label="New Owner">
            <select className="prop-input" value={targetId} onChange={e => setTargetId(e.target.value)}>
                <option value="">Select Principal...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
        </NexFormGroup>
    </FormPageLayout>
  );
};

export const TaskMetadataView = () => {
  const { navigateTo, updateTaskMetadata, tasks, nav } = useBPM();
  const t = tasks.find(x => x.id === nav.selectedId);
  const [priority, setPriority] = useState<TaskPriority>(t?.priority || TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState(t?.dueDate ? t.dueDate.split('T')[0] : '');

  const handleSave = async () => {
    if (t) {
        await updateTaskMetadata(t.id, { priority, dueDate: new Date(dueDate).toISOString() });
        navigateTo('inbox', t.id); // Go back to detail
    }
  };

  if (!t) return <div>Task not found</div>;

  return (
    <FormPageLayout title="Task Parameters" onBack={() => navigateTo('inbox', t.id)} onSave={handleSave}>
      <div className="space-y-6">
        <NexFormGroup label="Priority Level">
            <select className="prop-input" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
        </NexFormGroup>
        <NexFormGroup label="Due Date">
            <input type="date" className="prop-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </NexFormGroup>
      </div>
    </FormPageLayout>
  );
};
