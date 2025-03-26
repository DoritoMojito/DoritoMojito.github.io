@echo off
setlocal

:: Run individual batch files
call assets\data\project_filters.bat
call assets\data\project_files.bat

:: GitHub update
cd /d "%~dp0"  :: Change to the script's directory
git add .
git commit -m "Automated update"
git push origin main

echo Update pushed to GitHub!
pause
