@echo off
echo ===============================================
echo    Header Scanner - Test, Lint, Build ^& Start
echo ===============================================
echo.

:: 1. Run Tests
echo [*] Starting: Unit Tests...
echo Executing: npm run test
echo.
call npm run test
if %errorlevel% neq 0 (
    echo.
    echo [X] Error: Unit Tests failed with exit code %errorlevel%.
    exit /b %errorlevel%
)
echo [PASS] Success: Unit Tests completed successfully!
echo.

:: 2. Run Secret Scan
echo [*] Starting: Secret Scan...
echo Executing: node scripts/scan-secrets.js
echo.
call node scripts/scan-secrets.js
if %errorlevel% neq 0 (
    echo.
    echo [X] Error: Secret Scan failed with exit code %errorlevel%.
    exit /b %errorlevel%
)
echo [PASS] Success: Secret Scan completed successfully!
echo.

:: 3. Run Linting
echo [*] Starting: Linter Check...
echo Executing: npm run lint
echo.
call npm run lint
if %errorlevel% neq 0 (
    echo.
    echo [X] Error: Linter Check failed with exit code %errorlevel%.
    exit /b %errorlevel%
)
echo [PASS] Success: Linter Check completed successfully!
echo.

:: 3. Run Build
echo [*] Starting: Production Build...
echo Executing: npm run build
echo.
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [X] Error: Production Build failed with exit code %errorlevel%.
    exit /b %errorlevel%
)
echo [PASS] Success: Production Build completed successfully!
echo.

:: 4. Start Application
echo [PASS] All checks passed! Starting the application...
echo Executing: npm run start
echo.
call npm run start

