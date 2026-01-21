
import React, { useState, useRef, useEffect } from 'react';
import { useBPM } from '../../contexts/BPMContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ToolbarAction } from '../../types';

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
                className={`px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200 rounded-sm transition-colors whitespace-nowrap ${isOpen ? 'bg-slate-200 font-bold text-slate-900' : ''}`}
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
                                        onClose();
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
    const { toolbarConfig, navigateTo, reseedSystem, createAdHocTask, exportData, currentUser, addNotification } = useBPM();
    const { themeMode, setThemeMode, density, setDensity } = useTheme();
    
    // Siloed State: Only one menu active at a time
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const toggleMenu = (menu: string) => setActiveMenu(curr => curr === menu ? null : menu);
    const closeMenu = () => setActiveMenu(null);

    // --- 10 Global Wired Actions ---

    // 1. Quick Task
    const actionQuickTask = async () => {
        const title = prompt("Enter task title:");
        if (title) {
            await createAdHocTask(title);
            addNotification('success', 'Task created successfully');
            navigateTo('inbox');
        }
    };

    // 2. New Case
    const actionNewCase = () => navigateTo('create-case');

    // 3. Backup Data
    const actionBackup = async () => {
        try {
            const data = await exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nexflow_backup_${new Date().toISOString()}.json`;
            a.click();
            addNotification('success', 'System backup downloaded');
        } catch (e) {
            addNotification('error', 'Backup failed');
        }
    };

    // 4. Copy Link
    const actionCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        addNotification('info', 'Current URL copied to clipboard');
    };

    // 5. Focus Search (Robust)
    const actionSearch = () => {
        const input = document.querySelector('input[placeholder="Global Search..."]') as HTMLInputElement;
        // Check if input exists and is visible (not hidden by media query)
        if (input && input.offsetParent !== null) {
            input.focus();
            input.select();
        } else {
            // Fallback: Dispatch Ctrl+K to open Command Palette on mobile/when hidden
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
        }
    };

    // 6. Fullscreen
    const actionFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.error(e));
        } else {
            document.exitFullscreen().catch(e => console.error(e));
        }
    };

    // 7. Resource Planner
    const actionPlanner = () => navigateTo('resource-planner');

    // 8. API Gateway
    const actionGateway = () => navigateTo('api-gateway');

    // 9. System Settings
    const actionSettings = () => navigateTo('settings');

    // 10. My Profile
    const actionProfile = () => {
        if (currentUser) navigateTo('edit-user', currentUser.id);
    };

    // --- Menu Construction ---

    const fileMenu: ToolbarAction[] = [
        ...(toolbarConfig.file || []),
        { divider: true, label: '' },
        { label: 'New Quick Task...', action: actionQuickTask, shortcut: 'Alt+N' },
        { label: 'Start New Case...', action: actionNewCase },
        { label: 'Download System Backup', action: actionBackup }
    ];

    const editMenu: ToolbarAction[] = [
        ...(toolbarConfig.edit || []),
        { divider: true, label: '' },
        { label: 'Copy Page Link', action: actionCopyLink, shortcut: 'Alt+C' }
    ];

    const viewMenu: ToolbarAction[] = [
        ...(toolbarConfig.view || []),
        { divider: true, label: '' },
        { label: 'Focus Search', action: actionSearch, shortcut: 'Cmd+K' },
        { label: 'Toggle Fullscreen', action: actionFullscreen, shortcut: 'F11' },
        { divider: true, label: '' },
        { label: 'Light Mode', action: () => setThemeMode('light'), disabled: themeMode === 'light' },
        { label: 'Dark Mode', action: () => setThemeMode('dark'), disabled: themeMode === 'dark' },
        { label: 'Compact Density', action: () => setDensity('compact'), disabled: density === 'compact' },
        { label: 'Comfortable Density', action: () => setDensity('comfortable'), disabled: density === 'comfortable' },
    ];

    const toolsMenu: ToolbarAction[] = [
        ...(toolbarConfig.tools || []),
        { divider: true, label: '' },
        { label: 'Resource Planner', action: actionPlanner },
        { label: 'API Gateway', action: actionGateway },
        { label: 'System Configuration', action: actionSettings }
    ];

    const userMenu: ToolbarAction[] = [
        { label: 'My Profile', action: actionProfile },
        { divider: true, label: '' },
        { label: 'Log Out', action: () => window.location.reload(), shortcut: 'Alt+Q' }
    ];

    const defaultHelpActions: ToolbarAction[] = [
        { label: 'Documentation', action: () => window.open('https://nexflow.io/docs', '_blank') },
        { label: 'Keyboard Shortcuts', action: () => alert('Press Ctrl+K for Command Palette') },
        { label: 'About NexFlow', action: () => alert('NexFlow Enterprise BPM v2.4.0') },
        { label: 'Reset Demo Data', action: () => { if(confirm('Reset all data?')) reseedSystem(); }, divider: true, shortcut: 'Dev' },
    ];

    return (
        <div className="flex flex-wrap items-center px-2 bg-slate-50 border-b border-default min-h-[32px] select-none shrink-0 relative z-50" role="menubar">
            <ToolbarMenu label="File" items={fileMenu} isOpen={activeMenu === 'file'} onToggle={() => toggleMenu('file')} onClose={closeMenu} />
            <ToolbarMenu label="Edit" items={editMenu} isOpen={activeMenu === 'edit'} onToggle={() => toggleMenu('edit')} onClose={closeMenu} />
            <ToolbarMenu label="View" items={viewMenu} isOpen={activeMenu === 'view'} onToggle={() => toggleMenu('view')} onClose={closeMenu} />
            <ToolbarMenu label="Tools" items={toolsMenu} isOpen={activeMenu === 'tools'} onToggle={() => toggleMenu('tools')} onClose={closeMenu} />
            <ToolbarMenu label="User" items={userMenu} isOpen={activeMenu === 'user'} onToggle={() => toggleMenu('user')} onClose={closeMenu} />
            <ToolbarMenu label="Help" items={[...(toolbarConfig.help || []), ...defaultHelpActions]} isOpen={activeMenu === 'help'} onToggle={() => toggleMenu('help')} onClose={closeMenu} />
        </div>
    );
};
