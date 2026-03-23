
# Rest-IA - Instruções de Instalação Windows

## 🔧 Requisitos do Sistema

### Automáticos (Incluídos no Instalador)
- ✅ **Microsoft Edge WebView2 Runtime** (Bootstrapper incorporado)
- ✅ **Visual C++ Redistributable** (Verificado automaticamente)

### Opcionais
- 📁 **Windows 10/11** (Recomendado)
- 📁 **Windows 7** (Compatível com ajustes)

## 📦 Instalação

1. **Baixe o arquivo**: `Rest-IA_1.1.0_x64_pt-PT.msi`
2. **Execute como Administrador**: Clique direito > "Executar como administrador"
3. **Siga o assistente**: Aceite os termos e escolha o diretório de instalação
4. **Aguarde a instalação**: O WebView2 será baixado automaticamente se necessário

## 🚀 Após a Instalação

### Primeira Execução
1. **Inicie o aplicativo**: Pelo menu iniciar ou atalho na área de trabalho
2. **Verificação automática**: O app verificará os requisitos do sistema
3. **Configuração inicial**: Será solicitado a configuração do Supabase

### Se o App Não Abrir
1. **Verifique o console**: Pressione F12 durante o startup para ver erros
2. **Instale manualmente**:
   - [Microsoft Edge WebView2 Runtime](https://go.microsoft.com/fwlink/p/?LinkId=2124703)
   - [Microsoft Visual C++ Redistributable 2019](https://aka.ms/vs/17/release/vc_redist.x64.exe)
3. **Reinicie o computador** após instalar as dependências

## 🔍 Solução de Problemas

### Erros Comuns

#### "Aplicação não inicia"
- **Causa**: WebView2 ou VC++ Redistributable ausente
- **Solução**: O instalador deve baixar automaticamente. Se falhar, instale manualmente

#### "Erro ao carregar componentes"
- **Causa**: Permissões insuficientes
- **Solução**: Execute como administrador

#### "Tela preta ao abrir"
- **Causa**: Incompatibilidade de drivers
- **Solução**: Atualize drivers de vídeo e reinicie

### Logs e Diagnóstico
- **Log de instalação**: `install.log` na pasta de instalação
- **Console do aplicativo**: F12 > Console durante execução
- **Verificação do sistema**: Automática no startup

## 📁 Estrutura de Diretórios

A aplicação cria os seguintes diretórios:
- `%APPDATA%\Rest-IA\` - Configurações e dados
- `%LOCALAPPDATA%\Rest-IA\` - Cache e arquivos temporários
- `%PROGRAMFILES%\Rest-IA\` - Arquivos do aplicativo

## 🗑️ Desinstalação

1. **Painel de Controle** > "Programas e Recursos"
2. **Encontre "Rest-IA"** e clique em "Desinstalar"
3. **Confirme** a desinstalação

## 📞 Suporte

Em caso de problemas:
1. Verifique os requisitos do sistema
2. Consulte os logs de erro
3. Execute a verificação automática incluída no aplicativo

---
**Versão**: 1.1.0  
**Plataforma**: Windows x64  
**Idioma**: Português (PT)
