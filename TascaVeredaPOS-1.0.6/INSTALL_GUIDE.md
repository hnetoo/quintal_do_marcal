# TASCA DO VEREDA POS - GUIA DE INSTALAÇÃO

## 📋 REQUISITOS DO SISTEMA

### Mínimos Obrigatórios:
- **Sistema Operacional**: Windows 10 (64-bit) ou superior
- **Processador**: Intel Core i3 ou AMD Ryzen 3 equivalente
- **Memória RAM**: 4GB mínimos (8GB recomendados)
- **Espaço em Disco**: 1GB livre para instalação + 500MB para dados
- **Resolução de Ecrã**: 1024x768 mínima (1920x1080 recomendada)

### Dependências Automáticas (Instaladas pelo MSI):
- ✅ Microsoft .NET Framework 4.8
- ✅ Microsoft Visual C++ 2019-2022 Redistributable
- ✅ Microsoft Edge WebView2 Runtime
- ✅ Windows Universal C Runtime

## 🚀 PROCESSO DE INSTALAÇÃO

### Passo 1: Download do Instalador
1. Faça download do arquivo `TascaVeredaPOS-1.0.6-x64.msi`
2. Verifique o tamanho do arquivo (deve ser ~150MB)
3. Execute uma verificação de vírus no arquivo

### Passo 2: Execução do Instalador
1. **Clique com o botão direito** no arquivo `.msi`
2. Selecione **"Executar como administrador"**
3. **Clique em "Sim"** no controle de conta de usuário (UAC)

### Passo 3: Assistente de Instalação
1. **Bem-vindo**: Clique em "Próximo"
2. **Pasta de Destino**: 
   - Padrão: `C:\Arquivos de Programas\Tasca do Vereda POS`
   - Pode alterar se necessário
   - Clique em "Próximo"
3. **Pronto para Instalar**: 
   - Revise as configurações
   - Clique em "Instalar"
4. **Progresso da Instalação**: 
   - Aguarde a instalação das dependências (pode levar 5-10 minutos)
   - O instalador pode reiniciar o computador se necessário
5. **Conclusão**: 
   - Marque "Iniciar o Tasca do Vereda POS"
   - Clique em "Concluir"

## 📱 CONFIGURAÇÃO PÓS-INSTALAÇÃO

### Primeira Execução:
1. O aplicativo iniciará automaticamente
2. **Configuração Inicial**:
   - Nome do Restaurante
   - Morada
   - Contacto
   - NIF
   - Configurações de impressora

### Atalhos Criados:
- **Menu Iniciar** → "Tasca do Vereda POS"
- **Área de Trabalho** → "Tasca do Vereda POS"

## 🔧 CONFIGURAÇÃO AVANÇADA

### Localização de Arquivos:
- **Aplicação**: `C:\Arquivos de Programas\Tasca do Vereda POS\`
- **Dados**: `%APPDATA%\Tasca do Vereda POS\`
- **Logs**: `%APPDATA%\Tasca do Vereda POS\logs\`
- **Base de Dados**: `%APPDATA%\Tasca do Vereda POS\data\tasca_vereda.db`

### Configuração de Rede:
- O aplicativo funciona **offline** por padrão
- Para sincronização, configure as opções no menu "Sistema"
- Firewall: Porta 3000 (se necessário para acesso remoto)

## 🖥️ OTIMIZAÇÃO PARA DIFERENTES ECRÃS

### Ecrãs Pequenos (Tablets 7-10"):
- Interface adaptada automaticamente
- Navegação por gestos touch
- Botões maiores e mais espaçados

### Ecrãs Médios (Laptops 13-15"):
- Layout compacto otimizado
- Sidebar colapsível
- Atalhos de teclado disponíveis

### Ecrãs Grandes (Desktop 17+):
- Interface completa com todos os painéis
- Múltiplas janelas simultâneas
- Visualização máxima de dados

### Configurações de Responsividade:
1. Menu "Sistema" → "Interface"
2. Ajuste "Escala de Interface" (75% - 150%)
3. Configure "Modo de Exibição" (Compacto/Completo)

## 🔐 SEGURANÇA E PERMISSÕES

### Permissões Necessárias:
- **Acesso ao Sistema de Arquivos** (para base de dados local)
- **Acesso à Rede** (para atualizações opcionais)
- **Acesso à Impressora** (para impressão de recibos)

### Configurações de Segurança:
1. Menu "Sistema" → "Segurança"
2. Configure PIN de acesso
3. Defina permissões de utilizadores
4. Ative backup automático

## 🛠️ MANUTENÇÃO E TROUBLESHOOTING

### Limpeza Automática:
- **Mensal**: Remoção de dados antigos (>3 meses)
- **Semanal**: Otimização da base de dados
- **Diária**: Backup automático

### Problemas Comuns:

#### Aplicativo não inicia:
1. Verifique se o Windows está atualizado
2. Execute como administrador
3. Verifique o antivírus
4. Reinstale as dependências manualmente

#### Lentidão:
1. Verifique espaço em disco
2. Limpe dados antigos (Menu "Base de Dados")
3. Reinicie o aplicativo
4. Verifique uso de memória

#### Erros de Base de Dados:
1. Menu "Base de Dados" → "Verificar Integridade"
2. Execute "Reparar Base de Dados"
3. Restaure do backup se necessário

### Logs do Sistema:
- Localização: `%APPDATA%\Tasca do Vereda POS\logs\`
- Arquivo: `app.log`
- Use para diagnóstico avançado

## 📊 MONITORAMENTO DE PERFORMANCE

### Indicadores:
- Uso de CPU: < 10% em idle
- Uso de Memória: < 200MB
- Tamanho da Base de Dados: < 100MB (com limpeza automática)

### Ferramentas:
- Menu "Sistema" → "Performance"
- Monitoramento em tempo real
- Alertas automáticos

## 🔄 ATUALIZAÇÕES

### Atualizações Automáticas:
- Verificação semanal
- Download automático
- Instalação silenciosa

### Atualização Manual:
1. Menu "Sistema" → "Verificar Atualizações"
2. Download do novo instalador
3. Executar como administrador
4. Manter dados existentes

## 📞 SUPORTE TÉCNICO

### Contactos:
- **Email**: suporte@vereda-angola.com
- **Telefone**: +244 923 000 000
- **WhatsApp**: +244 923 000 001

### Horário de Suporte:
- Segunda a Sexta: 08:00 - 18:00
- Sábado: 09:00 - 13:00
- Domingo e Feriados: Emergências apenas

### Informações para Suporte:
1. Versão do Windows
2. Versão do Tasca POS
3. Logs do sistema
4. Descrição detalhada do problema

## 📋 CHECKLIST DE INSTALAÇÃO

### Antes de Instalar:
- [ ] Windows 10+ (64-bit)
- [ ] 4GB+ RAM
- [ ] 1GB+ espaço livre
- [ ] Privilegios de administrador
- [ ] Antivírus configurado

### Durante a Instalação:
- [ ] Executar como administrador
- [ ] Aguardar instalação das dependências
- [ ] Reiniciar se solicitado
- [ ] Verificar atalhos criados

### Após a Instalação:
- [ ] Aplicativo inicia corretamente
- [ ] Configuração inicial concluída
- [ ] Testar funcionalidades básicas
- [ ] Verificar impressão (se aplicável)
- [ ] Configurar backup

---

## ⚠️ AVISOS IMPORTANTES

1. **Backup Sempre**: Faça backup regular dos dados
2. **Atualizações**: Mantenha o Windows atualizado
3. **Antivírus**: Configure exceções para o aplicativo
4. **Rede**: Firewall pode bloquear funcionalidades
5. **Espaço**: Monitore espaço em disco regularmente

## 🎯 DICAS DE OTIMIZAÇÃO

1. **Use SSD** para melhor performance
2. **Fechar outros aplicativos** durante o uso intensivo
3. **Limpe dados antigos** regularmente
4. **Reinicie semanalmente** o aplicativo
5. **Monitore logs** para problemas recorrentes

---

**Versão**: 1.0.6  
**Data**: Março 2025  
**Compatibilidade**: Windows 10+ (64-bit)  
**Desenvolvido por**: Vereda Systems Angola
