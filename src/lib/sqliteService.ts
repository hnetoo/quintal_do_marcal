
/**
 * Serviço de Base de Dados SQLite para Windows (via Tauri)
 * Fallback automático para LocalStorage em ambiente Web
 * Com limpeza automática mensal para economizar espaço em disco
 */
class SqliteService {
  private db: any = null;
  private isTauri = !!(window as any).__TAURI_INTERNALS__;
  private initPromise: Promise<boolean> | null = null;

  async init(): Promise<boolean> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!this.isTauri) {
        console.log("Ambiente Web Detectado: Utilizando LocalStorage");
        return true;
      }

      try {
        const { default: Database } = await import("@tauri-apps/plugin-sql");
        this.db = await Database.load("sqlite:tasca_vereda_v3.db");
        
        // Tabela de estado da aplicação
        await this.db.execute(`
          CREATE TABLE IF NOT EXISTS application_state (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 🔥 TABELA SETTINGS PARA TAXA DE IMPOSTO
        await this.db.execute(`
          CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY DEFAULT 'default',
            taxRate REAL DEFAULT 7,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 🔥 MIGRAÇÃO INICIAL - Inserir settings se não existirem
        await this.db.execute(`
          INSERT OR IGNORE INTO settings (id, taxRate) VALUES ('default', 7)
        `);

        // Tabela de pedidos para histórico
        await this.db.execute(`
          CREATE TABLE IF NOT EXISTS orders_history (
            id TEXT PRIMARY KEY,
            table_id INTEGER,
            customer_name TEXT,
            total_amount REAL,
            payment_method TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabela de despesas
        await this.db.execute(`
          CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            amount_kz REAL NOT NULL,
            category TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabela de logs de auditoria
        await this.db.execute(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_name TEXT,
            action TEXT NOT NULL,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabela de configurações do sistema
        await this.db.execute(`
          CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Criar índices para performance
        await this.db.execute("CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders_history (created_at)");
        await this.db.execute("CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses (created_at)");
        await this.db.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp)");

        // Verificar e executar limpeza mensal
        await this.setupMonthlyCleanup();
        
        return true;
      } catch (e) {
        console.warn("Falha ao carregar plugin SQL Tauri, usando fallback LocalStorage:", e);
        this.isTauri = false;
        return true;
      }
    })();

    return this.initPromise;
  }

  // Configurar limpeza mensal automática
  private async setupMonthlyCleanup(): Promise<void> {
    if (!this.isTauri || !this.db) return;

    try {
      // Verificar última limpeza
      const result = await this.db.select(
        "SELECT value FROM system_settings WHERE key = 'last_cleanup_date'"
      );
      
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastCleanup = result.length > 0 ? result[0].value : null;
      
      if (lastCleanup !== currentMonth) {
        console.log('[SQLite] Iniciando limpeza mensal de dados antigos...');
        await this.performMonthlyCleanup();
        
        // Atualizar data da última limpeza
        await this.db.execute(
          "INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
          ['last_cleanup_date', currentMonth]
        );
        
        console.log('[SQLite] Limpeza mensal concluída');
      }
    } catch (error) {
      console.error('[SQLite] Erro na verificação de limpeza mensal:', error);
    }
  }

  // Executar limpeza de dados antigos
  private async performMonthlyCleanup(): Promise<void> {
    if (!this.db) return;

    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const cutoffDate = threeMonthsAgo.toISOString();

      // Limpar pedidos fechados com mais de 3 meses
      const ordersResult = await this.db.execute(
        "DELETE FROM orders_history WHERE status = 'closed' AND created_at < ?",
        [cutoffDate]
      );

      // Limpar logs de auditoria com mais de 3 meses
      const logsResult = await this.db.execute(
        "DELETE FROM audit_logs WHERE timestamp < ?",
        [cutoffDate]
      );

      // Limpar despesas pagas com mais de 6 meses
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const expensesCutoff = sixMonthsAgo.toISOString();

      const expensesResult = await this.db.execute(
        "DELETE FROM expenses WHERE status = 'PAID' AND created_at < ?",
        [expensesCutoff]
      );

      // Optimizar base de dados
      await this.db.execute("VACUUM");

      console.log('[SQLite] Limpeza concluída:', {
        orders: ordersResult.lastInsertRowid || 0,
        logs: logsResult.lastInsertRowid || 0,
        expenses: expensesResult.lastInsertRowid || 0
      });

    } catch (error) {
      console.error('[SQLite] Erro durante limpeza mensal:', error);
    }
  }

  // Salvar pedido no histórico
  async saveOrder(order: any): Promise<void> {
    if (!this.isTauri || !this.db) return;

    try {
      await this.db.execute(`
        INSERT OR REPLACE INTO orders_history (
          id, table_id, customer_name, total_amount, payment_method, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        order.id,
        order.tableId || null,
        order.subAccountName || 'Cliente',
        order.total || 0,
        order.paymentMethod || 'NUMERARIO',
        order.status || 'closed',
        new Date().toISOString()
      ]);
    } catch (error) {
      console.error('[SQLite] Erro ao salvar pedido:', error);
    }
  }

  // Salvar despesa
  async saveExpense(expense: any): Promise<void> {
    if (!this.isTauri || !this.db) return;

    try {
      await this.db.execute(`
        INSERT OR REPLACE INTO expenses (
          id, description, amount_kz, category, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        expense.id,
        expense.description,
        expense.amount,
        expense.category,
        expense.status || 'PENDING',
        expense.createdAt?.toISOString() || new Date().toISOString()
      ]);
    } catch (error) {
      console.error('[SQLite] Erro ao salvar despesa:', error);
    }
  }

  // Salvar log de auditoria
  async saveAuditLog(log: any): Promise<void> {
    if (!this.isTauri || !this.db) return;

    try {
      await this.db.execute(`
        INSERT OR REPLACE INTO audit_logs (
          id, user_name, action, details, timestamp
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        log.id || `log-${Date.now()}`,
        log.userName || 'Sistema',
        log.action,
        log.details || '',
        log.timestamp?.toISOString() || new Date().toISOString()
      ]);
    } catch (error) {
      console.error('[SQLite] Erro ao salvar log:', error);
    }
  }

  // Obter pedidos do histórico
  async getOrders(limit?: number): Promise<any[]> {
    if (!this.isTauri || !this.db) return [];

    try {
      let query = "SELECT * FROM orders_history ORDER BY created_at DESC";
      if (limit) {
        query += ` LIMIT ${limit}`;
      }

      const result = await this.db.select(query);
      return result || [];
    } catch (error) {
      console.error('[SQLite] Erro ao obter pedidos:', error);
      return [];
    }
  }

  // Obter despesas
  async getExpenses(): Promise<any[]> {
    if (!this.isTauri || !this.db) return [];

    try {
      const result = await this.db.select("SELECT * FROM expenses ORDER BY created_at DESC");
      return result || [];
    } catch (error) {
      console.error('[SQLite] Erro ao obter despesas:', error);
      return [];
    }
  }

  // Obter estatísticas da base de dados
  async getDatabaseStats(): Promise<any> {
    if (!this.isTauri || !this.db) {
      return { size: 'LocalStorage', tables: 'N/A' };
    }

    try {
      const orders = await this.db.select("SELECT COUNT(*) as count FROM orders_history");
      const expenses = await this.db.select("SELECT COUNT(*) as count FROM expenses");
      const logs = await this.db.select("SELECT COUNT(*) as count FROM audit_logs");

      return {
        size: 'SQLite DB',
        orders: orders[0]?.count || 0,
        expenses: expenses[0]?.count || 0,
        logs: logs[0]?.count || 0,
        lastCleanup: await this.getLastCleanupDate()
      };
    } catch (error) {
      console.error('[SQLite] Erro ao obter estatísticas:', error);
      return { size: 'Error', tables: 'N/A' };
    }
  }

  private async getLastCleanupDate(): Promise<string> {
    if (!this.db) return 'Nunca';
    
    try {
      const result = await this.db.select(
        "SELECT value FROM system_settings WHERE key = 'last_cleanup_date'"
      );
      return result.length > 0 ? result[0].value : 'Nunca';
    } catch {
      return 'Nunca';
    }
  }

  // Forçar limpeza manual (para uso administrativo)
  async forceCleanup(): Promise<void> {
    if (!this.isTauri || !this.db) {
      console.log('[SQLite] Limpeza manual disponível apenas em ambiente desktop');
      return;
    }

    console.log('[SQLite] Iniciando limpeza manual...');
    await this.performMonthlyCleanup();
    
    // Atualizar data da última limpeza
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    await this.db.execute(
      "INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
      ['last_cleanup_date', currentMonth]
    );
    
    console.log('[SQLite] Limpeza manual concluída');
  }

  async saveState(state: any): Promise<void> {
    if (state === undefined) return;
    
    try {
      const dataStr = JSON.stringify(state);
      
      if (this.isTauri && this.db) {
        await this.db.execute(
          "INSERT OR REPLACE INTO application_state (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
          ["current_state", dataStr]
        );
      } else {
        localStorage.setItem('vereda-quantum-store-v8', dataStr);
      }
    } catch (e) {
      console.error("Erro ao persistir estado:", e);
    }
  }

  // 🔥 MÉTODO PARA SALVAR TAXA DE IMPOSTO NO SQLITE
  async saveTaxRate(taxRate: number): Promise<void> {
    try {
      if (this.isTauri && this.db) {
        await this.db.execute(
          "UPDATE settings SET taxRate = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 'default'",
          [taxRate]
        );
        console.log(`💰 [SQLite] Taxa de imposto atualizada: ${taxRate}%`);
      } else {
        console.warn('⚠️ [SQLite] Ambiente não-Tauri, taxa não salva no banco');
      }
    } catch (e) {
      console.error("❌ [SQLite] Erro ao salvar taxa de imposto:", e);
    }
  }

  // 🔥 MÉTODO PARA CARREGAR TAXA DE IMPOSTO DO SQLITE
  async loadTaxRate(): Promise<number> {
    try {
      if (this.isTauri && this.db) {
        const result: any[] = await this.db.select(
          "SELECT taxRate FROM settings WHERE id = 'default'"
        );
        return result[0]?.taxRate || 7;
      } else {
        return 7; // Fallback para ambiente web
      }
    } catch (e) {
      console.error("❌ [SQLite] Erro ao carregar taxa de imposto:", e);
      return 7; // Fallback
    }
  }

  // Limpar todos os pedidos do histórico
  async clearAllOrders(): Promise<void> {
    if (!this.isTauri || !this.db) {
      console.log('[SQLite] clearAllOrders disponível apenas em ambiente desktop');
      return;
    }

    try {
      console.log('[SQLite] Limpando histórico de pedidos...');
      const result = await this.db.execute("DELETE FROM orders_history");
      console.log('[SQLite] Pedidos removidos:', result.rowsAffected || 0);
      
      // Limpar também tabela de estado da aplicação
      await this.db.execute("DELETE FROM application_state WHERE id = 'current_state'");
      console.log('[SQLite] Estado da aplicação limpo');
    } catch (error) {
      console.error('[SQLite] Erro ao limpar pedidos:', error);
      throw error;
    }
  }

  // Limpar todas as despesas
  async clearAllExpenses(): Promise<void> {
    if (!this.isTauri || !this.db) {
      console.log('[SQLite] clearAllExpenses disponível apenas em ambiente desktop');
      return;
    }

    try {
      console.log('[SQLite] Limpando despesas...');
      const result = await this.db.execute("DELETE FROM expenses");
      console.log('[SQLite] Despesas removidas:', result.rowsAffected || 0);
    } catch (error) {
      console.error('[SQLite] Erro ao limpar despesas:', error);
      throw error;
    }
  }

  async loadState(): Promise<any> {
    try {
      if (this.isTauri) {
        // Garantir que o init terminou se estivermos em Tauri
        await this.init();
        if (this.db) {
          const result: any[] = await this.db.select(
            "SELECT data FROM application_state WHERE id = ? ORDER BY updated_at DESC LIMIT 1",
            ["current_state"]
          );
          if (result.length > 0) return JSON.parse(result[0].data);
        }
      }
      
      const data = localStorage.getItem('vereda-quantum-store-v8');
      if (!data) return null;

      const parsed = JSON.parse(data);
      // Zustand persist armazena como { state: {...}, version: N }
      return parsed.state || parsed;
    } catch (e) {
      console.error("Erro ao carregar estado:", e);
      return null;
    }
  }
}

export const sqliteService = new SqliteService();
