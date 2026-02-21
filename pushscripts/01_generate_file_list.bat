@echo off
setlocal enabledelayedexpansion

:: Define project and output directory based on the script location
set "script_dir=%~dp0"
set "projects_dir=%script_dir%..\projects"
set "output_dir=%script_dir%..\assets\data"
set "output_file=%output_dir%\project_files.json"

:: Ensure the projects directory exists
if not exist "%projects_dir%" (
    echo Error: Projects directory not found: %projects_dir%
    exit /b
)

:: Ensure output directory exists
if not exist "%output_dir%" (
    mkdir "%output_dir%"
)

:: Start writing JSON
echo [ > "%output_file%"

:: Initialize first element flag
set FIRST=1

:: Loop through Markdown files
for %%F in ("%projects_dir%\*.md") do (
    if !FIRST! == 1 (
        set FIRST=0
        echo   "%%~nxF" >> "%output_file%"
    ) else (
        echo ,  "%%~nxF" >> "%output_file%"
    )
)

:: Close JSON array
echo ] >> "%output_file%"

::echo File list generated in %output_file%
