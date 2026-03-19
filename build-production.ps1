# Build Script para Produção - Tasca do Vereda POS
# Gera MSI completo com todas as dependências
# Versão: 1.0.6

param(
    [switch]$Clean,
    [switch]$SkipTests,
    [switch]$Verbose
)

# Cores para output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Função para output colorido
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Blue"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

# Verificar ambiente
function Test-Environment {
    Write-Info "Verificando ambiente de build..."
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        Write-Info "Node.js: $nodeVersion"
        
        if ([version]$nodeVersion.Replace('v', '') -lt [version]"18.0.0") {
            Write-Error "Node.js 18+ requerido. Versão atual: $nodeVersion"
            exit 1
        }
    }
    catch {
        Write-Error "Node.js não encontrado. Por favor, instale Node.js 18+"
        exit 1
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version
        Write-Info "npm: $npmVersion"
    }
    catch {
        Write-Error "npm não encontrado. Por favor, instale npm 9+"
        exit 1
    }
    
    # Verificar Rust
    try {
        $rustVersion = rustc --version
        Write-Info "Rust: $rustVersion"
    }
    catch {
        Write-Error "Rust não encontrado. Por favor, instale Rust"
        exit 1
    }
    
    # Verificar Tauri CLI
    try {
        $tauriVersion = tauri --version
        Write-Info "Tauri CLI: $tauriVersion"
    }
    catch {
        Write-Warning "Tauri CLI não encontrado. Instalando..."
        npm install -g @tauri-apps/cli
    }
    
    Write-Success "Ambiente verificado com sucesso!"
}

# Limpar build anterior
function Clear-Build {
    Write-Info "Limpando build anterior..."
    
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Info "Removida pasta dist/"
    }
    
    if (Test-Path "target") {
        Remove-Item -Recurse -Force "target"
        Write-Info "Removida pasta target/"
    }
    
    if (Test-Path "src-tauri\target") {
        Remove-Item -Recurse -Force "src-tauri\target"
        Write-Info "Removida pasta src-tauri\target/"
    }
    
    Write-Success "Build anterior limpo!"
}

# Instalar dependências
function Install-Dependencies {
    Write-Info "Instalando dependências..."
    
    # Dependências Node.js
    Write-Info "Instalando dependências Node.js..."
    npm ci
    
    # Dependências Rust
    Write-Info "Compilando dependências Rust..."
    Set-Location "src-tauri"
    cargo build --release
    Set-Location ".."
    
    Write-Success "Dependências instaladas!"
}

# Verificar código
function Test-Code {
    if ($SkipTests) {
        Write-Warning "Testes pulados por parâmetro -SkipTests"
        return
    }
    
    Write-Info "Verificando código..."
    
    # Lint
    try {
        npm run lint:fix
        Write-Success "Lint concluído!"
    }
    catch {
        Write-Warning "Lint com warnings"
    }
    
    # Type check
    try {
        npm run type-check
        Write-Success "Type check concluído!"
    }
    catch {
        Write-Error "Type check falhou"
        exit 1
    }
    
    # Testes (se existirem)
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.PSObject.Properties.Name -contains "test") {
        try {
            npm test
            Write-Success "Testes concluídos!"
        }
        catch {
            Write-Warning "Testes com falhas"
        }
    }
    else {
        Write-Info "Nenhum teste encontrado"
    }
    
    Write-Success "Código verificado!"
}

# Build frontend
function Build-Frontend {
    Write-Info "Build do frontend..."
    
    npm run build
    
    if (!(Test-Path "dist")) {
        Write-Error "Build do frontend falhou - pasta dist não encontrada"
        exit 1
    }
    
    $distSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum
    Write-Success "Frontend build concluído! Tamanho: $([math]::Round($distSize / 1MB, 2)) MB"
}

# Build Tauri MSI
function Build-MSI {
    Write-Info "Build do MSI..."
    
    Set-Location "src-tauri"
    
    # Build para Windows (MSI)
    cargo tauri build --target msi
    
    Set-Location ".."
    
    Write-Success "MSI build concluído!"
}

# Verificar artefatos
function Test-Artifacts {
    Write-Info "Verificando artefatos gerados..."
    
    $msiPath = "src-tauri\target\release\bundle\msi\Tasca do Vereda POS_1.0.6_x64_en-US.msi"
    
    if (Test-Path $msiPath) {
        $fileInfo = Get-Item $msiPath
        $fileSize = [math]::Round($fileInfo.Length / 1MB, 2)
        Write-Success "MSI gerado: $($fileInfo.Name) ($fileSize MB)"
    }
    else {
        Write-Error "MSI não encontrado em: $msiPath"
        
        # Listar arquivos gerados
        Get-ChildItem -Recurse "src-tauri\target" -Filter "*.msi" -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Info "Encontrado: $($_.FullName)"
        }
        exit 1
    }
}

# Gerar checksum
function New-Checksum {
    Write-Info "Gerando checksum..."
    
    $msiPath = "src-tauri\target\release\bundle\msi\Tasca do Vereda POS_1.0.6_x64_en-US.msi"
    
    if (Test-Path $msiPath) {
        $hash = Get-FileHash $msiPath -Algorithm SHA256
        $hash.Hash | Out-File "$msiPath.sha256" -Encoding UTF8
        Write-Success "Checksum gerado: $msiPath.sha256"
        Write-Info "SHA256: $($hash.Hash)"
    }
}

# Criar pacote de distribuição
function New-Package {
    Write-Info "Criando pacote de distribuição..."
    
    $packageDir = "TascaVeredaPOS-1.0.6-Package"
    $msiPath = "src-tauri\target\release\bundle\msi\Tasca do Vereda POS_1.0.6_x64_en-US.msi"
    
    if (Test-Path $packageDir) {
        Remove-Item -Recurse -Force $packageDir
    }
    
    New-Item -ItemType Directory -Force $packageDir | Out-Null
    
    # Copiar MSI
    Copy-Item $msiPath "$packageDir\" -Force
    
    # Copiar checksum
    if (Test-Path "$msiPath.sha256") {
        Copy-Item "$msiPath.sha256" "$packageDir\" -Force
    }
    
    # Copiar documentação
    if (Test-Path "INSTALL_GUIDE.md") {
        Copy-Item "INSTALL_GUIDE.md" "$packageDir\" -Force
    }
    
    if (Test-Path "README.md") {
        Copy-Item "README.md" "$packageDir\" -Force
    }
    
    # Criar arquivo de informações
    $fileInfo = Get-Item $msiPath
    $versionInfo = @"
Tasca do Vereda POS
Versão: 1.0.6
Build Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Platform: Windows x64
Size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB
SHA256: $((Get-FileHash $msiPath -Algorithm SHA256).Hash)
"@
    
    $versionInfo | Out-File "$packageDir\VERSION.txt" -Encoding UTF8
    
    # Criar zip
    Compress-Archive -Path "$packageDir\*" -DestinationPath "$packageDir.zip" -Force
    
    Write-Success "Pacote criado: $packageDir.zip"
    
    $zipInfo = Get-Item "$packageDir.zip"
    Write-Info "Tamanho do pacote: $([math]::Round($zipInfo.Length / 1MB, 2)) MB"
}

# Função principal
function Start-Build {
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  Tasca do Vereda POS - Build de Produção" -ForegroundColor Cyan
    Write-Host "  Versão: 1.0.6" -ForegroundColor Cyan
    Write-Host "  Plataforma: Windows x64" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        Test-Environment
        
        if ($Clean) {
            Clear-Build
        }
        
        Install-Dependencies
        Test-Code
        Build-Frontend
        Build-MSI
        Test-Artifacts
        New-Checksum
        New-Package
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Success "✅ Build de produção concluído com sucesso!"
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Info "⏱️  Tempo total: $($duration.TotalMinutes.ToString('F2')) minutos"
        Write-Host ""
        Write-Info "📦 Artefatos gerados:"
        Write-Info "   - MSI: src-tauri\target\release\bundle\msi\"
        Write-Info "   - Pacote: TascaVeredaPOS-1.0.6-Package.zip"
        Write-Host ""
        Write-Success "🚀 Pronto para distribuição!"
    }
    catch {
        Write-Error "Build falhou: $($_.Exception.Message)"
        exit 1
    }
}

# Executar script
Start-Build
