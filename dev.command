#!/bin/bash
# Galaxy Explorer dev server — double-click to run (macOS).
# Serves this folder at http://localhost:8124 and opens the browser.
# If the port is already serving, it just opens the browser. Ctrl+C to stop.
cd "$(dirname "$0")"
( sleep 1; open "http://localhost:8124" ) &
exec python3 -m http.server 8124
