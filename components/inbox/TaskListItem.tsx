
import React from 'react';
import { Task, TaskPriority } from '../../types';
import { Clock, Layers, ChevronRight, AlertCircle } from 'lucide-react';

export const getPriorityClasses = (p: TaskPriority) => {
  switch (p) {
    case TaskPriority.CRITICAL: return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' };
    case TaskPriority.HIGH: return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
    case TaskPriority.MEDIUM: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' };
    default: return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };
  }
};

interface TaskListItemProps {
  task: Task;
  selectedTask: Task | null;
  onSelectTask: (task: Task) => void;
}

export const TaskListItem: React.FC<TaskListItemProps> = ({ task, selectedTask, onSelectTask }) => {
  const isSelected = selectedTask?.id === task.id;
  const pc = getPriorityClasses(task.priority);
  
  return (
    <div 
      onClick={() => onSelectTask(task)}
      className={`px-6 py-6 border-b border-slate-100 cursor-pointer transition-all duration-200 relative group ${isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}
    >
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900 rounded-r-full"></div>}
      
      <div className="flex justify-between items-start mb-3">
        <h4 className={`text-[15px] font-black leading-tight transition-colors pr-6 flex-1 ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-2 shrink-0">
          {task.priority === TaskPriority.CRITICAL && <AlertCircle size={14} className="text-rose-500 animate-pulse" />}
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${pc.bg} ${pc.text} ${pc.border}`}>
            {task.priority}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
         <div className="flex items-center gap-2 max-w-[60%]">
            <Layers size={12} className="opacity-80 shrink-0" /> 
            <span className="truncate">{task.processName}</span>
         </div>
         <div className="flex items-center gap-2">
            <Clock size={12} className="opacity-80 shrink-0" /> 
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
         </div>
      </div>
      
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-all opacity-0 group-hover:opacity-100">
        <ChevronRight size={18} />
      </div>
    </div>
  );
};
