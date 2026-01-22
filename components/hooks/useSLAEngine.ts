
import { useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';

interface SLAOptions {
    onEscalate: (task: Task) => void;
    checkInterval?: number; // ms
}

export const useSLAEngine = (tasks: Task[], { onEscalate, checkInterval = 60000 }: SLAOptions) => {
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            
            tasks.forEach(t => {
                if (
                    t.status !== TaskStatus.COMPLETED && 
                    t.status !== TaskStatus.REJECTED &&
                    t.dueDate && 
                    t.priority !== TaskPriority.CRITICAL
                ) {
                    const due = new Date(t.dueDate);
                    // Check if overdue
                    if (due < now) {
                        onEscalate(t);
                    }
                }
            });
        }, checkInterval);

        return () => clearInterval(interval);
    }, [tasks, onEscalate, checkInterval]);
};
