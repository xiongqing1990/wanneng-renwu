@echo off
chcp 65001 >nul 2>&1
echo.
echo ============================================
echo   万能任务APP - 一键QA测试系统
echo ============================================
echo.

cd /d "%~dp0"

set "NODE_EXE=C:\Users\Administrator\.workbuddy\binaries\node\versions\22.12.0\node.exe"

if not exist "%NODE_EXE%" (
    echo [ERROR] Node.js not found
    pause
    exit /b 1
)

echo [INFO] Running 52 test cases...
echo.
"%NODE_EXE%" tests\qa-runner.js android\app\src\main\assets\public temp
set RESULT=%ERRORLEVEL%
echo.

if %RESULT% equ 0 (
    echo ========================================
    echo   ALL TESTS PASSED - OK to release!
    echo ========================================
) else (
    echo ========================================
    echo   TESTS FAILED - Fix before release!
    echo ========================================
)

pause
