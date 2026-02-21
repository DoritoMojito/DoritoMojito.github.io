@echo off
setlocal EnableDelayedExpansion

:: ==============================
:: CONFIG
:: ==============================
set "script_dir=%~dp0"
set "source_dir=%script_dir%..\assets\attachments"
set "output_dir=%script_dir%..\assets\attachments\_processed"
set "max_jobs=5"

:: Normalize paths
for %%a in ("%source_dir%") do set "source_dir=%%~fa"
for %%a in ("%output_dir%") do set "output_dir=%%~fa"

:: ==============================
:: WORKER MODE
:: ==============================
if not "%~1"=="" goto worker

:: ==============================
:: CONTROLLER MODE
:: ==============================
where magick >nul 2>&1 || (
    echo ImageMagick not found in PATH
    pause
    exit /b 1
)

echo.
echo Scanning images for WebP conversion...

set total=0
for /R "%source_dir%" %%f in (*.png *.jpg *.jpeg *.gif *.bmp *.tiff) do (
    echo %%f | find /I "%output_dir%" >nul
    if errorlevel 1 set /a total+=1
)

echo Found %total% images to convert to WebP.
echo.
echo Processing (max %max_jobs% parallel jobs)
echo.

set current=0

for /R "%source_dir%" %%f in (*.png *.jpg *.jpeg *.gif *.bmp *.tiff) do (

    echo %%f | find /I "%output_dir%" >nul
    if errorlevel 1 (

        call :wait_for_slot

        set /a current+=1
        echo [!current!/%total%] Queuing %%~nxf

        :: Launch worker instance safely with quoted paths
        start "" /b cmd /c ""%~f0" "%%f""
    )
)

:: Wait for all jobs to finish
call :wait_until_done

echo.
echo All images converted to WebP.
::pause
exit /b


:: ==============================
:: WORKER FUNCTION
:: ==============================
:worker
setlocal EnableDelayedExpansion

set "input=%~1"

for %%a in ("%input%") do (
    set "folder=%%~dpa"
    set "name=%%~na"
    set "ext=%%~xa"
)

:: Calculate relative directory
set "rel_dir=!folder:%source_dir%\=!"

:: Remove leading and trailing backslashes
if "!rel_dir:~0,1!"=="\" set "rel_dir=!rel_dir:~1!"
if "!rel_dir:~-1!"=="\" set "rel_dir=!rel_dir:~0,-1!"

:: Set target directory
if defined rel_dir (
    set "target_dir=%output_dir%\!rel_dir!"
) else (
    set "target_dir=%output_dir%"
)

:: Create directory - use mkdir with quoted path
mkdir "%target_dir%" 2>nul
if not exist "%target_dir%" (
    echo Failed to create directory: %target_dir%
    exit /b 1
)

:: Set output filename (keep original name but change extension to .webp)
set "output_file=%target_dir%\%name%.webp"

:: Skip regeneration if already processed and newer
if exist "!output_file!" (
    for %%i in ("!output_file!") do set outTime=%%~ti
    for %%i in ("%input%") do set inTime=%%~ti
    if "!outTime!" GEQ "!inTime!" (
        echo Skipping %name% - already up to date
        endlocal
        exit /b
    )
)

echo Converting %name% to WebP (original resolution)...

:: Convert image to WebP keeping original resolution
magick "%input%" ^
  -strip ^
  -quality 90 ^
  -define webp:lossless=false ^
  -define webp:method=6 ^
  "!output_file!"

if !errorlevel! equ 0 (
    echo Finished converting %name%.webp
) else (
    echo Error converting %name%
)

endlocal
exit /b


:: ==============================
:: PARALLEL CONTROL
:: ==============================
:wait_for_slot
:check_again
for /f %%j in ('tasklist ^| find /I "%~nx0" /c') do set count=%%j
if !count! GEQ %max_jobs% (
    timeout /t 1 >nul
    goto check_again
)
exit /b

:wait_until_done
:wait_loop
for /f %%j in ('tasklist ^| find /I "%~nx0" /c') do set count=%%j
if !count! GTR 1 (
    timeout /t 1 >nul
    goto wait_loop
)
exit /b