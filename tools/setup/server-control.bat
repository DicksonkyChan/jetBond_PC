@echo off
setlocal

if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="clean" goto clean

:help
echo Usage: server-control.bat [start^|stop^|restart^|clean]
echo.
echo Commands:
echo   start   - Start the JetBond server
echo   stop    - Stop the JetBond server
echo   restart - Stop and start the server
echo   clean   - Kill all node processes and start fresh
echo.
goto end

:start
echo Starting JetBond server...
node server-local.js
goto end

:stop
echo Stopping JetBond server...
taskkill /f /im node.exe 2>nul
if %errorlevel%==0 (
    echo Server stopped successfully
) else (
    echo No server processes found
)
goto end

:clean
echo Cleaning all node processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq JetBond Server*" 2>nul
echo All processes cleaned
timeout /t 2 /nobreak >nul
goto start

:restart
echo Restarting JetBond server...
call :stop
timeout /t 2 /nobreak >nul
call :start
goto end

:end