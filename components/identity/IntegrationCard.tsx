
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
    return <Key size={24}/>;
};

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ name, status, sync, active, isHeader }) => {
    const icon = getIcon(name);

    if (isHeader) {
        return (
             <div className="flex items-center gap-4 mb-2">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                    {icon}
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-800">{name}</h3>
                    <p className="text-xs text-slate-500">Manage SAML/OIDC and LDAP integrations.</p>
                 </div>
              </div>
        );
    }
    
  return (
    <div className={`p-4 border rounded-2xl flex items-center justify-between transition-all ${active ? 'bg-slate-50 border-blue-200' : 'bg-white border-slate-100 opacity-60'}`}>
       <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{icon}</div>
          <div>
             <p className="text-xs font-bold text-slate-800">{name}</p>
             <p className="text-[10px] text-slate-400 font-medium">{sync}</p>
          </div>
       </div>
       <div className="flex flex-col items-end">
          <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'text-blue-600' : 'text-slate-400'}`}>{status}</span>
          {active && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse mt-1"></div>}
       </div>
    </div>
  );
};
