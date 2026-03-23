@echo off
echo ========================================
echo Rest-IA - Diagnostico de Sistema
echo ========================================
echo.

echo [1] Verificando Windows Version...
ver
echo.

echo [2] Verificando WebView2 Runtime...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{56F18EAD-BE22-465A-9395-30DC2D6EF638}" /v pv 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ WebView2 Runtime encontrado
) else (
    echo ❌ WebView2 Runtime NAO encontrado
)
echo.

echo [3] Verificando Visual C++ Redistributable...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Classes\TypeLib" /f "*Microsoft*VC*" | find "TypeLib" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Visual C++ Redistributable encontrado
) else (
    echo ❌ Visual C++ Redistributable NAO encontrado
)
echo.

echo [4] Verificando .NET Runtime...
dotnet --list-runtimes 2>nul | find "Microsoft.WindowsDesktop.App" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ .NET Runtime encontrado
) else (
    echo ❌ .NET Runtime NAO encontrado
)
echo.

echo [5] Verificando espaco em disco...
wmic logicaldisk get size,freespace,caption
echo.

echo [6] Testando executavel do Rest-IA...
if exist "src-tauri\target\release\rest-ia.exe" (
    echo ✅ Executavel encontrado
    echo Testando inicializacao...
    timeout /t 3 /nobreak >nul
    start "" "src-tauri\target\release\rest-ia.exe"
    echo ✅ Aplicacao iniciada - verifique se abriu corretamente
) else (
    echo ❌ Executavel NAO encontrado - execute 'npm run tauri build'
)
echo.

echo [7] Verificando logs de erro...
if exist "src-tauri\target\release\bundle\msi\install.log" (
    echo 📋 Logs de instalacao encontrados em install.log
    type "src-tauri\target\release\bundle\msi\install.log" | find "ERROR"
)
echo.

echo ========================================
echo Diagnostico concluido!
echo ========================================
echo.
echo Se a aplicacao nao abrir:
echo 1. Instale Microsoft Edge WebView2 Runtime
echo 2. Instale Microsoft Visual C++ Redistributable 2019+
echo 3. Reinicie o computador
echo 4. Execute novamente como Administrador
echo.
pause
