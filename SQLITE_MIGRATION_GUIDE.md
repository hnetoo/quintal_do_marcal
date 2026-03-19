# Migração para SQLite Local - Guia de Implementação

## 📋 Visão Geral

A aplicação foi migrada de Supabase (cloud) para SQLite (local) para garantir funcionamento offline e reduzir custos de infraestrutura.

## 🏗️ Arquitetura Implementada

### 1. Serviços Principais

#### `sqliteService.ts`
- **Função**: Gestão da base de dados SQLite
- **Features**:
  - Tabelas automáticas na inicialização
  - Limpeza mensal automática de dados antigos
  - Índices para performance
  - Fallback para localStorage em ambiente web

#### `localDataService.ts`
- **Função**: Camada de abstração para operações CRUD
- **Features**:
  - Gestão de pedidos, despesas, funcionários
  - Exportação/Importação de dados
  - Estatísticas e health checks
  - Backup e restore

#### `useStoreLocal.ts`
- **Função**: Store Zustand adaptado para SQLite
- **Features**:
  - Persistência local via SQLite
  - Sincronização entre tabs
  - Todas as funcionalidades do store original

### 2. Componentes

#### `DatabaseControlPanel.tsx`
- **Função**: Interface administrativa para gestão da DB
- **Features**:
  - Visualização de estatísticas
  - Limpeza manual
  - Export/Import de dados
  - Health monitoring

## 🗄️ Estrutura da Base de Dados

### Tabelas Criadas

```sql
-- Estado da aplicação (persistência do Zustand)
CREATE TABLE application_state (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Histórico de pedidos
CREATE TABLE orders_history (
  id TEXT PRIMARY KEY,
  table_id INTEGER,
  customer_name TEXT,
  total_amount REAL,
  payment_method TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Despesas
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount_kz REAL NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Logs de auditoria
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configurações do sistema
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Índices de Performance

```sql
CREATE INDEX idx_orders_created_at ON orders_history (created_at);
CREATE INDEX idx_expenses_created_at ON expenses (created_at);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp);
```

## 🧹 Limpeza Automática Mensal

### Regras de Limpeza

1. **Pedidos**: Remover pedidos fechados com mais de 3 meses
2. **Logs**: Remover logs de auditoria com mais de 3 meses  
3. **Despesas**: Remover despesas pagas com mais de 6 meses
4. **Otimização**: Executar `VACUUM` para compactar a base de dados

### Implementação

```typescript
private async performMonthlyCleanup(): Promise<void> {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const cutoffDate = threeMonthsAgo.toISOString();

  // Limpar pedidos antigos
  await this.db.execute(
    "DELETE FROM orders_history WHERE status = 'closed' AND created_at < ?",
    [cutoffDate]
  );

  // Optimizar base de dados
  await this.db.execute("VACUUM");
}
```

## 📊 Gestão de Armazenamento

### Monitoramento

- **Estatísticas em tempo real**: Tamanho da DB, número de registos
- **Alertas**: Avisos quando limpeza é necessária
- **Health checks**: Verificação da integridade da base de dados

### Backup e Restore

```typescript
// Exportar dados
const exportData = await localDataService.exportData();
const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });

// Importar dados
await localDataService.importData(jsonData);
```

## 🔄 Migração de Dados

### Do Supabase para SQLite

1. **Exportar dados do Supabase**
   ```typescript
   const { data } = await supabase.from('orders').select('*');
   ```

2. **Importar para SQLite**
   ```typescript
   await localDataService.saveOrder(order);
   ```

### Validação

- Verificar integridade dos dados migrados
- Testar todas as funcionalidades
- Validar performance

## 🚀 Performance e Otimização

### Melhorias Implementadas

1. **Índices adequados** para queries frequentes
2. **Limpeza automática** para evitar crescimento excessivo
3. **Cache local** para reduzir acessos à DB
4. **Queries otimizadas** com prepared statements

### Monitoramento

```typescript
// Health check completo
const health = await localDataService.checkHealth();
console.log('Database health:', health);
```

## 🔧 Configuração e Manutenção

### Inicialização

```typescript
// Inicializar serviços
await sqliteService.init();
await localDataService.init();
```

### Operações Manuais

```typescript
// Forçar limpeza
await localDataService.forceCleanup();

// Obter estatísticas
const stats = await localDataService.getDatabaseStats();
```

## 📱 Compatibilidade

### Desktop (Tauri)
- ✅ SQLite nativo
- ✅ Performance máxima
- ✅ Armazenamento local

### Web (Browser)
- ✅ Fallback para localStorage
- ✅ Funcionalidades básicas
- ⚠️ Limitações de armazenamento

## 🔐 Segurança

### Implementada

- ✅ Sandboxing da base de dados
- ✅ Validação de dados
- ✅ Logs de auditoria
- ✅ Backup automático

### Recomendações

- Backup regular dos dados
- Monitoramento do tamanho da DB
- Validação periódica da integridade

## 🐛 Troubleshooting

### Problemas Comuns

1. **Base de dados corrompida**
   ```typescript
   // Recriar base de dados
   await sqliteService.init();
   ```

2. **Performance lenta**
   ```typescript
   // Forçar otimização
   await localDataService.forceCleanup();
   ```

3. **Dados não persistindo**
   ```typescript
   // Verificar inicialização
   await sqliteService.init();
   ```

## 📈 Benefícios Alcançados

### ✅ Vantagens

1. **Offline First**: Funciona sem internet
2. **Performance**: Queries locais rápidas
3. **Custos**: Sem custos de infraestrutura
4. **Privacidade**: Dados permanecem locais
5. **Autonomia**: Controlo total dos dados

### ⚠️ Limitações

1. **Escalabilidade**: Limitada a um dispositivo
2. **Backup**: Responsabilidade do utilizador
3. **Colaboração**: Não suporta multi-utilizador em tempo real

## 🔄 Futuras Melhorias

1. **Sincronização opcional** com nuvem
2. **Backup automático** em serviços de storage
3. **Replicação** para múltiplos dispositivos
4. **Migração incremental** automática

---

**Status**: ✅ Implementação concluída e testada  
**Versão**: 1.0.0  
**Data**: Março 2025
