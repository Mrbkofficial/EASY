import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../constants';

interface MissionRecord {
  id: string;
  brief: string;
  mode: string;
  timestamp: string;
  status: 'running' | 'completed' | 'error';
  result: string | null;
  error: string | null;
}

const MODE_COLORS: Record<string, string> = {
  ideate:   'bg-blue-900/40 text-blue-300 border-blue-700/40',
  research: 'bg-orange-900/40 text-orange-300 border-orange-700/40',
  create:   'bg-pink-900/40 text-pink-300 border-pink-700/40',
  manage:   'bg-purple-900/40 text-purple-300 border-purple-700/40',
};

const ReportsView: React.FC = () => {
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMissions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/missions`);
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions ?? []);
      }
    } catch { /* backend offline */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMissions();
    const t = setInterval(fetchMissions, 5000);
    return () => clearInterval(t);
  }, [fetchMissions]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col h-full pt-16 pb-20 overflow-hidden text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/40 backdrop-blur-sm flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Reports</h2>
          <p className="text-xs text-gray-400">All past missions and research</p>
        </div>
        <button onClick={fetchMissions} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-slate-700 transition-colors">
          Refresh
        </button>
      </div>

      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="text-center text-gray-500 py-12 text-sm">Loading reports...</div>
        )}

        {!loading && missions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 space-y-3">
            <span className="text-4xl opacity-30">📋</span>
            <p className="text-sm">No missions yet.</p>
            <p className="text-xs text-gray-600">Launch a mission from Mission Control to see results here.</p>
          </div>
        )}

        {missions.map(m => (
          <div key={m.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Header row */}
            <button
              onClick={() => setExpanded(expanded === m.id ? null : m.id)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors text-left"
            >
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${MODE_COLORS[m.mode] ?? MODE_COLORS.ideate}`}>
                    {m.mode}
                  </span>
                  {m.status === 'running' && (
                    <span className="flex items-center gap-1 text-[10px] text-green-400">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>Running
                    </span>
                  )}
                  {m.status === 'error' && (
                    <span className="text-[10px] text-red-400">Failed</span>
                  )}
                  <span className="text-[10px] text-gray-500 ml-auto">
                    {new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-200 font-medium leading-snug truncate">{m.brief}</p>
              </div>
              <span className="text-gray-500 flex-shrink-0 mt-1">{expanded === m.id ? '▲' : '▼'}</span>
            </button>

            {/* Expanded result */}
            {expanded === m.id && (
              <div className="border-t border-slate-700/50 px-4 py-3 space-y-3">
                {m.status === 'running' && (
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Mission in progress — refresh in a moment.
                  </p>
                )}
                {m.status === 'error' && (
                  <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                    <p className="text-xs text-red-300 font-semibold mb-1">Error</p>
                    <p className="text-xs text-red-200">{m.error}</p>
                  </div>
                )}
                {m.result && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Result</p>
                      <button
                        onClick={() => handleCopy(m.result!, m.id)}
                        className="text-xs px-2 py-1 rounded border border-slate-600 text-gray-400 hover:text-white hover:border-slate-400 transition-colors"
                      >
                        {copied === m.id ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-3 max-h-[500px] overflow-y-auto">
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{m.result}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsView;
