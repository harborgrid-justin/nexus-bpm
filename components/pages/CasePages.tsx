
import React, { useState, useEffect } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FormPageLayout } from '../shared/PageTemplates';
import { NexFormGroup, NexSwitch, NexCard } from '../shared/NexUI';
import { TaskPriority } from '../../types';
import { 
  Briefcase, ShieldAlert, Globe, DollarSign, Calendar, User, Building, 
  MapPin, Tag, Flag, AlertTriangle, Scale, Lock, Clock, BookOpen, 
  Layers, HardDrive, Filter, Target, Zap, ShieldCheck, FileSearch, UserCheck,
  Hash, Plus, Settings
} from 'lucide-react';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const CaseCreateView = () => {
  const { navigateTo, createCase, groups, users, currentUser, setToolbarConfig } = useBPM();
  const { gridConfig } = useTheme();
  
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'Incident', priority: TaskPriority.MEDIUM,
    status: 'Open', departmentId: '', ownerId: currentUser?.id || '',
    strategicPillar: 'Operational Excellence', businessUnit: 'Global Operations',
    riskLevel: 'Low', compliance: 'None', isConfidential: false,
    costCenter: '', impactAmount: 0, currency: 'USD',
    incidentDate: new Date().toISOString().split('T')[0], targetDate: '',
    site: 'Remote', region: 'Global', autoStart: false,
    tags: ''
  });

  const [isEditable, setIsEditable] = useState(false);

  // Layouts
  const defaultLayouts = {
      lg: [
          { i: 'card-identity', x: 0, y: 0, w: 8, h: 14 },
          { i: 'card-org', x: 8, y: 0, w: 4, h: 14 },
          { i: 'card-risk', x: 0, y: 14, w: 4, h: 12 },
          { i: 'card-finance', x: 4, y: 14, w: 4, h: 12 },
          { i: 'card-auto', x: 8, y: 14, w: 4, h: 12 }
      ],
      md: [
          { i: 'card-identity', x: 0, y: 0, w: 6, h: 14 },
          { i: 'card-org', x: 6, y: 0, w: 4, h: 14 },
          { i: 'card-risk', x: 0, y: 14, w: 5, h: 12 },
          { i: 'card-finance', x: 5, y: 14, w: 5, h: 12 },
          { i: 'card-auto', x: 0, y: 26, w: 10, h: 8 }
      ]
  };
  const [layouts, setLayouts] = useState(defaultLayouts);

  useEffect(() => {
      setToolbarConfig({
          view: [
              { label: isEditable ? 'Lock Layout' : 'Customize Form Layout', action: () => setIsEditable(!isEditable), icon: Settings },
              { label: 'Reset Layout', action: () => setLayouts(defaultLayouts) }
          ]
      });
  }, [setToolbarConfig, isEditable]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!formData.title) return;
    const newId = await createCase(formData.title, formData.description, {
        priority: formData.priority as TaskPriority,
        ownerId: formData.ownerId,
        data: {
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        }
    });
    navigateTo('case-viewer', newId);
  };

  return (
    <FormPageLayout 
        title="Initiate Enterprise Case" 
        subtitle="Provision a high-context operational record." 
        onBack={() => navigateTo('cases')} 
        onSave={handleSave} 
        saveLabel="Initialize Record"
        fullWidth
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-4 pb-10">
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={gridConfig.rowHeight}
            margin={gridConfig.margin}
            isDraggable={isEditable}
            isResizable={isEditable}
            draggableHandle=".drag-handle"
            onLayoutChange={(curr, all) => setLayouts(all)}
        >
            <NexCard key="card-identity" dragHandle={isEditable} title="Identity & Strategy" className="p-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <NexFormGroup label="Primary Case Title" required>
                            <input className="prop-input !text-[16px] !font-bold" placeholder="e.g. Q4 Regional Compliance Audit" value={formData.title} onChange={e => handleChange('title', e.target.value)} />
                        </NexFormGroup>
                    </div>
                    <NexFormGroup label="Category">
                        <select className="prop-input" value={formData.type} onChange={e => handleChange('type', e.target.value)}>
                            <option>Incident</option><option>Strategic Project</option><option>Service Request</option><option>Investigation</option>
                        </select>
                    </NexFormGroup>
                    <NexFormGroup label="Priority">
                        <select className="prop-input font-bold" value={formData.priority} onChange={e => handleChange('priority', e.target.value)}>
                            <option value="Critical">Critical (2h)</option><option value="High">High (1d)</option><option value="Medium">Medium (3d)</option><option value="Low">Low (7d)</option>
                        </select>
                    </NexFormGroup>
                    <div className="col-span-2">
                        <NexFormGroup label="Executive Summary">
                            <textarea className="prop-input h-24 py-3 resize-none" placeholder="Context and objectives..." value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                        </NexFormGroup>
                    </div>
                </div>
            </NexCard>

            <NexCard key="card-org" dragHandle={isEditable} title="Placement" className="p-6">
                <div className="space-y-4">
                    <NexFormGroup label="Department" required>
                        <select className="prop-input" value={formData.departmentId} onChange={e => handleChange('departmentId', e.target.value)}>
                            <option value="">Select Unit...</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </NexFormGroup>
                    <NexFormGroup label="Owner" required>
                        <select className="prop-input" value={formData.ownerId} onChange={e => handleChange('ownerId', e.target.value)}>
                            <option value="">Select Owner...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </NexFormGroup>
                    <NexFormGroup label="Region">
                        <select className="prop-input" value={formData.region} onChange={e => handleChange('region', e.target.value)}>
                            <option>NA</option><option>EMEA</option><option>APAC</option><option>LATAM</option>
                        </select>
                    </NexFormGroup>
                </div>
            </NexCard>

            <NexCard key="card-risk" dragHandle={isEditable} title="Governance" className="p-6 border-l-4 border-l-rose-500">
                <div className="space-y-4">
                    <NexFormGroup label="Risk Rating">
                        <select className="prop-input bg-rose-50/20" value={formData.riskLevel} onChange={e => handleChange('riskLevel', e.target.value)}>
                            <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                        </select>
                    </NexFormGroup>
                    <NexFormGroup label="Compliance Framework">
                        <select className="prop-input" value={formData.compliance} onChange={e => handleChange('compliance', e.target.value)}>
                            <option value="None">None</option><option>GDPR</option><option>SOX</option><option>HIPAA</option>
                        </select>
                    </NexFormGroup>
                    <NexSwitch label="Confidential" checked={formData.isConfidential} onChange={v => handleChange('isConfidential', v)} />
                </div>
            </NexCard>

            <NexCard key="card-finance" dragHandle={isEditable} title="Financials" className="p-6">
                <div className="space-y-4">
                    <NexFormGroup label="Cost Center">
                        <input className="prop-input font-mono" placeholder="CC-000" value={formData.costCenter} onChange={e => handleChange('costCenter', e.target.value)} />
                    </NexFormGroup>
                    <NexFormGroup label="Est. Impact">
                        <div className="flex gap-1">
                            <input type="number" className="prop-input flex-1" value={formData.impactAmount} onChange={e => handleChange('impactAmount', Number(e.target.value))} />
                            <select className="prop-input w-20" value={formData.currency} onChange={e => handleChange('currency', e.target.value)}><option>USD</option><option>EUR</option></select>
                        </div>
                    </NexFormGroup>
                </div>
            </NexCard>

            <NexCard key="card-auto" dragHandle={isEditable} title="Automation" className="p-6 border-l-4 border-l-amber-500">
                <div className="space-y-4">
                    <NexFormGroup label="Tags (CSV)">
                        <input className="prop-input" placeholder="audit, urgent..." value={formData.tags} onChange={e => handleChange('tags', e.target.value)} />
                    </NexFormGroup>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm">
                        <NexSwitch label="Auto-Start Workflow" checked={formData.autoStart} onChange={v => handleChange('autoStart', v)} />
                        <p className="text-[10px] text-blue-600 mt-2">Will trigger process based on category.</p>
                    </div>
                </div>
            </NexCard>
        </ResponsiveGridLayout>
      </div>
    </FormPageLayout>
  );
};

export const CaseEditView = () => {
  const { navigateTo, updateCase, cases, nav } = useBPM();
  const c = cases.find(x => x.id === nav.selectedId);
  const [title, setTitle] = useState(c?.title || '');
  const [desc, setDesc] = useState(c?.description || '');

  const handleSave = async () => {
    if (c) {
        await updateCase(c.id, { title, description: desc });
        navigateTo('case-viewer', c.id);
    }
  };

  if (!c) return <div className="p-20 text-center text-slate-400">Record unavailable.</div>;

  return (
    <FormPageLayout title="Update Case Parameters" onBack={() => navigateTo('case-viewer', c.id)} onSave={handleSave}>
      <div className="space-y-8">
        <NexFormGroup label="Case Title"><input className="prop-input !font-bold" value={title} onChange={e => setTitle(e.target.value)} /></NexFormGroup>
        <NexFormGroup label="Executive Summary"><textarea className="prop-input h-48 py-3 resize-none" value={desc} onChange={e => setDesc(e.target.value)} /></NexFormGroup>
      </div>
    </FormPageLayout>
  );
};

export const CasePolicyView = () => {
  const { navigateTo, addCasePolicy, nav } = useBPM();
  const [policy, setPolicy] = useState('');

  const handleSave = async () => {
    if (nav.selectedId && policy) {
        await addCasePolicy(nav.selectedId, policy);
        navigateTo('case-viewer', nav.selectedId);
    }
  };

  return (
    <FormPageLayout title="Bind Compliance Policy" subtitle="Force a regulatory rule onto this case record." onBack={() => navigateTo('case-viewer', nav.selectedId)} onSave={handleSave} saveLabel="Bind Policy">
      <NexFormGroup label="Policy Declaration">
          <textarea className="prop-input h-48 py-3 resize-none" value={policy} onChange={e => setPolicy(e.target.value)} placeholder="State the policy requirement or compliance rule text here..." />
      </NexFormGroup>
    </FormPageLayout>
  );
};

export const CaseStakeholderView = () => {
  const { navigateTo, addCaseStakeholder, users, nav } = useBPM();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('Consultant');

  const handleSave = async () => {
    if (nav.selectedId && userId) {
        await addCaseStakeholder(nav.selectedId, userId, role);
        navigateTo('case-viewer', nav.selectedId);
    }
  };

  return (
    <FormPageLayout title="Grant Record Access" subtitle="Authorize a stakeholder to collaborate on this engagement." onBack={() => navigateTo('case-viewer', nav.selectedId)} onSave={handleSave} saveLabel="Grant Authorization">
      <div className="space-y-8">
        <NexFormGroup label="Authorized Principal">
            <select className="prop-input" value={userId} onChange={e => setUserId(e.target.value)}>
                <option value="">-- Select Person --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
        </NexFormGroup>
        <NexFormGroup label="Case Role Assignment">
            <select className="prop-input" value={role} onChange={e => setRole(e.target.value)}>
                <option>Consultant</option><option>Approver</option><option>Auditor</option><option>Observer</option>
            </select>
        </NexFormGroup>
      </div>
    </FormPageLayout>
  );
};

export const CaseLaunchView = () => {
  const { navigateTo, startProcess, processes, nav } = useBPM();
  const [procId, setProcId] = useState('');

  const handleSave = async () => {
    if (nav.selectedId && procId) {
        await startProcess(procId, { summary: `Launched via Case Context` }, nav.selectedId);
        navigateTo('case-viewer', nav.selectedId);
    }
  };

  return (
    <FormPageLayout title="Execute Process" subtitle="Select an operational blueprint to instantiate." onBack={() => navigateTo('case-viewer', nav.selectedId)} onSave={handleSave} saveLabel="Begin Execution">
        <NexFormGroup label="Process Blueprint">
            <select className="prop-input" value={procId} onChange={e => setProcId(e.target.value)}>
                <option value="">-- Select Deployed Model --</option>
                {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </NexFormGroup>
    </FormPageLayout>
  );
};
