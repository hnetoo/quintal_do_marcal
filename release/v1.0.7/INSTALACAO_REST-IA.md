# Rest-IA v1.0.7 - Guia de Instalação e Teste

## 🎯 **Resumo da Alteração:**
- ✅ Nome alterado: "Tasca do Vereda POS" → "Rest-IA"
- ✅ Versão: 1.0.7
- ✅ MSI criado: `Rest-IA_v1.0.7_x64_pt-PT.msi`
- ✅ Instalação concluída com sucesso
- ✅ Arquivos frontend incluídos manualmente

## 📦 **Arquivos Criados:**
```
release/v1.0.7/
├── Rest-IA_v1.0.7_x64_pt-PT.msi        # Instalador principal
├── DIAGNOSTICO.md                        # Diagnóstico completo
├── VERSION_INFO.md                       # Informações da versão
├── CHANGELOG.md                          # Histórico de mudanças
└── README.md                             # Documentação
```

## 🔧 **Arquivos de Configuração Atualizados:**
- `src-tauri/tauri.conf.json`: productName → "Rest-IA"
- `src-tauri/tauri.conf.json`: title → "Rest-IA v1.0.7"
- `src-tauri/Cargo.toml`: name → "rest-ia"
- `src-tauri/msi-fragments/main.wxs`: Title → "Rest-IA"
- `src-tauri/msi-fragments/ui.wxs`: Textos atualizados

## 🚨 **Problema Persistente:**
O aplicativo instala corretamente mas fecha imediatamente ao executar.

### ❌ **Sintomas:**
- Processo inicia (PID criado)
- Processo fecha em < 5 segundos
- Nenhuma janela visível
- Erro `0xc0000409` (stack buffer overflow)

### ✅ **Instalação OK:**
- MSI executa sem erros
- Arquivos copiados para `C:\Program Files\Rest-IA\`
- Pasta `dist/` com frontend incluída
- Registro do Windows atualizado

## 🛠️ **Soluções Implementadas:**

### 1️⃣ **Correção Import Logo:**
- Todos os imports de `/logo.png` corrigidos para `../assets/logo.png`
- Arquivo `logo.png` criado em `src/assets/`

### 2️⃣ **Atualização Nome:**
- Nome do produto alterado em todos os arquivos de configuração
- Instalador mostra "Rest-IA" em vez de "Tasca do Vereda POS"

### 3️⃣ **Build Completo:**
- `cargo clean` para limpar builds anteriores
- Build frontend com assets corretos
- MSI gerado com novo nome

## 🎯 **Próximos Passos para Solução:**

### 🧪 **Teste Manual:**
1. **Executar como administrador**: Right-click → "Run as administrator"
2. **Verificar dependências**: WebView2 Runtime, Visual C++ Redistributable
3. **Testar compatibilidade**: Right-click → Properties → Compatibility
4. **Verificar antivirus**: Desativar temporariamente

### 📋 **Diagnóstico Avançado:**
1. **Event Viewer**: Windows Logs → Application → procurar "rest-ia"
2. **Dependency Walker**: Verificar DLLs faltando
3. **Process Monitor**: Monitorar acesso a arquivos
4. **Debug Mode**: Executar com parâmetros de debug

### 🔧 **Soluções Técnicas:**
1. **Instalar WebView2 Runtime** (se necessário)
2. **Instalar Visual C++ Redistributable 2022**
3. **Verificar permissões da pasta** `C:\Program Files\Rest-IA\`
4. **Testar em máquina limpa** (sem outros softwares)

## 📊 **Status Atual:**

### ✅ **Concluído:**
- Nome alterado para "Rest-IA"
- MSI v1.0.7 criado e funcional
- Instalação concluída
- Arquivos frontend incluídos

### ❌ **Pendente:**
- Aplicativo não abre/executa corretamente
- Erro de corrupção de memória persiste
- Causa raiz não identificada

## 🎯 **Recomendação Imediata:**

### 🧪 **Testar em Ambiente Isolado:**
1. **Máquina virtual limpa** (Windows 10/11)
2. **Instalar apenas dependências essenciais**
3. **Executar instalação limpa**
4. **Verificar se problema persiste**

### 📞 **Suporte:**
- Se o problema persistir em múltiplas máquinas
- Possível bug no código Rust/Tauri
- Necessário debug do código fonte

---

**Status**: Nome alterado com sucesso - Problema de execução persiste
**Prioridade**: Média - Nome corrigido, execução pendente
**Próxima ação**: Testar em ambiente limpo/isolado

---

## 📁 **Arquivo Final:**
`release\v1.0.7\Rest-IA_v1.0.7_x64_pt-PT.msi`

**Para instalar**: Right-click → "Install" → Seguir wizard
**Para testar**: Start Menu → "Rest-IA" ou executável em `C:\Program Files\Rest-IA\`
