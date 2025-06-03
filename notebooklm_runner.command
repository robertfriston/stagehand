#!/bin/bash

# Define paths
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROJECT_DIR="$HOME/Documents/UTOPIA/stagehand"
SCRIPT_PATH="$PROJECT_DIR/scripts/notebooklm_to_podcast.ts"
NPX="/Users/jobenvy/.nvm/versions/node/v20.15.0/bin/npx"

# Launch Chrome with remote debugging if not already running
pgrep -f "Chrome.*9222" > /dev/null || \
"$CHROME" --remote-debugging-port=9222 \
--user-data-dir="/tmp/stagehand-chrome-session" \
--no-proxy-server &

# Wait for Chrome
sleep 5

# Run script
cd "$PROJECT_DIR"
export PATH="/Users/jobenvy/.nvm/versions/node/v20.15.0/bin:$PATH"
"$NPX" tsx "$SCRIPT_PATH"

# Convert to MP3
say -v Samantha -o output/notebooklm_podcast.aiff -f output/notebooklm_podcast_script.txt
afconvert -f m4af -d aac -b 192000 output/notebooklm_podcast.aiff output/notebooklm_podcast.mp3

# Notify via voice + alert
say "Podcast ready."
osascript -e 'display notification "Podcast MP3 generated." with title "JobEnvy"'