@echo off
rem Galaxy Explorer dev server - double-click to run (Windows).
rem Serves this folder at http://localhost:8124 and opens the browser.
cd /d "%~dp0"
start "" http://localhost:8124
python -m http.server 8124
