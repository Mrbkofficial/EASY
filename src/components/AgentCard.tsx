import React from 'react';
import { AgentName, AgentStatus, AgentState } from '../types';
import { AGENT_CONFIG } from '../constants';

const STATUS_STYLES: Record<AgentStatus, { label: string; dot: string; border: string }> = {
  idle:      { label: 'Idle',      dot: 'bg-gray-400',   border: 'border-gray-700' },
  working:   { label: 'Working',   dot: 'bg-green-400 animate-pulse', border: 'border-green-500/50' },
  completed: { label: 'Done',      dot: 'bg-blue-400',   border: 'border-blue-500/50' },
  error:     { label: 'Error',     dot: 'bg-red-400',    border: 'border-red-500/50' },
  offline:   { label: 'Offline',   dot: 'bg-gray-600',   border: 'border-gray-800' },
};

const AGENT_COLORS: Record<AgentName, { bg: string; icon: string; ring: string }> = {
  T:    { bg: 'bg-blue-900/40',   icon: 'text-blue-400',   ring: 'ring-blue-500/30' },
  A:    { bg: 'bg-orange-900/40', icon: 'text-orange-400', ring: 'ring-orange-500/30' },
  Boss: { bg: 'bg-purple-900/40', icon: 'text-purple-400', ring: 'ring-purple-500/30' },
};

const AgentIcon: React.FC<{ name: AgentName }> = ({ name }) => {
  if (name === 'T') return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  );
  if (name === 'A') return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/>
    </svg>
  );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
};

interface AgentCardProps {
  state: AgentState;
}

const AgentCard: React.FC<AgentCardProps> = ({ state }) => {
  const config = AGENT_CONFIG[state.name];
  const colors = AGENT_COLORS[state.name];
  const statusStyle = STATUS_STYLES[state.status];

  return (
    <div className={`${colors.bg} border ${statusStyle.border} rounded-xl p-4 flex flex-col gap-3 transition-all duration-300 ring-1 ${colors.ring}`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center ${colors.icon} ring-1 ${colors.ring}`}>
          <AgentIcon name={state.name} />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-white text-base">{config.fullName}</span>
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800/80`}>
              <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
              <span className="text-gray-300">{statusStyle.label}</span>
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">{config.title}</p>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-2.5 min-h-[44px]">
        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
          {state.currentTask || config.description}
        </p>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{state.tasksCompleted} task{state.tasksCompleted !== 1 ? 's' : ''} completed</span>
        <span className="truncate max-w-[120px]">{state.lastActivity || 'Awaiting mission'}</span>
      </div>
    </div>
  );
};

export default AgentCard;
