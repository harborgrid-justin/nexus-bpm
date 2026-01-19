
import React, { useMemo } from 'react';
import { ProcessDefinition, ProcessStep } from '../../types';
import { diff } from 'immer';
import { ArrowRight, Plus, Minus, Edit, AlertCircle, CheckCircle } from 'lucide-react';
import { NexBadge } from '../shared/NexUI';

interface Props {
  oldVer: ProcessDefinition;
  newVer: ProcessDefinition;
}

export const ProcessDiffViewer: React.FC<Props> = ({ oldVer, newVer }) => {
  
  const diffs = useMemo(() => {
    const addedSteps = newVer.steps.filter(ns => !oldVer.steps.find(os => os.id === ns.id));
    const removedSteps = oldVer.steps.filter(os => !newVer.steps.find(ns => ns.id === os.id));
    const modifiedSteps = newVer.steps.filter(ns => {
        const os = oldVer.steps.find(s => s.id === ns.id);
        return os && JSON.stringify(os) !== JSON.stringify(ns);
    });

    return { addedSteps, removedSteps, modifiedSteps };
  }, [oldVer, newVer]);

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-4">
                <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase font-bold">Base</div>
                    <div className="font-mono text-sm font-bold bg-slate-100 px-2 py-1 rounded">v{oldVer.version}.0</div>
                </div>
                <ArrowRight size={16} className="text-slate-400"/>
                <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase font-bold">Current</div>
                    <div className="font-mono text-sm font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">v{newVer.version}.0</div>
                </div>
            </div>
            <div className="flex gap-2">
                <NexBadge variant="emerald">{diffs.addedSteps.length} Added</NexBadge>
                <NexBadge variant="rose">{diffs.removedSteps.length} Removed</NexBadge>
                <NexBadge variant="amber">{diffs.modifiedSteps.length} Modified</NexBadge>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Added Section */}
            {diffs.addedSteps.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold text-emerald-700 uppercase mb-3 flex items-center gap-2">
                        <Plus size={14} className="bg-emerald-100 p-0.5 rounded-full"/> Added Steps
                    </h4>
                    <div className="space-y-2">
                        {diffs.addedSteps.map(s => (
                            <div key={s.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-sm text-emerald-900">{s.name}</div>
                                    <div className="text-xs text-emerald-700">{s.type} • {s.role || 'No Role'}</div>
                                </div>
                                <div className="text-xs font-mono text-emerald-600">{s.id}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Modified Section */}
            {diffs.modifiedSteps.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 flex items-center gap-2">
                        <Edit size={14} className="bg-amber-100 p-0.5 rounded-full"/> Modified Steps
                    </h4>
                    <div className="space-y-2">
                        {diffs.modifiedSteps.map(ns => {
                            const os = oldVer.steps.find(s => s.id === ns.id);
                            return (
                                <div key={ns.id} className="p-3 bg-amber-50 border border-amber-200 rounded-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-bold text-sm text-amber-900">{ns.name}</div>
                                        <div className="text-xs font-mono text-amber-600">{ns.id}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div className="p-2 bg-white/50 rounded border border-amber-100">
                                            <div className="font-bold text-amber-800 mb-1">Before</div>
                                            <pre className="whitespace-pre-wrap text-[10px] text-slate-600">{JSON.stringify(os, null, 2)}</pre>
                                        </div>
                                        <div className="p-2 bg-white rounded border border-amber-200 shadow-sm">
                                            <div className="font-bold text-amber-800 mb-1">After</div>
                                            <pre className="whitespace-pre-wrap text-[10px] text-slate-800">{JSON.stringify(ns, null, 2)}</pre>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Removed Section */}
            {diffs.removedSteps.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold text-rose-700 uppercase mb-3 flex items-center gap-2">
                        <Minus size={14} className="bg-rose-100 p-0.5 rounded-full"/> Removed Steps
                    </h4>
                    <div className="space-y-2">
                        {diffs.removedSteps.map(s => (
                            <div key={s.id} className="p-3 bg-rose-50 border border-rose-200 rounded-sm opacity-75">
                                <div>
                                    <div className="font-bold text-sm text-rose-900 line-through">{s.name}</div>
                                    <div className="text-xs text-rose-700">{s.type}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {diffs.addedSteps.length === 0 && diffs.removedSteps.length === 0 && diffs.modifiedSteps.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <CheckCircle size={32} className="mx-auto mb-2 text-slate-300"/>
                    <p className="font-medium">No structural changes detected.</p>
                </div>
            )}
        </div>
    </div>
  );
};
