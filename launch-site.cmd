@echo off
start "Geo Classifier Server" powershell -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0launch-site.ps1" -NoBrowser
if errorlevel 1 pause
