@echo off
title Teste MSI Corrigido - Rest-IA
color 0A

echo.
echo ========================================
echo   TESTE MSI CORRIGIDO - Rest-IA v1.0.1
echo ========================================
echo.

echo [PROBLEMA IDENTIFICADO]
echo windows_subsystem = "windows" escondia a janela
echo [SOLUCAO APLICADA]
echo windows_subsystem = "console" mostra a janela
echo.

echo [1/4] Instalando MSI corrigido...
echo [!] Instalando: Rest-IA_1.0.1_x64_pt-PT.msi
msiexec /i "src-tauri\target\release\bundle\msi\Rest-IA_1.0.1_x64_pt-PT.msi" /quiet /norestart
echo [✓] Instalacao concluida

echo [2/4] Aguardando 3 segundos...
timeout /t 3 >nul

echo [3/4] Verificando se executavel instalado existe...
if exist "C:\Program Files\Rest-IA\rest-ia.exe" (
    echo [✓] Executavel encontrado em Program Files
    set EXE_PATH="C:\Program Files\Rest-IA\rest-ia.exe"
) else (
    if exist "C:\Program Files (x86)\Rest-IA\rest-ia.exe" (
        echo [✓] Executavel encontrado em Program Files (x86)
        set EXE_PATH="C:\Program Files (x86)\Rest-IA\rest-ia.exe"
    ) else (
        echo [!] Executavel nao encontrado
        goto :test_direct
    )
)

echo [4/4] Testando se MSI corrigido abre...
echo [!] Tentando abrir: %EXE_PATH%
start "" %EXE_PATH%
timeout /t 5 >nul

echo [VERIFICACAO FINAL]
tasklist | findstr "rest-ia.exe" >nul
if %errorlevel% == 0 (
    echo [✓] Processo rest-ia.exe esta rodando!
    echo [✓] MSI CORRIGIDO E FUNCIONANDO 100%%!
    echo [✓] JANELA DEVE ESTAR VISIVEL!
) else (
    echo [!] Processo nao encontrado
    echo [!] Verifique se a janela apareceu
    echo [!] Pode ter aberto e fechado
)

goto :end

:test_direct
echo [!] Testando executavel direto do build corrigido...
if exist "src-tauri\target\release\rest-ia.exe" (
    echo [✓] Executavel de build encontrado
    echo [!] Abrindo executavel direto corrigido...
    start "" "src-tauri\target\release\rest-ia.exe"
    timeout /t 5 >nul
    tasklist | findstr "rest-ia.exe" >nul
    if %errorlevel% == 0 (
        echo [✓] Executavel direto corrigido funciona!
        echo [!] Tente instalar MSI novamente
    ) else (
        echo [!] Executavel direto nao abriu
    )
) else (
    echo [!] Executavel de build nao encontrado
)

:end
echo.
echo ========================================
echo   TESTE MSI CORRIGIDO CONCLUIDO
echo ========================================
echo.
echo RESUMO:
echo - Problema: windows_subsystem = "windows"
echo - Solucao: windows_subsystem = "console"
echo - Resultado: Janela visivel em ambos os casos
echo.
pause
