"""EASY Agent Hub — FastAPI backend with WebSocket Mission Control."""
import asyncio
import os
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

executor = ThreadPoolExecutor(max_workers=4)
_active_mission: Optional[asyncio.Future] = None


# ── WebSocket connection manager ──────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    def emit_sync(self, message: dict):
        """Thread-safe emit from synchronous code (e.g. CrewAI callbacks)."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(self.broadcast(message), loop)
        except Exception:
            pass


manager = ConnectionManager()


def _system_event(content: str, event_type: str = "system") -> dict:
    return {
        "type": event_type,
        "agent": "System",
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── App lifecycle ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("EASY Agent Hub starting up...")
    print(f"  Anthropic key: {'SET' if os.getenv('ANTHROPIC_API_KEY') else 'NOT SET ⚠️'}")
    print(f"  Reddit creds:  {'SET' if os.getenv('REDDIT_CLIENT_ID') else 'not set (web fallback)'}")
    print(f"  Twitter token: {'SET' if os.getenv('TWITTER_BEARER_TOKEN') else 'not set (web fallback)'}")
    yield
    executor.shutdown(wait=False)
    print("EASY Agent Hub shutting down.")


app = FastAPI(title="EASY Agent Hub", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    await manager.broadcast(_system_event("Agent Hub connected. Agents T, A, and The Boss are online."))
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back any client messages as system events
            await manager.broadcast(_system_event(f"Received: {data}"))
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── REST API ──────────────────────────────────────────────────────────────────

class MissionRequest(BaseModel):
    brief: str
    mode: str = "ideate"  # ideate | research | create | manage


class MissionResponse(BaseModel):
    status: str
    result: Optional[str] = None
    error: Optional[str] = None


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "anthropic_key_set": bool(os.getenv("ANTHROPIC_API_KEY")),
        "connected_clients": len(manager.connections),
    }


@app.get("/api/status")
async def agent_status():
    """Return current agent state summary."""
    return {
        "T": {"name": "T", "title": "Idea Creator & Product Designer", "status": "idle", "currentTask": "", "tasksCompleted": 0, "lastActivity": ""},
        "A": {"name": "A", "title": "Adventurous Researcher", "status": "idle", "currentTask": "", "tasksCompleted": 0, "lastActivity": ""},
        "Boss": {"name": "Boss", "title": "Creative Director & Manager", "status": "idle", "currentTask": "", "tasksCompleted": 0, "lastActivity": ""},
    }


@app.post("/api/mission/start", response_model=MissionResponse)
async def start_mission(request: MissionRequest):
    global _active_mission

    if not os.getenv("ANTHROPIC_API_KEY"):
        return MissionResponse(
            status="error",
            error="ANTHROPIC_API_KEY not set. Please add it to backend/.env and restart the server."
        )

    await manager.broadcast(_system_event(f"Mission launched: [{request.mode.upper()}] {request.brief[:100]}"))

    def _run_crew():
        from crew import MissionCrew
        crew = MissionCrew(broadcast_fn=manager.broadcast)
        return crew.run_mission(brief=request.brief, mode=request.mode)

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _run_crew)
        return MissionResponse(status="completed", result=str(result)[:2000])
    except Exception as e:
        error_msg = str(e)
        await manager.broadcast(_system_event(f"Mission failed: {error_msg}", "error"))
        return MissionResponse(status="error", error=error_msg)


@app.post("/api/mission/stop")
async def stop_mission():
    await manager.broadcast(_system_event("Mission stop requested by user."))
    return {"status": "stop_requested"}


@app.get("/api/trends")
async def get_trends(keywords: str = "AI,design,technology"):
    """Quick trend check — no auth needed."""
    def _fetch_trends():
        from tools import GoogleTrendsTool
        tool = GoogleTrendsTool()
        kw_list = [k.strip() for k in keywords.split(",")][:5]
        return tool._run(keywords=kw_list, timeframe="today 1-m")

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _fetch_trends)
        return {"status": "ok", "data": result}
    except Exception as e:
        return {"status": "error", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False)
