@echo off
echo ========================================
echo  Diagnostico - Quintal do Marcal POS
echo ========================================
echo.

echo [1/6] Verificando instalacao...
Get-WmiObject -Class Win32_Product | Where-Object {$_.Name -like "*Tasca*"} | Select-Object Name, Version, InstallLocation

echo.
echo [2/6] Verificando arquivos de instalacao...
if exist "C:\Program Files\Tasca do Vereda POS\tasca-do-vereda.exe" (
    echo ✅ Executavel encontrado
) else (
    echo ❌ Executavel NAO encontrado
)

echo.
echo [3/6] Verificando pasta dist...
if exist "C:\Program Files\Tasca do Vereda POS\dist" (
    echo ✅ Pasta dist encontrada
    dir "C:\Program Files\Tasca do Vereda POS\dist"
) else (
    echo ❌ Pasta dist NAO encontrada
    echo 📁 Tentando encontrar arquivos frontend...
    dir "C:\Program Files\Tasca do Vereda POS" /s
)

echo.
echo [4/6] Testando execucao direta...
echo Executando: "C:\Program Files\Tasca do Vereda POS\tasca-do-vereda.exe"
Start-Process -FilePath "C:\Program Files\Tasca do Vereda POS\tasca-do-vereda.exe" -PassThru
timeout /t 3 /nobreak > nul

echo.
echo [5/6] Verificando processos ativos...
tasklist | findstr "tasca"

echo.
echo [6/6] Verificando logs de erro...
Get-EventLog -LogName Application -Newest 3 -Source "*Error*" | Format-Table TimeGenerated, EntryType, Message -Wrap

echo.
echo ========================================
echo  Diagnostico concluido!
echo ========================================
pause
