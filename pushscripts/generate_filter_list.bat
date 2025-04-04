@echo off
setlocal enabledelayedexpansion

:: Define paths
set "script_dir=%~dp0"
set "projects_dir=%script_dir%..\projects"
set "output_dir=%script_dir%..\assets\data"
set "output_file=%output_dir%\project_filters.json"
set "tempfile=%temp%\tags.tmp"
set "uniquetags=%temp%\uniquetags.tmp"
set "debug_log=%script_dir%debug_log.txt"

:: Ensure required directories exist
if not exist "%projects_dir%" (
    echo Error: Projects directory not found: %projects_dir%
    exit /b
)
if not exist "%output_dir%" (
    mkdir "%output_dir%"
)

:: Clear temporary and debug files
if exist "%tempfile%" del "%tempfile%"
if exist "%uniquetags%" del "%uniquetags%"
if exist "%debug_log%" del "%debug_log%"

echo --- Debug Log --- > "%debug_log%"
echo. > "%uniquetags%"  :: Create empty file initially

:: Loop through markdown files
for %%F in ("%projects_dir%\*.md") do (
    echo Processing file: %%F >> "%debug_log%"
    set "inside_yaml=0"
    set "reading_tags=0"
    set "stop_processing=0"

    for /f "usebackq delims=" %%A in ("%%F") do (
        if !stop_processing! equ 1 (
            rem Skip processing if we're done with YAML
        ) else (
            set "line=%%A"
            echo Line: !line! >> "%debug_log%"

            :: Detect YAML front matter start/end
            if "!line!"=="---" (
                if !inside_yaml! equ 0 (
                    set "inside_yaml=1"
                    echo Entering YAML block >> "%debug_log%"
                ) else (
                    echo Exiting YAML block >> "%debug_log%"
                    set "inside_yaml=0"
                    set "reading_tags=0"
                    set "stop_processing=1"
                )
            )

            if !inside_yaml! equ 1 (
                :: When we see the project-tags: line, enable reading tags
                if /i "!line!"=="project-tags:" (
                    set "reading_tags=1"
                    echo Found project-tags section >> "%debug_log%"
                )
                if !reading_tags! equ 1 (
                    :: Trim leading spaces
                    for /f "tokens=* delims= " %%X in ("!line!") do set "trimmed_line=%%X"
                    echo Checking line for tag: !trimmed_line! >> "%debug_log%"
                    if /i not "!trimmed_line!"=="project-tags:" (
                        if "!trimmed_line:~0,2!"=="- " (
                            set "tag=!trimmed_line:~2!"

                            :: Remove all spaces (both leading and trailing)
                            set "tag=!tag: =!"
                            
                            :: Additional trim to handle any remaining whitespace
                            for /f "tokens=* delims= " %%G in ("!tag!") do set "tag=%%G"

                            if not "!tag!"=="" (
                                echo Extracted tag: !tag! >> "%debug_log%"
                                
                                :: Check if tag already exists in unique tags file
                                findstr /i /x /c:"!tag!" "%uniquetags%" >nul 2>&1
                                if errorlevel 1 (
                                    echo !tag! >> "%uniquetags%"
                                    echo Added new tag: !tag! >> "%debug_log%"
                                ) else (
                                    echo Tag already exists: !tag! >> "%debug_log%"
                                )
                            ) else (
                                echo Ignored empty tag >> "%debug_log%"
                            )
                        )
                    )
                )
            )
        )
    )
)

:: Check if we found any tags
for /f %%i in ('type "%uniquetags%" ^| find /c /v ""') do set "linecount=%%i"
if "!linecount!"=="0" (
    echo No tags found in any project files. >> "%debug_log%"
    echo No tags found in any project files.
    del "%uniquetags%"
    exit /b
)

:: Sort the unique tags
sort "%uniquetags%" /o "%uniquetags%"

:: Write JSON structure
(
    echo {
    echo   "filters": [
) > "%output_file%"

set "first_line=1"
for /f "tokens=*" %%T in (%uniquetags%) do (
    if defined first_line (
        echo     "%%T" >> "%output_file%"
        set "first_line="
    ) else (
        echo     ,"%%T" >> "%output_file%"
    )
)

(
    echo   ]
    echo }
) >> "%output_file%"

:: Clean up
if exist "%tempfile%" del "%tempfile%"
if exist "%uniquetags%" del "%uniquetags%"
echo Filter extraction complete. Output saved to: %output_file% >> "%debug_log%"
echo Filter extraction complete. Output saved to: %output_file%
pause