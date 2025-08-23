@echo off
setlocal enabledelayedexpansion

REM EduConnect System - GitHub Packages Setup Script (Windows)
REM This script helps set up GitHub Packages for the EduConnect System

echo.
echo 🚀 EduConnect System - GitHub Packages Setup
echo =============================================

REM Check if bun is installed
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Bun is not installed. Please install Bun first:
    echo https://bun.sh/
    pause
    exit /b 1
)

echo [SUCCESS] Bun is installed
bun --version

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Check if GitHub token is set
if "%GITHUB_TOKEN%"=="" (
    echo [WARNING] GITHUB_TOKEN environment variable is not set.
    echo.
    echo To set up GitHub Packages authentication:
    echo 1. Go to GitHub Settings → Developer settings → Personal access tokens
    echo 2. Create a token with 'read:packages' and 'write:packages' scopes
    echo 3. Set the environment variable: set GITHUB_TOKEN=your_token_here
    echo.
    set /p continue="Do you want to continue without authentication? (y/N): "
    if /i not "!continue!"=="y" exit /b 1
)

REM Install dependencies
echo [INFO] Installing dependencies...
bun install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

REM Run linting
echo [INFO] Running linting...
bun run lint
if %errorlevel% neq 0 (
    echo [WARNING] Linting failed, but continuing...
)

REM Build the project
echo [INFO] Building the project...
bun run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo [SUCCESS] Project built successfully!

REM Check if .npmrc exists and is configured
if not exist ".npmrc" (
    echo [WARNING] .npmrc file not found. Creating one...
    (
        echo @kotkala:registry=https://npm.pkg.github.com
        echo registry=https://registry.npmjs.org/
        echo //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
        echo always-auth=true
    ) > .npmrc
    echo [SUCCESS] .npmrc file created
) else (
    echo [SUCCESS] .npmrc file already exists
)

REM Ask user what they want to do
echo.
echo What would you like to do?
echo 1^) Publish with patch version bump (0.1.0 → 0.1.1^)
echo 2^) Publish with minor version bump (0.1.0 → 0.2.0^)
echo 3^) Publish with major version bump (0.1.0 → 1.0.0^)
echo 4^) Publish current version without bump
echo 5^) Dry run (test publishing without actually publishing^)
echo 6^) Exit

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo [INFO] Publishing with patch version bump...
    bun version patch
    goto :publish
)
if "%choice%"=="2" (
    echo [INFO] Publishing with minor version bump...
    bun version minor
    goto :publish
)
if "%choice%"=="3" (
    echo [INFO] Publishing with major version bump...
    bun version major
    goto :publish
)
if "%choice%"=="4" (
    echo [INFO] Publishing current version...
    goto :publish
)
if "%choice%"=="5" (
    echo [INFO] Running dry run...
    bun publish --dry-run
    echo [SUCCESS] Dry run completed
    goto :end
)
if "%choice%"=="6" (
    echo [INFO] Exiting...
    goto :end
)

echo [ERROR] Invalid choice
pause
exit /b 1

:publish
echo [INFO] Publishing to GitHub Packages...
bun publish
if %errorlevel% neq 0 (
    echo [ERROR] Failed to publish package
    pause
    exit /b 1
)

echo [SUCCESS] Package published successfully!

REM Get current version
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set CURRENT_VERSION=%%i

echo.
echo 📦 Package Information:
echo    Name: @kotkala/educonnect-system
echo    Version: !CURRENT_VERSION!
echo    Registry: https://npm.pkg.github.com
echo.
echo 🔧 To install this package:
echo    echo @kotkala:registry=https://npm.pkg.github.com ^>^> .npmrc
echo    bun add @kotkala/educonnect-system

:end
echo.
echo [SUCCESS] Setup completed successfully! 🎉
pause
