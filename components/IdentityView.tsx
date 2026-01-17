
import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  Users, Shield, Landmark, UserPlus, Search, 
  MoreVertical, Key, User as UserIcon, PlusCircle, Trash2, Globe, Fingerprint, Lock,
  Clock, X, ChevronRight, ShieldAlert, CheckSquare, Plus, Edit, Slash
} from 'lucide-react';
import { Permission, User } from '../types';
import { TabBtn } from './identity/TabBtn';
import { IntegrationCard } from './identity/IntegrationCard';
import { PolicyItem } from './identity/PolicyItem';
import { NexButton, NexBadge, NexCard, NexModal, NexFormGroup } from './shared/NexUI';

export const IdentityView: React.FC = () => {
  const { users, roles, groups, delegations, hasPermission, currentUser, revokeDelegation, createDelegation, createUser, updateUser, deleteUser, createRole, updateRole, deleteRole, createGroup, updateGroup, deleteGroup } = useBPM();
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'roles' | 'groups' | 'sso'>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [showDelModal, setShowDelModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Edit Mode IDs (null = create)
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Form States
  const [delTargetId, setDelTargetId] = useState('');
  const [delScope, setDelScope] = useState<'All' | 'Critical Only'>('All');
  
  const [userForm, setUserForm] = useState({ name: '', email: '', roleId: '', groupId: '', location: '', skills: '' });
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] as Permission[] });
  const [groupForm, setGroupForm] = useState({ name: '', parentGroupId: '', description: '' });

  const canManageUsers = hasPermission(Permission.USER_MANAGE);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myDelegations = delegations.filter(d => d.fromUserId === currentUser?.id);

  // --- Handlers ---

  const openCreateUser = () => {
      setEditingUserId(null);
      setUserForm({ name: '', email: '', roleId: '', groupId: '', location: '', skills: '' });
      setShowUserModal(true);
  };

  const openEditUser = (u: User) => {
      setEditingUserId(u.id);
      setUserForm({ 
          name: u.name, 
          email: u.email, 
          roleId: u.roleIds[0] || '', 
          groupId: u.groupIds[0] || '', 
          location: u.location, 
          skills: u.skills.join(', ') 
      });
      setShowUserModal(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        name: userForm.name,
        email: userForm.email,
        roleIds: [userForm.roleId],
        groupIds: [userForm.groupId],
        location: userForm.location,
        skills: userForm.skills.split(',').map(s => s.trim()),
        status: 'Active' as const,
        domainId: currentUser?.domainId || 'GLOBAL'
    };

    if (editingUserId) {
        await updateUser(editingUserId, payload);
    } else {
        await createUser(payload);
    }
    setShowUserModal(false);
  };

  const handleDeactivateUser = async (id: string) => {
      await updateUser(id, { status: 'Terminated' });
  };

  const openCreateRole = () => {
      setEditingRoleId(null);
      setRoleForm({ name: '', permissions: [] });
      setShowRoleModal(true);
  };

  const openEditRole = (r: any) => {
      setEditingRoleId(r.id);
      setRoleForm({ name: r.name, permissions: r.permissions });
      setShowRoleModal(true);
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoleId) {
        await updateRole(editingRoleId, roleForm);
    } else {
        await createRole(roleForm);
    }
    setShowRoleModal(false);
  };

  const openCreateGroup = () => {
      setEditingGroupId(null);
      setGroupForm({ name: '', parentGroupId: '', description: '' });
      setShowGroupModal(true);
  };

  const openEditGroup = (g: any) => {
      setEditingGroupId(g.id);
      setGroupForm({ name: g.name, parentGroupId: g.parentGroupId || '', description: g.description });
      setShowGroupModal(true);
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroupId) {
        await updateGroup(editingGroupId, groupForm);
    } else {
        await createGroup(groupForm);
    }
    setShowGroupModal(false);
  };

  const togglePermission = (p: Permission) => {
    if (roleForm.permissions.includes(p)) {
        setRoleForm({ ...roleForm, permissions: roleForm.permissions.filter(x => x !== p) });
    } else {
        setRoleForm({ ...roleForm, permissions: [...roleForm.permissions, p] });
    }
  };

  const handleCreateDelegation = async () => {
    if (!delTargetId) return;
    await createDelegation(delTargetId, delScope);
    setShowDelModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative">
      <header className="flex flex-col gap-4 border-b border-slate-300 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Identity & Access</h2>
          <p className="text-xs text-slate-500 font-medium">Principal management and directory protocols.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 overflow-x-auto">
           <TabBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={UserIcon} label="My Session" />
           <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Principals" />
           <TabBtn active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} icon={Shield} label="Roles" />
           <TabBtn active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} icon={Landmark} label="Groups" />
           <TabBtn active={activeTab === 'sso'} onClick={() => setActiveTab('sso')} icon={Fingerprint} label="Directory" />
        </div>
      </header>

      {/* --- Modals --- */}
      <NexModal isOpen={showDelModal} onClose={() => setShowDelModal(false)} title="Proxy Assignment">
         <div className="space-y-4">
            <NexFormGroup label="Assignee">
                <select className="prop-input" value={delTargetId} onChange={e => setDelTargetId(e.target.value)}>
                    <option value="">Select User...</option>
                    {users.filter(u => u.id !== currentUser?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                </select>
            </NexFormGroup>
            <NexFormGroup label="Scope">
                <div className="flex gap-2">
                    <button onClick={() => setDelScope('All')} className={`flex-1 py-2 rounded-sm text-xs font-bold border transition-all ${delScope === 'All' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'}`}>Full</button>
                    <button onClick={() => setDelScope('Critical Only')} className={`flex-1 py-2 rounded-sm text-xs font-bold border transition-all ${delScope === 'Critical Only' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-300'}`}>Critical</button>
                </div>
            </NexFormGroup>
            <NexButton variant="primary" onClick={handleCreateDelegation} className="w-full">Activate Proxy</NexButton>
         </div>
      </NexModal>

      <NexModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title={editingUserId ? "Edit Profile" : "Provision New Identity"}>
         <form onSubmit={handleSubmitUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <NexFormGroup label="Full Name">
                    <input required className="prop-input" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} placeholder="e.g. Sarah Connor" />
                </NexFormGroup>
                <NexFormGroup label="Email Address">
                    <input required type="email" className="prop-input" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="corp@nexflow.com" />
                </NexFormGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <NexFormGroup label="Primary Role">
                    <select required className="prop-input" value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})}>
                        <option value="">Select Role...</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </NexFormGroup>
                <NexFormGroup label="Department Group">
                    <select required className="prop-input" value={userForm.groupId} onChange={e => setUserForm({...userForm, groupId: e.target.value})}>
                        <option value="">Select Group...</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </NexFormGroup>
            </div>
            <NexFormGroup label="Office Location">
                <input className="prop-input" value={userForm.location} onChange={e => setUserForm({...userForm, location: e.target.value})} placeholder="e.g. London HQ" />
            </NexFormGroup>
            <NexFormGroup label="Skills (CSV)">
                <input className="prop-input" value={userForm.skills} onChange={e => setUserForm({...userForm, skills: e.target.value})} placeholder="BPMN, Audit, Java..." />
            </NexFormGroup>
            <div className="flex justify-end pt-2">
                <NexButton type="submit" variant="primary" icon={Plus}>{editingUserId ? "Update User" : "Provision User"}</NexButton>
            </div>
         </form>
      </NexModal>

      <NexModal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title={editingRoleId ? "Edit Role" : "Define RBAC Role"} size="lg">
         <form onSubmit={handleSubmitRole} className="space-y-4">
            <NexFormGroup label="Role Name">
                <input required className="prop-input" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} placeholder="e.g. Compliance Auditor" />
            </NexFormGroup>
            <NexFormGroup label="Permission Scopes">
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-sm bg-slate-50">
                    {Object.values(Permission).map(p => (
                        <label key={p} className="flex items-center gap-2 p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-sm cursor-pointer transition-all">
                            <input type="checkbox" checked={roleForm.permissions.includes(p)} onChange={() => togglePermission(p)} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-xs font-medium text-slate-700">{p}</span>
                        </label>
                    ))}
                </div>
            </NexFormGroup>
            <div className="flex justify-end pt-2">
                <NexButton type="submit" variant="primary" icon={Shield}>{editingRoleId ? "Update Role" : "Create Role"}</NexButton>
            </div>
         </form>
      </NexModal>

      <NexModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} title={editingGroupId ? "Edit Organization Unit" : "Create Organization Unit"}>
         <form onSubmit={handleSubmitGroup} className="space-y-4">
            <NexFormGroup label="Unit Name">
                <input required className="prop-input" value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} placeholder="e.g. APAC Sales" />
            </NexFormGroup>
            <NexFormGroup label="Parent Unit">
                <select className="prop-input" value={groupForm.parentGroupId} onChange={e => setGroupForm({...groupForm, parentGroupId: e.target.value})}>
                    <option value="">Root Level</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </NexFormGroup>
            <NexFormGroup label="Description">
                <textarea className="prop-input h-20 resize-none" value={groupForm.description} onChange={e => setGroupForm({...groupForm, description: e.target.value})} placeholder="Operational scope..." />
            </NexFormGroup>
            <div className="flex justify-end pt-2">
                <NexButton type="submit" variant="primary" icon={Landmark}>{editingGroupId ? "Update Group" : "Establish Group"}</NexButton>
            </div>
         </form>
      </NexModal>

      {/* --- Main Content --- */}

      {activeTab === 'profile' && currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <NexCard className="lg:col-span-1 p-0 flex flex-col">
              <div className="p-6 text-center border-b border-slate-200 bg-slate-50">
                 <div className="w-16 h-16 bg-white border border-slate-300 rounded-sm flex items-center justify-center text-2xl font-bold text-slate-800 mx-auto mb-3 shadow-sm">
                    {currentUser?.name?.charAt(0) || '?'}
                 </div>
                 <h3 className="text-base font-bold text-slate-900">{currentUser?.name}</h3>
                 <p className="text-xs text-slate-500 font-mono mb-3">{currentUser?.email}</p>
                 <div className="flex flex-wrap justify-center gap-1">
                    {currentUser?.roleIds?.map(rid => (
                      <span key={rid} className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-sm text-[10px] font-bold uppercase">
                        {roles.find(r => r.id === rid)?.name || 'Role'}
                      </span>
                    ))}
                 </div>
              </div>
              <div className="p-4 space-y-2">
                 <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Location</span>
                    <span className="font-bold text-slate-800">{currentUser?.location}</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Unit</span>
                    <span className="font-bold text-slate-800">{groups.find(g => currentUser?.groupIds?.includes(g.id))?.name || 'Global'}</span>
                 </div>
              </div>
           </NexCard>

           <NexCard className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Key size={16} className="text-blue-600"/> Delegation & Proxy
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage temporary authority transfers.</p>
                 </div>
                 <NexButton variant="secondary" onClick={() => setShowDelModal(true)} icon={PlusCircle}>New Record</NexButton>
              </div>
              
              <div className="space-y-2">
                 {myDelegations.length === 0 ? (
                   <div className="p-8 border border-dashed border-slate-200 rounded-sm text-center bg-slate-50">
                     <p className="text-xs text-slate-400 font-bold uppercase">No Active Delegations</p>
                   </div>
                 ) : (
                   myDelegations.map(del => (
                     <div key={del.id} className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-white border border-slate-300 rounded-sm flex items-center justify-center font-bold text-xs text-slate-700">
                             {users.find(u => u.id === del.toUserId)?.name?.charAt(0)}
                           </div>
                           <div>
                              <p className="text-xs font-bold text-slate-800">To: {users.find(u => u.id === del.toUserId)?.name}</p>
                              <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-slate-500">Until: {new Date(del.endDate).toLocaleDateString()}</span>
                                 <span className={`text-[9px] font-bold px-1 rounded-sm border ${del.scope === 'Critical Only' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{del.scope}</span>
                              </div>
                           </div>
                        </div>
                        <button onClick={() => revokeDelegation(del.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm"><Trash2 size={14}/></button>
                     </div>
                   ))
                 )}
              </div>
           </NexCard>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <input 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-sm text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none"
                placeholder="Search principals..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {canManageUsers && (
               <NexButton variant="primary" icon={UserPlus} onClick={openCreateUser}>Provision</NexButton>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
              <NexCard key={user.id} className="p-4 flex flex-col gap-3 group relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-200">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">{user.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{user.email}</p>
                    </div>
                  </div>
                  <NexBadge variant={user.status === 'Active' ? 'emerald' : 'rose'}>{user.status}</NexBadge>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                   <span className="font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Lock size={10}/> {roles.find(r => user.roleIds.includes(r.id))?.name || 'Authorized'}
                   </span>
                   {/* User Actions */}
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => openEditUser(user)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Edit size={14}/></button>
                       <button onClick={() => handleDeactivateUser(user.id)} className="p-1 hover:bg-slate-100 rounded text-amber-600" title="Deactivate"><Slash size={14}/></button>
                       <button onClick={() => deleteUser(user.id)} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 size={14}/></button>
                   </div>
                </div>
              </NexCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
          <div className="space-y-4">
              <div className="flex justify-end">
                  <NexButton variant="secondary" icon={Shield} onClick={openCreateRole}>Define Role</NexButton>
              </div>
              <div className="grid gap-4">
                  {roles.map(role => (
                      <NexCard key={role.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                          <div>
                              <h4 className="font-bold text-slate-900 text-sm mb-1">{role.name}</h4>
                              <p className="text-[10px] text-slate-500 font-mono">{role.id}</p>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="flex flex-wrap gap-1 justify-end">
                                  {role.permissions.slice(0, 5).map(p => (
                                      <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-sm text-[9px] font-medium">{p}</span>
                                  ))}
                                  {role.permissions.length > 5 && <span className="px-2 py-0.5 text-[9px] text-slate-400">+{role.permissions.length - 5} more</span>}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEditRole(role)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Edit size={14}/></button>
                                  <button onClick={() => deleteRole(role.id)} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 size={14}/></button>
                              </div>
                          </div>
                      </NexCard>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'groups' && (
          <div className="space-y-4">
              <div className="flex justify-end">
                  <NexButton variant="secondary" icon={Landmark} onClick={openCreateGroup}>Create Group</NexButton>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groups.map(group => (
                      <NexCard key={group.id} className="p-4 group relative">
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditGroup(group)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Edit size={14}/></button>
                              <button onClick={() => deleteGroup(group.id)} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 size={14}/></button>
                          </div>
                          <div className="flex items-start justify-between mb-3">
                              <Landmark size={20} className="text-slate-400"/>
                              {group.parentGroupId && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-100">Sub-Unit</span>}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mb-1">{group.name}</h4>
                          <p className="text-xs text-slate-500 leading-snug">{group.description}</p>
                      </NexCard>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
