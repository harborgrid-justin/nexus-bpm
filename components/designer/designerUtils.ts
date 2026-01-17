import React from 'react';
import { ProcessStepType } from '../../types';
import { 
  Play, Flag, User, Cog, GitBranch, Box, 
  FunctionSquare, Zap, Clock, ShieldCheck, Mail, MessageSquare, Smartphone, 
  FileText, PenTool, Database, Cloud, Code, Terminal, Server, 
  CreditCard, DollarSign, BrainCircuit, Mic, Image as ImageIcon,
  Share2, Key, Lock, Globe, HardDrive, FileSpreadsheet,
  AlertTriangle, StopCircle, RotateCw, GitMerge, MoreHorizontal,
  Layout, Briefcase, ShoppingCart, Activity,
  CheckSquare, Plus, Upload, Table
} from 'lucide-react';

export interface StepMetadata {
  icon: React.ElementType;
  color: string;
  defaultName: string;
  category: string;
  description?: string;
  defaultSkills?: string[];
}

export const STEP_CATEGORIES = [
  'Core', 'Gateways', 'Events', 'Communication', 'Documents', 
  'CRM & Sales', 'Dev Tools', 'Cloud Infra', 'Data & Integration', 
  'AI & ML', 'Finance', 'Logic & Rules'
];

const METADATA: { [key in ProcessStepType]?: StepMetadata } = {
  // --- CORE ---
  'start': { icon: Play, color: 'text-emerald-600', defaultName: 'Start', category: 'Core' },
  'end': { icon: Flag, color: 'text-rose-600', defaultName: 'End', category: 'Core' },
  'user-task': { icon: User, color: 'text-blue-600', defaultName: 'User Task', category: 'Core' },
  'service-task': { icon: Cog, color: 'text-slate-600', defaultName: 'Service Task', category: 'Core' },
  'sub-process': { icon: Box, color: 'text-slate-500', defaultName: 'Sub-Process', category: 'Core' },
  'script-task': { icon: Code, color: 'text-orange-600', defaultName: 'Script', category: 'Core' },

  // --- GATEWAYS ---
  'exclusive-gateway': { icon: GitBranch, color: 'text-amber-500', defaultName: 'Exclusive (XOR)', category: 'Gateways' },
  'parallel-gateway': { icon: Plus, color: 'text-emerald-500', defaultName: 'Parallel (AND)', category: 'Gateways' },
  'inclusive-gateway': { icon: GitMerge, color: 'text-blue-500', defaultName: 'Inclusive (OR)', category: 'Gateways' },
  'complex-gateway': { icon: Activity, color: 'text-purple-500', defaultName: 'Complex', category: 'Gateways' },
  'event-gateway': { icon: Zap, color: 'text-orange-500', defaultName: 'Event Based', category: 'Gateways' },

  // --- EVENTS ---
  'timer-event': { icon: Clock, color: 'text-slate-600', defaultName: 'Timer', category: 'Events' },
  'message-event': { icon: Mail, color: 'text-slate-600', defaultName: 'Message', category: 'Events' },
  'signal-event': { icon: Activity, color: 'text-slate-600', defaultName: 'Signal', category: 'Events' },
  'error-event': { icon: AlertTriangle, color: 'text-rose-500', defaultName: 'Error', category: 'Events' },
  'escalation-event': { icon: Zap, color: 'text-amber-500', defaultName: 'Escalation', category: 'Events' },
  'compensation-event': { icon: RotateCw, color: 'text-blue-500', defaultName: 'Compensate', category: 'Events' },

  // --- COMMUNICATION ---
  'email-send': { icon: Mail, color: 'text-indigo-500', defaultName: 'Send Email', category: 'Communication' },
  'slack-post': { icon: MessageSquare, color: 'text-purple-600', defaultName: 'Slack Post', category: 'Communication' },
  'teams-message': { icon: MessageSquare, color: 'text-blue-700', defaultName: 'Teams Msg', category: 'Communication' },
  'sms-twilio': { icon: Smartphone, color: 'text-rose-500', defaultName: 'Twilio SMS', category: 'Communication' },
  'whatsapp-msg': { icon: MessageSquare, color: 'text-emerald-500', defaultName: 'WhatsApp', category: 'Communication' },
  'push-notification': { icon: Zap, color: 'text-amber-500', defaultName: 'Push Notify', category: 'Communication' },
  'sendgrid-email': { icon: Mail, color: 'text-blue-400', defaultName: 'SendGrid', category: 'Communication' },
  'mailchimp-add': { icon: User, color: 'text-yellow-600', defaultName: 'Mailchimp Add', category: 'Communication' },

  // --- DOCUMENTS ---
  'pdf-generate': { icon: FileText, color: 'text-rose-600', defaultName: 'Gen PDF', category: 'Documents' },
  'doc-sign': { icon: PenTool, color: 'text-blue-600', defaultName: 'DocuSign', category: 'Documents' },
  'ocr-extract': { icon: Activity, color: 'text-slate-600', defaultName: 'OCR Extract', category: 'Documents' },
  's3-upload': { icon: HardDrive, color: 'text-orange-500', defaultName: 'S3 Upload', category: 'Documents' },
  'gdrive-save': { icon: Cloud, color: 'text-blue-500', defaultName: 'G-Drive', category: 'Documents' },
  'sharepoint-store': { icon: FileText, color: 'text-teal-600', defaultName: 'SharePoint', category: 'Documents' },
  'dropbox-save': { icon: Box, color: 'text-blue-700', defaultName: 'Dropbox', category: 'Documents' },
  'template-render': { icon: Layout, color: 'text-indigo-500', defaultName: 'Render Tpl', category: 'Documents' },

  // --- CRM & SALES ---
  'salesforce-create': { icon: Cloud, color: 'text-blue-500', defaultName: 'SFDC Create', category: 'CRM & Sales' },
  'salesforce-update': { icon: Cloud, color: 'text-blue-500', defaultName: 'SFDC Update', category: 'CRM & Sales' },
  'hubspot-add': { icon: User, color: 'text-orange-500', defaultName: 'HubSpot Add', category: 'CRM & Sales' },
  'zoho-lead': { icon: Briefcase, color: 'text-yellow-500', defaultName: 'Zoho Lead', category: 'CRM & Sales' },
  'pipedrive-deal': { icon: DollarSign, color: 'text-green-600', defaultName: 'Pipedrive', category: 'CRM & Sales' },
  'dynamics-record': { icon: Briefcase, color: 'text-blue-700', defaultName: 'Dynamics 365', category: 'CRM & Sales' },
  'zendesk-ticket': { icon: MessageSquare, color: 'text-emerald-600', defaultName: 'Zendesk', category: 'CRM & Sales' },
  'intercom-msg': { icon: MessageSquare, color: 'text-blue-500', defaultName: 'Intercom', category: 'CRM & Sales' },

  // --- DEV TOOLS ---
  'jira-issue': { icon: Activity, color: 'text-blue-600', defaultName: 'Jira Issue', category: 'Dev Tools' },
  'github-pr': { icon: GitBranch, color: 'text-slate-800', defaultName: 'GitHub PR', category: 'Dev Tools' },
  'gitlab-merge': { icon: GitMerge, color: 'text-orange-600', defaultName: 'GitLab MR', category: 'Dev Tools' },
  'bitbucket-commit': { icon: GitBranch, color: 'text-blue-700', defaultName: 'Bitbucket', category: 'Dev Tools' },
  'trello-card': { icon: Layout, color: 'text-blue-500', defaultName: 'Trello Card', category: 'Dev Tools' },
  'asana-task': { icon: CheckSquare, color: 'text-rose-500', defaultName: 'Asana Task', category: 'Dev Tools' },
  'linear-issue': { icon: Activity, color: 'text-indigo-600', defaultName: 'Linear', category: 'Dev Tools' },
  'pagerduty-alert': { icon: AlertTriangle, color: 'text-green-600', defaultName: 'PagerDuty', category: 'Dev Tools' },

  // --- CLOUD INFRA ---
  'aws-lambda': { icon: Cloud, color: 'text-orange-500', defaultName: 'AWS Lambda', category: 'Cloud Infra' },
  'azure-func': { icon: Cloud, color: 'text-blue-600', defaultName: 'Azure Func', category: 'Cloud Infra' },
  'gcp-function': { icon: Cloud, color: 'text-red-500', defaultName: 'GCP Func', category: 'Cloud Infra' },
  'kubernetes-job': { icon: Server, color: 'text-blue-500', defaultName: 'K8s Job', category: 'Cloud Infra' },
  'vm-provision': { icon: Server, color: 'text-slate-600', defaultName: 'Provision VM', category: 'Cloud Infra' },
  'db-provision': { icon: Database, color: 'text-indigo-500', defaultName: 'Prov DB', category: 'Cloud Infra' },
  'dns-update': { icon: Globe, color: 'text-amber-600', defaultName: 'DNS Update', category: 'Cloud Infra' },
  'cdn-purge': { icon: Zap, color: 'text-purple-600', defaultName: 'Purge CDN', category: 'Cloud Infra' },

  // --- DATA & INTEGRATION ---
  'sql-query': { icon: Database, color: 'text-slate-700', defaultName: 'SQL Query', category: 'Data & Integration' },
  'rest-api': { icon: Globe, color: 'text-blue-500', defaultName: 'REST API', category: 'Data & Integration' },
  'graphql-query': { icon: Activity, color: 'text-pink-600', defaultName: 'GraphQL', category: 'Data & Integration' },
  'soap-call': { icon: Code, color: 'text-red-700', defaultName: 'SOAP', category: 'Data & Integration' },
  'kafka-publish': { icon: Activity, color: 'text-slate-900', defaultName: 'Kafka Pub', category: 'Data & Integration' },
  'rabbit-mq': { icon: MessageSquare, color: 'text-orange-600', defaultName: 'RabbitMQ', category: 'Data & Integration' },
  'ftp-upload': { icon: Upload, color: 'text-blue-800', defaultName: 'FTP', category: 'Data & Integration' },
  'csv-parse': { icon: FileSpreadsheet, color: 'text-emerald-600', defaultName: 'Parse CSV', category: 'Data & Integration' },
  'xml-transform': { icon: Code, color: 'text-orange-500', defaultName: 'XML Trans', category: 'Data & Integration' },
  'json-map': { icon: Code, color: 'text-yellow-600', defaultName: 'JSON Map', category: 'Data & Integration' },

  // --- AI & ML ---
  'ai-text-gen': { icon: BrainCircuit, color: 'text-purple-600', defaultName: 'Gen Text', category: 'AI & ML' },
  'ai-summarize': { icon: FileText, color: 'text-blue-500', defaultName: 'Summarize', category: 'AI & ML' },
  'ai-sentiment': { icon: Activity, color: 'text-rose-500', defaultName: 'Sentiment', category: 'AI & ML' },
  'ai-vision': { icon: ImageIcon, color: 'text-amber-500', defaultName: 'Computer Vision', category: 'AI & ML' },
  'ai-translate': { icon: Globe, color: 'text-green-500', defaultName: 'Translate', category: 'AI & ML' },
  'ai-classify': { icon: Box, color: 'text-indigo-600', defaultName: 'Classify', category: 'AI & ML' },
  'automl-predict': { icon: BrainCircuit, color: 'text-slate-800', defaultName: 'AutoML', category: 'AI & ML' },
  'vector-embed': { icon: Database, color: 'text-cyan-600', defaultName: 'Embeddings', category: 'AI & ML' },

  // --- FINANCE ---
  'stripe-charge': { icon: CreditCard, color: 'text-indigo-600', defaultName: 'Stripe Charge', category: 'Finance' },
  'paypal-payout': { icon: DollarSign, color: 'text-blue-700', defaultName: 'PayPal', category: 'Finance' },
  'quickbooks-invoice': { icon: FileText, color: 'text-green-600', defaultName: 'QuickBooks', category: 'Finance' },
  'xero-bill': { icon: FileText, color: 'text-blue-500', defaultName: 'Xero Bill', category: 'Finance' },
  'sap-posting': { icon: Server, color: 'text-blue-900', defaultName: 'SAP Post', category: 'Finance' },
  'oracle-ledger': { icon: Database, color: 'text-red-700', defaultName: 'Oracle GL', category: 'Finance' },
  'expensify-report': { icon: DollarSign, color: 'text-green-500', defaultName: 'Expensify', category: 'Finance' },

  // --- LOGIC & RULES ---
  'business-rule': { icon: FunctionSquare, color: 'text-slate-800', defaultName: 'Bus. Rule', category: 'Logic & Rules' },
  'decision-table': { icon: Table, color: 'text-blue-600', defaultName: 'Decision Tbl', category: 'Logic & Rules' },
  'wait-state': { icon: Clock, color: 'text-slate-500', defaultName: 'Wait', category: 'Logic & Rules' },
  'terminate-end': { icon: StopCircle, color: 'text-rose-700', defaultName: 'Terminate', category: 'Logic & Rules' },
  'loop-container': { icon: RotateCw, color: 'text-amber-600', defaultName: 'Loop', category: 'Logic & Rules' },
};

export const getStepTypeMetadata = (type: ProcessStepType): StepMetadata => {
  return METADATA[type] || { 
    icon: Cog, 
    color: 'text-slate-400', 
    defaultName: 'Unknown',
    category: 'Other'
  };
};
