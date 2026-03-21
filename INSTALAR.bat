@echo off
title Rest-IA - Instalação Automática
color 0A

echo.
echo  ========================================
echo        Rest-IA v1.0.1
echo    Instalação Automática  
echo  ========================================
echo.

echo [1/4] Verificando se o Rest-IA já está instalado...
if exist "C:\Rest-IA\rest-ia.exe" (
    echo [✓] Rest-IA já está instalado em C:\Rest-IA\
    echo [✓] Abrindo aplicação...
    timeout /t 3 >nul
    start "" "C:\Rest-IA\rest-ia.exe"
    goto :fim
)

echo [2/4] Criando diretório de instalação...
if not exist "C:\Rest-IA" (
    mkdir "C:\Rest-IA"
    echo [✓] Diretório C:\Rest-IA criado
)

echo [3/4] Copiando arquivos da aplicação...
xcopy "rest-ia.exe" "C:\Rest-IA\" /Y /Q
xcopy "resources" "C:\Rest-IA\resources\" /Y /E /I /Q
xcopy "sqlite:tasca_vereda.db" "C:\Rest-IA\" /Y /Q 2>nul

echo [✓] Arquivos copiados com sucesso!

echo [4/4] Criando atalho no Desktop...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%temp%\CreateShortcut.vbs"
echo sLinkFile = "C:\Users\%USERNAME%\Desktop\Rest-IA.lnk" >> "%temp%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%temp%\CreateShortcut.vbs"
echo oLink.TargetPath = "C:\Rest-IA\rest-ia.exe" >> "%temp%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "C:\Rest-IA" >> "%temp%\CreateShortcut.vbs"
echo oLink.Description = "Rest-IA - Sistema POS para Gestão de Restaurante" >> "%temp%\CreateShortcut.vbs"
echo oLink.IconLocation = "C:\Rest-IA\rest-ia.exe" >> "%temp%\CreateShortcut.vbs"
echo oLink.Save >> "%temp%\CreateShortcut.vbs"
cscript //nologo "%temp%\CreateShortcut.vbs"
del "%temp%\CreateShortcut.vbs"

echo [✓] Atalho criado no Desktop!

echo.
echo  ========================================
echo     INSTALAÇÃO CONCLUÍDA!
echo  ========================================
echo.
echo [✓] Rest-IA instalado em: C:\Rest-IA\
echo [✓] Atalho criado no Desktop
echo [✓] Para executar, clique no atalho "Rest-IA" no Desktop
echo.

echo Pressione qualquer tecla para abrir o Rest-IA agora...
pause >nul
start "" "C:\Rest-IA\rest-ia.exe"

:fim
echo.
echo ========================================
echo        Rest-IA v1.0.1
echo     Instalação Concluída!
echo  ========================================
echo.
timeout /t 5 >nul
