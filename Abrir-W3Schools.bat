@echo off
REM Abrir el mirror W3Schools offline con un servidor local (evita errores CORS/file://)
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado. Descargalo de https://nodejs.org/
  pause
  exit /b 1
)
echo Iniciando servidor local en http://localhost:8000/ ...
start "" node "%~dp0servidor-local.js" 8000
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/www.w3schools.com/index.html"
echo Servidor en marcha. No cierres esta ventana mientras navegues.
pause
