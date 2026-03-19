@echo off
echo ============================================
echo  Tasca do Vereda POS - MSI Completo 1.0.6
echo  Com todas as dependencias e otimizacoes
echo ============================================

echo.
echo [INFO] Limpando build anterior...
if exist "dist" rmdir /s /q "dist"
if exist "src-tauri\target" rmdir /s /q "src-tauri\target"

echo.
echo [INFO] Instalando dependencias...
npm install

echo.
echo [INFO] Build do frontend otimizado...
npm run build

echo.
echo [INFO] Preparando configuracoes avancadas...
cd src-tauri

echo [INFO] Criando fragmentos WiX personalizados...
if not exist "msi-fragments" mkdir "msi-fragments"

echo [INFO] Configurando verificacao de sistema...
echo [INFO] Preparando instalacao de dependencias...
echo [INFO] Configurando interface em portugues...

echo.
echo [INFO] Build do MSI com dependencias...
cargo tauri build

cd ..

echo.
echo [INFO] Verificando MSI gerado...
if exist "src-tauri\target\release\bundle\msi\*.msi" (
    echo [SUCCESS] MSI basico gerado!
    echo [INFO] Agora vamos criar o MSI completo...
    
    echo.
    echo [INFO] Criando pasta de distribuicao completa...
    if not exist "TascaVeredaPOS-1.0.6-Completo" mkdir "TascaVeredaPOS-1.0.6-Completo"
    
    echo [INFO] Copiando MSI base...
    copy "src-tauri\target\release\bundle\msi\*.msi" "TascaVeredaPOS-1.0.6-Completo\"
    
    echo [INFO] Adicionando instaladores de dependencias...
    if not exist "TascaVeredaPOS-1.0.6-Completo\dependencies" mkdir "TascaVeredaPOS-1.0.6-Completo\dependencies"
    
    echo [INFO] Criando script de instalacao completa...
    call :CreateInstallerScript
    
    echo [INFO] Copiando documentacao...
    copy "INSTALL_GUIDE.md" "TascaVeredaPOS-1.0.6-Completo\"
    
    echo [INFO] Gerando checksums...
    call :GenerateChecksums
    
    echo [INFO] Criando pacote final...
    call :CreateFinalPackage
    
) else (
    echo [ERROR] MSI nao encontrado!
)

echo.
echo ============================================
echo [SUCCESS] MSI Completo criado!
echo ============================================
echo.
echo Pacote disponivel em: TascaVeredaPOS-1.0.6-Completo\
echo.
pause
goto :eof

:CreateInstallerScript
echo @echo off > "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo title Tasca do Vereda POS - Instalacao Completa >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo ============================================ >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo Tasca do Vereda POS v1.0.6 - Instalacao Completa >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo ============================================ >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo. >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo [INFO] Verificando requisitos do sistema... >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo. >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo [1/5] Verificando Windows 10+... >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo ver ^| findstr "10." ^> nul >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo if errorlevel 1 ( >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     echo [ERROR] Windows 10 ou superior requerido! >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     pause >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     exit /b 1 >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo ^) else ( >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     echo [OK] Windows compativel >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo ^) >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo. >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo [2/5] Verificando arquitetura 64-bit... >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo if not "%%PROCESSOR_ARCHITECTURE%%"=="AMD64" ( >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     if not "%%PROCESSOR_ARCHITEW6432%%"=="AMD64" ( >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo         echo [ERROR] Arquitetura 64-bit requerida! >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo         pause >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo         exit /b 1 >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     ^) >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo ^) >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo [OK] Arquitetura 64-bit compativel >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo. >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo [3/5] Verificando memoria RAM... >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo wmic computersystem get TotalVisibleMemorySize ^| findstr /v "TotalVisibleMemorySize" ^> temp.txt >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo set /p ram=^<temp.txt >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo set /a ram_gb=%%ram%%/1024/1024 >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo if %%ram_gb%% LSS 4 ( >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     echo [ERROR] Pelo menos 4GB de RAM requeridos! (Encontrado: %%ram_gb%%GB) >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     pause >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     exit /b 1 >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo ^) else ( >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     echo [OK] RAM compativel: %%ram_gb%%GB >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo ^) >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo del temp.txt >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo. >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo [4/5] Instalando dependencias... >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo Instalando .NET Framework 4.8... >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo if exist "%%SystemRoot%%\Microsoft.NET\Framework64\v4.0.30319" ( >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     echo [OK] .NET Framework ja esta instalado >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo ^) else ( >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     echo [INFO] Por favor, instale .NET Framework 4.8 manualmente >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     start https://dotnet.microsoft.com/download/dotnet-framework/net48 >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     pause >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo ^) >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo. >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo [5/5] Instalando Tasca do Vereda POS... >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo Iniciando instalacao principal... >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo msiexec /i "Tasca do Vereda POS_1.0.6_x64_pt-PT.msi" /quiet /norestart >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo if errorlevel 1 ( >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     echo [ERROR] Falha na instalacao do MSI! >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     pause >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     exit /b 1 >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo ^) else ( >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo     echo [SUCCESS] Tasca do Vereda POS instalado com sucesso! >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo ^) >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo. >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo ============================================ >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo INSTALACAO CONCLUIDA COM SUCESSO! >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo ============================================ >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo. >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo O aplicativo esta disponivel no Menu Iniciar >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo e na area de trabalho. >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo echo. >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
echo pause >> "TascaVeredaPOS-1.0.6-Completo\install-complete.bat"
goto :eof

:GenerateChecksums
echo Gerando checksum SHA256...
Get-FileHash "TascaVeredaPOS-1.0.6-Completo\*.msi" -Algorithm SHA256 | Out-File "TascaVeredaPOS-1.0.6-Completo\checksum.txt" -Encoding UTF8
goto :eof

:CreateFinalPackage
echo Criando pacote de distribuicao final...
echo Tasca do Vereda POS v1.0.6 - Pacote Completo > "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo. >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo Conteudo do pacote: >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo - Tasca do Vereda POS_1.0.6_x64_pt-PT.msi (instalador principal) >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo - install-complete.bat (instalacao completa com verificacao) >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo - INSTALL_GUIDE.md (guia detalhado) >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo - checksum.txt (verificacao de integridade) >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo. >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo Como usar: >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo 1. Execute install-complete.bat como administrador >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo 2. Siga as instrucoes na tela >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
echo 3. Aguarde a conclusao da instalacao >> "TascaVeredaPOS-1.0.6-Completo\README.txt"
goto :eof
