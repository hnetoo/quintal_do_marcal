@echo off
echo ========================================
echo  Quintal do Marcal - Build v1.0.7
echo ========================================
echo.

echo [1/6] Limpando builds anteriores...
if exist dist rmdir /s /q dist
if exist src-tauri\target rmdir /s /q src-tauri\target

echo [2/6] Instalando dependencias...
call npm install

echo [3/6] Build web...
call npm run build

echo [4/6] Build desktop MSI...
call npm run build:msi

echo [5/6] Criando pasta de release...
if not exist release mkdir release
if not exist release\v1.0.7 mkdir release\v1.0.7

echo [6/6] Copiando arquivos...
copy src-tauri\target\release\bundle\msi\*.msi release\v1.0.7\
copy dist\* release\v1.0.7\ /y
copy CHANGELOG.md release\v1.0.7\ /y
copy README.md release\v1.0.7\ /y

echo.
echo ========================================
echo  ✅ Build v1.0.7 Concluido!
echo ========================================
echo.
echo 📦 Arquivos em: release\v1.0.7\
echo 🚀 MSI pronto para instalacao
echo 📋 CHANGELOG.md incluido
echo.
echo Para instalar: release\v1.0.7\*.msi
echo.
pause
