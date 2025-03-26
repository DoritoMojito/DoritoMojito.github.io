@echo off
setlocal enabledelayedexpansion

:: Define output file
set "output=../data/project_filters.json"
echo { > "%output%"
echo   "filters": [ >> "%output%"

:: Temporary file for storing unique tags
set "tempfile=%temp%\tags.tmp"
del "%tempfile%" 2>nul

:: Loop through markdown files (ensure paths with spaces are handled)
for %%F in ("../../projects\*.md") do (
    for /f "tokens=2 delims:" %%A in ('findstr /R "^project-tags:" "%%F"') do (
        set "tags=%%A"
        set "tags=!tags: =!"
        echo !tags!>> "%tempfile%"
    )
)

:: Remove duplicates and format JSON (Ensure the temp file exists)
if exist "%tempfile%" (
    powershell -Command "$tags = Get-Content '%tempfile%' | Sort-Object -Unique; '    \"' + ($tags -join '\", \"') + '\"' | Set-Content '%tempfile%'"
    powershell -Command "(Get-Content '%output%') + (Get-Content '%tempfile%') + '  ]', '}' | Set-Content '%output%'"
) else (
    echo No tags found. No filtering done.
)

del "%tempfile%"

echo Filter extraction complete.
