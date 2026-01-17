
import React, { useState } from 'react';
import { useBPM } from '../contexts/BPMContext';
import { 
  Users, Shield, Landmark, UserPlus, Search, 
  MoreVertical, Key, User as UserIcon, PlusCircle, Trash2, Globe, Fingerprint, Lock,
  Clock, X, ChevronRight, ShieldAlert
} from 'lucide-react';
import { Permission, User } from '../types';
import { TabBtn } from './identity/TabBtn';
import { IntegrationCard } from './identity/IntegrationCard';
import { PolicyItem } from './identity/PolicyItem';
import { NexButton, NexBadge } from './shared/NexUI';

export const IdentityView: React.FC = () => {
  const { users, roles, groups, delegations, hasPermission, currentUser, revokeDelegation, createDelegation } = useBPM();
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'roles' | 'groups' | 'sso'>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDelModal, setShowDelModal] = useState(false);
  const [delTargetId, setDelTargetId] = useState('');
  const [delScope, setDelScope] = useState<'All' | 'Critical Only'>('All');

  const canManageUsers = hasPermission(Permission.USER_MANAGE);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myDelegations = delegations.filter(d => d.fromUserId === currentUser?.id);

  const handleCreateDelegation = async () => {
    if (!delTargetId) return;
    await createDelegation(delTargetId, delScope);
    setShowDelModal(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-32 relative">
      <header className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tightest">Identity</h2>
          <p className="text-[14px] text-slate-500 font-medium mt-1">Manage principals and directory protocols.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[20px] border border-slate-200/50 overflow-x-auto no-scrollbar shadow-inner">
           <TabBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={UserIcon} label="Session" />
           <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Principals" />
           <TabBtn active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} icon={Shield} label="Auth" />
           <TabBtn active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} icon={Landmark} label="Units" />
           <TabBtn active={activeTab === 'sso'} onClick={() => setActiveTab('sso')} icon={Fingerprint} label="Directory" />
        </div>
      </header>

      {showDelModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-3xl animate-slide-up space-y-8 relative">
             <button onClick={() => setShowDelModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
             <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Proxy Assignment</h3>
                <p className="text-sm text-slate-500 font-medium">Delegate your operational authority.</p>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="prop-label">Assignee Principal</label>
                   <select 
                     className="prop-input appearance-none" 
                     value={delTargetId} 
                     onChange={e => setDelTargetId(e.target.value)}
                   >
                      <option value="">Select Principal...</option>
                      {users.filter(u => u.id !== currentUser?.id).map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="prop-label">Delegation Scope</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setDelScope('All')} className={`py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all ${delScope === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Full Authority</button>
                      <button onClick={() => setDelScope('Critical Only')} className={`py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all ${delScope === 'Critical Only' ? 'bg-rose-600 text-white border-rose-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Critical Only</button>
                   </div>
                </div>
             </div>
             <NexButton variant="primary" onClick={handleCreateDelegation} className="w-full">Activate Proxy</NexButton>
          </div>
        </div>
      )}

      {activeTab === 'profile' && currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm text-center relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-20 bg-slate-900"></div>
                 <div className="relative mt-2">
                    <div className="w-24 h-24 bg-white border-4 border-white shadow-xl rounded-[28px] flex items-center justify-center text-3xl font-black text-slate-900 mx-auto mb-6 group-hover:scale-105 transition-all">
                       {currentUser?.name?.charAt(0) || '?'}
                    </div>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">{currentUser?.name}</h3>
                 <p className="text-slate-500 text-[12px] font-semibold mb-6">{currentUser?.email}</p>
                 <div className="flex flex-wrap justify-center gap-2">
                    {currentUser?.roleIds?.map(rid => (
                      <span key={rid} className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">
                        {roles.find(r => r.id === rid)?.name || 'Role'}
                      </span>
                    ))}
                 </div>
              </div>

              <div className="bg-white p-6 rounded-[28px] border border-slate-200/60 shadow-sm space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Globe size={14}/> Global Scope
                 </h4>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Region</span>
                       <span className="text-[12px] font-black text-slate-900">{currentUser?.location}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Unit</span>
                       <span className="text-[12px] font-black text-slate-900">{groups.find(g => currentUser?.groupIds?.includes(g.id))?.name || 'Global'}</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
                 <div className="flex items-start justify-between mb-8">
                    <div>
                       <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                         <Key size={22} className="text-blue-600"/> Authorization Delegation
                       </h3>
                       <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed">Designate a principal substitute for your active task queues.</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    {myDelegations.length === 0 ? (
                      <div className="p-12 border-2 border-dashed border-slate-100 rounded-[28px] text-center bg-slate-50/20">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No substitutions configured</p>
                      </div>
                    ) : (
                      myDelegations.map(del => (
                        <div key={del.id} className="p-5 bg-slate-900 text-white rounded-[24px] flex items-center justify-between shadow-lg relative overflow-hidden">
                           <div className="flex items-center gap-5 relative z-10">
                              <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-[16px] flex items-center justify-center font-black text-lg">
                                {users.find(u => u.id === del.toUserId)?.name?.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-[13px] font-black uppercase tracking-tight">Proxy: {users.find(u => u.id === del.toUserId)?.name}</p>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-400 font-bold">Expires: {new Date(del.endDate).toLocaleDateString()}</span>
                                    <NexBadge variant={del.scope === 'Critical Only' ? 'rose' : 'blue'}>{del.scope}</NexBadge>
                                 </div>
                              </div>
                           </div>
                           <button onClick={() => revokeDelegation(del.id)} className="p-2.5 bg-white/10 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><Trash2 size={18}/></button>
                        </div>
                      ))
                    )}
                    <button onClick={() => setShowDelModal(true)} className="w-full py-4 bg-white border border-slate-200 text-slate-900 rounded-[20px] text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-slate-50">
                       <PlusCircle size={18} className="text-blue-500"/> New Delegation Record
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-[28px] border border-slate-200/60 shadow-sm flex flex-col gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                placeholder="Global principal search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {canManageUsers && (
               <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                 <UserPlus size={18} className="text-blue-400"/> Provision Principal
               </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    {user.name.charAt(0)}
                  </div>
                  <NexBadge variant={user.status === 'Active' ? 'emerald' : 'rose'}>{user.status}</NexBadge>
                </div>
                <h4 className="font-black text-slate-900 text-[16px] mb-1">{user.name}</h4>
                <p className="text-[12px] text-slate-400 font-medium mb-4">{user.email}</p>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Lock size={12}/> {roles.find(r => user.roleIds.includes(r.id))?.name || 'Authorized'}
                   </div>
                   <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sso' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm space-y-8">
              <IntegrationCard isHeader={true} name="Directory Sync"/>
              <div className="space-y-3">
                 <IntegrationCard name="MS Azure Directory" status="Verified" sync="Domain sync: 12m ago" active />
                 <IntegrationCard name="Okta Workforce" status="Verified" sync="SAML 2.0 Real-time" active />
                 <IntegrationCard name="OneLogin IDP" status="Provisioning" sync="Auth required" />
              </div>
           </div>
           <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl space-y-6 text-white relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full -mr-10 -mt-10"></div>
              <div className="space-y-6 relative z-10">
                 <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[18px] flex items-center justify-center text-blue-400">
                    <Lock size={24}/>
                 </div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Security Policies</h3>
                 <p className="text-lg font-bold leading-relaxed max-w-[280px]">Zero-trust governance protocols enforced across nodes.</p>
                 <div className="pt-4 space-y-4">
                    <PolicyItem text="RBAC Least-Privilege Enforced" active />
                    <PolicyItem text="Multi-Factor Auth Required" active />
                    <PolicyItem text="90-Day Auto-Revoke Inactivity" active />
                 </div>
              </div>
              <PolicyItem isButton={true} />
           </div>
        </div>
      )}
    </div>
  );
};
