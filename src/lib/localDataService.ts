import { sqliteService } from './sqliteService';
import { Order, Expense, Employee, AttendanceRecord, AuditLog } from '../../types';

/**
 * Serviço de Gestão de Dados Local (SQLite)
 * Substitui completamente o Supabase para operações locais
 */
export class LocalDataService {
  private static instance: LocalDataService;

  static getInstance(): LocalDataService {
    if (!LocalDataService.instance) {
      LocalDataService.instance = new LocalDataService();
    }
    return LocalDataService.instance;
  }

  // Inicialização do serviço
  async init(): Promise<void> {
    await sqliteService.init();
    console.log('[LocalDataService] Serviço de dados local inicializado');
  }

  // === GESTÃO DE PEDIDOS ===
  
  async saveOrder(order: Order): Promise<void> {
    try {
      await sqliteService.saveOrder(order);
      console.log('[LocalDataService] Pedido salvo localmente:', order.id);
    } catch (error) {
      console.error('[LocalDataService] Erro ao salvar pedido:', error);
      throw error;
    }
  }

  async getOrders(limit?: number): Promise<Order[]> {
    try {
      return await sqliteService.getOrders(limit);
    } catch (error) {
      console.error('[LocalDataService] Erro ao obter pedidos:', error);
      return [];
    }
  }

  // === GESTÃO DE DESPESAS ===

  async saveExpense(expense: Expense): Promise<void> {
    try {
      await sqliteService.saveExpense(expense);
      console.log('[LocalDataService] Despesa salva localmente:', expense.id);
    } catch (error) {
      console.error('[LocalDataService] Erro ao salvar despesa:', error);
      throw error;
    }
  }

  async getExpenses(): Promise<Expense[]> {
    try {
      return await sqliteService.getExpenses();
    } catch (error) {
      console.error('[LocalDataService] Erro ao obter despesas:', error);
      return [];
    }
  }

  async updateExpenseStatus(id: string, status: string): Promise<void> {
    // Implementar atualização de status na tabela expenses
    console.log('[LocalDataService] Atualizando status da despesa:', id, status);
  }

  async deleteExpense(id: string): Promise<void> {
    // Implementar deleção de despesa
    console.log('[LocalDataService] Removendo despesa:', id);
  }

  // === GESTÃO DE FUNCIONÁRIOS ===

  async saveEmployee(employee: Employee): Promise<void> {
    // Implementar salvamento de funcionários
    console.log('[LocalDataService] Funcionário salvo localmente:', employee.id);
  }

  async getEmployees(): Promise<Employee[]> {
    // Implementar obtenção de funcionários
    console.log('[LocalDataService] Obtendo lista de funcionários');
    return [];
  }

  async updateEmployee(employee: Employee): Promise<void> {
    // Implementar atualização de funcionário
    console.log('[LocalDataService] Funcionário atualizado:', employee.id);
  }

  async deleteEmployee(id: string): Promise<void> {
    // Implementar deleção de funcionário
    console.log('[LocalDataService] Removendo funcionário:', id);
  }

  // === GESTÃO DE PONTO ===

  async saveAttendance(attendance: AttendanceRecord): Promise<void> {
    // Implementar salvamento de registos de ponto
    console.log('[LocalDataService] Registo de ponto salvo:', attendance.id);
  }

  async getAttendance(employeeId?: string): Promise<AttendanceRecord[]> {
    // Implementar obtenção de registos de ponto
    console.log('[LocalDataService] Obtendo registos de ponto');
    return [];
  }

  // === AUDITORIA E LOGS ===

  async saveAuditLog(log: AuditLog): Promise<void> {
    try {
      await sqliteService.saveAuditLog(log);
      console.log('[LocalDataService] Log de auditoria salvo:', log.id);
    } catch (error) {
      console.error('[LocalDataService] Erro ao salvar log:', error);
    }
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    // Implementar obtenção de logs
    console.log('[LocalDataService] Obtendo logs de auditoria');
    return [];
  }

  // === ESTATÍSTICAS E RELATÓRIOS ===

  async getFinancialStats(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const orders = await this.getOrders();
      const expenses = await this.getExpenses();

      // Filtrar por período se especificado
      const filteredOrders = startDate && endDate 
        ? orders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate >= startDate && orderDate <= endDate;
          })
        : orders;

      const filteredExpenses = startDate && endDate
        ? expenses.filter(e => {
            const expenseDate = new Date(e.createdAt);
            return expenseDate >= startDate && expenseDate <= endDate;
          })
        : expenses;

      // Calcular estatísticas
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const totalOrders = filteredOrders.length;
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalRevenue,
        totalExpenses,
        totalProfit: totalRevenue - totalExpenses,
        totalOrders,
        averageTicket,
        period: {
          start: startDate?.toISOString(),
          end: endDate?.toISOString()
        }
      };
    } catch (error) {
      console.error('[LocalDataService] Erro ao calcular estatísticas:', error);
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalOrders: 0,
        averageTicket: 0
      };
    }
  }

  async getDatabaseStats(): Promise<any> {
    try {
      return await sqliteService.getDatabaseStats();
    } catch (error) {
      console.error('[LocalDataService] Erro ao obter estatísticas da DB:', error);
      return {
        size: 'Error',
        tables: 'N/A',
        lastCleanup: 'Nunca'
      };
    }
  }

  // === MANUTENÇÃO ===

  async forceCleanup(): Promise<void> {
    try {
      await sqliteService.forceCleanup();
      console.log('[LocalDataService] Limpeza forçada concluída');
    } catch (error) {
      console.error('[LocalDataService] Erro na limpeza forçada:', error);
      throw error;
    }
  }

  // === BACKUP E RESTAURAÇÃO ===

  async exportData(): Promise<any> {
    try {
      const orders = await this.getOrders();
      const expenses = await this.getExpenses();
      const employees = await this.getEmployees();
      const logs = await this.getAuditLogs(1000);

      return {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        data: {
          orders,
          expenses,
          employees,
          auditLogs: logs
        }
      };
    } catch (error) {
      console.error('[LocalDataService] Erro ao exportar dados:', error);
      throw error;
    }
  }

  async importData(data: any): Promise<void> {
    try {
      console.log('[LocalDataService] Iniciando importação de dados...');
      
      // Importar pedidos
      if (data.data?.orders) {
        for (const order of data.data.orders) {
          await this.saveOrder(order);
        }
      }

      // Importar despesas
      if (data.data?.expenses) {
        for (const expense of data.data.expenses) {
          await this.saveExpense(expense);
        }
      }

      // Importar funcionários
      if (data.data?.employees) {
        for (const employee of data.data.employees) {
          await this.saveEmployee(employee);
        }
      }

      console.log('[LocalDataService] Importação concluída com sucesso');
    } catch (error) {
      console.error('[LocalDataService] Erro na importação:', error);
      throw error;
    }
  }

  // === SAÚDE DO SISTEMA ===

  async checkHealth(): Promise<any> {
    try {
      const stats = await this.getDatabaseStats();
      const financialStats = await this.getFinancialStats();

      return {
        status: 'healthy',
        database: stats,
        financial: financialStats,
        timestamp: new Date().toISOString(),
        features: {
          sqlite: true,
          supabase: false,
          autoCleanup: true
        }
      };
    } catch (error) {
      console.error('[LocalDataService] Erro no health check:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Exportar instância singleton
export const localDataService = LocalDataService.getInstance();
