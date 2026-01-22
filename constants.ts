
export const STEP_TYPES = {
  START: 'start',
  END: 'end',
  USER_TASK: 'user-task',
  SERVICE_TASK: 'service-task',
  SUB_PROCESS: 'sub-process',
  SCRIPT_TASK: 'script-task',
  EXCLUSIVE_GATEWAY: 'exclusive-gateway',
  PARALLEL_GATEWAY: 'parallel-gateway',
  INCLUSIVE_GATEWAY: 'inclusive-gateway',
  TIMER_EVENT: 'timer-event',
  MESSAGE_EVENT: 'message-event',
  BUSINESS_RULE: 'business-rule',
  NOTE: 'note'
} as const;

export const TASK_STATUS = {
  PENDING: 'Pending',
  CLAIMED: 'Claimed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected'
} as const;

export const PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
} as const;

export const LAYOUT_DIRECTION = {
  HORIZONTAL: 'LR',
  VERTICAL: 'TB'
} as const;

export const DRAFT_STORAGE_KEY = 'nexflow_draft';
