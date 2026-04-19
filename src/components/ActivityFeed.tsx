import React, { useEffect, useRef } from 'react';
import { AgentEvent, AgentName } from '../types';

const AGENT_COLORS: Record<AgentName | 'System', string> = {
  T:      'text-blue-400',
  A:      'text-orange-400',
  Boss:   'text-purple-400',
  System: 'text-gray-400',
};

const EVENT_ICONS: Record<string, string> = {
  task_start:    '▶',
  task_complete: '✓',
  agent_message: '💬',
  delegation:    '→',
  status_update: '●',
  system:        '◆',
  error:         '✗',
};

interface ActivityFeedProps {
  events: AgentEvent[];
  maxHeight?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ events, maxHeight = '320px' }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm gap-2">
        <span className="text-2xl opacity-40">◈</span>
        <span>Awaiting first transmission...</span>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto space-y-1.5 pr-1" style={{ maxHeight }}>
      {events.map((event, i) => {
        const colorClass = AGENT_COLORS[event.agent as keyof typeof AGENT_COLORS] || 'text-gray-400';
        const icon = EVENT_ICONS[event.type] || '●';
        const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return (
          <div key={i} className="flex items-start gap-2 text-xs bg-slate-900/50 rounded-lg px-3 py-2 hover:bg-slate-800/50 transition-colors">
            <span className={`${colorClass} mt-0.5 font-mono w-4 text-center flex-shrink-0`}>{icon}</span>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`font-bold ${colorClass}`}>{event.agent}</span>
                {event.task && <span className="text-gray-600 truncate max-w-[120px]">· {event.task}</span>}
              </div>
              <p className="text-gray-300 leading-relaxed break-words">{event.content}</p>
            </div>
            <span className="text-gray-600 flex-shrink-0 font-mono">{time}</span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default ActivityFeed;
