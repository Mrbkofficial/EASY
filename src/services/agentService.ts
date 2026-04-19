import { AgentEvent, AgentState, AgentName, MissionRequest } from '../types';
import { WS_URL, API_URL } from '../constants';

type EventCallback = (event: AgentEvent) => void;
type StateCallback = (states: Record<AgentName, AgentState>) => void;

class AgentService {
  private ws: WebSocket | null = null;
  private eventListeners: EventCallback[] = [];
  private stateListeners: StateCallback[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnected = false;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    try {
      this.ws = new WebSocket(WS_URL);
      this.ws.onopen = () => {
        this.isConnected = true;
        this.broadcast({ type: 'system', agent: 'System', content: 'Connected to Mission Control', timestamp: new Date().toISOString() });
      };
      this.ws.onmessage = (event) => {
        try {
          const data: AgentEvent = JSON.parse(event.data);
          this.eventListeners.forEach(cb => cb(data));
        } catch { /* ignore malformed messages */ }
      };
      this.ws.onclose = () => {
        this.isConnected = false;
        this.broadcast({ type: 'system', agent: 'System', content: 'Disconnected. Reconnecting...', timestamp: new Date().toISOString() });
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };
      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), 3000);
  }

  private broadcast(event: AgentEvent) {
    this.eventListeners.forEach(cb => cb(event));
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  onEvent(cb: EventCallback) {
    this.eventListeners.push(cb);
    return () => { this.eventListeners = this.eventListeners.filter(l => l !== cb); };
  }

  onStateUpdate(cb: StateCallback) {
    this.stateListeners.push(cb);
    return () => { this.stateListeners = this.stateListeners.filter(l => l !== cb); };
  }

  get connected() { return this.isConnected; }

  async startMission(request: MissionRequest): Promise<{ status: string; result?: string }> {
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
