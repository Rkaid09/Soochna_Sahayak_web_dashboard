@echo off
echo Starting Soochna Sahayak Police Dashboard...
echo.

REM Navigate to project directory
cd /d "C:\Users\Rajani Kant Jha\Documents\bhasini_police"

REM Kill any existing Node processes
taskkill /f /im node.exe 2>nul

REM Start the server
echo Starting server...
start "Police Dashboard Server" cmd /k "node server.js"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Open browser
echo Opening browser...
start http://localhost:3000

echo.
echo Dashboard started successfully!
echo Server is running in the separate window.
echo Close the server window to stop the application.
pause