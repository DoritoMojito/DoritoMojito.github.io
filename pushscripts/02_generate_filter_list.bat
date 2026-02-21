@echo off
setlocal enabledelayedexpansion

:: ===== CONFIGURATION =====
:: Set to 1 to enable debug mode
set "DEBUG=0"

:: ===== PATHS =====
set "script_dir=%~dp0"
set "projects_dir=%script_dir%..\projects"
set "output_dir=%script_dir%..\assets\data"
set "output_file=%output_dir%\project_filters.json"
set "tempfile=%temp%\tags.tmp"
set "uniquetags=%temp%\uniquetags.tmp"
set "debug_log=%script_dir%debug_log.txt"

:: ===== INITIALIZATION =====
if %DEBUG% equ 1 (
    echo [DEBUG] Debug mode enabled
    if exist "%debug_log%" del "%debug_log%"
    echo --- Debug Log --- > "%debug_log%"
)

:: Ensure required directories exist
if not exist "%projects_dir%" (
    echo Error: Projects directory not found: %projects_dir%
    exit /b 1
)
if not exist "%output_dir%" (
    mkdir "%output_dir%"
)

:: Clear temporary files
if exist "%tempfile%" del "%tempfile%"
if exist "%uniquetags%" del "%uniquetags%"

:: ===== PROCESS FILES =====
for %%F in ("%projects_dir%\*.md") do (
    if %DEBUG% equ 1 (
        echo [DEBUG] Processing file: %%F >> "%debug_log%"
        echo [DEBUG] Processing file: %%F
    )
    
    set "inside_yaml=0"
    set "reading_tags=0"
    set "stop_processing=0"

    for /f "usebackq delims=" %%A in ("%%F") do (
        if !stop_processing! equ 1 (
            rem Skip processing if we're done with YAML
        ) else (
            set "line=%%A"
            if %DEBUG% equ 1 echo [DEBUG] Line: !line! >> "%debug_log%"

            :: Detect YAML front matter start/end
            if "!line!"=="---" (
                if !inside_yaml! equ 0 (
                    set "inside_yaml=1"
                    if %DEBUG% equ 1 echo [DEBUG] Entering YAML block >> "%debug_log%"
                ) else (
                    if %DEBUG% equ 1 echo [DEBUG] Exiting YAML block >> "%debug_log%"
                    set "inside_yaml=0"
                    set "reading_tags=0"
                    set "stop_processing=1"
                )
            )

            if !inside_yaml! equ 1 (
                :: When we see the project-tags: line, enable reading tags
                if "!line!"=="project-tags:" (
                    set "reading_tags=1"
                    if %DEBUG% equ 1 echo [DEBUG] Found project-tags section >> "%debug_log%"
                )
                if !reading_tags! equ 1 (
                    :: Trim leading/trailing spaces and remove list marker
                    for /f "tokens=* delims= " %%X in ("!line!") do set "trimmed_line=%%X"
                    if "!trimmed_line:~0,2!"=="- " (
                        set "tag=!trimmed_line:~2!"
                        for /f "tokens=* delims= " %%G in ("!tag!") do set "tag=%%G"
                        
                        if not "!tag!"=="" (
                            if %DEBUG% equ 1 (
                                echo [DEBUG] Extracted tag: !tag! >> "%debug_log%"
                            )
                            echo !tag!>>"%tempfile%"
                        )
                    )
                )
            )
        )
    )
)

:: ===== PROCESS TAGS =====
if exist "%tempfile%" (
    if %DEBUG% equ 1 (
        echo [DEBUG] Processing extracted tags >> "%debug_log%"
        echo [DEBUG] Sorting and removing duplicates
    )
    sort "%tempfile%" /o "%tempfile%"
    
    set "prev_tag="
    for /f "tokens=* delims= " %%T in (%tempfile%) do (
        set "current_tag=%%T"
        if /i not "!current_tag!"=="!prev_tag!" (
            echo !current_tag!>>"%uniquetags%"
            set "prev_tag=!current_tag!"
        )
    )
)

:: ===== GENERATE OUTPUT =====
if exist "%uniquetags%" (
    if %DEBUG% equ 1 (
        echo [DEBUG] Generating JSON output >> "%debug_log%"
    )
    (
        echo {
        echo   "filters": [
        set "first=1"
        for /f "tokens=* delims= " %%T in (%uniquetags%) do (
            if defined first (
                echo     "%%T"
                set "first="
            ) else (
                echo     ,"%%T"
            )
        )
        echo   ]
        echo }
    ) > "%output_file%"
    
    echo Successfully created: %output_file%
    if %DEBUG% equ 1 type "%output_file%"
) else (
    echo No tags found in any project files.
    exit /b 1
)

:: ===== CLEAN UP =====
if exist "%tempfile%" del "%tempfile%"
if exist "%uniquetags%" del "%uniquetags%"

if %DEBUG% equ 1 (
    echo [DEBUG] Script completed
    pause
)