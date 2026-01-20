
import React, { useState } from 'react';
import { ProcessStepType } from '../../types';
import { getStepTypeMetadata, STEP_CATEGORIES } from './designerUtils';
import { Plus, ChevronDown, ChevronRight, Search, Star, StickyNote } from 'lucide-react';

interface PaletteItemProps {
  type: ProcessStepType | 'note';
  onAdd: (type: ProcessStepType | 'note') => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ type, onAdd, isFavorite, onToggleFavorite }) => {
  const { icon: Icon, color, defaultName: label } = getStepTypeMetadata(type);
  
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
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
        </button>
        {onToggleFavorite && (
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Star size={12} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-amber-400 opacity-100" : ""} />
            </button>
        )}
    </div>
  );
};

export const PaletteSidebar = ({ onAddNode }: { onAddNode: (type: ProcessStepType | 'note') => void }) => {
  const [openCategories, setOpenCategories] = useState<string[]>(['Favorites', 'Annotations', 'Core']);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['start', 'end', 'user-task', 'exclusive-gateway']);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const toggleFavorite = (type: string) => {
      setFavorites(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const groupedSteps: Record<string, string[]> = {};
  
  // Explicitly add 'note'
  const allTypes: string[] = [
    'note',
    'start', 'end', 'user-task', 'service-task', 'sub-process', 'script-task',
    'exclusive-gateway', 'parallel-gateway', 'inclusive-gateway', 'complex-gateway', 'event-gateway',
    'timer-event', 'message-event', 'signal-event', 'error-event', 'escalation-event', 'compensation-event',
    'email-send', 'slack-post', 'teams-message', 'sms-twilio', 'whatsapp-msg', 'push-notification', 'sendgrid-email', 'mailchimp-add',
    'pdf-generate', 'doc-sign', 'ocr-extract', 's3-upload', 'gdrive-save', 'sharepoint-store', 'dropbox-save', 'template-render',
    'salesforce-create', 'salesforce-update', 'hubspot-add', 'zoho-lead', 'pipedrive-deal', 'dynamics-record', 'zendesk-ticket', 'intercom-msg',
    'jira-issue', 'github-pr', 'gitlab-merge', 'bitbucket-commit', 'trello-card', 'asana-task', 'linear-issue', 'pagerduty-alert',
    'aws-lambda', 'azure-func', 'gcp-function', 'kubernetes-job', 'vm-provision', 'db-provision', 'dns-update', 'cdn-purge',
    'sql-query', 'rest-api', 'graphql-query', 'soap-call', 'kafka-publish', 'rabbit-mq', 'ftp-upload', 'csv-parse', 'xml-transform', 'json-map',
    'ai-text-gen', 'ai-summarize', 'ai-sentiment', 'ai-vision', 'ai-translate', 'ai-classify', 'automl-predict', 'vector-embed',
    'stripe-charge', 'paypal-payout', 'quickbooks-invoice', 'xero-bill', 'sap-posting', 'oracle-ledger', 'expensify-report',
    'business-rule', 'decision-table', 'wait-state', 'terminate-end', 'loop-container'
  ];

  allTypes.forEach(type => {
    const meta = getStepTypeMetadata(type as ProcessStepType);
    if (!groupedSteps[meta.category]) groupedSteps[meta.category] = [];
    if (meta.defaultName.toLowerCase().includes(search.toLowerCase()) || meta.category.toLowerCase().includes(search.toLowerCase())) {
        groupedSteps[meta.category].push(type);
    }
  });

  const displayCategories = ['Favorites', ...STEP_CATEGORIES];

  return (
    <aside className="w-full h-full bg-slate-50 border-r border-slate-300 flex flex-col shrink-0">
      <div className="border-b border-slate-200" style={{ padding: 'var(--space-base)' }}>
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
      
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: 'var(--space-base)', gap: 'var(--space-base)', display: 'flex', flexDirection: 'column' }}>
        {displayCategories.map(category => {
            let steps: string[] = [];
            
            if (category === 'Favorites') {
                steps = favorites.filter(t => 
                    getStepTypeMetadata(t as any).defaultName.toLowerCase().includes(search.toLowerCase())
                );
            } else {
                steps = groupedSteps[category] || [];
            }

            if (steps.length === 0) return null;

            const isOpen = openCategories.includes(category) || search.length > 0;

            return (
                <div key={category} className="mb-2">
                    <button 
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase hover:bg-slate-100 rounded-sm transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            {category === 'Favorites' && <Star size={12} className="text-amber-400 fill-amber-400"/>}
                            {category}
                        </span>
                        {isOpen ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                    </button>
                    
                    {isOpen && (
                        <div className="mt-1 space-y-0.5 pl-1 animate-slide-up">
                            {steps.map(type => (
                                <PaletteItem 
                                    key={type} 
                                    type={type as ProcessStepType} 
                                    onAdd={onAddNode} 
                                    isFavorite={favorites.includes(type)}
                                    onToggleFavorite={() => toggleFavorite(type)}
                                />
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
