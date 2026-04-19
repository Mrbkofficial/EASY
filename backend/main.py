"""EASY Agent Hub — FastAPI backend with polling-based event delivery."""
import asyncio
import os
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

executor = ThreadPoolExecutor(max_workers=4)

# ── Event store (replaces WebSocket broadcast) ────────────────────────────────

_event_store: list[dict] = []
_event_seq: int = 0


def _store_event(event: dict):
    global _event_seq, _event_store
    _event_seq += 1
    _event_store.append({**event, "_seq": _event_seq})
    if len(_event_store) > 300:
        _event_store.pop(0)


async def broadcast(message: dict):
    _store_event(message)


def broadcast_sync(message: dict):
    """Thread-safe emit from synchronous agent code."""
    _store_event(message)


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
    _store_event(_system_event("Agent Hub online. Agents T, A, and The Boss are ready."))
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


# ── REST API ──────────────────────────────────────────────────────────────────

class MissionRequest(BaseModel):
    brief: str
    mode: str = "ideate"


class MissionResponse(BaseModel):
    status: str
    result: Optional[str] = None
    error: Optional[str] = None


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "anthropic_key_set": bool(os.getenv("ANTHROPIC_API_KEY")),
        "event_count": len(_event_store),
    }


@app.get("/api/events")
async def get_events(since_seq: int = 0):
    """Poll for new agent events since a given sequence number."""
    events = [e for e in _event_store if e.get("_seq", 0) > since_seq]
    return {"events": events, "latest_seq": _event_seq}


@app.get("/api/status")
async def agent_status():
    return {
        "T": {"name": "T", "title": "Idea Creator & Product Designer", "status": "idle", "currentTask": "", "tasksCompleted": 0, "lastActivity": ""},
        "A": {"name": "A", "title": "Adventurous Researcher", "status": "idle", "currentTask": "", "tasksCompleted": 0, "lastActivity": ""},
        "Boss": {"name": "Boss", "title": "Creative Director & Manager", "status": "idle", "currentTask": "", "tasksCompleted": 0, "lastActivity": ""},
    }


@app.post("/api/mission/start", response_model=MissionResponse)
async def start_mission(request: MissionRequest):
    if not os.getenv("ANTHROPIC_API_KEY"):
        return MissionResponse(
            status="error",
            error="ANTHROPIC_API_KEY not set. Please add it to backend/.env and restart."
        )

    _store_event(_system_event(f"Mission launched: [{request.mode.upper()}] {request.brief[:100]}"))

    def _run_crew():
        from crew import MissionCrew
        crew = MissionCrew(broadcast_fn=broadcast_sync)
        return crew.run_mission(brief=request.brief, mode=request.mode)

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _run_crew)
        _store_event(_system_event(f"Mission complete.", "system"))
        return MissionResponse(status="completed", result=str(result)[:2000])
    except Exception as e:
        error_msg = str(e)
        _store_event(_system_event(f"Mission failed: {error_msg}", "error"))
        return MissionResponse(status="error", error=error_msg)


@app.post("/api/mission/stop")
async def stop_mission():
    _store_event(_system_event("Mission stop requested."))
    return {"status": "stop_requested"}


@app.get("/api/trends")
async def get_trends(keywords: str = "AI,design,technology"):
    def _fetch():
        from pytrends.request import TrendReq
        pt = TrendReq(hl="en-US", tz=360)
        kw_list = [k.strip() for k in keywords.split(",")][:5]
        pt.build_payload(kw_list, timeframe="today 1-m")
        data = pt.interest_over_time()
        return data.tail(4).to_string() if not data.empty else "No data"

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _fetch)
        return {"status": "ok", "data": result}
    except Exception as e:
        return {"status": "error", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False)
