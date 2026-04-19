export enum UserTier {
  Free = 'Free',
  Pro = 'Pro',
  Premium = 'Premium',
}

export enum ProjectStatus {
  Open = 'Open',
  Completed = 'Completed',
}

export interface Project {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  status: ProjectStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  companyName: string;
  tier: UserTier;
  projects: Project[];
  avatar?: string;
  companyLogo?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

// ── Agent system types ────────────────────────────────────────────────────────

export type AgentName = 'T' | 'A' | 'Boss';
export type AgentStatus = 'idle' | 'working' | 'completed' | 'error' | 'offline';

export type AgentEventType =
  | 'status_update'
  | 'task_start'
  | 'task_complete'
  | 'agent_message'
  | 'delegation'
  | 'system'
  | 'error';

export interface AgentEvent {
  type: AgentEventType;
  agent: AgentName | 'System';
  content: string;
  task?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentState {
  name: AgentName;
  title: string;
  status: AgentStatus;
  currentTask: string;
  tasksCompleted: number;
  lastActivity: string;
}

export interface MissionRequest {
  brief: string;
  mode: 'ideate' | 'research' | 'create' | 'manage';
}

export interface TaskEntry {
  id: string;
  agent: AgentName;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
}
