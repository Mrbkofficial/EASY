import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AgentName, AgentState, AgentEvent, AgentStatus, TaskEntry, MissionRequest } from '../types';
import { AGENT_CONFIG } from '../constants';
import { agentService } from '../services/agentService';
import AgentCard from '../components/AgentCard';
import ActivityFeed from '../components/ActivityFeed';

const DEFAULT_AGENT_STATES: Record<AgentName, AgentState> = {
  T: { name: 'T', title: AGENT_CONFIG.T.title, status: 'offline', currentTask: '', tasksCompleted: 0, lastActivity: '' },
  A: { name: 'A', title: AGENT_CONFIG.A.title, status: 'offline', currentTask: '', tasksCompleted: 0, lastActivity: '' },
  Boss: { name: 'Boss', title: AGENT_CONFIG.Boss.title, status: 'offline', currentTask: '', tasksCompleted: 0, lastActivity: '' },
};

const MISSION_MODES: { value: MissionRequest['mode']; label: string; icon: string; description: string }[] = [
  { value: 'ideate', label: 'Ideate', icon: '💡', description: 'T generates ideas, A provides trend context' },
  { value: 'research', label: 'Research', icon: '🔍', description: 'A deep-dives into a topic or market' },
  { value: 'create', label: 'Create', icon: '🎨', description: 'Boss builds decks, visuals, or documents' },
  { value: 'manage', label: 'Manage', icon: '🎯', description: 'Boss orchestrates a full multi-agent project' },
];

const MissionControlView: React.FC = () => {
  const [agentStates, setAgentStates] = useState<Record<AgentName, AgentState>>(DEFAULT_AGENT_STATES);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [brief, setBrief] = useState('');
  const [mode, setMode] = useState<MissionRequest['mode']>('ideate');
  const [isMissionRunning, setIsMissionRunning] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'tasks'>('feed');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleEvent = useCallback((event: AgentEvent) => {
    setEvents(prev => [...prev.slice(-200), event]);

    if (event.agent === 'System') {
      setWsConnected(event.content.includes('Connected'));
      if (event.content.includes('Connected')) {
        setAgentStates(prev => {
          const next = { ...prev };
          (['T', 'A', 'Boss'] as AgentName[]).forEach(n => {
            if (next[n].status === 'offline') next[n] = { ...next[n], status: 'idle' };
          });
          return next;
        });
      }
      return;
    }

    const agentName = event.agent as AgentName;

    if (event.type === 'task_start') {
      setAgentStates(prev => ({ ...prev, [agentName]: { ...prev[agentName as AgentName], status: 'working', currentTask: event.task || event.content, lastActivity: new Date(event.timestamp).toLocaleTimeString() } }));
      if (event.task) {
        setTasks(prev => [...prev, {
          id: `${Date.now()}-${Math.random()}`,
          agent: agentName,
          description: event.task!,
          status: 'in_progress',
          createdAt: event.timestamp,
        }]);
      }
    } else if (event.type === 'task_complete') {
      setAgentStates(prev => ({ ...prev, [agentName]: { ...prev[agentName as AgentName], status: 'completed', currentTask: '', tasksCompleted: (prev[agentName as AgentName]?.tasksCompleted ?? 0) + 1, lastActivity: new Date(event.timestamp).toLocaleTimeString() } }));
      if (event.task) {
        setTasks(prev => prev.map(t =>
          t.description === event.task && t.agent === agentName
            ? { ...t, status: 'completed', completedAt: event.timestamp }
            : t
        ));
      }
    } else if (event.type === 'status_update') {
      setAgentStates(prev => ({ ...prev, [agentName]: { ...prev[agentName as AgentName], status: event.content.includes('idle') ? 'idle' : 'working', lastActivity: new Date(event.timestamp).toLocaleTimeString() } }));
    }
  }, []);

  useEffect(() => {
    agentService.connect();
    return () => { agentService.disconnect(); };
  }, []);

  useEffect(() => {
    const unsub = agentService.onEvent(handleEvent);
    return unsub;
  }, [handleEvent]);

  const handleLaunchMission = async () => {
    if (!brief.trim() || isMissionRunning) return;
    setIsMissionRunning(true);
    try {
      await agentService.startMission({ brief: brief.trim(), mode });
    } catch (err) {
      setEvents(prev => [...prev, {
        type: 'error',
        agent: 'System',
        content: `Failed to start mission: ${err instanceof Error ? err.message : 'Backend offline. Start the Python server.'}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsMissionRunning(false);
      setBrief('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleLaunchMission();
  };

  const clearFeed = () => setEvents([]);

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="flex flex-col h-full pt-16 pb-20 overflow-hidden text-white">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/40 backdrop-blur-sm flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Mission Control</h2>
          <p className="text-xs text-gray-400">Coordinate your AI agent team</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${wsConnected ? 'bg-green-900/40 text-green-400 border border-green-700/40' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
            {wsConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-4">
        {/* Agent cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['T', 'A', 'Boss'] as AgentName[]).map(name => (
            <AgentCard key={name} state={agentStates[name]} />
          ))}
        </div>

        {/* Mission launcher */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-200">Launch a Mission</h3>

          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-2">
            {MISSION_MODES.map(m => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${mode === m.value ? 'bg-green-900/40 border-green-600/50 text-green-300' : 'bg-slate-900/50 border-slate-700/50 text-gray-400 hover:border-slate-600'}`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 italic">{MISSION_MODES.find(m => m.value === mode)?.description}</p>

          <textarea
            ref={inputRef}
            value={brief}
            onChange={e => setBrief(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Brief The Boss on the mission... (⌘+Enter to launch)`}
            rows={3}
            className="w-full bg-slate-900/70 border border-slate-600/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
          />

          <div className="flex gap-2">
            <button
              onClick={handleLaunchMission}
              disabled={!brief.trim() || isMissionRunning}
              className="flex-grow py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-gray-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isMissionRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Running...
                </>
              ) : (
                <>
                  <span>🚀</span> Launch Mission
                </>
              )}
            </button>
            {isMissionRunning && (
              <button onClick={() => agentService.stopMission()} className="px-3 py-2.5 bg-red-900/40 border border-red-700/40 text-red-400 text-sm rounded-lg hover:bg-red-800/40 transition-colors">Stop</button>
            )}
          </div>
        </div>

        {/* Activity / Tasks tabs */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-700/50">
            {(['feed', 'tasks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === tab ? 'text-white bg-slate-700/40 border-b-2 border-green-500' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {tab === 'feed' ? `Activity Feed` : `Tasks (${tasks.length})`}
              </button>
            ))}
            <button onClick={clearFeed} className="px-3 text-xs text-gray-600 hover:text-gray-400 transition-colors">Clear</button>
          </div>

          <div className="p-3">
            {activeTab === 'feed' ? (
              <ActivityFeed events={events} maxHeight="280px" />
            ) : (
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '280px' }}>
                {pendingTasks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">In Progress</p>
                    <div className="space-y-1.5">
                      {pendingTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2 text-xs">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'in_progress' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></span>
                          <span className={`font-medium ${task.agent === 'T' ? 'text-blue-400' : task.agent === 'A' ? 'text-orange-400' : 'text-purple-400'}`}>{task.agent}</span>
                          <span className="text-gray-300 flex-grow truncate">{task.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {completedTasks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Completed</p>
                    <div className="space-y-1.5">
                      {completedTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 bg-slate-900/30 rounded-lg px-3 py-2 text-xs opacity-60">
                          <span className="text-green-500">✓</span>
                          <span className="text-gray-400">{task.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {tasks.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">No tasks yet — launch a mission to begin.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionControlView;
