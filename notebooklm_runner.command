#!/bin/bash

# ---
# # NotebookLM Runner
#
# This script automates various workflows for interacting with NotebookLM and generating podcasts.
#
# ## Modes:
#
# - **1) debug1**: Runs the 'add youtube' workflow only. (`scripts/notebooklm_add_youtube.ts`)
# - **2) debug2**: Runs the 'download audio' workflow only. (`scripts/master_podcast_generator.ts`)
# - **3) debug3**: Discovers new sources and then transcribes them. (`scripts/notebook_discover_sources.ts`, `scripts/notebook_transcribe_sources.ts`)
# - **4) debug4**: Transcribes sources only. (`scripts/notebook_transcribe_sources.ts`)
# - **5) normal**: Adds a YouTube source and then downloads the audio. (`scripts/notebooklm_add_youtube.ts`, `scripts/master_podcast_generator.ts`)
# - **6) headless**: Same as 'normal', but runs Chrome in headless mode. (`scripts/notebooklm_add_youtube.ts`, `scripts/master_podcast_generator.ts`)
# - **7) podcasts-from-transcribe**: Generates final podcast audio from transcribed sources. (`scripts/notebook_podcast_sources_final.ts`)
# - **8) HOSTS**: Full workflow combining discovery, transcription, and final podcast generation (3, 4, & 7). (`scripts/notebook_discover_sources.ts`, `scripts/notebook_transcribe_sources.ts`, `scripts/notebook_podcast_sources_final.ts`)
# - **9) MOVIES**: Full workflow for movies. (`scripts/notebook_discover_movie_sources.ts`, `scripts/notebook_transcribe_movie_sources.ts`, `scripts/notebook_podcast_movie_sources_final.ts`)
# - **10) INDEPTH**: Full workflow for InDepth sources. (`scripts/notebook_discover_indepth_sources.ts`, `scripts/notebook_transcribe_indepth_sources.ts`, `scripts/notebook_podcast_indepth_sources_final.ts`)
# - **0) Exit**: Exits the script.
# ---


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
  echo "What mode?: RUN (3) FOLLOWED BY (7) FOR NORMAL USE"
  echo "1) debug1 - runs the 'add youtube' workflow only"
  echo "2) debug2 - runs the 'download audio' workflow only"
  echo "3) debug3 - RUNS THE NEW DISCOVER FOLLWED BY (4) TRANSCRIBE WORKFLOWS"
  echo "4) debug4 - TRANSCRIBE WORKFLOWS ONLY"
  echo "5) normal - runs the add youtube then the download audio"
  echo "6) headless - same as normal, but headless Chrome"
  echo "7) podcasts-from-transcribe - GENERATE THE AUDIO PODCASTS FROM TRANSCRIBED SOURCES (FINAL)"
  echo "8) HOSTS - FULL WORKFLOW OF 3, 4, & 7"
  echo "9) MOVIES - FULL WORKFLOW"
  echo "10) INDEPTH - FULL WORKFLOW FOR INDEPTH SOURCES"
  echo "0) Exit"
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
    8) MODE="hosts"; break ;;
    9) MODE="movies"; break ;;
    10) MODE="indepth"; break ;;
    0) exit 0 ;;
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
  hosts)
    echo "🚀 [HOSTS WORKFLOW] Running Discover Sources script (Step 3)..."
    ts-node "$PROJECT_DIR/scripts/notebook_discover_sources.ts"
    echo "✅ [HOSTS WORKFLOW] Discover finished. Waiting 60 seconds..."
    sleep 60
    echo "🚀 [HOSTS WORKFLOW] Running Transcribe Sources script (Step 4)..."
    ts-node "$PROJECT_DIR/scripts/notebook_transcribe_sources.ts"
    echo "✅ [HOSTS WORKFLOW] Transcribe finished. Waiting 60 seconds..."
    sleep 60
    NOTEBOOK_PODCAST_SOURCES_SCRIPT="$PROJECT_DIR/scripts/notebook_podcast_sources_final.ts"
    echo "🚀 [HOSTS WORKFLOW] Running podcast generation (Step 7)..."
    npx tsx "$NOTEBOOK_PODCAST_SOURCES_SCRIPT"
    echo "[Process completed]"; exit 0
    ;;
  movies)
    echo "🚀 [MOVIES WORKFLOW] Running Discover Movie Sources script..."
    ts-node "$PROJECT_DIR/scripts/notebook_discover_movie_sources.ts"
    echo "✅ [MOVIES WORKFLOW] Discover finished. Waiting 60 seconds..."
    sleep 60
    echo "🚀 [MOVIES WORKFLOW] Running Transcribe Movie Sources script..."
    ts-node "$PROJECT_DIR/scripts/notebook_transcribe_movie_sources.ts"
    echo "✅ [MOVIES WORKFLOW] Transcribe finished. Waiting 60 seconds..."
    sleep 60
    NOTEBOOK_PODCAST_MOVIE_SOURCES_SCRIPT="$PROJECT_DIR/scripts/notebook_podcast_movie_sources_final.ts"
    echo "🚀 [MOVIES WORKFLOW] Running movie podcast generation..."
    npx tsx "$NOTEBOOK_PODCAST_MOVIE_SOURCES_SCRIPT"
    echo "[Process completed]"; exit 0
    ;;
  indepth)
    PERSONA_JSON="$HOME/Documents/jobenvy-mono/jobenvy-mono-v2/backend-server/server/admin/static/personas/persona-template.indepth.json"
    NOTEBOOK_URL=$(node -e "console.log(Object.keys(require('$PERSONA_JSON').prompts)[0])")
    echo "🚀 [INDEPTH WORKFLOW] Running Discover InDepth Sources script..."
    ts-node "$PROJECT_DIR/scripts/notebook_discover_indepth_sources.ts"
    echo "✅ [INDEPTH WORKFLOW] Discover finished. Waiting 60 seconds..."
    sleep 60
    echo "🚀 [INDEPTH WORKFLOW] Running Transcribe InDepth Sources script..."
    ts-node "$PROJECT_DIR/scripts/notebook_transcribe_indepth_sources.ts"
    echo "✅ [INDEPTH WORKFLOW] Transcribe finished. Waiting 60 seconds..."
    sleep 60
    NOTEBOOK_PODCAST_INDEPTH_SOURCES_SCRIPT="$PROJECT_DIR/scripts/notebook_podcast_indepth_sources_final.ts"
    echo "🚀 [INDEPTH WORKFLOW] Running indepth podcast generation..."
    npx tsx "$NOTEBOOK_PODCAST_INDEPTH_SOURCES_SCRIPT"
    echo "[Process completed]"; exit 0
    ;;
  *)
    echo "Invalid mode selected"
	;;
esac

