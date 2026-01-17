
import React from 'react';
import { ProcessStepType } from '../../types';
import { 
  Play, Flag, User, Cog, GitBranch, Box, 
  FunctionSquare, Zap, Clock, ShieldCheck, Mail
} from 'lucide-react';

export interface StepMetadata {
  icon: React.ElementType;
  color: string;
  defaultName: string;
  defaultSkills?: string[];
  description?: string;
}

export const getStepTypeMetadata = (type: ProcessStepType): StepMetadata => {
  const metadata: { [key in ProcessStepType]?: StepMetadata } = {
    'start': { 
      icon: Play, 
      color: 'text-slate-900', 
      defaultName: 'Initiation Entry',
      description: 'Trigger point for the business cycle.'
    },
    'end': { 
      icon: Flag, 
      color: 'text-slate-900', 
      defaultName: 'Resolution End',
      description: 'Conclusion of the operational thread.'
    },
    'user-task': { 
      icon: User, 
      color: 'text-blue-600', 
      defaultName: 'Human Action',
      description: 'Manual intervention or verification step.',
      defaultSkills: ['BPMN']
    },
    'service-task': { 
      icon: Cog, 
      color: 'text-indigo-600', 
      defaultName: 'System Procedure',
      description: 'Automated ERP or API integration.'
    },
    'decision': { 
      icon: GitBranch, 
      color: 'text-amber-600', 
      defaultName: 'Decision Logic',
      description: 'Boolean or multi-variate branch logic.'
    },
    'sub-process': { 
      icon: Box, 
      color: 'text-slate-600', 
      defaultName: 'Encapsulated Flow',
      description: 'Nested workflow container.'
    },
    'rules-engine-task': { 
      icon: FunctionSquare, 
      color: 'text-slate-900', 
      defaultName: 'Rule Execution',
      description: 'Declarative business logic execution.'
    },
    'parallel-gateway': { 
      icon: Zap, 
      color: 'text-emerald-600', 
      defaultName: 'Parallel Sync',
      description: 'Concurrent execution thread synchronization.'
    }
  };
  return metadata[type] || { 
    icon: Cog, 
    color: 'text-slate-400', 
    defaultName: 'Standard Component' 
  };
};
