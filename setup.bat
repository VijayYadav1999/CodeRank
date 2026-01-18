@echo off

REM CodeRank Development Setup Script for Windows
REM Run this script to set up the development environment

setlocal enabledelayedexpansion

echo 🚀 CodeRank Development Setup
echo ==============================
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed
    exit /b 1
)

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not installed
    exit /b 1
)

echo ✅ All prerequisites are met
echo.

REM Setup backend
echo 📦 Setting up backend...
cd backend
call npm install
copy ..\​.env.example .env
echo ✅ Backend setup complete
cd ..

REM Setup frontend
echo 📦 Setting up frontend...
cd frontend
call npm install
echo ✅ Frontend setup complete
cd ..

echo.
echo ✨ Setup complete!
echo.
echo To start development:
echo 1. Backend with Docker:
echo    cd backend ^&^& docker-compose -f docker/docker-compose.dev.yml up
echo.
echo 2. Frontend (in another terminal):
echo    cd frontend ^&^& npm start
echo.
echo Frontend: http://localhost:4200
echo Backend:  http://localhost:5000
echo MongoDB:  mongodb://localhost:27017
echo.
echo Happy coding! 🎉

endlocal
