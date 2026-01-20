
import React, { useEffect, useState, useRef } from 'react';
import { Search, ChevronRight, LayoutDashboard, CheckSquare, Layers, FileText, Database, Settings, Briefcase, FunctionSquare, Command, FormInput, Plug, Sparkles } from 'lucide-react';
import { useBPM } from '../contexts/BPMContext';
import { ViewState } from '../types';

export const CommandPalette: React.FC = () => {
  const { navigateTo, tasks, processes, createCase, rules, forms, integrations } = useBPM();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    if (isOpen) {
        inputRef.current?.focus();
        setQuery('');
        setSelectedIndex(0);
    }
  }, [isOpen]);

  const navigationItems = [
    { label: 'Go to Dashboard', icon: LayoutDashboard, action: () => navigateTo('dashboard') },
    { label: 'Go to Inbox', icon: CheckSquare, action: () => navigateTo('inbox') },
    { label: 'Go to Registry', icon: Layers, action: () => navigateTo('processes') },
    { label: 'Go to Rules Engine', icon: FunctionSquare, action: () => navigateTo('rules') },
    { label: 'Go to Case Manager', icon: Briefcase, action: () => navigateTo('cases') },
    { label: 'Go to Form Builder', icon: FormInput, action: () => navigateTo('forms') },
    { label: 'Go to Marketplace', icon: Plug, action: () => navigateTo('marketplace') },
    { label: 'Go to Settings', icon: Settings, action: () => navigateTo('settings') },
  ];

  const filteredTasks = tasks.slice(0, 5).map(t => ({
      label: `Task: ${t.title}`,
      icon: CheckSquare,
      action: () => navigateTo('inbox', t.id)
  }));

  const filteredProcesses = processes.slice(0, 3).map(p => ({
      label: `Process: ${p.name}`,
      icon: Layers,
      action: () => navigateTo('processes', p.id)
  }));

  const filteredRules = rules.slice(0, 3).map(r => ({
      label: `Rule: ${r.name}`,
      icon: FunctionSquare,
      action: () => navigateTo('rules', r.id)
  }));

  const filteredForms = forms.slice(0, 3).map(f => ({
      label: `Form: ${f.name}`,
      icon: FormInput,
      action: () => navigateTo('form-designer', f.id)
  }));

  const actionItems = [
      { label: 'Create New Case', icon: Briefcase, action: () => { createCase('Untitled Case', ''); navigateTo('cases'); } },
      { label: 'Generate AI Rule', icon: Sparkles, action: () => navigateTo('ai-rule-gen') },
  ];

  const allItems = query 
    ? [...navigationItems, ...actionItems, ...filteredTasks, ...filteredProcesses, ...filteredRules, ...filteredForms].filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : [...navigationItems, ...actionItems];

  const handleSelect = (idx: number) => {
      if (allItems[idx]) {
          allItems[idx].action();
          setIsOpen(false);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
          setSelectedIndex(prev => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
          setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
          handleSelect(selectedIndex);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-[2px] flex items-start justify-center pt-[15vh]">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-slide-up transform transition-all">
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
           <Search size={18} className="text-slate-400 mr-3" />
           <input 
             ref={inputRef}
             className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-800"
             placeholder="Type a command or search assets..."
             value={query}
             onChange={e => setQuery(e.target.value)}
             onKeyDown={handleKeyDown}
           />
           <div className="flex gap-1">
             <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-500 font-bold">ESC</span>
           </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto py-2">
           {allItems.length === 0 ? (
               <div className="px-4 py-8 text-center text-xs text-slate-400">No matching commands found.</div>
           ) : (
               allItems.map((item, idx) => (
                   <button
                     key={idx}
                     onClick={() => handleSelect(idx)}
                     className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors ${idx === selectedIndex ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600' : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'}`}
                     onMouseEnter={() => setSelectedIndex(idx)}
                   >
                      <item.icon size={16} className={idx === selectedIndex ? 'text-blue-600' : 'text-slate-400'} />
                      <span className="flex-1 text-xs font-medium">{item.label}</span>
                      {idx === selectedIndex && <ChevronRight size={14} className="text-blue-400"/>}
                   </button>
               ))
           )}
        </div>
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <div className="flex gap-2">
                <span>Navigate <Command size={10} className="inline"/></span>
                <span>Select ↵</span>
            </div>
            <span>Nexus Enterprise OS</span>
        </div>
      </div>
    </div>
  );
};
