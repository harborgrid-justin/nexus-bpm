
import React, { useState, useRef, useEffect } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ChevronDown, Check, Sun, Moon } from 'lucide-react';
import { ToolbarAction } from '../../types';

interface MenuProps {
    label: string;
    items: ToolbarAction[];
}

const ToolbarMenu: React.FC<MenuProps> = ({ label, items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!items || items.length === 0) return null;

    return (
        <div className="relative" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200 rounded-sm transition-colors ${isOpen ? 'bg-slate-200' : ''}`}
            >
                {label}
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 min-w-[200px] bg-white border border-slate-300 shadow-xl rounded-sm z-[100] py-1 animate-slide-up">
                    {items.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {item.divider && <div className="h-px bg-slate-100 my-1 mx-2" />}
                            <button
                                onClick={() => { 
                                    if(item.action && !item.disabled) {
                                        item.action();
                                        setIsOpen(false);
                                    }
                                }}
                                disabled={item.disabled}
                                className={`w-full text-left px-4 py-2 text-xs flex justify-between items-center ${item.disabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'}`}
                            >
                                <span>{item.label}</span>
                                {item.shortcut && <span className="text-[10px] text-slate-400 font-mono ml-4">{item.shortcut}</span>}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export const GlobalToolbar: React.FC = () => {
    const { toolbarConfig, navigateTo, reseedSystem } = useBPM();
    const { themeMode, setThemeMode, density, setDensity } = useTheme();

    // Default View Actions (Always available)
    const defaultViewActions: ToolbarAction[] = [
        { label: 'Appearance', divider: true },
        { label: 'Light Mode', action: () => setThemeMode('light'), disabled: themeMode === 'light' },
        { label: 'Dark Mode', action: () => setThemeMode('dark'), disabled: themeMode === 'dark' },
        { label: 'Density', divider: true },
        { label: 'Compact', action: () => setDensity('compact'), disabled: density === 'compact' },
        { label: 'Comfortable', action: () => setDensity('comfortable'), disabled: density === 'comfortable' },
    ];

    // Default Help Actions
    const defaultHelpActions: ToolbarAction[] = [
        { label: 'Documentation', action: () => window.open('https://nexflow.io/docs', '_blank') },
        { label: 'Keyboard Shortcuts', action: () => alert('Press Ctrl+K for Command Palette') },
        { label: 'About NexFlow', action: () => alert('NexFlow Enterprise BPM v2.4.0') },
        { label: 'Reset Demo Data', action: () => { if(confirm('Reset all data?')) reseedSystem(); }, divider: true, shortcut: 'Dev' },
    ];

    return (
        <div className="flex items-center px-2 bg-slate-50 border-b border-default h-8 select-none shrink-0" role="menubar">
            <ToolbarMenu label="File" items={toolbarConfig.file || []} />
            <ToolbarMenu label="Edit" items={toolbarConfig.edit || []} />
            <ToolbarMenu label="View" items={[...(toolbarConfig.view || []), ...defaultViewActions]} />
            <ToolbarMenu label="Tools" items={toolbarConfig.tools || []} />
            <ToolbarMenu label="Help" items={[...(toolbarConfig.help || []), ...defaultHelpActions]} />
        </div>
    );
};
