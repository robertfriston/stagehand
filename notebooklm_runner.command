#!/bin/bash


trap 'echo; echo "Script interrupted. Exiting."; exit 130' INT
# --- Argument parsing for mode and future args ---
MODE=""
OTHER_ARG=""
# Add more default variables for future args as needed

for arg in "$@"; do
  case $arg in
	mode=*)
	  MODE="${arg#mode=}"
	  ;;
	other=*)
	  OTHER_ARG="${arg#other=}"
	  ;;
	# Add more arguments here as needed
  esac
done

# If no mode is set, prompt the user interactively
if [[ -z "$MODE" ]]; then
  echo "What mode?:"
  echo "1) debug1 - runs the 'add youtube' workflow only"
  echo "2) debug2 - runs the 'download audio' workflow only"
  echo "3) debug3 - to be determined"
  echo "4) normal - works as it does now - runs the add youtube then the download audio"
  echo "5) Exit"
  while true; do
	read -p "#? " mode_choice
	case $mode_choice in
	  1)
		MODE="debug1"; break ;;
	  2)
		MODE="debug2"; break ;;
	  3)
		MODE="debug3"; break ;;
	  4)
		MODE="normal"; break ;;
	  5)
		echo "Exiting script."; exit 0 ;;
	  *)
		echo "Invalid option. Please choose a valid number (1-5)." ;;
	esac
  done
fi


echo "🛠️ Running in mode: $MODE"
if [[ -n "$OTHER_ARG" ]]; then
  echo "Other argument: $OTHER_ARG"
fi


CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROJECT_DIR="$HOME/Documents/UTOPIA/stagehand"
SCRIPT="$PROJECT_DIR/scripts/master_podcast_generator.ts"
ADD_YOUTUBE_SCRIPT="$PROJECT_DIR/scripts/notebooklm_add_youtube.ts"

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

cd "$PROJECT_DIR"
export PATH="$HOME/.nvm/versions/node/v20.15.0/bin:$PATH"

case "$MODE" in
  debug1)
	echo "[debug1] Running 'add youtube' workflow only..."
	npx tsx "$ADD_YOUTUBE_SCRIPT"
	echo "[Process completed]"; exit 0
	;;
  debug2)
	echo "[debug2] Running 'download audio' workflow only..."
	npx tsx "$SCRIPT"
	echo "[Process completed]"; exit 0
	;;
  debug3)
	echo "[debug3] No workflow defined yet. Exiting."
	echo "[Process completed]"; exit 0
	;;
  normal)
	echo "[normal] Running both workflows: add youtube, then download audio..."
	npx tsx "$ADD_YOUTUBE_SCRIPT"
	npx tsx "$SCRIPT"
	;;
  *)
	echo "Unknown mode: $MODE. Exiting."; exit 1
	;;
esac

# Print process completed and forcefully exit if not interactive
if [[ ! -t 0 ]]; then
  echo "[Process completed]"
  kill -9 $$
fi

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

# Always run YouTube workflow first
cd "$PROJECT_DIR"
export PATH="$HOME/.nvm/versions/node/v20.15.0/bin:$PATH"
npx tsx "$PROJECT_DIR/scripts/notebooklm_add_youtube.ts"

# Then run audio download script (original workflow)
npx tsx "$SCRIPT"

# Print process completed and forcefully exit if not interactive
if [[ ! -t 0 ]]; then
  echo "[Process completed]"
  kill -9 $$
fi