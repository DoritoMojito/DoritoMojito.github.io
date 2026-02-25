@echo off
setlocal EnableDelayedExpansion

:: ==============================
:: CONFIG
:: ==============================
set "script_dir=%~dp0"
set "source_dir=%script_dir%..\assets\attachments"
set "output_dir=%script_dir%..\assets\attachments"
set "projects_dir=%script_dir%..\projects"
set "max_jobs=5"

:: Normalize paths
for %%a in ("%source_dir%") do set "source_dir=%%~fa"
for %%a in ("%output_dir%") do set "output_dir=%%~fa"
for %%a in ("%projects_dir%") do set "projects_dir=%%~fa"

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
echo Scanning markdown files for project images...

:: Create a temporary file to store unique image paths
set "temp_file=%temp%\images_to_process_%random%.txt"
type nul > "%temp_file%"

:: Find all project-image references in markdown files
set total=0
for /R "%projects_dir%" %%m in (*.md) do (
    echo Processing %%m...
    
    :: Find lines containing "project-image:"
    for /f "tokens=*" %%l in ('findstr /i "project-image:" "%%m" 2^>nul') do (
        set "line=%%l"
        
        :: Extract the path between the parentheses: [](path)
        set "line=!line:*](=!"
        for /f "tokens=1 delims=)" %%p in ("!line!") do (
            set "img_path=%%p"
            
            if not "!img_path!"=="" (
                echo !img_path! >> "%temp_file%"
                set /a total+=1
                echo   Found: !img_path!
            )
        )
    )
)

:: Remove duplicates and count unique images
sort "%temp_file%" | findstr /v "^$" > "%temp_file%.uniq"
move /y "%temp_file%.uniq" "%temp_file%" >nul

set unique_total=0
for /f %%i in ('type "%temp_file%" ^| find /c /v ""') do set unique_total=%%i

echo Found %unique_total% unique images referenced in markdown files.
echo.
echo Processing (max %max_jobs% parallel jobs)
echo.

set current=0

:: Process each unique image
for /f "usebackq delims=" %%i in ("%temp_file%") do (
    set "rel_path=%%i"
    
    :: URL-decode the path (replace %20 with space)
    set "rel_path=!rel_path:%%20= !"
    set "rel_path=!rel_path:%%2f=\!"
    set "rel_path=!rel_path:%%2F=\!"
    
    :: Convert relative path to absolute path and normalize
    set "full_path=%script_dir%..\!rel_path!"
    set "full_path=!full_path:/=\!"
    
    :: Remove any double backslashes
    set "full_path=!full_path:\\=\!"
    
    echo Looking for: !full_path!
    
    :: Check if the file exists
    if exist "!full_path!" (
        call :wait_for_slot
        
        set /a current+=1
        echo [!current!/%unique_total%] Queuing %%~nxi
        
        :: Launch worker instance with quoted path
        start "" /b cmd /c ""%~f0" "!full_path!""
    ) else (
        echo [WARNING] File not found: !full_path!
        
        :: Try to find the file by searching for the filename
        for %%f in ("!full_path!") do set "filename=%%~nxf"
        echo   Searching for "!filename!" in attachments...
        
        for /R "%source_dir%" %%f in ("!filename!") do (
            echo   Found alternative: %%f
            call :wait_for_slot
            set /a current+=1
            echo [!current!/%unique_total%] Queuing !filename! (from search)
            start "" /b cmd /c ""%~f0" "%%f""
        )
    )
)

:: Clean up temp file
del "%temp_file%" 2>nul

:: Wait for all jobs to finish
call :wait_until_done

echo.
echo All project images processed.
::pause
exit /b


:: ==============================
:: WORKER FUNCTION
:: ==============================
:worker
setlocal EnableDelayedExpansion

set "input=%~1"

echo Worker processing: "%input%"

for %%a in ("%input%") do (
    set "folder=%%~dpa"
    set "name=%%~na"
    set "ext=%%~xa"
    set "drive=%%~da"
    set "path_without_drive=%%~pna"
)

:: Calculate relative directory from source_dir
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

:: Create directory - use mkdir with quoted path and create parent directories
if not exist "%target_dir%" (
    mkdir "%target_dir%" 2>nul
)

:: Double-check directory exists
if not exist "%target_dir%" (
    echo Failed to create directory: %target_dir%
    exit /b 1
)

:: Skip regeneration if already processed and newer
set "large_webp=%target_dir%\%name%-large.webp"
if exist "!large_webp!" (
    for %%i in ("!large_webp!") do set outTime=%%~ti
    for %%i in ("%input%") do set inTime=%%~ti
    if "!outTime!" GEQ "!inTime!" (
        echo Skipping %name% - already up to date
        endlocal
        exit /b
    )
)

echo Processing %name% in %target_dir%...

:: Convert image to WebP with multiple sizes - use separate commands for better error handling
magick "%input%" -strip -quality 82 -resize "500x500>" -define webp:lossless=false "%target_dir%\%name%-small.webp"
if !errorlevel! neq 0 echo Error creating small thumbnail for %name%

magick "%input%" -strip -quality 85 -resize "800x800>" -define webp:lossless=false "%target_dir%\%name%-medium.webp"
if !errorlevel! neq 0 echo Error creating medium thumbnail for %name%

magick "%input%" -strip -quality 88 -resize "1200x1200>" -define webp:lossless=false "%target_dir%\%name%-large.webp"
if !errorlevel! neq 0 echo Error creating large thumbnail for %name%

echo Finished %name%
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