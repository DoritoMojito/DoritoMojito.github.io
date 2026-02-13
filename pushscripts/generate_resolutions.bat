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
echo Scanning images...

set total=0
for /R "%source_dir%" %%f in (*.png *.jpg *.jpeg *.webp) do (
    echo %%f | find /I "%output_dir%" >nul
    if errorlevel 1 set /a total+=1
)

echo Found %total% images.
echo.
echo Processing (max %max_jobs% parallel jobs)
echo.

set current=0

for /R "%source_dir%" %%f in (*.png *.jpg *.jpeg *.webp) do (

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
echo All images processed.
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

:: Skip regeneration if already processed and newer
if exist "%target_dir%\%name%-large.webp" (
    for %%i in ("%target_dir%\%name%-large.webp") do set outTime=%%~ti
    for %%i in ("%input%") do set inTime=%%~ti
    if "!outTime!" GEQ "!inTime!" exit /b
)

:: Convert image to WebP with multiple sizes
magick "%input%" ^
  -strip ^
  -quality 82 ^
  -resize "500x500>" ^
  -define webp:lossless=false ^
  "%target_dir%\%name%-small.webp"

magick "%input%" ^
  -strip ^
  -quality 85 ^
  -resize "800x800>" ^
  -define webp:lossless=false ^
  "%target_dir%\%name%-medium.webp"

magick "%input%" ^
  -strip ^
  -quality 88 ^
  -resize "1200x1200>" ^
  -define webp:lossless=false ^
  "%target_dir%\%name%-large.webp"

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
