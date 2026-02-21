@echo off
setlocal

:: Change to the script's directory
cd /d "%~dp0"

echo Running pushscripts > "%~dp0error_log.txt"
echo. >> "%~dp0error_log.txt"

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

:: Force remove all image files from tracking regardless of location
git rm -r --cached --ignore-unmatch *.png
git rm -r --cached --ignore-unmatch *.jpg
git rm -r --cached --ignore-unmatch *.jpeg
git rm -r --cached --ignore-unmatch *.mp4

:: Also try recursive in all folders
git rm -r --cached --ignore-unmatch "**/*.png"
git rm -r --cached --ignore-unmatch "**/*.jpg"
git rm -r --cached --ignore-unmatch "**/*.jpeg"
git rm -r --cached --ignore-unmatch "**/*.mp4"

:: First, make sure .gitignore is committed
git add .gitignore
git commit -m "Update .gitignore" || echo No .gitignore changes

:: Remove all image files from Git tracking
echo Removing image files from Git tracking... >> "%~dp0error_log.txt"
for %%e in (png jpg jpeg mp4) do (
    git rm -r --cached *.%%e 2>> "%~dp0error_log.txt"
    git rm -r --cached */*.%%e 2>> "%~dp0error_log.txt"
    git rm -r --cached */*/*.%%e 2>> "%~dp0error_log.txt"
)

:: Commit the untracking
git commit -m "Stop tracking image files" || echo No images to untrack

:: Now proceed with your normal git add
git add --all

git add --all
git commit -m "Automated update" || echo No changes to commit. >> "%~dp0error_log.txt"
git push origin main

echo Update pushed to GitHub!
echo. Update pushed to GitHub! >> "%~dp0error_log.txt"
pause
echo.
echo Opening Deployments in 3 seconds.
timeout /t 3 /nobreak
start "" "https://github.com/DoritoMojito/DoritoMojito.github.io/deployments"

