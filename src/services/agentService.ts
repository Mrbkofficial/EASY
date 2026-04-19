import { AgentEvent, AgentState, AgentName, MissionRequest } from '../types';
import { API_URL } from '../constants';

type EventCallback = (event: AgentEvent) => void;

class AgentService {
  private eventListeners: EventCallback[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private latestSeq = 0;
  private _connected = false;

  connect() {
    if (this.pollTimer) return;
    this._connected = true;
    this.broadcast({
      type: 'system',
      agent: 'System',
      content: 'Agent Hub connected. Agents T, A, and The Boss are online.',
      timestamp: new Date().toISOString(),
    });
    // Poll for events every 2 seconds
    this.pollTimer = setInterval(() => this.pollEvents(), 2000);
    this.pollEvents(); // fetch immediately on connect
  }

  disconnect() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this._connected = false;
  }

  private async pollEvents() {
    try {
      const res = await fetch(`${API_URL}/api/events?since_seq=${this.latestSeq}`);
      if (!res.ok) return;
      const data = await res.json();
      const events: (AgentEvent & { _seq?: number })[] = data.events ?? [];
      if (data.latest_seq > this.latestSeq) this.latestSeq = data.latest_seq;
      events.forEach(({ _seq: _s, ...event }) => this.broadcast(event as AgentEvent));
    } catch {
      // ignore transient network errors
    }
  }

  private broadcast(event: AgentEvent) {
    this.eventListeners.forEach(cb => cb(event));
  }

  onEvent(cb: EventCallback) {
    this.eventListeners.push(cb);
    return () => { this.eventListeners = this.eventListeners.filter(l => l !== cb); };
  }

  onStateUpdate(_cb: (states: Record<AgentName, AgentState>) => void) {
    return () => {};
  }

  get connected() { return this._connected; }

  async startMission(request: MissionRequest): Promise<{ status: string; result?: string; error?: string }> {
    const res = await fetch(`${API_URL}/api/mission/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Mission failed: ${res.statusText}`);
    return res.json();
  }

  async getAgentStatus(): Promise<Record<AgentName, AgentState>> {
    const res = await fetch(`${API_URL}/api/status`);
    if (!res.ok) throw new Error('Failed to fetch agent status');
    return res.json();
  }

  async stopMission(): Promise<void> {
    await fetch(`${API_URL}/api/mission/stop`, { method: 'POST' });
  }
}

export const agentService = new AgentService();
