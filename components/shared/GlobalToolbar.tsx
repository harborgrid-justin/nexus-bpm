
import React, { useState, useRef, useEffect } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ToolbarAction } from '../../types';
import { commandService, Command } from '../../services/commandService';

interface MenuProps {
    label: string;
    items: ToolbarAction[];
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

const ToolbarMenu: React.FC<MenuProps> = ({ label, items, isOpen, onToggle, onClose }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!items || items.length === 0) return null;

    return (
        <div className="relative" ref={ref}>
            <button 
                onClick={onToggle}
                className={`px-3 py-1.5 text-xs text-secondary hover:bg-hover rounded-sm transition-colors whitespace-nowrap ${isOpen ? 'bg-active font-bold text-primary' : ''}`}
            >
                {label}
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 min-w-[200px] bg-panel border border-default shadow-xl rounded-sm z-[100] py-1 animate-slide-up">
                    {items.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {item.divider && <div className="h-px bg-default my-1 mx-2" />}
                            <button
                                onClick={() => { 
                                    if(item.action && !item.disabled) {
                                        item.action();
                                        onClose();
                                    }
                                }}
                                disabled={item.disabled}
                                className={`w-full text-left px-4 py-2 text-xs flex justify-between items-center ${item.disabled ? 'text-tertiary cursor-not-allowed' : 'text-secondary hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300'}`}
                            >
                                <span>{item.label}</span>
                                {item.shortcut && <span className="text-[10px] text-tertiary font-mono ml-4">{item.shortcut}</span>}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export const GlobalToolbar: React.FC = () => {
    const { toolbarConfig, navigateTo, reseedSystem, createAdHocTask, exportData, currentUser, addNotification } = useBPM();
    const { themeMode, setThemeMode, density, setDensity } = useTheme();
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const toggleMenu = (menu: string) => setActiveMenu(curr => curr === menu ? null : menu);
    const closeMenu = () => setActiveMenu(null);

    // Register basic commands
    useEffect(() => {
        const unregister = [
            commandService.register({ id: 'quick-task', label: 'New Quick Task', action: async () => {
                const title = prompt("Enter task title:");
                if (title) {
                    await createAdHocTask(title);
                    addNotification('success', 'Task created successfully');
                    navigateTo('inbox');
                }
            }, shortcut: 'Alt+N' }),
            commandService.register({ id: 'new-case', label: 'Start New Case', action: () => navigateTo('create-case') }),
            commandService.register({ id: 'backup', label: 'Download System Backup', action: async () => {
                try {
                    const data = await exportData();
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `nexflow_backup_${new Date().toISOString()}.json`; a.click();
                    addNotification('success', 'System backup downloaded');
                } catch (e) { addNotification('error', 'Backup failed'); }
            }}),
            commandService.register({ id: 'toggle-theme', label: 'Toggle Theme', action: () => setThemeMode(themeMode === 'light' ? 'dark' : 'light') }),
        ];
        return () => unregister.forEach(u => u());
    }, [createAdHocTask, navigateTo, exportData, themeMode, setThemeMode, addNotification]);

    const fileMenu: ToolbarAction[] = [
        ...(toolbarConfig.file || []),
        { divider: true, label: '' },
        { label: 'New Quick Task...', action: () => commandService.execute('quick-task'), shortcut: 'Alt+N' },
        { label: 'Start New Case...', action: () => commandService.execute('new-case') },
        { label: 'Download System Backup', action: () => commandService.execute('backup') }
    ];

    const editMenu: ToolbarAction[] = [
        ...(toolbarConfig.edit || []),
        { divider: true, label: '' },
        { label: 'Copy Page Link', action: () => { navigator.clipboard.writeText(window.location.href); addNotification('info', 'Copied'); }, shortcut: 'Alt+C' }
    ];

    const viewMenu: ToolbarAction[] = [
        ...(toolbarConfig.view || []),
        { divider: true, label: '' },
        { label: 'Focus Search', action: () => document.querySelector<HTMLInputElement>('input[placeholder="Global Search..."]')?.focus(), shortcut: 'Cmd+K' },
        { label: 'Toggle Fullscreen', action: () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(), shortcut: 'F11' },
        { divider: true, label: '' },
        { label: 'Light Mode', action: () => setThemeMode('light'), disabled: themeMode === 'light' },
        { label: 'Dark Mode', action: () => setThemeMode('dark'), disabled: themeMode === 'dark' },
        { label: 'Compact Density', action: () => setDensity('compact'), disabled: density === 'compact' },
        { label: 'Comfortable Density', action: () => setDensity('comfortable'), disabled: density === 'comfortable' },
    ];

    const toolsMenu: ToolbarAction[] = [
        ...(toolbarConfig.tools || []),
        { divider: true, label: '' },
        { label: 'Resource Planner', action: () => navigateTo('resource-planner') },
        { label: 'API Gateway', action: () => navigateTo('api-gateway') },
        { label: 'System Configuration', action: () => navigateTo('settings') }
    ];

    const userMenu: ToolbarAction[] = [
        { label: 'My Profile', action: () => currentUser && navigateTo('edit-user', currentUser.id) },
        { divider: true, label: '' },
        { label: 'Log Out', action: () => window.location.reload(), shortcut: 'Alt+Q' }
    ];

    const helpMenu: ToolbarAction[] = [
        ...(toolbarConfig.help || []),
        { label: 'Documentation', action: () => window.open('https://nexflow.io/docs', '_blank') },
        { label: 'Reset Demo Data', action: () => { if(confirm('Reset all data?')) reseedSystem(); }, divider: true, shortcut: 'Dev' },
    ];

    return (
        <div className="flex flex-wrap items-center px-2 bg-subtle border-b border-default min-h-[32px] select-none shrink-0 relative z-50" role="menubar">
            <ToolbarMenu label="File" items={fileMenu} isOpen={activeMenu === 'file'} onToggle={() => toggleMenu('file')} onClose={closeMenu} />
            <ToolbarMenu label="Edit" items={editMenu} isOpen={activeMenu === 'edit'} onToggle={() => toggleMenu('edit')} onClose={closeMenu} />
            <ToolbarMenu label="View" items={viewMenu} isOpen={activeMenu === 'view'} onToggle={() => toggleMenu('view')} onClose={closeMenu} />
            <ToolbarMenu label="Tools" items={toolsMenu} isOpen={activeMenu === 'tools'} onToggle={() => toggleMenu('tools')} onClose={closeMenu} />
            <ToolbarMenu label="User" items={userMenu} isOpen={activeMenu === 'user'} onToggle={() => toggleMenu('user')} onClose={closeMenu} />
            <ToolbarMenu label="Help" items={helpMenu} isOpen={activeMenu === 'help'} onToggle={() => toggleMenu('help')} onClose={closeMenu} />
        </div>
    );
};
