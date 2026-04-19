#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# EASY Agent Hub — Start Script
# Starts the Python agent backend and the React frontend
# ─────────────────────────────────────────────────────────────────────────────

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        EASY Agent Hub — Starting         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Check for .env files ──────────────────────────────────────────────────────
if [ ! -f "$BACKEND/.env" ]; then
  echo "⚠️  No backend/.env found. Copying from .env.example..."
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  echo "   → Edit backend/.env and add your ANTHROPIC_API_KEY before running missions."
  echo ""
fi

if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env" 2>/dev/null || true
fi

# ── Python backend ────────────────────────────────────────────────────────────
echo "🐍 Starting Python backend..."

cd "$BACKEND"

# Create venv if needed
if [ ! -d ".venv" ]; then
  echo "   Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
echo "   Installing Python dependencies..."
pip install -r requirements.txt -q

echo "   Starting FastAPI server on http://localhost:8000"
python main.py &
BACKEND_PID=$!

cd "$ROOT"

# ── Node / React frontend ─────────────────────────────────────────────────────
echo ""
echo "⚛️  Starting React frontend..."

if [ ! -d "node_modules" ]; then
  echo "   Installing Node dependencies..."
  npm install
fi

echo "   Starting Vite dev server on http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🚀 EASY Agent Hub is running!                       ║"
echo "║                                                       ║"
echo "║  Frontend:   http://localhost:5173                    ║"
echo "║  Agent API:  http://localhost:8000                    ║"
echo "║  API Docs:   http://localhost:8000/docs               ║"
echo "║                                                       ║"
echo "║  Agents: T (Idea Creator) | A (Researcher)           ║"
echo "║           The Boss (Director + Mac Control)           ║"
echo "║                                                       ║"
echo "║  Press Ctrl+C to stop everything                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Cleanup on exit
trap "echo ''; echo 'Stopping agents...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait $BACKEND_PID $FRONTEND_PID
