@echo off
setlocal enabledelayedexpansion

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
echo {"last_updated":"!timestamp!"} > ..\assets\data\last_updated.json

exit /b 0