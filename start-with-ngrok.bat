@echo off
echo ========================================
echo   Soochna Sahayak - Starting Server
echo ========================================
echo.

REM Configure ngrok authtoken
echo Configuring ngrok...
ngrok config add-authtoken 33jOph7ufhM0y9xIVN4zQDOMm9h_6CUWVveZJyaohvptXpM8Y

echo.
echo Installing dependencies...
call npm install

echo.
echo Starting server on port 3000...
echo.
start "Soochna Sahayak Server" cmd /k "node server.js"

timeout /t 5 /nobreak > nul

echo.
echo Starting ngrok tunnel...
echo.
start "Ngrok Tunnel" cmd /k "ngrok http 3000"

echo.
echo ========================================
echo   Server Started Successfully!
echo ========================================
echo.
echo Your local server: http://localhost:3000
echo Ngrok will provide a public URL in the ngrok window
echo.
echo IMPORTANT: Copy the ngrok HTTPS URL (e.g., https://xxxx.ngrok.io)
echo and share it with users to access your application.
echo.
echo All data (FIRs, files, users) will be saved locally.
echo.
echo Press any key to exit...
pause > nul
