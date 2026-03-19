@echo off
echo ============================================
echo  Tasca do Vereda POS - Build MSI 1.0.6
echo ============================================

echo.
echo [INFO] Limpando build anterior...
if exist "dist" rmdir /s /q "dist"
if exist "src-tauri\target" rmdir /s /q "src-tauri\target"

echo.
echo [INFO] Instalando dependencias...
npm install

echo.
echo [INFO] Build do frontend...
npm run build

echo.
echo [INFO] Build do MSI...
cd src-tauri
cargo tauri build --target msi
cd ..

echo.
echo [INFO] Verificando MSI gerado...
if exist "src-tauri\target\x86_64-pc-windows-msvc\release\bundle\msi\*.msi" (
    echo [SUCCESS] MSI gerado com sucesso!
    dir "src-tauri\target\x86_64-pc-windows-msvc\release\bundle\msi\*.msi"
) else (
    echo [ERROR] MSI nao encontrado!
    echo Listando arquivos em src-tauri\target:
    dir "src-tauri\target" /s
)

echo.
echo [INFO] Criando pasta de distribuicao...
if not exist "TascaVeredaPOS-1.0.6" mkdir "TascaVeredaPOS-1.0.6"

echo.
echo [INFO] Copiando arquivos...
copy "src-tauri\target\x86_64-pc-windows-msvc\release\bundle\msi\*.msi" "TascaVeredaPOS-1.0.6\"
copy "INSTALL_GUIDE.md" "TascaVeredaPOS-1.0.6\" 2>nul

echo.
echo [INFO] Gerando checksum...
certutil -hashfile "TascaVeredaPOS-1.0.6\*.msi" SHA256 > "TascaVeredaPOS-1.0.6\checksum.txt"

echo.
echo ============================================
echo [SUCCESS] Build concluido!
echo ============================================
echo.
echo MSI disponivel em: TascaVeredaPOS-1.0.6\
echo.
pause
