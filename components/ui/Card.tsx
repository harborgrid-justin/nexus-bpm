
import React from 'react';
import { GripVertical } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: React.ReactNode;
    actions?: React.ReactNode;
    dragHandle?: boolean;
}

export const NexCard = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '', title, actions, dragHandle, onClick, ...props }, ref) => (
  <div 
    ref={ref}
    onClick={onClick}
    className={`bg-panel border border-default shadow-sm flex flex-col rounded-base transition-colors ${onClick ? 'cursor-pointer hover:border-active' : ''} ${className}`}
    {...props}
  >
    {(title || actions || dragHandle) && (
        <div className="flex items-center justify-between border-b border-default bg-subtle px-card py-2">
            <div className="flex items-center gap-2">
                {dragHandle && <GripVertical size={14} className="text-tertiary cursor-grab active:cursor-grabbing drag-handle hover:text-primary"/>}
                <div className="font-bold text-primary text-sm">{title}</div>
            </div>
            <div className="flex items-center gap-2">{actions}</div>
        </div>
    )}
    <div className="flex-1 min-h-0 flex flex-col">{children}</div>
  </div>
));

NexCard.displayName = 'NexCard';
