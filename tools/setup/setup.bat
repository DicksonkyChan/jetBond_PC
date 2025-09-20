@echo off
echo ========================================
echo   JetBond Windows Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Creating environment file...
if not exist .env (
    copy .env.example .env
    echo Please edit .env file with your AWS and DeepSeek credentials
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the server:
echo   npm start
echo.
echo To start in development mode:
echo   npm run dev
echo.
echo To test the API:
echo   npm test
echo.
echo To test enhanced features:
echo   node test-enhanced-api.js
echo.
echo IMPORTANT: Edit .env file with your credentials before starting
echo.
pause