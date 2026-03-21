@echo off
title Teste MSI - Rest-IA
color 0A

echo.
echo  ========================================
echo      TESTE MSI - Rest-IA v1.0.1
echo  ========================================
echo.

echo [1/4] Verificando se MSI está instalado...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{*" | findstr "Rest-IA" >nul
if %errorlevel% == 0 (
    echo [✓] Rest-IA encontrado no registro
) else (
    echo [!] Rest-IA não encontrado no registro
)

echo [2/4] Verificando se executável existe...
if exist "C:\Program Files\Rest-IA\rest-ia.exe" (
    echo [✓] Executável encontrado em Program Files
    set "EXE_PATH=C:\Program Files\Rest-IA\rest-ia.exe"
) else (
    if exist "C:\Program Files (x86)\Rest-IA\rest-ia.exe" (
        echo [✓] Executável encontrado em Program Files (x86)
        set "EXE_PATH=C:\Program Files (x86)\Rest-IA\rest-ia.exe"
    ) else (
        echo [!] Executável não encontrado em Program Files
        echo [!] Tentando encontrar em outras localizações...
        for /f "delims=" %%i in ('dir /s /b "C:\Program Files\rest-ia.exe" 2^>nul') do (
            set "EXE_PATH=%%i"
            echo [✓] Executável encontrado: %%i
            goto :found
        )
        for /f "delims=" %%i in ('dir /s /b "C:\Program Files (x86)\rest-ia.exe" 2^>nul') do (
            set "EXE_PATH=%%i"
            echo [✓] Executável encontrado: %%i
            goto :found
        )
        echo [!] Executável não encontrado em nenhum local!
        goto :test_direct
    )
)

:found
echo [3/4] Testando se executável abre...
echo [!] Tentando abrir: %EXE_PATH%
timeout /t 2 >nul
start "" "%EXE_PATH%"
timeout /t 5 >nul

echo [4/4] Verificando se processo está rodando...
tasklist | findstr "rest-ia.exe" >nul
if %errorlevel% == 0 (
    echo [✓] Processo rest-ia.exe está rodando!
    echo [✓] MSI INSTALADO E FUNCIONANDO 100%!
) else (
    echo [!] Processo não encontrado
    echo [!] Pode ter aberto e fechado rapidamente
    echo [!] Verifique se a janela apareceu
)

goto :end

:test_direct
echo [!] Testando executável direto do build...
if exist "src-tauri\target\release\rest-ia.exe" (
    echo [✓] Executável de build encontrado
    echo [!] Abrindo executável direto...
    start "" "src-tauri\target\release\rest-ia.exe"
    timeout /t 5 >nul
    tasklist | findstr "rest-ia.exe" >nul
    if %errorlevel% == 0 (
        echo [✓] Executável direto funciona!
        echo [!] Problema está na instalação MSI, não no código
    ) else (
        echo [!] Nem o executável direto funciona
    )
) else (
    echo [!] Executável de build não encontrado
)

:end
echo.
echo  ========================================
echo      TESTE CONCLUÍDO
echo  ========================================
echo.
echo Se o MSI não funcionou, use o executável direto:
echo src-tauri\target\release\rest-ia.exe
echo.
pause
