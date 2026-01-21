
import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  Users, Shield, Landmark, UserPlus, Search, 
  Key, User as UserIcon, PlusCircle, Trash2, Fingerprint, Lock,
  ShieldAlert, Plus, Edit
} from 'lucide-react';
import { Permission } from '../types';
import { TabBtn } from './identity/TabBtn';
import { IntegrationCard } from './identity/IntegrationCard';
import { PolicyItem } from './identity/PolicyItem';
import { NexButton, NexBadge, NexCard } from './shared/NexUI';

export const IdentityView: React.FC = () => {
  const { users, roles, groups, delegations, hasPermission, currentUser, revokeDelegation, deleteUser, deleteRole, deleteGroup, navigateTo, settings, updateSystemSettings } = useBPM();
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'roles' | 'groups' | 'sso'>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  
  const canManageUsers = hasPermission(Permission.USER_MANAGE);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myDelegations = delegations.filter(d => d.fromUserId === currentUser?.id);

  const toggleSSO = (key: keyof typeof settings.sso) => {
      const newState = !settings.sso[key];
      updateSystemSettings({ 
          sso: { ...settings.sso, [key]: newState } 
      });
  };

  return (
    <div 
      className="animate-fade-in pb-20 relative flex flex-col"
      style={{ gap: 'var(--section-gap)' }}
    >
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

      {/* --- Main Content --- */}

      {activeTab === 'profile' && currentUser && (
        <div 
          className="grid grid-cols-1 lg:grid-cols-3"
          style={{ gap: 'var(--layout-gap)' }}
        >
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
                 <NexButton variant="secondary" onClick={() => navigateTo('create-delegation')} icon={PlusCircle}>New Record</NexButton>
              </div>
              
              <div className="space-y-2">
                 {myDelegations.length === 0 ? (
                   <div className="p-8 border-2 border-dashed border-slate-200 rounded-sm text-center bg-slate-50 flex flex-col items-center justify-center gap-2">
                     <Key size={24} className="text-slate-300"/>
                     <p className="text-xs text-slate-500 font-bold uppercase">No Active Delegations</p>
                     <NexButton size="sm" variant="secondary" onClick={() => navigateTo('create-delegation')} icon={Plus}>Add Delegation</NexButton>
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
        <div 
          className="flex flex-col"
          style={{ gap: 'var(--layout-gap)' }}
        >
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
               <NexButton variant="primary" icon={UserPlus} onClick={() => navigateTo('create-user')}>Provision</NexButton>
            )}
          </div>

          {filteredUsers.length === 0 ? (
             <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-sm bg-slate-50 flex flex-col items-center gap-3">
                <Users size={32} className="text-slate-300"/>
                <p className="text-sm font-bold text-slate-500">No users found.</p>
                <NexButton variant="primary" onClick={() => navigateTo('create-user')} icon={UserPlus}>Provision First User</NexButton>
             </div>
          ) : (
            <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                style={{ gap: 'var(--layout-gap)' }}
            >
                {filteredUsers.map(user => (
                <NexCard key={user.id} className="p-4 flex flex-col gap-3 group relative hover:border-blue-300 transition-all">
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
                        <button onClick={() => navigateTo('edit-user', user.id)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Edit size={14}/></button>
                        <button onClick={() => deleteUser(user.id)} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 size={14}/></button>
                    </div>
                    </div>
                </NexCard>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'roles' && (
          <div 
            className="flex flex-col"
            style={{ gap: 'var(--layout-gap)' }}
          >
              <div className="flex justify-end">
                  <NexButton variant="secondary" icon={Shield} onClick={() => navigateTo('create-role')}>Define Role</NexButton>
              </div>
              {roles.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-sm bg-slate-50 flex flex-col items-center gap-3">
                    <Shield size={32} className="text-slate-300"/>
                    <p className="text-sm font-bold text-slate-500">No RBAC roles defined.</p>
                    <NexButton variant="primary" onClick={() => navigateTo('create-role')} icon={Plus}>Create First Role</NexButton>
                 </div>
              ) : (
                <div 
                    className="grid"
                    style={{ gap: 'var(--layout-gap)' }}
                >
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
                                    <button onClick={() => navigateTo('edit-role', role.id)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Edit size={14}/></button>
                                    <button onClick={() => deleteRole(role.id)} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </NexCard>
                    ))}
                </div>
              )}
          </div>
      )}

      {activeTab === 'groups' && (
          <div 
            className="flex flex-col"
            style={{ gap: 'var(--layout-gap)' }}
          >
              <div className="flex justify-end">
                  <NexButton variant="secondary" icon={Landmark} onClick={() => navigateTo('create-group')}>Create Group</NexButton>
              </div>
              {groups.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-sm bg-slate-50 flex flex-col items-center gap-3">
                    <Landmark size={32} className="text-slate-300"/>
                    <p className="text-sm font-bold text-slate-500">No organization groups found.</p>
                    <NexButton variant="primary" onClick={() => navigateTo('create-group')} icon={Plus}>Create Group</NexButton>
                 </div>
              ) : (
                <div 
                    className="grid sm:grid-cols-2 lg:grid-cols-3"
                    style={{ gap: 'var(--layout-gap)' }}
                >
                    {groups.map(group => (
                        <NexCard key={group.id} className="p-4 group relative hover:border-blue-300 transition-all">
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => navigateTo('edit-group', group.id)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Edit size={14}/></button>
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
              )}
          </div>
      )}

      {activeTab === 'sso' && (
          <div 
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: 'var(--layout-gap)' }}
          >
              <NexCard className="p-6 space-y-4">
                  <IntegrationCard isHeader name="Identity Providers" />
                  <div className="space-y-3">
                      <div onClick={() => toggleSSO('ldap')} className="cursor-pointer">
                        <IntegrationCard name="LDAP / Active Directory" status={settings.sso.ldap ? "Connected" : "Inactive"} sync="Auto-Sync: 1hr" active={settings.sso.ldap} />
                      </div>
                      <div onClick={() => toggleSSO('okta')} className="cursor-pointer">
                        <IntegrationCard name="Okta OIDC" status={settings.sso.okta ? "Connected" : "Inactive"} sync="Just-in-Time" active={settings.sso.okta} />
                      </div>
                      <div onClick={() => toggleSSO('workspace')} className="cursor-pointer">
                        <IntegrationCard name="Google Workspace" status={settings.sso.workspace ? "Connected" : "Inactive"} sync="OAuth 2.0" active={settings.sso.workspace} />
                      </div>
                  </div>
              </NexCard>
              <div 
                className="flex flex-col"
                style={{ gap: 'var(--layout-gap)' }}
              >
                 <NexCard className="p-6">
                     <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-amber-500"/> Password Policy
                     </h3>
                     <div className="space-y-2">
                         <PolicyItem text={`Minimum Length: ${settings.security.minPasswordLength} chars`} active />
                         <PolicyItem text="Requires MFA for Admins" active={settings.security.mfaEnabled} />
                         <PolicyItem text="Session Timeout: 60m" active />
                     </div>
                 </NexCard>
              </div>
          </div>
      )}
    </div>
  );
};
