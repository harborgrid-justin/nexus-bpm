
import { ProcessStepType } from '../../types';

export type ConfigFieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'json' | 'code' | 'url';

export interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  required?: boolean;
  options?: string[]; // For select types
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
}

export const STEP_SCHEMAS: Partial<Record<ProcessStepType, ConfigField[]>> = {
  // --- CORE ---
  'start': [],
  'end': [],
  'user-task': [
    // Handled specially in PropertiesPanel due to Form linkage
  ],
  'service-task': [
    { key: 'url', label: 'Service Endpoint', type: 'url', required: true, placeholder: 'https://api.example.com/v1/...' },
    { key: 'method', label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], required: true, defaultValue: 'POST' },
    { key: 'headers', label: 'Headers (JSON)', type: 'json', placeholder: '{"Authorization": "Bearer..."}' },
    { key: 'timeout', label: 'Timeout (ms)', type: 'number', defaultValue: 5000 }
  ],
  'sub-process': [
    { key: 'processId', label: 'Target Process ID', type: 'text', required: true, helpText: 'ID of the child process to execute' },
    { key: 'waitForCompletion', label: 'Wait for Completion', type: 'boolean', defaultValue: true }
  ],
  'script-task': [
    { key: 'script', label: 'Script Logic (JS)', type: 'code', required: true, placeholder: 'execution.setVariable("foo", "bar");' },
    { key: 'resultVariable', label: 'Output Variable', type: 'text', placeholder: 'result' }
  ],

  // --- COMMUNICATION ---
  'email-send': [
    { key: 'to', label: 'Recipient(s)', type: 'text', required: true, helpText: 'Comma separated emails or ${variable}' },
    { key: 'subject', label: 'Subject Line', type: 'text', required: true },
    { key: 'body', label: 'Email Body (HTML)', type: 'textarea', required: true },
    { key: 'provider', label: 'Service Provider', type: 'select', options: ['SMTP', 'SendGrid', 'AWS SES'], defaultValue: 'SMTP' }
  ],
  'slack-post': [
    { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true },
    { key: 'channel', label: 'Channel Name', type: 'text', placeholder: '#general' },
    { key: 'message', label: 'Message Text', type: 'textarea', required: true }
  ],
  'teams-message': [
    { key: 'webhookUrl', label: 'Incoming Webhook', type: 'url', required: true },
    { key: 'title', label: 'Card Title', type: 'text' },
    { key: 'message', label: 'Message Body', type: 'textarea', required: true }
  ],
  'sms-twilio': [
    { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
    { key: 'authToken', label: 'Auth Token', type: 'text', required: true },
    { key: 'fromNumber', label: 'From Number', type: 'text', required: true },
    { key: 'toNumber', label: 'To Number', type: 'text', required: true },
    { key: 'body', label: 'SMS Content', type: 'textarea', required: true }
  ],
  'whatsapp-msg': [
    { key: 'templateId', label: 'Template ID', type: 'text', required: true },
    { key: 'toNumber', label: 'Recipient Phone', type: 'text', required: true },
    { key: 'variables', label: 'Template Vars (JSON)', type: 'json' }
  ],
  'push-notification': [
    { key: 'userId', label: 'Target User ID', type: 'text', required: true },
    { key: 'title', label: 'Notification Title', type: 'text', required: true },
    { key: 'body', label: 'Body Text', type: 'text', required: true }
  ],
  'sendgrid-email': [
    { key: 'apiKey', label: 'API Key', type: 'text', required: true },
    { key: 'templateId', label: 'Dynamic Template ID', type: 'text', required: true },
    { key: 'fromEmail', label: 'Sender Identity', type: 'text', required: true },
    { key: 'dynamicData', label: 'Template Data (JSON)', type: 'json' }
  ],
  'mailchimp-add': [
    { key: 'apiKey', label: 'API Key', type: 'text', required: true },
    { key: 'listId', label: 'Audience ID', type: 'text', required: true },
    { key: 'email', label: 'Subscriber Email', type: 'text', required: true }
  ],

  // --- DOCUMENTS ---
  'pdf-generate': [
    { key: 'templateHtml', label: 'HTML Template', type: 'code', required: true },
    { key: 'dataContext', label: 'Data Context (JSON)', type: 'json' },
    { key: 'outputFilename', label: 'Output Filename', type: 'text', required: true, defaultValue: 'document.pdf' }
  ],
  'doc-sign': [
    { key: 'provider', label: 'Provider', type: 'select', options: ['DocuSign', 'Adobe Sign', 'HelloSign'], defaultValue: 'DocuSign' },
    { key: 'signerEmail', label: 'Signer Email', type: 'text', required: true },
    { key: 'documentUrl', label: 'Document URL', type: 'url', required: true }
  ],
  'ocr-extract': [
    { key: 'engine', label: 'OCR Engine', type: 'select', options: ['Tesseract', 'Google Vision', 'AWS Textract'], defaultValue: 'Google Vision' },
    { key: 'fileUrl', label: 'Source File URL', type: 'url', required: true },
    { key: 'targetVariable', label: 'Output Variable', type: 'text', required: true, defaultValue: 'ocrResult' }
  ],
  's3-upload': [
    { key: 'bucket', label: 'Bucket Name', type: 'text', required: true },
    { key: 'region', label: 'AWS Region', type: 'text', defaultValue: 'us-east-1' },
    { key: 'key', label: 'File Key/Path', type: 'text', required: true },
    { key: 'sourceVar', label: 'Source Variable (Binary)', type: 'text', required: true }
  ],
  'gdrive-save': [
    { key: 'folderId', label: 'Parent Folder ID', type: 'text', required: true },
    { key: 'filename', label: 'Filename', type: 'text', required: true },
    { key: 'mimeType', label: 'MIME Type', type: 'text', defaultValue: 'application/pdf' }
  ],
  'sharepoint-store': [
    { key: 'siteUrl', label: 'SharePoint Site URL', type: 'url', required: true },
    { key: 'library', label: 'Document Library', type: 'text', required: true },
    { key: 'metadata', label: 'Metadata (JSON)', type: 'json' }
  ],
  'dropbox-save': [
    { key: 'path', label: 'Destination Path', type: 'text', required: true },
    { key: 'mode', label: 'Write Mode', type: 'select', options: ['add', 'overwrite', 'update'], defaultValue: 'add' }
  ],
  'template-render': [
    { key: 'engine', label: 'Engine', type: 'select', options: ['Mustache', 'Handlebars', 'EJS'], defaultValue: 'Handlebars' },
    { key: 'template', label: 'Template String', type: 'code', required: true },
    { key: 'variables', label: 'Variables (JSON)', type: 'json' }
  ],

  // --- CRM & SALES ---
  'salesforce-create': [
    { key: 'object', label: 'SObject Name', type: 'text', required: true, placeholder: 'Account, Contact, Lead...' },
    { key: 'fields', label: 'Field Mapping (JSON)', type: 'json', required: true }
  ],
  'salesforce-update': [
    { key: 'object', label: 'SObject Name', type: 'text', required: true },
    { key: 'recordId', label: 'Record ID', type: 'text', required: true },
    { key: 'fields', label: 'Updates (JSON)', type: 'json', required: true }
  ],
  'hubspot-add': [
    { key: 'entityType', label: 'Entity Type', type: 'select', options: ['contact', 'company', 'deal'], required: true },
    { key: 'properties', label: 'Properties (JSON)', type: 'json', required: true }
  ],
  'zoho-lead': [
    { key: 'module', label: 'Module', type: 'text', defaultValue: 'Leads' },
    { key: 'data', label: 'Record Data (JSON)', type: 'json', required: true }
  ],
  'pipedrive-deal': [
    { key: 'title', label: 'Deal Title', type: 'text', required: true },
    { key: 'value', label: 'Value', type: 'number', required: true },
    { key: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' }
  ],
  'dynamics-record': [
    { key: 'entity', label: 'Entity Name', type: 'text', required: true },
    { key: 'data', label: 'Attributes (JSON)', type: 'json', required: true }
  ],
  'zendesk-ticket': [
    { key: 'subject', label: 'Ticket Subject', type: 'text', required: true },
    { key: 'comment', label: 'Comment/Body', type: 'textarea', required: true },
    { key: 'priority', label: 'Priority', type: 'select', options: ['urgent', 'high', 'normal', 'low'], defaultValue: 'normal' }
  ],
  'intercom-msg': [
    { key: 'userId', label: 'User ID / Email', type: 'text', required: true },
    { key: 'body', label: 'Message Body', type: 'textarea', required: true }
  ],

  // --- DEV TOOLS ---
  'jira-issue': [
    { key: 'project', label: 'Project Key', type: 'text', required: true },
    { key: 'summary', label: 'Summary', type: 'text', required: true },
    { key: 'issueType', label: 'Issue Type', type: 'select', options: ['Bug', 'Task', 'Story', 'Epic'], defaultValue: 'Task' }
  ],
  'github-pr': [
    { key: 'repo', label: 'Repository (owner/name)', type: 'text', required: true },
    { key: 'title', label: 'PR Title', type: 'text', required: true },
    { key: 'head', label: 'Head Branch', type: 'text', required: true },
    { key: 'base', label: 'Base Branch', type: 'text', defaultValue: 'main' }
  ],
  'gitlab-merge': [
    { key: 'projectId', label: 'Project ID', type: 'text', required: true },
    { key: 'source', label: 'Source Branch', type: 'text', required: true },
    { key: 'target', label: 'Target Branch', type: 'text', required: true }
  ],
  'bitbucket-commit': [
    { key: 'repoSlug', label: 'Repo Slug', type: 'text', required: true },
    { key: 'message', label: 'Commit Message', type: 'text', required: true },
    { key: 'content', label: 'File Content', type: 'code', required: true }
  ],
  'trello-card': [
    { key: 'listId', label: 'List ID', type: 'text', required: true },
    { key: 'name', label: 'Card Name', type: 'text', required: true },
    { key: 'desc', label: 'Description', type: 'textarea' }
  ],
  'asana-task': [
    { key: 'workspace', label: 'Workspace ID', type: 'text', required: true },
    { key: 'project', label: 'Project ID', type: 'text', required: true },
    { key: 'name', label: 'Task Name', type: 'text', required: true }
  ],
  'linear-issue': [
    { key: 'teamId', label: 'Team ID', type: 'text', required: true },
    { key: 'title', label: 'Issue Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' }
  ],
  'pagerduty-alert': [
    { key: 'routingKey', label: 'Integration Key', type: 'text', required: true },
    { key: 'summary', label: 'Alert Summary', type: 'text', required: true },
    { key: 'severity', label: 'Severity', type: 'select', options: ['critical', 'error', 'warning', 'info'], defaultValue: 'critical' }
  ],

  // --- CLOUD INFRA ---
  'aws-lambda': [
    { key: 'functionName', label: 'Function Name/ARN', type: 'text', required: true },
    { key: 'payload', label: 'Payload (JSON)', type: 'json' },
    { key: 'invocationType', label: 'Invocation Type', type: 'select', options: ['RequestResponse', 'Event', 'DryRun'], defaultValue: 'RequestResponse' }
  ],
  'azure-func': [
    { key: 'functionUrl', label: 'Function URL', type: 'url', required: true },
    { key: 'key', label: 'Function Key', type: 'text' }
  ],
  'gcp-function': [
    { key: 'triggerUrl', label: 'Trigger URL', type: 'url', required: true },
    { key: 'region', label: 'Region', type: 'text', defaultValue: 'us-central1' }
  ],
  'kubernetes-job': [
    { key: 'cluster', label: 'Cluster Config', type: 'text', required: true },
    { key: 'manifest', label: 'Job Manifest (YAML)', type: 'code', required: true }
  ],
  'vm-provision': [
    { key: 'provider', label: 'Provider', type: 'select', options: ['AWS', 'Azure', 'GCP'], required: true },
    { key: 'instanceType', label: 'Instance Type', type: 'text', required: true },
    { key: 'imageId', label: 'AMI / Image ID', type: 'text', required: true }
  ],
  'db-provision': [
    { key: 'engine', label: 'Engine', type: 'select', options: ['MySQL', 'Postgres', 'MariaDB', 'Oracle'], required: true },
    { key: 'size', label: 'Instance Class', type: 'text', required: true },
    { key: 'dbName', label: 'Database Name', type: 'text', required: true }
  ],
  'dns-update': [
    { key: 'zoneId', label: 'Hosted Zone ID', type: 'text', required: true },
    { key: 'record', label: 'Record Name', type: 'text', required: true },
    { key: 'type', label: 'Record Type', type: 'select', options: ['A', 'CNAME', 'TXT', 'MX'], required: true },
    { key: 'value', label: 'Value', type: 'text', required: true }
  ],
  'cdn-purge': [
    { key: 'distributionId', label: 'Distribution ID', type: 'text', required: true },
    { key: 'paths', label: 'Paths (comma sep)', type: 'textarea', required: true, defaultValue: '/*' }
  ],

  // --- DATA ---
  'sql-query': [
    { key: 'connectionString', label: 'Connection String', type: 'text', required: true, helpText: 'jdbc:...' },
    { key: 'query', label: 'SQL Query', type: 'code', required: true, placeholder: 'SELECT * FROM users WHERE...' },
    { key: 'params', label: 'Parameters (JSON)', type: 'json' }
  ],
  'rest-api': [
    { key: 'url', label: 'Endpoint URL', type: 'url', required: true },
    { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], required: true },
    { key: 'body', label: 'Body', type: 'json' }
  ],
  'graphql-query': [
    { key: 'endpoint', label: 'GraphQL Endpoint', type: 'url', required: true },
    { key: 'query', label: 'Query / Mutation', type: 'code', required: true },
    { key: 'variables', label: 'Variables (JSON)', type: 'json' }
  ],
  'soap-call': [
    { key: 'wsdl', label: 'WSDL URL', type: 'url', required: true },
    { key: 'action', label: 'SOAP Action', type: 'text', required: true },
    { key: 'xmlBody', label: 'XML Body', type: 'code', required: true }
  ],
  'kafka-publish': [
    { key: 'topic', label: 'Topic Name', type: 'text', required: true },
    { key: 'key', label: 'Message Key', type: 'text' },
    { key: 'message', label: 'Message Payload', type: 'json', required: true }
  ],
  'rabbit-mq': [
    { key: 'queue', label: 'Queue Name', type: 'text', required: true },
    { key: 'exchange', label: 'Exchange', type: 'text' },
    { key: 'message', label: 'Message', type: 'text', required: true }
  ],
  'ftp-upload': [
    { key: 'host', label: 'FTP Host', type: 'text', required: true },
    { key: 'username', label: 'Username', type: 'text', required: true },
    { key: 'password', label: 'Password', type: 'text', required: true },
    { key: 'remotePath', label: 'Remote Path', type: 'text', required: true }
  ],
  'csv-parse': [
    { key: 'source', label: 'Source Variable', type: 'text', required: true },
    { key: 'delimiter', label: 'Delimiter', type: 'text', defaultValue: ',' },
    { key: 'hasHeader', label: 'Has Header', type: 'boolean', defaultValue: true }
  ],
  'xml-transform': [
    { key: 'xml', label: 'Source XML Var', type: 'text', required: true },
    { key: 'xslt', label: 'XSLT Stylesheet', type: 'code', required: true }
  ],
  'json-map': [
    { key: 'source', label: 'Source JSON Var', type: 'text', required: true },
    { key: 'spec', label: 'JOLT/Map Spec', type: 'json', required: true }
  ],

  // --- AI & ML ---
  'ai-text-gen': [
    { key: 'prompt', label: 'System Prompt', type: 'textarea', required: true },
    { key: 'userMessage', label: 'User Message', type: 'text', required: true },
    { key: 'model', label: 'Model', type: 'select', options: ['gpt-4', 'claude-v1', 'gemini-pro'], defaultValue: 'gemini-pro' }
  ],
  'ai-summarize': [
    { key: 'inputVar', label: 'Input Text Variable', type: 'text', required: true },
    { key: 'length', label: 'Summary Length', type: 'select', options: ['short', 'medium', 'long'], defaultValue: 'medium' }
  ],
  'ai-sentiment': [
    { key: 'inputVar', label: 'Input Text Variable', type: 'text', required: true }
  ],
  'ai-vision': [
    { key: 'imageUrl', label: 'Image URL', type: 'url', required: true },
    { key: 'prompt', label: 'Instruction', type: 'text', defaultValue: 'Describe this image.' }
  ],
  'ai-translate': [
    { key: 'inputVar', label: 'Input Text Variable', type: 'text', required: true },
    { key: 'targetLang', label: 'Target Language', type: 'text', required: true, placeholder: 'es, fr, de...' }
  ],
  'ai-classify': [
    { key: 'inputVar', label: 'Input Text Variable', type: 'text', required: true },
    { key: 'categories', label: 'Categories (CSV)', type: 'text', required: true, placeholder: 'support, sales, spam' }
  ],
  'automl-predict': [
    { key: 'modelId', label: 'Model Endpoint ID', type: 'text', required: true },
    { key: 'payload', label: 'Prediction Instance', type: 'json', required: true }
  ],
  'vector-embed': [
    { key: 'inputVar', label: 'Input Text', type: 'text', required: true },
    { key: 'model', label: 'Embedding Model', type: 'text', defaultValue: 'text-embedding-ada-002' }
  ],

  // --- FINANCE ---
  'stripe-charge': [
    { key: 'amount', label: 'Amount (Cents)', type: 'number', required: true },
    { key: 'currency', label: 'Currency', type: 'text', defaultValue: 'usd' },
    { key: 'source', label: 'Source Token', type: 'text', required: true }
  ],
  'paypal-payout': [
    { key: 'recipientType', label: 'Recipient Type', type: 'select', options: ['EMAIL', 'PHONE', 'PAYPAL_ID'], defaultValue: 'EMAIL' },
    { key: 'receiver', label: 'Receiver', type: 'text', required: true },
    { key: 'amount', label: 'Amount', type: 'number', required: true }
  ],
  'quickbooks-invoice': [
    { key: 'customerId', label: 'Customer Ref', type: 'text', required: true },
    { key: 'lines', label: 'Line Items (JSON)', type: 'json', required: true }
  ],
  'xero-bill': [
    { key: 'contactId', label: 'Contact ID', type: 'text', required: true },
    { key: 'date', label: 'Date', type: 'text', required: true, placeholder: 'YYYY-MM-DD' },
    { key: 'lines', label: 'Line Items (JSON)', type: 'json', required: true }
  ],
  'sap-posting': [
    { key: 'bapiName', label: 'BAPI Name', type: 'text', required: true },
    { key: 'parameters', label: 'Parameters (JSON)', type: 'json', required: true }
  ],
  'oracle-ledger': [
    { key: 'ledgerId', label: 'Ledger ID', type: 'text', required: true },
    { key: 'journalEntry', label: 'Entry Data (JSON)', type: 'json', required: true }
  ],
  'expensify-report': [
    { key: 'employeeEmail', label: 'Employee Email', type: 'text', required: true },
    { key: 'report', label: 'Report Details', type: 'json', required: true }
  ],

  // --- LOGIC ---
  'business-rule': [
    { key: 'ruleId', label: 'Rule ID', type: 'text', required: true, helpText: 'ID from Rules Engine' }
  ],
  'decision-table': [
    { key: 'tableId', label: 'Decision Table ID', type: 'text', required: true }
  ],
  'wait-state': [
    { key: 'duration', label: 'Duration (ISO8601)', type: 'text', required: true, placeholder: 'PT1H (1 Hour)' }
  ],
  'terminate-end': [
    { key: 'reason', label: 'Termination Reason', type: 'text' }
  ],
  'loop-container': [
    { key: 'collection', label: 'Collection Variable', type: 'text', required: true },
    { key: 'elementVar', label: 'Element Variable Name', type: 'text', required: true }
  ]
};

// --- VALIDATION HELPER ---
export const validateStepConfiguration = (type: ProcessStepType, data: any = {}): boolean => {
  const schema = STEP_SCHEMAS[type];
  if (!schema) return true; // No schema implies no strict requirements

  for (const field of schema) {
    if (field.required) {
      const value = data[field.key];
      if (value === undefined || value === null || value === '') {
        return false;
      }
    }
  }
  return true;
};
