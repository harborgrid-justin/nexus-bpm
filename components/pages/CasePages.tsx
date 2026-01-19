
import React, { useState } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { FormPageLayout } from '../shared/PageTemplates';
import { NexFormGroup, NexSwitch } from '../shared/NexUI';
import { TaskPriority } from '../../types';
import { 
  Briefcase, ShieldAlert, Globe, DollarSign, Calendar, User, Building, 
  MapPin, Tag, Flag, AlertTriangle, Scale, Lock, Clock, BookOpen, 
  Layers, HardDrive, Filter, Target, Zap, ShieldCheck, FileSearch, UserCheck,
  Hash,
  Plus
} from 'lucide-react';

export const CaseCreateView = () => {
  const { navigateTo, createCase, groups, users, currentUser } = useBPM();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Incident',
    priority: TaskPriority.MEDIUM,
    status: 'Open',
    departmentId: '',
    ownerId: currentUser?.id || '',
    requesterName: currentUser?.name || '',
    requesterEmail: currentUser?.email || '',
    source: 'Internal Portal',
    strategicPillar: 'Operational Excellence',
    businessUnit: 'Global Operations',
    riskLevel: 'Low',
    compliance: 'None',
    jurisdiction: 'United States',
    isConfidential: false,
    legalHold: false,
    gdprImpact: false,
    dpiasRequired: false,
    costCenter: '',
    budgetCode: '',
    impactAmount: 0,
    currency: 'USD',
    capitalized: false,
    targetDate: '',
    incidentDate: new Date().toISOString().split('T')[0],
    site: 'Remote',
    region: 'Global',
    complexity: 'Medium',
    externalRef: '',
    parentCaseId: '',
    rootCause: 'TBD',
    isVendorInvolved: false,
    vendorName: '',
    tags: '',
    autoStart: false,
    evidenceRequirement: 'Standard'
  });

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
        subtitle="Provision a high-context operational record for audit and automation." 
        onBack={() => navigateTo('cases')} 
        onSave={handleSave} 
        saveLabel="Initialize Record"
        fullWidth
    >
      <div className="max-w-[1100px] mx-auto p-10 pb-32 space-y-10">
        
        {/* SECTION 1: IDENTITY & STRATEGY */}
        <section className="section-card">
            <div className="section-header">
                <Target size={16} className="text-blue-600" />
                <h3 className="section-title">Identity & Strategy</h3>
            </div>
            <div className="grid grid-cols-12 gap-x-6 gap-y-8">
                <div className="col-span-12 lg:col-span-8">
                    <NexFormGroup label="Primary Case Title" required helpText="A concise, authoritative name for this record.">
                        <input className="prop-input !text-[16px] !font-bold" placeholder="e.g. Q4 Regional Compliance Audit - EMEA" value={formData.title} onChange={e => handleChange('title', e.target.value)} />
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Case Category" icon={Layers}>
                        <select className="prop-input" value={formData.type} onChange={e => handleChange('type', e.target.value)}>
                            <option>Incident</option>
                            <option>Strategic Project</option>
                            <option>Service Request</option>
                            <option>Regulatory Investigation</option>
                            <option>Audit Engagement</option>
                            <option>Security Event</option>
                        </select>
                    </NexFormGroup>
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Priority Matrix" icon={Flag}>
                        <select className="prop-input font-bold" value={formData.priority} onChange={e => handleChange('priority', e.target.value)}>
                            <option value="Critical" className="text-red-600 font-bold">Critical (SLA: 2h)</option>
                            <option value="High" className="text-orange-600 font-bold">High (SLA: 1d)</option>
                            <option value="Medium" className="text-blue-600 font-bold">Medium (SLA: 3d)</option>
                            <option value="Low" className="text-slate-600 font-bold">Low (SLA: 7d)</option>
                        </select>
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Strategic Pillar" icon={Target}>
                        <select className="prop-input" value={formData.strategicPillar} onChange={e => handleChange('strategicPillar', e.target.value)}>
                            <option>Operational Excellence</option>
                            <option>Growth & Expansion</option>
                            <option>Regulatory Compliance</option>
                            <option>Digital Transformation</option>
                            <option>Sustainability (ESG)</option>
                        </select>
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Resource Complexity" icon={Zap}>
                        <select className="prop-input" value={formData.complexity} onChange={e => handleChange('complexity', e.target.value)}>
                            <option>Low (L1)</option>
                            <option>Medium (L2)</option>
                            <option>High (L3)</option>
                        </select>
                    </NexFormGroup>
                </div>

                <div className="col-span-12">
                    <NexFormGroup label="Executive Summary / Context" icon={BookOpen}>
                        <textarea className="prop-input h-24 py-3 resize-none" placeholder="Explain the business context, objectives, and any immediate risks..." value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                    </NexFormGroup>
                </div>
            </div>
        </section>

        {/* SECTION 2: PLACEMENT & OWNERSHIP */}
        <section className="section-card">
            <div className="section-header">
                <Building size={16} className="text-indigo-600" />
                <h3 className="section-title">Organizational Placement</h3>
            </div>
            <div className="grid grid-cols-12 gap-x-6 gap-y-8">
                <div className="col-span-12 lg:col-span-6">
                    <NexFormGroup label="Reporting Department" icon={Building} required>
                        <div className="flex gap-1">
                            <select className="prop-input flex-1" value={formData.departmentId} onChange={e => handleChange('departmentId', e.target.value)}>
                                <option value="">-- Select Organizational Unit --</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <button type="button" onClick={() => navigateTo('create-group')} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-sm hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all" title="Add Unit">
                                <Plus size={16}/>
                            </button>
                        </div>
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-6">
                    <NexFormGroup label="Assigned Principal Owner" icon={UserCheck} required>
                        <div className="flex gap-1">
                            <select className="prop-input flex-1" value={formData.ownerId} onChange={e => handleChange('ownerId', e.target.value)}>
                                <option value="">-- Select Accountable Person --</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.location})</option>)}
                            </select>
                            <button type="button" onClick={() => navigateTo('create-user')} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-sm hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all" title="Provision User">
                                <Plus size={16}/>
                            </button>
                        </div>
                    </NexFormGroup>
                </div>

                <div className="col-span-12 lg:col-span-3">
                    <NexFormGroup label="Business Unit" icon={Globe}>
                        <select className="prop-input" value={formData.businessUnit} onChange={e => handleChange('businessUnit', e.target.value)}>
                            <option>Global Operations</option>
                            <option>Shared Services</option>
                            <option>Product & Engineering</option>
                            <option>Sales & Marketing</option>
                            <option>Legal & HR</option>
                        </select>
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-3">
                    <NexFormGroup label="Resource Region" icon={MapPin}>
                        <select className="prop-input" value={formData.region} onChange={e => handleChange('region', e.target.value)}>
                            <option>NA (North America)</option>
                            <option>EMEA Central</option>
                            <option>APAC (Asia Pacific)</option>
                            <option>LATAM</option>
                        </select>
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-3">
                    <NexFormGroup label="Operational Site" icon={Building}>
                        <select className="prop-input" value={formData.site} onChange={e => handleChange('site', e.target.value)}>
                            <option>Remote</option>
                            <option>London HQ</option>
                            <option>New York Tech Hub</option>
                            <option>Singapore DC</option>
                        </select>
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-3">
                    <NexFormGroup label="Inbound Source" icon={Filter}>
                        <select className="prop-input" value={formData.source} onChange={e => handleChange('source', e.target.value)}>
                            <option>System Trigger</option>
                            <option>Employee Portal</option>
                            <option>Executive Intake</option>
                            <option>External API</option>
                        </select>
                    </NexFormGroup>
                </div>
            </div>
        </section>

        {/* SECTION 3: GOVERNANCE & COMPLIANCE */}
        <section className="section-card border-l-4 border-l-rose-500">
            <div className="section-header">
                <ShieldAlert size={16} className="text-rose-600" />
                <h3 className="section-title text-rose-700">Governance & Compliance</h3>
            </div>
            <div className="grid grid-cols-12 gap-x-6 gap-y-8">
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Inherent Risk Rating" icon={AlertTriangle}>
                        <select className="prop-input !border-rose-100 bg-rose-50/20" value={formData.riskLevel} onChange={e => handleChange('riskLevel', e.target.value)}>
                            <option>Low - Minimal</option>
                            <option>Medium - Moderate</option>
                            <option>High - Significant</option>
                            <option>Critical - Threat</option>
                        </select>
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Regulatory Framework" icon={Scale}>
                        <select className="prop-input" value={formData.compliance} onChange={e => handleChange('compliance', e.target.value)}>
                            <option value="None">Non-Regulated</option>
                            <option>GDPR / Privacy</option>
                            <option>SOX / Financial</option>
                            <option>HIPAA / Health</option>
                            <option>SOC2 / Security</option>
                        </select>
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Evidence Requirement" icon={FileSearch}>
                        <select className="prop-input" value={formData.evidenceRequirement} onChange={e => handleChange('evidenceRequirement', e.target.value)}>
                            <option>Standard (Internal)</option>
                            <option>High (Audit Ready)</option>
                            <option>Maximum (Forensic)</option>
                        </select>
                    </NexFormGroup>
                </div>

                <div className="col-span-12 lg:col-span-6">
                   <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-sm">
                        <NexSwitch label="Confidential / Restricted Access" checked={formData.isConfidential} onChange={v => handleChange('isConfidential', v)} icon={Lock} />
                        <NexSwitch label="Active Legal Hold Engaged" checked={formData.legalHold} onChange={v => handleChange('legalHold', v)} icon={Scale} />
                   </div>
                </div>
                <div className="col-span-12 lg:col-span-6">
                   <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-sm">
                        <NexSwitch label="GDPR Article 30 Impact" checked={formData.gdprImpact} onChange={v => handleChange('gdprImpact', v)} icon={ShieldCheck} />
                        <NexSwitch label="DPIA Required" checked={formData.dpiasRequired} onChange={v => handleChange('dpiasRequired', v)} icon={FileSearch} />
                   </div>
                </div>
            </div>
        </section>

        {/* SECTION 4: FINANCIALS & LOGISTICS */}
        <section className="section-card">
            <div className="section-header">
                <DollarSign size={16} className="text-emerald-600" />
                <h3 className="section-title">Financial Exposure & Logistics</h3>
            </div>
            <div className="grid grid-cols-12 gap-x-6 gap-y-8">
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Cost Center" icon={Building}>
                        <input className="prop-input font-mono" placeholder="CC-000-00" value={formData.costCenter} onChange={e => handleChange('costCenter', e.target.value)} />
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Budget / GL Code" icon={Hash}>
                        <input className="prop-input font-mono" placeholder="e.g. 500201" value={formData.budgetCode} onChange={e => handleChange('budgetCode', e.target.value)} />
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Estimated Amount" icon={DollarSign}>
                        <div className="flex gap-1">
                            <input type="number" className="prop-input flex-1" value={formData.impactAmount} onChange={e => handleChange('impactAmount', Number(e.target.value))} />
                            <select className="prop-input w-24" value={formData.currency} onChange={e => handleChange('currency', e.target.value)}>
                                <option>USD</option><option>EUR</option><option>GBP</option>
                            </select>
                        </div>
                    </NexFormGroup>
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Incident / Start Date" icon={Calendar}>
                        <input type="date" className="prop-input" value={formData.incidentDate} onChange={e => handleChange('incidentDate', e.target.value)} />
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Target Resolution" icon={Clock}>
                        <input type="date" className="prop-input" value={formData.targetDate} onChange={e => handleChange('targetDate', e.target.value)} />
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4 flex items-end pb-1.5">
                    <NexSwitch label="Capital Expenditure (CAPEX)" checked={formData.capitalized} onChange={v => handleChange('capitalized', v)} icon={DollarSign} />
                </div>
            </div>
        </section>

        {/* SECTION 5: AUTOMATION & META */}
        <section className="section-card border-l-4 border-l-amber-500">
            <div className="section-header">
                <Zap size={16} className="text-amber-500" />
                <h3 className="section-title">Automation & Meta</h3>
            </div>
            <div className="grid grid-cols-12 gap-x-6 gap-y-8">
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Parent Engagement ID" icon={Briefcase}>
                        <input className="prop-input font-mono" placeholder="CASE-XXXXX" value={formData.parentCaseId} onChange={e => handleChange('parentCaseId', e.target.value)} />
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="External ERP/CRM Ref" icon={HardDrive}>
                        <input className="prop-input" placeholder="e.g. SFDC-99212" value={formData.externalRef} onChange={e => handleChange('externalRef', e.target.value)} />
                    </NexFormGroup>
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <NexFormGroup label="Search Tags" icon={Tag}>
                        <input className="prop-input" placeholder="urgent, q4, audit..." value={formData.tags} onChange={e => handleChange('tags', e.target.value)} />
                    </NexFormGroup>
                </div>

                <div className="col-span-12">
                    <div className="p-5 bg-blue-50 border border-blue-100 rounded-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 text-white rounded-full shadow-sm">
                                <Zap size={20}/>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Adaptive Workflow Initiation</h4>
                                <p className="text-xs text-blue-700">Enable automatic process matching based on Case Category and Risk Rating.</p>
                            </div>
                        </div>
                        <NexSwitch label="" checked={formData.autoStart} onChange={v => handleChange('autoStart', v)} />
                    </div>
                </div>
            </div>
        </section>

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
