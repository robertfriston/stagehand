
#!/bin/bash

# ---
# NotebookLM Runner (patched for curated mode reliability)
#
# - Ensures Bash is used for mapfile
# - Adds error handling for missing persona JSON
# - Adds fallback for empty prompts
# - Adds user guidance if curated persona JSON is empty


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
# - **11) CURATED**: Full workflow copy of HOSTS for curation. (`scripts/notebook_discover_curated_sources.ts`, `scripts/notebook_transcribe_curated_sources.ts`, `scripts/notebook_podcast_curated_sources_final.ts`)

# --- PATCH: Curated mode reliability ---

CURATED_JSON="scripts/persona-template.curated.json"
if [[ "$MODE" =~ ^11(\.|$) ]]; then
  if [[ ! -f "$CURATED_JSON" ]]; then
    echo "❌ Curated persona JSON not found: $CURATED_JSON"
    exit 1
  fi
  # Check if prompts object is empty
  PROMPTS_COUNT=$(node -e "const c=require('./$CURATED_JSON');console.log(Object.keys(c.prompts||{}).length)")
  if [[ "$PROMPTS_COUNT" == "0" ]]; then
    echo "⚠️  The curated persona JSON has no prompts configured. Please populate the 'prompts' object in $CURATED_JSON before running curated workflows."
    exit 1
  fi
  # POSIX-compatible: populate NOTEBOOK_URLS array
  NOTEBOOK_URLS=()
  while IFS= read -r line; do
    NOTEBOOK_URLS+=("$line")
  done < <(node -e "const c=require('./$CURATED_JSON');Object.keys(c.prompts||{}).forEach(k=>console.log(k))")
  if [ "${#NOTEBOOK_URLS[@]}" -eq 0 ]; then
    echo "❌ No NotebookLM URLs found in curated persona JSON."
    exit 1
  fi
  for NOTEBOOK_URL in "${NOTEBOOK_URLS[@]}"; do
    echo "🔁 Running curated workflow for notebook: $NOTEBOOK_URL"
    export PERSONA_JSON="$CURATED_JSON"
    export NOTEBOOK_URL
    # Discover
    node scripts/notebook_discover_curated_sources.ts || { echo "❌ Discover step failed for $NOTEBOOK_URL"; exit 1; }
    # Transcribe
    node scripts/notebook_transcribe_curated_sources.ts || { echo "❌ Transcribe step failed for $NOTEBOOK_URL"; exit 1; }
    # Podcast
    node scripts/notebook_podcast_curated_sources_final.ts || { echo "❌ Podcast step failed for $NOTEBOOK_URL"; exit 1; }
  done
  exit 0
fi
# - **12) AUTOMATED**: Full workflow copy of HOSTS for automation. (`scripts/notebook_discover_automated_sources.ts`, `scripts/notebook_transcribe_automated_sources.ts`, `scripts/notebook_podcast_automated_sources_final.ts`)
# - **0) Exit**: Exits the script.
#
# ## How Persona JSON and NotebookLM URL Selection Works
#
# - Each workflow (HOSTS, MOVIES, INDEPTH) is mapped to a specific persona JSON file (e.g., MaxEnvy, Denny, JimJam).
# - The persona JSON contains a `prompts` object. Each key in this object is a NotebookLM notebook URL.
# - The runner script selects a random key (URL) from the `prompts` object for the chosen persona. (Currently, each persona has only one URL, but this is future-proofed for multiple URLs.)
# - The selected NotebookLM URL is exported as an environment variable (`NOTEBOOK_URL`) and used by the workflow scripts.
# - This ensures each workflow uses the correct persona and notebook context for all automation steps.
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
  echo "8) HOSTS - FULL WORKFLOW OF 3, 4, & 7 (discover, transcribe, podcast)"
  echo "  8.1) HOSTS - Discover only"
  echo "  8.2) HOSTS - Transcribe only"
  echo "  8.3) HOSTS - Podcast only"
  echo "9) MOVIES - FULL WORKFLOW (discover, transcribe, podcast)"
  echo "  9.1) MOVIES - Discover only"
  echo "  9.2) MOVIES - Transcribe only"
  echo "  9.3) MOVIES - Podcast only"
  echo "10) INDEPTH - FULL WORKFLOW FOR INDEPTH SOURCES (discover, transcribe, podcast)"
  echo "  10.1) INDEPTH - Discover only"
  echo "  10.2) INDEPTH - Transcribe only"
  echo "  10.3) INDEPTH - Podcast only"
  echo "11) CURATED - FULL WORKFLOW (discover, transcribe, podcast)"
  echo "  11.1) CURATED - Discover only"
  echo "  11.2) CURATED - Transcribe only"
  echo "  11.3) CURATED - Podcast only"
  echo "12) AUTOMATED - FULL WORKFLOW (discover, transcribe, podcast)"
  echo "  12.1) AUTOMATED - Discover only"
  echo "  12.2) AUTOMATED - Transcribe only"
  echo "  12.3) AUTOMATED - Podcast only"
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
    8.1) MODE="hosts-discover"; break ;;
    8.2) MODE="hosts-transcribe"; break ;;
    8.3) MODE="hosts-podcast"; break ;;
    9) MODE="movies"; break ;;
    9.1) MODE="movies-discover"; break ;;
    9.2) MODE="movies-transcribe"; break ;;
    9.3) MODE="movies-podcast"; break ;;
    10) MODE="indepth"; break ;;
    10.1) MODE="indepth-discover"; break ;;
    10.2) MODE="indepth-transcribe"; break ;;
    10.3) MODE="indepth-podcast"; break ;;
    11) MODE="curated"; break ;;
    11.1) MODE="curated-discover"; break ;;
    11.2) MODE="curated-transcribe"; break ;;
    11.3) MODE="curated-podcast"; break ;;
    12) MODE="automated"; break ;;
    12.1) MODE="automated-discover"; break ;;
    12.2) MODE="automated-transcribe"; break ;;
    12.3) MODE="automated-podcast"; break ;;
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


# Persona JSON paths
MAXENVY_JSON="$HOME/Documents/jobenvy-mono/jobenvy-mono-v2/backend-server/server/admin/static/personas/persona-template.maxenvy.json"
DENNY_JSON="$HOME/Documents/jobenvy-mono/jobenvy-mono-v2/backend-server/server/admin/static/personas/persona-template.denny.json"
JIMJAM_JSON="$HOME/Documents/jobenvy-mono/jobenvy-mono-v2/backend-server/server/admin/static/personas/persona-template.jimjam.json"
CURATED_JSON="$HOME/Documents/jobenvy-mono/jobenvy-mono-v2/backend-server/server/admin/static/personas/persona-template.curated.json"
AUTOMATED_JSON="$HOME/Documents/jobenvy-mono/jobenvy-mono-v2/backend-server/server/admin/static/personas/persona-template.automated.json"

# CURATED_JSON="$PROJECT_DIR/persona-template.curated.json"
export CURATED_JSON
# AUTOMATED_JSON="$PROJECT_DIR/persona-template.automated.json"
export AUTOMATED_JSON


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
  hosts|hosts-discover|hosts-transcribe|hosts-podcast)
    PERSONA_JSON="$MAXENVY_JSON"
    export PERSONA_JSON
    NOTEBOOK_URL=$(node -e "const fs = require('fs'); const persona = JSON.parse(fs.readFileSync(process.env.PERSONA_JSON || '$MAXENVY_JSON', 'utf8')); console.log(Object.keys(persona.prompts)[0])")
    export NOTEBOOK_URL
    CHROME_FLAGS="--remote-debugging-port=9222 --user-data-dir=/tmp/stagehand-chrome-session --no-proxy-server --start-maximized"
    if [[ "$MODE" == "headless" ]]; then
      CHROME_FLAGS="$CHROME_FLAGS --headless=new"
    fi
    echo "🔁 Launching Chrome..."
    pgrep -f "Chrome.*9222" > /dev/null || "$CHROME" $CHROME_FLAGS &
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
    echo "DEBUG: [HOSTS] PERSONA_JSON=$PERSONA_JSON"
    echo "DEBUG: [HOSTS] NOTEBOOK_URL=$NOTEBOOK_URL"
    if [[ "$MODE" == "hosts" || "$MODE" == "hosts-discover" ]]; then
      echo "🚀 [HOSTS WORKFLOW] Running Discover Sources script (Step 3)..."
      ts-node "$PROJECT_DIR/scripts/notebook_discover_sources.ts"
      if [[ "$MODE" == "hosts-discover" ]]; then echo "[Process completed]"; exit 0; fi
      echo "✅ [HOSTS WORKFLOW] Discover finished. Waiting 60 seconds..."
      sleep 60
    fi
    if [[ "$MODE" == "hosts" || "$MODE" == "hosts-transcribe" ]]; then
      echo "🚀 [HOSTS WORKFLOW] Running Transcribe Sources script (Step 4)..."
      ts-node "$PROJECT_DIR/scripts/notebook_transcribe_sources.ts"
      if [[ "$MODE" == "hosts-transcribe" ]]; then echo "[Process completed]"; exit 0; fi
      echo "✅ [HOSTS WORKFLOW] Transcribe finished. Waiting 60 seconds..."
      sleep 60
    fi
    if [[ "$MODE" == "hosts" || "$MODE" == "hosts-podcast" ]]; then
      NOTEBOOK_PODCAST_SOURCES_SCRIPT="$PROJECT_DIR/scripts/notebook_podcast_sources_final.ts"
      echo "🚀 [HOSTS WORKFLOW] Running podcast generation (Step 7)..."
      npx tsx "$NOTEBOOK_PODCAST_SOURCES_SCRIPT"
      echo "[Process completed]"; exit 0
    fi
    ;;
  movies|movies-discover|movies-transcribe|movies-podcast)
    PERSONA_JSON="$DENNY_JSON"
    export PERSONA_JSON
    NOTEBOOK_URL=$(node -e "const fs = require('fs'); const persona = JSON.parse(fs.readFileSync(process.env.PERSONA_JSON || '$DENNY_JSON', 'utf8')); console.log(Object.keys(persona.prompts)[0])")
    export NOTEBOOK_URL
    CHROME_FLAGS="--remote-debugging-port=9222 --user-data-dir=/tmp/stagehand-chrome-session --no-proxy-server --start-maximized"
    if [[ "$MODE" == "headless" ]]; then
      CHROME_FLAGS="$CHROME_FLAGS --headless=new"
    fi
    echo "🔁 Launching Chrome..."
    pgrep -f "Chrome.*9222" > /dev/null || "$CHROME" $CHROME_FLAGS &
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
    echo "DEBUG: [MOVIES] PERSONA_JSON=$PERSONA_JSON"
    echo "DEBUG: [MOVIES] NOTEBOOK_URL=$NOTEBOOK_URL"
    if [[ "$MODE" == "movies" || "$MODE" == "movies-discover" ]]; then
      echo "🚀 [MOVIES WORKFLOW] Running Discover Movie Sources script..."
      ts-node "$PROJECT_DIR/scripts/notebook_discover_movie_sources.ts"
      if [[ "$MODE" == "movies-discover" ]]; then echo "[Process completed]"; exit 0; fi
      echo "✅ [MOVIES WORKFLOW] Discover finished. Waiting 60 seconds..."
      sleep 60
    fi
    if [[ "$MODE" == "movies" || "$MODE" == "movies-transcribe" ]]; then
      echo "🚀 [MOVIES WORKFLOW] Running Transcribe Movie Sources script..."
      ts-node "$PROJECT_DIR/scripts/notebook_transcribe_movie_sources.ts"
      if [[ "$MODE" == "movies-transcribe" ]]; then echo "[Process completed]"; exit 0; fi
      echo "✅ [MOVIES WORKFLOW] Transcribe finished. Waiting 60 seconds..."
      sleep 60
    fi
    if [[ "$MODE" == "movies" || "$MODE" == "movies-podcast" ]]; then
      NOTEBOOK_PODCAST_MOVIE_SOURCES_SCRIPT="$PROJECT_DIR/scripts/notebook_podcast_movie_sources_final.ts"
      echo "🚀 [MOVIES WORKFLOW] Running movie podcast generation..."
      npx tsx "$NOTEBOOK_PODCAST_MOVIE_SOURCES_SCRIPT"
      echo "[Process completed]"; exit 0
    fi
    ;;
  indepth|indepth-discover|indepth-transcribe|indepth-podcast)
    PERSONA_JSON="$JIMJAM_JSON"
    export PERSONA_JSON
    NOTEBOOK_URL=$(node -e "const fs = require('fs'); const persona = JSON.parse(fs.readFileSync(process.env.PERSONA_JSON || '$JIMJAM_JSON', 'utf8')); console.log(Object.keys(persona.prompts)[0])")
    export NOTEBOOK_URL
    CHROME_FLAGS="--remote-debugging-port=9222 --user-data-dir=/tmp/stagehand-chrome-session --no-proxy-server --start-maximized"
    if [[ "$MODE" == "headless" ]]; then
      CHROME_FLAGS="$CHROME_FLAGS --headless=new"
    fi
    echo "🔁 Launching Chrome..."
    pgrep -f "Chrome.*9222" > /dev/null || "$CHROME" $CHROME_FLAGS &
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
    echo "DEBUG: [INDEPTH] PERSONA_JSON=$PERSONA_JSON"
    echo "DEBUG: [INDEPTH] NOTEBOOK_URL=$NOTEBOOK_URL"
    if [[ "$MODE" == "indepth" || "$MODE" == "indepth-discover" ]]; then
      echo "🚀 [INDEPTH WORKFLOW] Running Discover InDepth Sources script..."
      ts-node "$PROJECT_DIR/scripts/notebook_discover_indepth_sources.ts"
      if [[ "$MODE" == "indepth-discover" ]]; then echo "[Process completed]"; exit 0; fi
      echo "✅ [INDEPTH WORKFLOW] Discover finished. Waiting 60 seconds..."
      sleep 60
    fi
    if [[ "$MODE" == "indepth" || "$MODE" == "indepth-transcribe" ]]; then
      echo "🚀 [INDEPTH WORKFLOW] Running Transcribe InDepth Sources script..."
      ts-node "$PROJECT_DIR/scripts/notebook_transcribe_indepth_sources.ts"
      if [[ "$MODE" == "indepth-transcribe" ]]; then echo "[Process completed]"; exit 0; fi
      echo "✅ [INDEPTH WORKFLOW] Transcribe finished. Waiting 60 seconds..."
      sleep 60
    fi
    if [[ "$MODE" == "indepth" || "$MODE" == "indepth-podcast" ]]; then
      NOTEBOOK_PODCAST_INDEPTH_SOURCES_SCRIPT="$PROJECT_DIR/scripts/notebook_podcast_indepth_sources_final.ts"
      echo "🚀 [INDEPTH WORKFLOW] Running indepth podcast generation..."
      npx tsx "$NOTEBOOK_PODCAST_INDEPTH_SOURCES_SCRIPT"
      echo "[Process completed]"; exit 0
    fi
    ;;
  curated|curated-discover|curated-transcribe|curated-podcast)
    PERSONA_JSON="$CURATED_JSON"
    export PERSONA_JSON
    NOTEBOOK_URLS=()
    while IFS= read -r line; do
      NOTEBOOK_URLS+=("$line")
    done < <(node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync(process.env.CURATED_JSON,"utf8"));console.log(Object.keys(p.prompts).join("\n"));')
    CHROME_FLAGS="--remote-debugging-port=9222 --user-data-dir=/tmp/stagehand-chrome-session --no-proxy-server --start-maximized"
    if [[ "$MODE" == "headless" ]]; then
      CHROME_FLAGS="$CHROME_FLAGS --headless=new"
    fi
    echo "🔁 Launching Chrome..."
    pgrep -f "Chrome.*9222" > /dev/null || "$CHROME" $CHROME_FLAGS &
    for url in "${NOTEBOOK_URLS[@]}"; do
      NOTEBOOK_URL="$url"
      export NOTEBOOK_URL
      if [[ "$MODE" != "headless" ]]; then
        echo "🌐 Opening Notebook $NOTEBOOK_URL..."
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
      echo "DEBUG: [CURATED] PERSONA_JSON=$PERSONA_JSON"
      echo "DEBUG: [CURATED] NOTEBOOK_URL=$NOTEBOOK_URL"
      if [[ "$MODE" == "curated" || "$MODE" == "curated-discover" ]]; then
        echo "🚀 [CURATED WORKFLOW] Running Discover Sources script (Step 3)..."
        ts-node "$PROJECT_DIR/scripts/notebook_discover_curated_sources.ts"
        if [[ "$MODE" == "curated-discover" ]]; then
          echo "✅ [CURATED WORKFLOW] Discover finished. Waiting 60 seconds..."
          sleep 60
          continue
        fi
        echo "✅ [CURATED WORKFLOW] Discover finished. Waiting 60 seconds..."
        sleep 60
      fi
      if [[ "$MODE" == "curated" || "$MODE" == "curated-transcribe" ]]; then
        echo "🚀 [CURATED WORKFLOW] Running Transcribe Sources script (Step 4)..."
        ts-node "$PROJECT_DIR/scripts/notebook_transcribe_curated_sources.ts"
        if [[ "$MODE" == "curated-transcribe" ]]; then
          echo "✅ [CURATED WORKFLOW] Transcribe finished. Waiting 60 seconds..."
          sleep 60
          continue
        fi
        echo "✅ [CURATED WORKFLOW] Transcribe finished. Waiting 60 seconds..."
        sleep 60
      fi
      if [[ "$MODE" == "curated" || "$MODE" == "curated-podcast" ]]; then
        NOTEBOOK_PODCAST_SOURCES_SCRIPT="$PROJECT_DIR/scripts/notebook_podcast_curated_sources_final.ts"
        echo "🚀 [CURATED WORKFLOW] Running podcast generation (Step 7)..."
        npx tsx "$NOTEBOOK_PODCAST_SOURCES_SCRIPT"
        echo "✅ [CURATED WORKFLOW] Podcast generation finished."
        if [[ "$MODE" == "curated-podcast" ]]; then
          continue
        fi
      fi
    done
    echo "[Process completed]"; exit 0
    ;;
  automated|automated-discover|automated-transcribe|automated-podcast)
    PERSONA_JSON="$AUTOMATED_JSON"
    export PERSONA_JSON
    NOTEBOOK_URL=$(node -e "const fs = require('fs'); const persona = JSON.parse(fs.readFileSync(process.env.PERSONA_JSON || '$MAXENVY_JSON', 'utf8')); console.log(Object.keys(persona.prompts)[0])")
    export NOTEBOOK_URL
    CHROME_FLAGS="--remote-debugging-port=9222 --user-data-dir=/tmp/stagehand-chrome-session --no-proxy-server --start-maximized"
    if [[ "$MODE" == "headless" ]]; then
      CHROME_FLAGS="$CHROME_FLAGS --headless=new"
    fi
    echo "🔁 Launching Chrome..."
    pgrep -f "Chrome.*9222" > /dev/null || "$CHROME" $CHROME_FLAGS &
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
    echo "DEBUG: [AUTOMATED] PERSONA_JSON=$PERSONA_JSON"
    echo "DEBUG: [AUTOMATED] NOTEBOOK_URL=$NOTEBOOK_URL"
    if [[ "$MODE" == "automated" || "$MODE" == "automated-discover" ]]; then
      echo "🚀 [AUTOMATED WORKFLOW] Running Discover Sources script (Step 3)..."
      ts-node "$PROJECT_DIR/scripts/notebook_discover_automated_sources.ts"
      if [[ "$MODE" == "automated-discover" ]]; then echo "[Process completed]"; exit 0; fi
      echo "✅ [AUTOMATED WORKFLOW] Discover finished. Waiting 60 seconds..."
      sleep 60
    fi
    if [[ "$MODE" == "automated" || "$MODE" == "automated-transcribe" ]]; then
      echo "🚀 [AUTOMATED WORKFLOW] Running Transcribe Sources script (Step 4)..."
      ts-node "$PROJECT_DIR/scripts/notebook_transcribe_automated_sources.ts"
      if [[ "$MODE" == "automated-transcribe" ]]; then echo "[Process completed]"; exit 0; fi
      echo "✅ [AUTOMATED WORKFLOW] Transcribe finished. Waiting 60 seconds..."
      sleep 60
    fi
    if [[ "$MODE" == "automated" || "$MODE" == "automated-podcast" ]]; then
      NOTEBOOK_PODCAST_SOURCES_SCRIPT="$PROJECT_DIR/scripts/notebook_podcast_automated_sources_final.ts"
      echo "🚀 [AUTOMATED WORKFLOW] Running podcast generation (Step 7)..."
      npx tsx "$NOTEBOOK_PODCAST_SOURCES_SCRIPT"
      echo "[Process completed]"; exit 0
    fi
    ;;
  *)
    echo "Invalid mode selected"
  ;;
esac

