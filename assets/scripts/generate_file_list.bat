@echo off
setlocal enabledelayedexpansion

:: Define output file
set OUTPUT=../data/project_files.json
echo [ > %OUTPUT%

:: Initialize first element flag
set FIRST=1

:: Loop through Markdown files
for %%F in (../../projects/*.md) do (
    if !FIRST! == 1 (
        set FIRST=0
        echo   "%%~nxF" >> %OUTPUT%
    ) else (
        echo ,  "%%~nxF" >> %OUTPUT%
    )
)

:: Close JSON array
echo ] >> %OUTPUT%

echo File list generated in %OUTPUT%
