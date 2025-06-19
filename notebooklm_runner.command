#!/bin/bash


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
  select opt in "debug1" "debug2" "debug3" "normal" "Exit"; do
	case $opt in
	  debug1|debug2|debug3|normal)
		MODE="$opt"
		break
		;;
	  Exit)
		echo "Exiting script."
		exit 0
		;;
	  *)
		echo "Invalid option. Please choose a valid number."
		;;
	esac
  done
fi


echo "🛠️ Running in mode: $MODE"
if [[ -n "$OTHER_ARG" ]]; then
  echo "Other argument: $OTHER_ARG"
fi

# If mode is not normal, acknowledge and exit
if [[ "$MODE" != "normal" ]]; then
  echo "Mode '$MODE' selected. No behavior defined yet. Exiting."
  exit 0
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