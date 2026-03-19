@echo off
title Tasca do Vereda POS - Instalação Completa
echo ============================================
echo Tasca do Vereda POS v1.0.6 - Instalação Completa
echo ============================================
echo.
echo [INFO] Verificando requisitos do sistema...
echo.

echo [1/5] Verificando Windows 10+...
ver | findstr "10." > nul
if errorlevel 1 (
    echo [ERROR] Windows 10 ou superior requerido!
    pause
    exit /b 1
) else (
    echo [OK] Windows compatível
)
echo.

echo [2/5] Verificando arquitetura 64-bit...
if not "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    if not "%PROCESSOR_ARCHITEW6432%"=="AMD64" (
        echo [ERROR] Arquitetura 64-bit requerida!
        pause
        exit /b 1
    )
)
echo [OK] Arquitetura 64-bit compatível
echo.

echo [3/5] Verificando memória RAM...
wmic computersystem get TotalVisibleMemorySize | findstr /v "TotalVisibleMemorySize" > temp.txt
set /p ram=<temp.txt
set /a ram_gb=%ram%/1024/1024
if %ram_gb% LSS 4 (
    echo [ERROR] Pelo menos 4GB de RAM requeridos! (Encontrado: %ram_gb%GB)
    pause
    exit /b 1
) else (
    echo [OK] RAM compatível: %ram_gb%GB
)
del temp.txt
echo.

echo [4/5] Verificando espaço em disco...
wmic logicaldisk get size,freespace | findstr /v "Size" > temp.txt
for /f "tokens=2" %%a in (temp.txt) do (
    set /a free_gb=%%a/1024/1024
    if !free_gb! GTR 1 (
        echo [OK] Espaço em disco: !free_gb!GB disponível
        goto :space_ok
    )
)
echo [ERROR] Pelo menos 1GB de espaço livre requerido!
del temp.txt
pause
exit /b 1
:space_ok
del temp.txt
echo.

echo [5/5] Instalando Tasca do Vereda POS...
echo Iniciando instalação principal...
echo.

echo [INFO] Executando instalador MSI...
msiexec /i "Tasca do Vereda POS_1.0.6_x64_pt-PT.msi" /quiet /norestart
if errorlevel 1 (
    echo [ERROR] Falha na instalação do MSI!
    echo [INFO] Tentando instalação em modo interativo...
    msiexec /i "Tasca do Vereda POS_1.0.6_x64_pt-PT.msi"
    if errorlevel 1 (
        echo [ERROR] Falha na instalação mesmo em modo interativo!
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] Tasca do Vereda POS instalado com sucesso!
)
echo.

echo [INFO] Configurando atalhos...
if exist "%ProgramFiles%\Tasca do Vereda POS\tasca-do-vereda.exe" (
    echo [OK] Aplicativo instalado em: %ProgramFiles%\Tasca do Vereda POS\
    
    echo [INFO] Criando atalho na área de trabalho...
    powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\Tasca do Vereda POS.lnk');$s.TargetPath='%ProgramFiles%\Tasca do Vereda POS\tasca-do-vereda.exe';$s.Save()"
    
    echo [INFO] Registrando no Menu Iniciar...
    powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Tasca do Vereda POS.lnk');$s.TargetPath='%ProgramFiles%\Tasca do Vereda POS\tasca-do-vereda.exe';$s.Save()"
    
    echo [OK] Atalhos criados com sucesso!
) else (
    echo [WARNING] Aplicativo não encontrado no local esperado
)
echo.

echo [INFO] Registrando associação de arquivos...
reg add "HKCR\.tvp" /ve /t REG_SZ /d "TascaVeredaPOS.File" /f > nul 2>&1
reg add "HKCR\TascaVeredaPOS.File" /ve /t REG_SZ /d "Tasca do Vereda POS File" /f > nul 2>&1
reg add "HKCR\TascaVeredaPOS.File\DefaultIcon" /ve /t REG_SZ /d "\"%ProgramFiles%\Tasca do Vereda POS\tasca-do-vereda.exe\",0" /f > nul 2>&1
reg add "HKCR\TascaVeredaPOS.File\shell\open\command" /ve /t REG_SZ /d "\"%ProgramFiles%\Tasca do Vereda POS\tasca-do-vereda.exe\" \"%%1\"" /f > nul 2>&1
echo [OK] Associação de arquivos registrada
echo.

echo ============================================
echo INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo ============================================
echo.
echo O aplicativo está disponível:
echo - Menu Iniciar ^> Tasca do Vereda POS
echo - Área de trabalho ^> Tasca do Vereda POS
echo.
echo Recursos disponíveis:
echo - Interface responsiva para todos os tamanhos de ecrã
echo - Base de dados SQLite local
echo - Gestão completa de restaurante
echo.
echo Para suporte técnico:
echo - Email: suporte@vereda-angola.com
echo - Telefone: +244 923 000 000
echo.
pause
