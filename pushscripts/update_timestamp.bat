@echo off
setlocal enabledelayedexpansion

:: Define project and output directory based on the script location
set "script_dir=%~dp0"
set "projects_dir=%script_dir%..\projects"
set "output_dir=%script_dir%..\assets\data"
set "output_file=%output_dir%\last_Updated.json"

:: Ensure the projects directory exists
if not exist "%projects_dir%" (
    echo Error: Projects directory not found: %projects_dir%
    exit /b
)

:: Ensure output directory exists
if not exist "%output_dir%" (
    mkdir "%output_dir%"
)

:: Get current date in consistent format (MM/DD/YYYY)
for /f "tokens=1-3 delims=/ " %%a in ('wmic os get LocalDateTime ^| find "."') do (
    set datetime=%%a
)

:: Extract date components
set year=!datetime:~0,4!
set month=!datetime:~4,2!
set day=!datetime:~6,2!

:: Convert month number to abbreviation (e.g., 04 -> Apr)
set monthnames=JanFebMarAprMayJunJulAugSepOctNovDec
set /a monthnum=100%month%%%100
set /a monthindex=(!monthnum!-1)*3
set monthabbr=!monthnames:~%monthindex%,3!

:: Remove leading zero from day if needed
if "!day:~0,1!"=="0" set day=!day:~1!

:: Get time in 24-hour format (HH:MM)
set hour=!datetime:~8,2!
set minute=!datetime:~10,2!

:: Create formatted timestamp
set timestamp=!monthabbr! !day! !year!, !hour!:!minute!

:: Write to JSON file
echo {"last_Updated":"!timestamp!"} > "%output_file%"

exit /b 0