
import React from 'react';
import { Landmark, Lock, Zap, Key } from 'lucide-react';

interface IntegrationCardProps {
    name: string;
    status?: string;
    sync?: string;
    active?: boolean;
    isHeader?: boolean;
}

const getIcon = (name: string) => {
    if (name.includes('LDAP')) return <Landmark size={20}/>;
    if (name.includes('Okta')) return <Lock size={20}/>;
    if (name.includes('Workspace')) return <Zap size={20}/>;
    return <Key size={20}/>;
};

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ name, status, sync, active, isHeader }) => {
    const icon = getIcon(name);

    if (isHeader) {
        return (
             <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-sm flex items-center justify-center border border-slate-200">
                    {icon}
                 </div>
                 <div>
                    <h3 className="text-base font-bold text-slate-800">{name}</h3>
                    <p className="text-xs text-slate-500">Manage SAML/OIDC/LDAP connections.</p>
                 </div>
              </div>
        );
    }
    
  return (
    <div className={`p-3 border rounded-sm flex items-center justify-between transition-all ${active ? 'bg-white border-blue-400 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
       <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-sm ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{icon}</div>
          <div>
             <p className="text-xs font-bold text-slate-800">{name}</p>
             <p className="text-[10px] text-slate-500 font-medium">{sync}</p>
          </div>
       </div>
       <div className="flex flex-col items-end">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1 rounded-sm border ${active ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-100 border-slate-200'}`}>{status}</span>
       </div>
    </div>
  );
};
