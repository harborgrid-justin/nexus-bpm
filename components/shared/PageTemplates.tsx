
import React from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { NexButton } from './NexUI';

interface FormPageLayoutProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onSave?: () => void;
  saveLabel?: string;
  isSaving?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const FormPageLayout: React.FC<FormPageLayoutProps> = ({ 
  title, subtitle, onBack, onSave, saveLabel = 'Save Changes', isSaving, children, actions 
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-none">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NexButton variant="secondary" onClick={onBack}>Cancel</NexButton>
          {actions}
          {onSave && (
            <NexButton variant="primary" onClick={onSave} disabled={isSaving} icon={Save}>
              {isSaving ? 'Saving...' : saveLabel}
            </NexButton>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto bg-white border border-slate-300 rounded-sm shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
