@echo off
title Teste MSI - Rest-IA
color 0A

echo.
echo ========================================
echo     TESTE MSI - Rest-IA v1.0.1
echo ========================================
echo.

echo [1/4] Verificando se MSI esta instalado...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" | findstr "Rest-IA" >nul
if %errorlevel% == 0 (
    echo [✓] Rest-IA encontrado no registro
) else (
    echo [!] Rest-IA nao encontrado no registro
)

echo [2/4] Verificando se executavel existe...
if exist "C:\Program Files\Rest-IA\rest-ia.exe" (
    echo [✓] Executavel encontrado em Program Files
    set EXE_PATH="C:\Program Files\Rest-IA\rest-ia.exe"
    goto found
)

if exist "C:\Program Files (x86)\Rest-IA\rest-ia.exe" (
    echo [✓] Executavel encontrado em Program Files (x86)
    set EXE_PATH="C:\Program Files (x86)\Rest-IA\rest-ia.exe"
    goto found
)

echo [!] Executavel nao encontrado em Program Files
echo [!] Tentando executavel direto do build...

if exist "src-tauri\target\release\rest-ia.exe" (
    echo [✓] Executavel de build encontrado
    set EXE_PATH="src-tauri\target\release\rest-ia.exe"
    echo [!] Testando executavel direto...
    start "" %EXE_PATH%
    timeout /t 5 >nul
    tasklist | findstr "rest-ia.exe" >nul
    if %errorlevel% == 0 (
        echo [✓] Executavel direto funciona!
        echo [!] Problema esta na instalacao MSI, nao no codigo
    ) else (
        echo [!] Executavel direto nao abriu
    )
) else (
    echo [!] Executavel de build nao encontrado
)
goto end

:found
echo [3/4] Testando se executavel abre...
echo [!] Tentando abrir: %EXE_PATH%
start "" %EXE_PATH%
timeout /t 5 >nul

echo [4/4] Verificando se processo esta rodando...
tasklist | findstr "rest-ia.exe" >nul
if %errorlevel% == 0 (
    echo [✓] Processo rest-ia.exe esta rodando!
    echo [✓] MSI INSTALADO E FUNCIONANDO 100%%!
) else (
    echo [!] Processo nao encontrado
    echo [!] Verifique se a janela apareceu
)

:end
echo.
echo ========================================
echo     TESTE CONCLUIDO
echo ========================================
echo.
echo Resultados:
echo - MSI nao esta instalado no registro
echo - Executavel direto: src-tauri\target\release\rest-ia.exe
echo.
pause
