@echo off
setlocal disabledelayedexpansion

:: Configuration
set "source_dir=..\assets\attachments"
set "output_dir=..\assets\attachments\processed"

:: Verify ImageMagick
where magick >nul 2>&1
if errorlevel 1 (
    echo Error: ImageMagick not found in PATH
    echo Please install from https://imagemagick.org/
    pause
    exit /b 1
)

:: Create output directory
if not exist "%output_dir%" mkdir "%output_dir%"

:: Process images
for %%f in ("%source_dir%\*.png", "%source_dir%\*.jpg", "%source_dir%\*.jpeg", "%source_dir%\*.webp") do (
    call :process_image "%%f" "%%~nf" "%%~xf"
)

echo.
echo Image processing complete!
pause
exit /b

:process_image
set "input=%~1"
set "name=%~2"
set "ext=%~3"

echo Processing: %name%%ext%

:: Create version directory
mkdir "%output_dir%\%name%" >nul 2>&1

:: Create small (500px)
echo Creating %name%-small%ext%
magick "%input%" -resize 500x -quality 85 -strip "%output_dir%\%name%\%name%-small%ext%"

:: Create medium (800px)
echo Creating %name%-medium%ext%
magick "%input%" -resize 800x -quality 85 -strip "%output_dir%\%name%\%name%-medium%ext%"

:: Create large (1200px)
echo Creating %name%-large%ext%
magick "%input%" -resize 1200x -quality 85 -strip "%output_dir%\%name%\%name%-large%ext%"

exit /b