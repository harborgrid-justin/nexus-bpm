
import React, { useState, useEffect } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { FormPageLayout } from '../shared/PageTemplates';
import { NexFormGroup } from '../shared/NexUI';
import { Permission } from '../../types';

// --- USER FORM ---
export const UserFormView = () => {
  const { navigateTo, createUser, updateUser, users, roles, groups, nav, currentUser } = useBPM();
  const isEdit = nav.view === 'edit-user';
  const existingUser = isEdit ? users.find(u => u.id === nav.selectedId) : null;

  const [form, setForm] = useState({ name: '', email: '', roleId: '', groupId: '', location: '', skills: '' });

  useEffect(() => {
    if (existingUser) {
      setForm({
        name: existingUser.name,
        email: existingUser.email,
        roleId: existingUser.roleIds[0] || '',
        groupId: existingUser.groupIds[0] || '',
        location: existingUser.location,
        skills: existingUser.skills.join(', ')
      });
    }
  }, [existingUser]);

  const handleSave = async () => {
    const payload = {
        name: form.name,
        email: form.email,
        roleIds: [form.roleId],
        groupIds: [form.groupId],
        location: form.location,
        skills: form.skills.split(',').map(s => s.trim()),
        status: 'Active' as const,
        domainId: currentUser?.domainId || 'GLOBAL'
    };

    if (isEdit && nav.selectedId) {
        await updateUser(nav.selectedId, payload);
    } else {
        await createUser(payload);
    }
    navigateTo('identity');
  };

  return (
    <FormPageLayout 
      title={isEdit ? "Edit Principal" : "Provision Identity"} 
      subtitle="Manage user access and organizational attributes."
      onBack={() => navigateTo('identity')} 
      onSave={handleSave}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
            <NexFormGroup label="Full Name">
                <input className="prop-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Sarah Connor" />
            </NexFormGroup>
            <NexFormGroup label="Email Address">
                <input type="email" className="prop-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="corp@nexflow.com" />
            </NexFormGroup>
        </div>
        <div className="grid grid-cols-2 gap-6">
            <NexFormGroup label="Primary Role">
                <select className="prop-input" value={form.roleId} onChange={e => setForm({...form, roleId: e.target.value})}>
                    <option value="">Select Role...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </NexFormGroup>
            <NexFormGroup label="Department Group">
                <select className="prop-input" value={form.groupId} onChange={e => setForm({...form, groupId: e.target.value})}>
                    <option value="">Select Group...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </NexFormGroup>
        </div>
        <NexFormGroup label="Office Location">
            <input className="prop-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. London HQ" />
        </NexFormGroup>
        <NexFormGroup label="Skills (CSV)">
            <input className="prop-input" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="BPMN, Audit, Java..." />
        </NexFormGroup>
      </div>
    </FormPageLayout>
  );
};

// --- ROLE FORM ---
export const RoleFormView = () => {
  const { navigateTo, createRole, updateRole, roles, nav } = useBPM();
  const isEdit = nav.view === 'edit-role';
  const existingRole = isEdit ? roles.find(r => r.id === nav.selectedId) : null;

  const [form, setForm] = useState({ name: '', permissions: [] as Permission[] });

  useEffect(() => {
    if (existingRole) {
      setForm({ name: existingRole.name, permissions: existingRole.permissions });
    }
  }, [existingRole]);

  const togglePermission = (p: Permission) => {
    if (form.permissions.includes(p)) {
        setForm({ ...form, permissions: form.permissions.filter(x => x !== p) });
    } else {
        setForm({ ...form, permissions: [...form.permissions, p] });
    }
  };

  const handleSave = async () => {
    if (isEdit && nav.selectedId) {
        await updateRole(nav.selectedId, form);
    } else {
        await createRole(form);
    }
    navigateTo('identity');
  };

  return (
    <FormPageLayout 
      title={isEdit ? "Edit Role" : "Define RBAC Role"} 
      subtitle="Configure granular permission scopes."
      onBack={() => navigateTo('identity')} 
      onSave={handleSave}
    >
      <div className="space-y-6">
        <NexFormGroup label="Role Name">
            <input className="prop-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Compliance Auditor" />
        </NexFormGroup>
        <NexFormGroup label="Permission Scopes">
            <div className="grid grid-cols-2 gap-3 p-4 border border-slate-200 rounded-sm bg-slate-50">
                {Object.values(Permission).map(p => (
                    <label key={p} className="flex items-center gap-3 p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-sm cursor-pointer transition-all">
                        <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePermission(p)} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-xs font-medium text-slate-700">{p}</span>
                    </label>
                ))}
            </div>
        </NexFormGroup>
      </div>
    </FormPageLayout>
  );
};

// --- GROUP FORM ---
export const GroupFormView = () => {
  const { navigateTo, createGroup, updateGroup, groups, nav } = useBPM();
  const isEdit = nav.view === 'edit-group';
  const existingGroup = isEdit ? groups.find(g => g.id === nav.selectedId) : null;

  const [form, setForm] = useState({ name: '', parentGroupId: '', description: '' });

  useEffect(() => {
    if (existingGroup) {
      setForm({ name: existingGroup.name, parentGroupId: existingGroup.parentGroupId || '', description: existingGroup.description });
    }
  }, [existingGroup]);

  const handleSave = async () => {
    if (isEdit && nav.selectedId) {
        await updateGroup(nav.selectedId, form);
    } else {
        await createGroup(form);
    }
    navigateTo('identity');
  };

  return (
    <FormPageLayout 
      title={isEdit ? "Edit Unit" : "Create Unit"} 
      subtitle="Establish organizational hierarchy nodes."
      onBack={() => navigateTo('identity')} 
      onSave={handleSave}
    >
      <div className="space-y-6">
        <NexFormGroup label="Unit Name">
            <input className="prop-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. APAC Sales" />
        </NexFormGroup>
        <NexFormGroup label="Parent Unit">
            <select className="prop-input" value={form.parentGroupId} onChange={e => setForm({...form, parentGroupId: e.target.value})}>
                <option value="">Root Level</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
        </NexFormGroup>
        <NexFormGroup label="Description">
            <textarea className="prop-input h-32 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Operational scope..." />
        </NexFormGroup>
      </div>
    </FormPageLayout>
  );
};

// --- DELEGATION FORM ---
export const DelegationFormView = () => {
  const { navigateTo, createDelegation, users, currentUser } = useBPM();
  const [targetId, setTargetId] = useState('');
  const [scope, setScope] = useState<'All' | 'Critical Only'>('All');

  const handleSave = async () => {
    if (!targetId) return;
    await createDelegation(targetId, scope);
    navigateTo('identity');
  };

  return (
    <FormPageLayout 
      title="Proxy Assignment" 
      subtitle="Temporarily transfer authority."
      onBack={() => navigateTo('identity')} 
      onSave={handleSave}
      saveLabel="Activate Proxy"
    >
      <div className="space-y-6">
        <NexFormGroup label="Assignee">
            <select className="prop-input" value={targetId} onChange={e => setTargetId(e.target.value)}>
                <option value="">Select User...</option>
                {users.filter(u => u.id !== currentUser?.id).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
            </select>
        </NexFormGroup>
        <NexFormGroup label="Authority Scope">
            <div className="flex gap-4">
                <button onClick={() => setScope('All')} className={`flex-1 py-3 rounded-sm text-xs font-bold border transition-all ${scope === 'All' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'}`}>Full Authority</button>
                <button onClick={() => setScope('Critical Only')} className={`flex-1 py-3 rounded-sm text-xs font-bold border transition-all ${scope === 'Critical Only' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-300'}`}>Critical Tasks Only</button>
            </div>
        </NexFormGroup>
      </div>
    </FormPageLayout>
  );
};
