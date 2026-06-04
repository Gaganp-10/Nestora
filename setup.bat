@echo off
chcp 65001 > nul
echo.
echo  ==========================================
echo   NESTORA  —  Database Setup
echo  ==========================================
echo.

:: Activate virtual environment
echo  [1/3] Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo  ERROR: Could not activate venv. Make sure venv exists.
    echo  Run:  python -m venv venv
    pause
    exit /b 1
)

:: Install required packages
echo  [2/3] Installing dependencies...
pip install pymysql python-dotenv --quiet
if errorlevel 1 (
    echo  ERROR: pip install failed. Check your internet connection.
    pause
    exit /b 1
)

:: Run the setup script
echo  [3/3] Running database setup...
echo.
python setup_database.py

echo.
pause
