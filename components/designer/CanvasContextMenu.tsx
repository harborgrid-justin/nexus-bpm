import React, { useEffect, useRef } from 'react';
import { 
  Copy, Trash2, Edit, Link2Off, Settings, 
  Plus, Play, Square, GitBranch, Crosshair, 
  ClipboardPaste, Eraser, Clipboard
} from 'lucide-react';
import { ProcessStepType } from '../../types';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  targetId: string | null;
  onClose: () => void;
  onAction: (action: string, payload?: any) => void;
}

const MenuItem = ({ icon: Icon, label, action, payload, shortcut, danger, onClick }: any) => (
  <button 
    type="button"
    onClick={(e) => onClick(e, action, payload)}
    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors group ${danger ? 'hover:bg-rose-50 text-rose-700' : 'hover:bg-blue-50 text-slate-700'}`}
  >
    <div className="flex items-center gap-2">
      <Icon size={14} className={danger ? 'text-rose-500' : 'text-slate-400 group-hover:text-blue-600'} />
      <span className="font-medium">{label}</span>
    </div>
    {shortcut && <span className="text-[10px] text-slate-400 font-mono ml-4">{shortcut}</span>}
  </button>
);

const Divider = () => <div className="h-px bg-slate-100 my-1" />;

export const CanvasContextMenu: React.FC<ContextMenuProps> = ({ position, targetId, onClose, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // If the menu is clicked, we rely on stopPropagation below, 
      // but for extra safety we check containment here too.
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use capture to ensure we catch events, but our stopPropagation in the div helps isolate it.
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [onClose]);

  if (!position) return null;

  const handleItemClick = (e: React.MouseEvent, action: string, payload?: any) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to any parent handlers
    onAction(action, payload);
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      // Critical: Stop mousedown propagation so the document listener doesn't see it and close the menu
      onMouseDown={(e) => e.stopPropagation()} 
      className="fixed z-dropdown bg-white border border-slate-200 rounded-sm shadow-xl min-w-[180px] animate-fade-in flex flex-col py-1"
      style={{ top: position.y, left: position.x }}
    >
      {targetId ? (
        // --- NODE CONTEXT ---
        <>
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            Component Options
          </div>
          <MenuItem icon={Settings} label="Properties" action="edit" onClick={handleItemClick} />
          <MenuItem icon={Clipboard} label="Copy" action="copy" shortcut="Ctrl+C" onClick={handleItemClick} />
          <MenuItem icon={Copy} label="Duplicate" action="duplicate" shortcut="Ctrl+D" onClick={handleItemClick} />
          <MenuItem icon={Link2Off} label="Disconnect" action="disconnect" onClick={handleItemClick} />
          <Divider />
          <MenuItem icon={Trash2} label="Delete" action="delete" danger shortcut="Del" onClick={handleItemClick} />
        </>
      ) : (
        // --- CANVAS CONTEXT ---
        <>
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            Canvas Actions
          </div>
          <MenuItem icon={ClipboardPaste} label="Paste Component" action="paste" shortcut="Ctrl+V" onClick={handleItemClick} />
          <Divider />
          <MenuItem icon={Plus} label="Add User Task" action="add-node" payload="user-task" onClick={handleItemClick} />
          <MenuItem icon={GitBranch} label="Add Gateway" action="add-node" payload="exclusive-gateway" onClick={handleItemClick} />
          <MenuItem icon={Play} label="Add Start Event" action="add-node" payload="start" onClick={handleItemClick} />
          <Divider />
          <MenuItem icon={Crosshair} label="Reset View" action="reset-view" onClick={handleItemClick} />
          <MenuItem icon={Eraser} label="Clear Canvas" action="clear-canvas" danger onClick={handleItemClick} />
        </>
      )}
    </div>
  );
};