
import React, { useState } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { FormPageLayout } from '../shared/PageTemplates';
import { NexFormGroup } from '../shared/NexUI';

export const CaseCreateView = () => {
  const { navigateTo, createCase } = useBPM();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const handleSave = async () => {
    if (!title) return;
    const newId = await createCase(title, desc);
    navigateTo('case-viewer', newId);
  };

  return (
    <FormPageLayout title="Initiate Case" subtitle="Open a new operational case file." onBack={() => navigateTo('cases')} onSave={handleSave} saveLabel="Open Case">
      <div className="space-y-6">
        <NexFormGroup label="Case Identifier">
            <input className="prop-input" placeholder="e.g. Fraud Investigation #402" value={title} onChange={e => setTitle(e.target.value)} />
        </NexFormGroup>
        <NexFormGroup label="Strategic Objective">
            <textarea className="prop-input h-40 resize-none" placeholder="Describe expected outcome..." value={desc} onChange={e => setDesc(e.target.value)} />
        </NexFormGroup>
      </div>
    </FormPageLayout>
  );
};

export const CaseEditView = () => {
  const { navigateTo, updateCase, cases, nav } = useBPM();
  const c = cases.find(x => x.id === nav.selectedId);
  const [title, setTitle] = useState(c?.title || '');
  const [desc, setDesc] = useState(c?.description || '');

  const handleSave = async () => {
    if (c) {
        await updateCase(c.id, { title, description: desc });
        navigateTo('case-viewer', c.id);
    }
  };

  if (!c) return <div>Case not found</div>;

  return (
    <FormPageLayout title="Edit Case Details" onBack={() => navigateTo('case-viewer', c.id)} onSave={handleSave}>
      <div className="space-y-6">
        <NexFormGroup label="Case Title"><input className="prop-input" value={title} onChange={e => setTitle(e.target.value)} /></NexFormGroup>
        <NexFormGroup label="Description"><textarea className="prop-input h-40 resize-none" value={desc} onChange={e => setDesc(e.target.value)} /></NexFormGroup>
      </div>
    </FormPageLayout>
  );
};

export const CasePolicyView = () => {
  const { navigateTo, addCasePolicy, nav } = useBPM();
  const [policy, setPolicy] = useState('');

  const handleSave = async () => {
    if (nav.selectedId && policy) {
        await addCasePolicy(nav.selectedId, policy);
        navigateTo('case-viewer', nav.selectedId);
    }
  };

  return (
    <FormPageLayout title="Attach Policy" subtitle="Enforce a new compliance rule on this case." onBack={() => navigateTo('case-viewer', nav.selectedId)} onSave={handleSave} saveLabel="Enforce">
      <NexFormGroup label="Policy Statement">
          <textarea className="prop-input h-40 resize-none" value={policy} onChange={e => setPolicy(e.target.value)} placeholder="e.g. All refunds > $500 must have VP approval..." />
      </NexFormGroup>
    </FormPageLayout>
  );
};

export const CaseStakeholderView = () => {
  const { navigateTo, addCaseStakeholder, users, nav } = useBPM();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('Consultant');

  const handleSave = async () => {
    if (nav.selectedId && userId) {
        await addCaseStakeholder(nav.selectedId, userId, role);
        navigateTo('case-viewer', nav.selectedId);
    }
  };

  return (
    <FormPageLayout title="Add Stakeholder" subtitle="Invite a collaborator to this case." onBack={() => navigateTo('case-viewer', nav.selectedId)} onSave={handleSave} saveLabel="Add Member">
      <div className="space-y-6">
        <NexFormGroup label="Principal">
            <select className="prop-input" value={userId} onChange={e => setUserId(e.target.value)}>
                <option value="">Select User...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
        </NexFormGroup>
        <NexFormGroup label="Case Role">
            <select className="prop-input" value={role} onChange={e => setRole(e.target.value)}>
                <option>Consultant</option><option>Approver</option><option>Auditor</option><option>Observer</option>
            </select>
        </NexFormGroup>
      </div>
    </FormPageLayout>
  );
};

export const CaseLaunchView = () => {
  const { navigateTo, startProcess, processes, nav } = useBPM();
  const [procId, setProcId] = useState('');

  const handleSave = async () => {
    if (nav.selectedId && procId) {
        await startProcess(procId, { summary: `Auto-launched from case` }, nav.selectedId);
        navigateTo('case-viewer', nav.selectedId);
    }
  };

  return (
    <FormPageLayout title="Launch Workflow" subtitle="Select a blueprint to instantiate." onBack={() => navigateTo('case-viewer', nav.selectedId)} onSave={handleSave} saveLabel="Start Workflow">
        <NexFormGroup label="Blueprint">
            <select className="prop-input" value={procId} onChange={e => setProcId(e.target.value)}>
                <option value="">Select Process...</option>
                {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </NexFormGroup>
    </FormPageLayout>
  );
};
