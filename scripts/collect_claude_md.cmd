@echo off
REM Collect CLAUDE.md files from C:\Projects\*\ modified in the last 60 days.
REM Copies them into Documents\claude-md-collection\ renamed as {project_name}.CLAUDE.md

set "DEST=%USERPROFILE%\Documents\claude-md-collection"
set "SRC=C:\Projects"
set "DAYS=60"

if not exist "%DEST%" mkdir "%DEST%"

set count=0
for /d %%P in ("%SRC%\*") do (
    if exist "%%P\CLAUDE.md" (
        call :checkAge "%%P\CLAUDE.md" "%%~nxP"
    )
)

echo.
echo Done. %count% file(s) copied to %DEST%
pause
goto :eof

:checkAge
set "filepath=%~1"
set "project=%~2"
REM forfiles /d -N matches files modified N+ days ago; errorlevel 1 means newer than N days
forfiles /p "%~dp1" /m "%~nx1" /d -%DAYS% >nul 2>&1
if errorlevel 1 (
    copy /y "%filepath%" "%DEST%\%project%.CLAUDE.md" >nul
    echo   Copied: %project%
    set /a count+=1
)
goto :eof
