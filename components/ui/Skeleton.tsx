
import React from 'react';

export const NexSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 rounded-sm ${className}`} />
);
