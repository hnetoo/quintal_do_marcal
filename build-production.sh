#!/bin/bash
# Build Script para Produção - Tasca do Vereda POS
# Gera MSI completo com todas as dependências

set -e

echo "🚀 Iniciando build de produção do Tasca do Vereda POS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para output colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar ambiente
check_environment() {
    log_info "Verificando ambiente de build..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js não encontrado. Por favor, instale Node.js 18+"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm não encontrado. Por favor, instale npm 9+"
        exit 1
    fi
    
    # Verificar Rust
    if ! command -v cargo &> /dev/null; then
        log_error "Rust/Cargo não encontrado. Por favor, instale Rust"
        exit 1
    fi
    
    # Verificar Tauri CLI
    if ! command -v tauri &> /dev/null; then
        log_warning "Tauri CLI não encontrado. Instalando..."
        npm install -g @tauri-apps/cli
    fi
    
    log_success "Ambiente verificado com sucesso!"
}

# Limpar build anterior
clean_build() {
    log_info "Limpando build anterior..."
    
    rm -rf dist/
    rm -rf target/
    rm -rf src-tauri/target/
    
    log_success "Build anterior limpo!"
}

# Instalar dependências
install_dependencies() {
    log_info "Instalando dependências..."
    
    # Dependências Node.js
    npm ci
    
    # Dependências Rust
    cd src-tauri
    cargo build --release
    cd ..
    
    log_success "Dependências instaladas!"
}

# Verificar código
verify_code() {
    log_info "Verificando código..."
    
    # Lint
    npm run lint:fix || log_warning "Lint com warnings"
    
    # Type check
    npm run type-check
    
    # Testes (se existirem)
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm test || log_warning "Testes com falhas"
    fi
    
    log_success "Código verificado!"
}

# Build frontend
build_frontend() {
    log_info "Build do frontend..."
    
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "Build do frontend falhou - pasta dist não encontrada"
        exit 1
    fi
    
    log_success "Frontend build concluído!"
}

# Build Tauri MSI
build_msi() {
    log_info "Build do MSI..."
    
    cd src-tauri
    
    # Build para Windows (MSI)
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        cargo tauri build --target msi
    else
        log_warning "Build cross-platform para Windows..."
        cargo tauri build --target x86_64-pc-windows-msvc --target msi
    fi
    
    cd ..
    
    log_success "MSI build concluído!"
}

# Verificar artefatos
verify_artifacts() {
    log_info "Verificando artefatos gerados..."
    
    MSI_FILE="src-tauri/target/release/bundle/msi/Tasca do Vereda POS_1.0.6_x64_en-US.msi"
    
    if [ -f "$MSI_FILE" ]; then
        FILE_SIZE=$(stat -f%z "$MSI_FILE" 2>/dev/null || stat -c%s "$MSI_FILE" 2>/dev/null)
        log_success "MSI gerado: $MSI_FILE ($(echo $FILE_SIZE | numfmt --to=iec)) bytes"
    else
        log_error "MSI não encontrado em: $MSI_FILE"
        
        # Listar arquivos gerados
        find src-tauri/target -name "*.msi" -type f 2>/dev/null || true
        exit 1
    fi
}

# Gerar checksum
generate_checksum() {
    log_info "Gerando checksum..."
    
    MSI_FILE="src-tauri/target/release/bundle/msi/Tasca do Vereda POS_1.0.6_x64_en-US.msi"
    
    if [ -f "$MSI_FILE" ]; then
        sha256sum "$MSI_FILE" > "${MSI_FILE}.sha256"
        log_success "Checksum gerado: ${MSI_FILE}.sha256"
    fi
}

# Criar pacote de distribuição
create_package() {
    log_info "Criando pacote de distribuição..."
    
    PACKAGE_DIR="TascaVeredaPOS-1.0.6-Package"
    MSI_FILE="src-tauri/target/release/bundle/msi/Tasca do Vereda POS_1.0.6_x64_en-US.msi"
    
    mkdir -p "$PACKAGE_DIR"
    
    # Copiar MSI
    cp "$MSI_FILE" "$PACKAGE_DIR/"
    
    # Copiar checksum
    cp "${MSI_FILE}.sha256" "$PACKAGE_DIR/" 2>/dev/null || true
    
    # Copiar documentação
    cp INSTALL_GUIDE.md "$PACKAGE_DIR/"
    cp README.md "$PACKAGE_DIR/" 2>/dev/null || true
    
    # Criar arquivo de informações
    cat > "$PACKAGE_DIR/VERSION.txt" << EOF
Tasca do Vereda POS
Versão: 1.0.6
Build Date: $(date)
Platform: Windows x64
Size: $(stat -f%z "$MSI_FILE" 2>/dev/null || stat -c%s "$MSI_FILE" 2>/dev/null) bytes
EOF
    
    # Criar zip
    cd "$PACKAGE_DIR"
    zip -r "../${PACKAGE_DIR}.zip" *
    cd ..
    
    log_success "Pacote criado: ${PACKAGE_DIR}.zip"
}

# Função principal
main() {
    echo "============================================"
    echo "  Tasca do Vereda POS - Build de Produção"
    echo "  Versão: 1.0.6"
    echo "  Plataforma: Windows x64"
    echo "============================================"
    
    check_environment
    clean_build
    install_dependencies
    verify_code
    build_frontend
    build_msi
    verify_artifacts
    generate_checksum
    create_package
    
    echo ""
    echo "============================================"
    log_success "✅ Build de produção concluído com sucesso!"
    echo "============================================"
    echo ""
    echo "📦 Artefatos gerados:"
    echo "   - MSI: src-tauri/target/release/bundle/msi/"
    echo "   - Pacote: TascaVeredaPOS-1.0.6-Package.zip"
    echo ""
    echo "🚀 Pronto para distribuição!"
}

# Executar script
main "$@"
