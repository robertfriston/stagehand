#!/bin/bash


trap 'echo; echo "Script interrupted. Exiting."; exit 130' INT
# --- Argument parsing for mode and future args ---
MODE=""
OTHER_ARG=""
# Add more default variables for future args as needed

for arg in "$@"; do
  case $arg in
	mode=*)
	  ;;
	other=*)
	  ;;
	# Add more arguments here as needed
  esac
done

# If no mode is set, prompt the user interactively
if [[ -z "$MODE" ]]; then
  echo "What mode?:"
  echo "1) debug1 - runs the 'add youtube' workflow only"
  echo "2) debug2 - runs the 'download audio' workflow only"
  echo "3) debug3 - RUNS THE NEW DISCOVER FOLLWED BY TRANSCRIBE WORKFLOWS"
  echo "4) Transcribe Latest Imported Sources (run after discover)"
  echo "5) normal - runs the add youtube then the download audio"
  echo "6) headless - same as normal, but headless Chrome"
  echo "7) podcasts-from-transcribe - generate podcasts from transcribed sources (FINAL)"
  echo "9) Exit"
  while true; do
	read -p "#? " mode_choice
	case $mode_choice in
    1) MODE="debug1"; break ;;
    2) MODE="debug2"; break ;;
    3) MODE="debug3"; break ;;
    4) MODE="debug4"; break ;;
    5) MODE="normal"; break ;;
    6) MODE="headless"; break ;;
    7) MODE="podcasts-from-transcribe"; break ;;
    9) exit 0 ;;
    *) echo "Invalid option";;
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

# Set Chrome flags for headless if needed
CHROME_FLAGS="--remote-debugging-port=9222 --user-data-dir=/tmp/stagehand-chrome-session --no-proxy-server --start-maximized"
if [[ "$MODE" == "headless" ]]; then
  CHROME_FLAGS="$CHROME_FLAGS --headless=new"
fi

echo "🔁 Launching Chrome..."
pgrep -f "Chrome.*9222" > /dev/null || \
"$CHROME" $CHROME_FLAGS &

# Only open GUI tabs if not headless
if [[ "$MODE" != "headless" ]]; then
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
fi

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
    echo "🚀 Running Discover Sources script..."
    ts-node "$PROJECT_DIR/scripts/notebook_discover_sources.ts"
    echo "✅ Discover finished. Waiting 60 seconds before transcribing..."
    sleep 60
    echo "🚀 Running Transcribe Sources script..."
    ts-node "$PROJECT_DIR/scripts/notebook_transcribe_sources.ts"
	;;
  debug4)
    NOTEBOOK_TRANSCRIBE_SOURCES_SCRIPT="$PROJECT_DIR/scripts/notebook_transcribe_sources.ts"
    echo "[debug4] Running 'transcribe sources' workflow only..."
    npx tsx "$NOTEBOOK_TRANSCRIBE_SOURCES_SCRIPT"
    echo "[Process completed]"; exit 0
    ;;
  normal)
    echo "[normal] Running 'add youtube' then 'download audio' workflows..."
    npx tsx "$ADD_YOUTUBE_SCRIPT"
    npx tsx "$SCRIPT"
	;;
  headless)
    echo "[headless] Running 'add youtube' then 'download audio' workflows..."
    npx tsx "$ADD_YOUTUBE_SCRIPT"
    npx tsx "$SCRIPT"
	;;
  podcasts-from-transcribe)
    NOTEBOOK_PODCAST_SOURCES_SCRIPT="$PROJECT_DIR/scripts/notebook_podcast_sources_final.ts"
    echo "[podcasts-from-transcribe] Running podcast generation from transcribed sources (FINAL)..."
    npx tsx "$NOTEBOOK_PODCAST_SOURCES_SCRIPT"
    echo "[Process completed]"; exit 0
    ;;
  *)
    echo "Invalid mode selected"
	;;
esac

