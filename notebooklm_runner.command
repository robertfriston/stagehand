#!/bin/bash

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROJECT_DIR="$HOME/Documents/UTOPIA/stagehand"
SCRIPT="$PROJECT_DIR/scripts/notebooklm_download_audio.ts"
NOTEBOOK_URL="https://notebooklm.google.com/notebook/7a13e605-3c56-4a9c-aa15-61f2d661abf2"

echo "🔁 Launching Chrome..."
pgrep -f "Chrome.*9222" > /dev/null || \
"$CHROME" --remote-debugging-port=9222 --user-data-dir="/tmp/stagehand-chrome-session" --no-proxy-server &

echo "🌐 Opening Notebook..."
sleep 3
osascript <<EOF
tell application "Google Chrome"
	if not (exists window 1) then make new window
	tell window 1
		make new tab with properties {URL:"$NOTEBOOK_URL"}
	end tell
	activate
end tell
EOF

echo "⏳ Waiting for login..."
sleep 10

echo "🚀 Running audio download script..."
cd "$PROJECT_DIR"
export PATH="$HOME/.nvm/versions/node/v20.15.0/bin:$PATH"
npx tsx "$SCRIPT"