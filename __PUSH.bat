@echo off
setlocal

:: Change to the script's directory
cd /d "%~dp0"

:: Define the scripts folder
set "script_dir=%~dp0pushscripts"

:: Ensure the directory exists
if not exist "%script_dir%" (
    echo Error: Scripts folder not found! >> "%~dp0error_log.txt"
    echo Error: Scripts folder not found!
    pause
    exit /b
)

:: Run all .bat files in the scripts directory
for %%F in ("%script_dir%\*.bat") do (
    echo Running: %%~nxF >> "%~dp0error_log.txt"
    echo Running: %%~nxF

    pushd "%script_dir%"  :: Change to script's directory
    if not exist "%%F" (
        echo Error: The script %%~nxF does not exist in %script_dir% >> "%~dp0error_log.txt"
        echo Error: The script %%~nxF does not exist in %script_dir%
        popd
        echo Finished: %%~nxF >> "%~dp0error_log.txt"
        echo Finished: %%~nxF
        echo.
        continue
    )

    call "%%F" 2>> "%~dp0error_log.txt"
    echo Exit Code: %errorlevel% >> "%~dp0error_log.txt"

    if %errorlevel% neq 0 (
        echo Error occurred while running %%~nxF with exit code %errorlevel% >> "%~dp0error_log.txt"
        echo Error occurred while running %%~nxF with exit code %errorlevel%
    )

    popd  :: Restore original directory
    echo Finished: %%~nxF >> "%~dp0error_log.txt"
    echo Finished: %%~nxF
    echo. >> "%~dp0error_log.txt"
    echo.  
)

:: Ensure Git detects all changes
cd /d "%~dp0"
git add --all
git commit -m "Automated update" || echo No changes to commit. >> "%~dp0error_log.txt"
git push origin main

echo Update pushed to GitHub!
pause
echo Opening Deployments in 2 seconds.
timeout /t 2 /nobreak
start "" "https://github.com/DoritoMojito/DoritoMojito.github.io/deployments"

