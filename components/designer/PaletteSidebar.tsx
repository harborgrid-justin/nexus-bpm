
import React, { useState } from 'react';
import { ProcessStepType } from '../../types';
import { getStepTypeMetadata, STEP_CATEGORIES } from './designerUtils';
import { Plus, ChevronDown, ChevronRight, Search, GripVertical } from 'lucide-react';

interface PaletteItemProps {
  type: ProcessStepType;
  onAdd: (type: ProcessStepType) => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ type, onAdd }) => {
  const { icon: Icon, color, defaultName: label } = getStepTypeMetadata(type);
  
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className="flex items-center group relative"
      draggable 
      onDragStart={(e) => onDragStart(e, type)}
    >
        <button 
        onClick={() => onAdd(type)} 
        className="w-full flex items-center gap-3 p-2 bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-sm text-left transition-all cursor-grab active:cursor-grabbing"
        >
        <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 bg-slate-50 border border-slate-200 group-hover:bg-white group-hover:border-blue-400`}>
            <Icon size={16} className={`${color} group-hover:text-blue-600`} />
        </div>
        <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-700 truncate">{label}</span>
        </div>
        <Plus size={14} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100" />
        </button>
    </div>
  );
};

export const PaletteSidebar = ({ onAddNode }: { onAddNode: (type: ProcessStepType) => void }) => {
  const [openCategories, setOpenCategories] = useState<string[]>(['Core', 'Communication', 'AI & ML']);
  const [search, setSearch] = useState('');

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  // Group steps by category based on metadata
  const groupedSteps: Record<string, ProcessStepType[]> = {};
  
  const allTypes: ProcessStepType[] = [
    // CORE
    'start', 'end', 'user-task', 'service-task', 'sub-process', 'script-task',
    // GATEWAYS
    'exclusive-gateway', 'parallel-gateway', 'inclusive-gateway', 'complex-gateway', 'event-gateway',
    // EVENTS
    'timer-event', 'message-event', 'signal-event', 'error-event', 'escalation-event', 'compensation-event',
    // COMMUNICATION
    'email-send', 'slack-post', 'teams-message', 'sms-twilio', 'whatsapp-msg', 'push-notification', 'sendgrid-email', 'mailchimp-add',
    // DOCUMENTS
    'pdf-generate', 'doc-sign', 'ocr-extract', 's3-upload', 'gdrive-save', 'sharepoint-store', 'dropbox-save', 'template-render',
    // CRM
    'salesforce-create', 'salesforce-update', 'hubspot-add', 'zoho-lead', 'pipedrive-deal', 'dynamics-record', 'zendesk-ticket', 'intercom-msg',
    // DEV
    'jira-issue', 'github-pr', 'gitlab-merge', 'bitbucket-commit', 'trello-card', 'asana-task', 'linear-issue', 'pagerduty-alert',
    // CLOUD
    'aws-lambda', 'azure-func', 'gcp-function', 'kubernetes-job', 'vm-provision', 'db-provision', 'dns-update', 'cdn-purge',
    // DATA
    'sql-query', 'rest-api', 'graphql-query', 'soap-call', 'kafka-publish', 'rabbit-mq', 'ftp-upload', 'csv-parse', 'xml-transform', 'json-map',
    // AI
    'ai-text-gen', 'ai-summarize', 'ai-sentiment', 'ai-vision', 'ai-translate', 'ai-classify', 'automl-predict', 'vector-embed',
    // FINANCE
    'stripe-charge', 'paypal-payout', 'quickbooks-invoice', 'xero-bill', 'sap-posting', 'oracle-ledger', 'expensify-report',
    // LOGIC
    'business-rule', 'decision-table', 'wait-state', 'terminate-end', 'loop-container'
  ];

  allTypes.forEach(type => {
    const meta = getStepTypeMetadata(type);
    if (!groupedSteps[meta.category]) groupedSteps[meta.category] = [];
    if (meta.defaultName.toLowerCase().includes(search.toLowerCase()) || meta.category.toLowerCase().includes(search.toLowerCase())) {
        groupedSteps[meta.category].push(type);
    }
  });

  return (
    <aside className="w-full h-full bg-slate-50 border-r border-slate-300 flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Component Library</h2>
        <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
            <input 
                className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-sm text-xs outline-none focus:border-blue-500" 
                placeholder="Search components..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-4 space-y-1">
        {STEP_CATEGORIES.map(category => {
            const steps = groupedSteps[category] || [];
            if (steps.length === 0) return null;

            const isOpen = openCategories.includes(category) || search.length > 0;

            return (
                <div key={category} className="mb-2">
                    <button 
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase hover:bg-slate-100 rounded-sm transition-colors"
                    >
                        <span>{category}</span>
                        {isOpen ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                    </button>
                    
                    {isOpen && (
                        <div className="mt-1 space-y-0.5 pl-1 animate-slide-up">
                            {steps.map(type => (
                                <PaletteItem key={type} type={type} onAdd={onAddNode} />
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </aside>
  );
};
