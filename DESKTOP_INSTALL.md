# Rest-IA Desktop - Instruções de Instalação

## 🚀 Problema Conhecido: MSI não abre após instalação

O instalador MSI pode não funcionar corretamente em alguns sistemas Windows. 
Use o executável diretamente para garantir funcionamento.

## 📦 Como Usar a Versão Portable (Recomendado)

### Opção 1: Executar Diretamente
1. Navegue para a pasta de build:
   ```
   C:\Users\hneto\rest-ia-clean -Quintal-doMarçal\src-tauri\target\release\
   ```

2. Execute o arquivo:
   ```
   rest-ia.exe
   ```

### Opção 2: Copiar para Pasta Local
1. Crie uma pasta em `C:\Rest-IA\`
2. Copie todo o conteúdo da pasta `release\` para `C:\Rest-IA\`
3. Crie um atalho no desktop para `C:\Rest-IA\rest-ia.exe`

### Opção 3: Compactar para Distribuição
1. Compacte a pasta `release\` em um arquivo ZIP
2. Distribua o ZIP para os usuários
3. Instruções para o usuário:
   - Extrair o ZIP
   - Executar `rest-ia.exe`

## ✅ Vantagens da Versão Portable

- ✅ **Funciona em qualquer computador** sem instalação
- ✅ **Sem problemas de registro** do Windows
- ✅ **Sem conflitos** com outros programas
- ✅ **Fácil backup** - apenas copiar a pasta
- ✅ **Testado e funcionando** - executável direto abre corretamente

## 🔧 Se Precisar do MSI

Se precisar absolutamente do instalador MSI:

1. **Execute como Administrador:**
   - Botão direito no MSI
   - "Executar como administrador"

2. **Desative o Antivírus temporariamente:**
   - Windows Defender
   - Outros antivírus

3. **Verifique os Logs do Windows:**
   - Event Viewer → Windows Logs → Application
   - Procure por erros relacionados ao "Rest-IA"

## 📋 Arquivos Gerados

- ✅ **MSI:** `Rest-IA_1.0.1_x64_pt-PT.msi`
- ✅ **EXE:** `rest-ia.exe` (funciona diretamente)
- ✅ **Ícones:** Gerados corretamente para Windows

## 🎯 Recomendação Final

**Use sempre o executável direto (`rest-ia.exe`) para evitar problemas de instalação.**

A aplicação foi testada e funciona perfeitamente quando executada diretamente!
