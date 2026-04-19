#!/usr/bin/env bash
# Download all latest EASY Agent Hub files from GitHub
BASE="https://raw.githubusercontent.com/Mrbkofficial/EASY/claude/create-ai-agents-r4HFU"
DEST="$HOME/Desktop/EASY"

echo "Updating EASY Agent Hub files..."

curl -sL "$BASE/backend/main.py"              -o "$DEST/backend/main.py"              && echo "  ✓ backend/main.py"
curl -sL "$BASE/backend/crew/main_crew.py"    -o "$DEST/backend/crew/main_crew.py"    && echo "  ✓ backend/crew/main_crew.py"
curl -sL "$BASE/src/services/agentService.ts" -o "$DEST/src/services/agentService.ts" && echo "  ✓ src/services/agentService.ts"
curl -sL "$BASE/src/views/MissionControlView.tsx" -o "$DEST/src/views/MissionControlView.tsx" && echo "  ✓ src/views/MissionControlView.tsx"

echo ""
echo "Done! Now restart both servers."
