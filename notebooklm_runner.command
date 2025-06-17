DEBUG=true
#!/bin/bash

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROJECT_DIR="$HOME/Documents/UTOPIA/stagehand"
SCRIPT="$PROJECT_DIR/scripts/master_podcast_generator.ts"

# Dynamically extract the first NotebookLM URL from the persona config
PERSONA_JSON="$HOME/Documents/jobenvy-mono/jobenvy-mono-v2/backend-server/server/admin/static/personas/persona-template.maxenvy.json"
NOTEBOOK_URL=$(node -e "console.log(Object.keys(require('$PERSONA_JSON').prompts)[0])")


echo "🔁 Launching Chrome..."
pgrep -f "Chrome.*9222" > /dev/null || \
"$CHROME" --remote-debugging-port=9222 --user-data-dir="/tmp/stagehand-chrome-session" --no-proxy-server --start-maximized &

echo "🌐 Opening Notebook..."
sleep 3
osascript <<EOF
tell application "Google Chrome"
	if not (exists window 1) then make new window
	tell window 1
		set URL of active tab to "http://127.0.0.1:8080/admin/adminDashboard"
		make new tab with properties {URL:"$NOTEBOOK_URL"}
	end tell
	activate
end tell
EOF

echo "⏳ Waiting for login..."
sleep 10


# If debugging, run the YouTube workflow script instead of the audio workflow
if [ "$DEBUG" = true ]; then
  echo "�️ Debug mode enabled. Running YouTube workflow script (notebooklm_add_youtube.ts) instead of audio workflow."
  cd "$PROJECT_DIR"
  export PATH="$HOME/.nvm/versions/node/v20.15.0/bin:$PATH"
  npx tsx "$PROJECT_DIR/scripts/notebooklm_add_youtube.ts"
  exit 0
fi

echo "🚀 Running audio download script..."
cd "$PROJECT_DIR"
export PATH="$HOME/.nvm/versions/node/v20.15.0/bin:$PATH"
npx tsx "$SCRIPT"