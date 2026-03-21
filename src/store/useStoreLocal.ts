import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { sqliteService } from '../lib/sqliteService';
import { localDataService } from '../lib/localDataService';
import { Table, Order, Dish, Customer, PaymentMethod, User, SystemSettings, Notification, MenuCategory, OrderType, Employee, AttendanceRecord, StockItem, Reservation, WorkShift, OrderItem, PermissionTemplate, AuditLog, PaymentMethodConfig, Expense, ExpenseCategory, ExpenseStatus } from '../../types';
import { MOCK_MENU, MOCK_TABLES, MOCK_CUSTOMERS, MOCK_USERS, MOCK_CATEGORIES, MOCK_STOCK, MOCK_RESERVATIONS } from '../../constants';
import defaultLogo from '../assets/logo.png';

const syncChannel = new BroadcastChannel('vereda_state_sync');

const customPersistenceStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const data = await sqliteService.loadState();
      if (data) return JSON.stringify({ state: data, version: 9 });
      return null;
    } catch (e) { return null; }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const parsed = JSON.parse(value);
      await sqliteService.saveState(parsed.state);
      syncChannel.postMessage({ type: 'STATE_UPDATE' });
    } catch (e) {}
  },
  removeItem: async (name: string): Promise<void> => {
    await sqliteService.saveState(null);
    syncChannel.postMessage({ type: 'STATE_UPDATE' });
  }
};

interface StoreState {
  users: User[];
  currentUser: User | null;
  login: (pin: string, userId?: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  removeUser: (id: string) => void;
  
  permissionTemplates: PermissionTemplate[];
  addPermissionTemplate: (template: PermissionTemplate) => void;
  updatePermissionTemplate: (template: PermissionTemplate) => void;
  removePermissionTemplate: (id: string) => void;

  transferTable: (fromTableId: number, toTableId: number) => void;
  cancelEmptyTable: (tableId: number) => void;
  addSubAccount: (tableId: number, name: string) => void;
  removeSubAccount: (orderId: string) => void;
  
  // Pagamentos
  addPaymentConfig: (config: Omit<PaymentMethodConfig, 'id'>) => void;
  updatePaymentConfig: (id: string, config: Partial<PaymentMethodConfig>) => void;
  
  // Configurações e UI
  settings: SystemSettings;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  auditLogs: AuditLog[];
  paymentConfigs: PaymentMethodConfig[];
  notifications: Notification[];
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName'>) => void;
  tables: Table[];
  categories: MenuCategory[];
  menu: Dish[];
  activeOrders: Order[];
  customers: Customer[];
  activeTableId: number | null;
  activeOrderId: string | null;
  customerDisplayMode: Record<number, 'MARKETING' | 'ORDER_SUMMARY'>;
  setCustomerDisplayMode: (tableId: number, mode: 'MARKETING' | 'ORDER_SUMMARY') => void;
  invoiceCounter: number;
  employees: Employee[];
  attendance: AttendanceRecord[];
  stock: StockItem[];
  reservations: Reservation[];
  workShifts: WorkShift[];
  
  // Despesas
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  approveExpense: (id: string, approvedBy: string) => void;
  loadExpenses: () => Promise<void>;
  
  // Funcionários
  loadEmployees: () => Promise<void>;
  
  setActiveTable: (id: number | null) => void;
  setActiveOrder: (id: string | null) => void;
  createNewOrder: (tableId: number | null, name?: string, type?: OrderType) => string;
  transferOrder: (orderId: string, targetTableId: number) => void;
  addToOrder: (tableId: number | null, dish: Dish, quantity?: number, notes?: string, orderId?: string) => void;
  checkoutTable: (orderId: string, paymentMethod: PaymentMethod, customerId?: string) => void;
  updateOrderPaymentMethod: (orderId: string, newMethod: PaymentMethod) => void;
  
  updateTablePosition: (id: number, x: number, y: number) => void;
  addTable: (table: Table) => void;
  updateTable: (table: Table) => void;
  removeTable: (id: number) => void;
  closeTable: (id: number) => void;

  updateOrderItemStatus: (orderId: string, itemIndex: number, status: OrderItem['status']) => void;
  markOrderAsServed: (orderId: string) => void;

  toggleDishVisibility: (id: string) => void;
  toggleDishFeatured: (id: string) => void;
  toggleCategoryVisibility: (id: string) => void;

  addDish: (dish: Dish) => void;
  updateDish: (dish: Dish) => void;
  removeDish: (id: string) => void;
  addCategory: (cat: MenuCategory) => void;
  updateCategory: (cat: MenuCategory) => void;
  removeCategory: (id: string) => void;
  duplicateDish: (id: string) => void;
  duplicateCategory: (id: string) => void;
  updateStockQuantity: (id: string, delta: number) => void;

  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  removeCustomer: (id: string) => void;
  settleCustomerDebt: (id: string, amount: number) => void;

  employees: Employee[];
  addEmployee: (e: Employee) => void;
  updateEmployee: (e: Employee) => void;
  removeEmployee: (id: string) => void;
  loadEmployees: () => Promise<void>;
  clockIn: (employeeId: string) => void;
  clockOut: (employeeId: string) => void;
  externalClockSync: (bioId: string) => void;

  addWorkShift: (shift: WorkShift) => void;
  updateWorkShift: (shift: WorkShift) => void;
  removeWorkShift: (id: string) => void;

  addReservation: (res: Reservation) => void;

  // Funções de manutenção da base de dados
  getDatabaseStats: () => Promise<any>;
  forceDatabaseCleanup: () => Promise<void>;
  exportDatabase: () => Promise<any>;
  importDatabase: (data: any) => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      users: [...MOCK_USERS, { id: '5', name: 'Proprietário', role: 'OWNER', pin: '0000', permissions: ['POS_SALES', 'POS_VOID', 'POS_DISCOUNT', 'FINANCE_VIEW', 'STOCK_MANAGE', 'STAFF_MANAGE', 'SYSTEM_CONFIG', 'OWNER_ACCESS', 'AGT_CONFIG'], status: 'ATIVO' }],
      currentUser: null,
      permissionTemplates: [
        { id: 'tp-waiter', name: 'Perfil Garçom', description: 'Permissões básicas para atendimento de mesas.', permissions: ['POS_SALES'] },
        { id: 'tp-cashier', name: 'Perfil Caixa', description: 'Acesso a vendas e descontos.', permissions: ['POS_SALES', 'POS_DISCOUNT'] },
        { id: 'tp-manager', name: 'Perfil Gerente', description: 'Acesso total operativo e financeiro.', permissions: ['POS_SALES', 'POS_VOID', 'POS_DISCOUNT', 'FINANCE_VIEW', 'STOCK_MANAGE', 'STAFF_MANAGE'] },
        { id: 'tp-owner', name: 'Perfil Proprietário', description: 'Controlo total e acesso ao Owner Hub.', permissions: ['POS_SALES', 'POS_VOID', 'POS_DISCOUNT', 'FINANCE_VIEW', 'STOCK_MANAGE', 'STAFF_MANAGE', 'SYSTEM_CONFIG', 'OWNER_ACCESS', 'AGT_CONFIG'] }
      ],
      addPermissionTemplate: (t) => set(state => ({ permissionTemplates: [...state.permissionTemplates, t] })),
      updatePermissionTemplate: (t) => set(state => ({ permissionTemplates: state.permissionTemplates.map(x => x.id === t.id ? t : x) })),
      removePermissionTemplate: (id) => set(state => ({ permissionTemplates: state.permissionTemplates.filter(x => x.id !== id) })),

      login: (pin, userId) => {
        const user = get().users.find(u => (userId ? u.id === userId : true) && u.pin === pin);
        if (user) { 
          set({ currentUser: user }); 
          get().addNotification('success', `Acesso autorizado: ${user.name}`);
          return true; 
        }
        get().addNotification('error', 'PIN Inválido');
        return false;
      },
      logout: () => {
        localStorage.clear();
        set({ currentUser: null });
      },
      addUser: (user) => set(state => ({ users: [...state.users, user] })),
      updateUser: (user) => set(state => ({ users: state.users.map(u => u.id === user.id ? user : u) })),
      removeUser: (id) => set(state => ({ users: state.users.filter(u => u.id !== id) })),
      auditLogs: [],
      paymentConfigs: [
        { id: '1', name: 'Numerário', type: 'NUMERARIO', icon: 'Banknote', isActive: true },
        { id: '2', name: 'TPA / Multicaixa', type: 'TPA', icon: 'CreditCard', isActive: true },
        { id: '3', name: 'Transferência', type: 'TRANSFERENCIA', icon: 'ArrowRightLeft', isActive: true },
        { id: '4', name: 'Referência QR', type: 'QR_CODE', icon: 'QrCode', isActive: true },
      ],
      notifications: [],
      addNotification: (type, message) => {
        const id = Math.random().toString(36).substring(7);
        set(state => {
          const currentNotifications = state.notifications.slice(-1);
          return { notifications: [...currentNotifications, { id, type, message }] };
        });
        
        const duration = type === 'success' ? 2000 : 5000;
        setTimeout(() => get().removeNotification(id), duration);
      },
      removeNotification: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      addAuditLog: (log) => {
        const currentUser = get().currentUser || { id: 'sys', name: 'Sistema' };
        const newLog: AuditLog = {
          ...log,
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          userId: currentUser.id,
          userName: currentUser.name
        };
        set(state => ({ auditLogs: [newLog, ...state.auditLogs].slice(0, 1000) }));
        
        // Salvar no SQLite local
        localDataService.saveAuditLog(newLog);
      },
      settings: {
        restaurantName: 'REST IA',
        appLogoUrl: defaultLogo,
        currency: "Kz",
        taxRate: 14,
        taxRegime: 'GERAL',
        phone: "+244 923 000 000",
        address: "Via AL 15, Talatona, Luanda",
        nif: "5000000000",
        commercialReg: "L001-2025",
        capitalSocial: "100.000,00 Kz",
        conservatoria: "Conservatória do Registo Comercial de Luanda",
        agtCertificate: "000/AGT/2025",
        invoiceSeries: "2025",
        kdsEnabled: true,
        isSidebarCollapsed: false,
        apiToken: "V-OS-QUBIT-777",
        autoBackup: false, // Desativado para modo apenas local
        customDigitalMenuUrl: "https://tasca-do-vereda.vercel.app/menu-digital" 
      },
      updateSettings: (s) => {
        set(state => ({ settings: { ...state.settings, ...s } }));
      },
      tables: MOCK_TABLES,
      categories: MOCK_CATEGORIES.map(c => ({...c, isVisibleDigital: true})),
      menu: MOCK_MENU.map(m => ({...m, isVisibleDigital: true, isFeatured: false})),
      activeOrders: [],
      customers: MOCK_CUSTOMERS,
      activeTableId: null,
      activeOrderId: null,
      customerDisplayMode: {},
      setCustomerDisplayMode: (tableId, mode) => set(state => ({
        customerDisplayMode: { ...state.customerDisplayMode, [tableId]: mode }
      })),
      invoiceCounter: 1,
      employees: [],
      attendance: [],
      stock: MOCK_STOCK,
      reservations: MOCK_RESERVATIONS,
      workShifts: [],
      expenses: [],

      // Implementação das funções de despesas
      addExpense: async (expense) => {
        const newExpense: Expense = {
          ...expense,
          id: `exp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set(state => ({ expenses: [...state.expenses, newExpense] }));
        
        // Salvar no SQLite local
        await localDataService.saveExpense(newExpense);
        
        get().addAuditLog({
          module: 'EXPENSES',
          action: 'ADICIONAR_DESPESA',
          details: `Despesa adicionada: ${expense.description} (${expense.amount} Kz)`
        });
        
        get().addNotification('success', 'Despesa adicionada com sucesso');
      },

      updateExpense: async (id, updates) => {
        set(state => ({
          expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e)
        }));
        
        const expense = get().expenses.find(e => e.id === id);
        if (expense) {
          await localDataService.saveExpense(expense);
        }
        
        get().addAuditLog({
          module: 'EXPENSES',
          action: 'ATUALIZAR_DESPESA',
          details: `Despesa atualizada: ${id}`
        });
      },

      removeExpense: async (id) => {
        const expense = get().expenses.find(e => e.id === id);
        set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }));
        
        if (expense) {
          await localDataService.deleteExpense(id);
        }
        
        get().addAuditLog({
          module: 'EXPENSES',
          action: 'REMOVER_DESPESA',
          details: `Despesa removida: ${expense?.description || id}`
        });
      },

      approveExpense: async (id, approvedBy) => {
        await get().updateExpense(id, { status: 'PAID' as ExpenseStatus });
        
        get().addAuditLog({
          module: 'EXPENSES',
          action: 'APROVAR_DESPESA',
          details: `Despesa aprovada por ${approvedBy}: ${id}`
        });
      },

      loadExpenses: async () => {
        try {
          const expenses = await localDataService.getExpenses();
          set({ expenses });
        } catch (error) {
          console.error('Erro ao carregar despesas:', error);
        }
      },

      // Implementação das funções de funcionários
      loadEmployees: async () => {
        try {
          const employees = await localDataService.getEmployees();
          set({ employees });
        } catch (error) {
          console.error('Erro ao carregar funcionários:', error);
        }
      },

      // Funções de manutenção da base de dados
      getDatabaseStats: async () => {
        return await localDataService.getDatabaseStats();
      },

      forceDatabaseCleanup: async () => {
        await localDataService.forceCleanup();
        get().addNotification('success', 'Limpeza da base de dados concluída');
      },

      exportDatabase: async () => {
        return await localDataService.exportData();
      },

      importDatabase: async (data) => {
        await localDataService.importData(data);
        get().addNotification('success', 'Dados importados com sucesso');
        await get().loadExpenses();
        await get().loadEmployees();
      },

      // Implementações existentes (mantidas para compatibilidade)
      setActiveTable: (id) => set({ activeTableId: id }),
      setActiveOrder: (id) => set({ activeOrderId: id }),

      createNewOrder: (tableId, name, type: OrderType = 'LOCAL') => {
        const id = `ord-${Date.now()}`;
        const newOrder: Order = {
          id, tableId, type, items: [], status: 'ABERTO' as const, timestamp: new Date(),
          total: 0, taxTotal: 0, profit: 0, subAccountName: name || 'Principal'
        };
        set(state => ({
          activeOrders: [...state.activeOrders, newOrder],
          activeOrderId: id,
          tables: tableId ? state.tables.map(t => t.id === tableId ? { ...t, status: 'OCUPADO' as const } : t) : state.tables
        }));
        return id;
      },

      addToOrder: (tableId, dish, quantity = 1, notes = '', orderId) => {
        const targetId = orderId || get().activeOrderId;
        set(state => {
          const orderExists = state.activeOrders.find(o => o.id === targetId);
          
          if (!orderExists && tableId) {
             const newId = `ord-${Date.now()}`;
             const newOrder: Order = {
               id: newId, tableId, type: 'LOCAL', items: [{
                  dishId: dish.id, quantity, status: 'PENDENTE' as const, notes,
                  unitPrice: dish.price, unitCost: dish.costPrice,
                  taxAmount: dish.price * (state.settings.taxRate / 100)
               }], status: 'ABERTO' as const, timestamp: new Date(),
               total: dish.price * quantity, taxTotal: (dish.price * (state.settings.taxRate / 100)) * quantity, 
               profit: (dish.price - dish.costPrice) * quantity, subAccountName: 'Principal'
             };
             return { 
                activeOrders: [...state.activeOrders, newOrder],
                activeOrderId: newId,
                tables: state.tables.map(t => t.id === tableId ? { ...t, status: 'OCUPADO' as const } : t)
             };
          }

          if (!orderExists) return state;

          const newOrders = state.activeOrders.map(o => {
            if (o.id !== targetId) return o;
            
            const existingItemIndex = o.items.findIndex(item => 
              item.dishId === dish.id && 
              item.notes === notes && 
              item.status === 'PENDENTE'
            );

            let newItems: OrderItem[];
            if (existingItemIndex !== -1) {
              newItems = o.items.map((item, idx) => 
                idx === existingItemIndex 
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              );
              get().addNotification('success', `Quantidade de ${dish.name} incrementada.`);
            } else {
              newItems = [...o.items, {
                dishId: dish.id, quantity, status: 'PENDENTE' as const, notes,
                unitPrice: dish.price, unitCost: dish.costPrice,
                taxAmount: dish.price * (state.settings.taxRate / 100)
              }];
            }

            const total = newItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
            const profit = newItems.reduce((acc, i) => acc + ((i.unitPrice - i.unitCost) * i.quantity), 0);
            const taxTotal = newItems.reduce((acc, i) => acc + (i.taxAmount * i.quantity), 0);
            return { ...o, items: newItems, total, profit, taxTotal };
          });
          
          return { activeOrders: newOrders };
        });
      },

      checkoutTable: async (orderId, paymentMethod, customerId) => {
        const series = get().settings.invoiceSeries;
        const count = get().invoiceCounter;
        const invoiceNumber = `FR VER${series}/${count}`;
        const hash = Math.random().toString(36).substring(2, 12).toUpperCase();
        
        set(state => {
          const order = state.activeOrders.find(o => o.id === orderId);
          if (!order) return state;

          const newOrders: Order[] = state.activeOrders.map(o => 
            o.id === orderId ? { ...o, status: 'closed' as const, paymentMethod, customerId, invoiceNumber, hash } : o
          );
          
          const tableId = order.tableId;
          const tableHasMoreOrders = newOrders.some(o => o.tableId === tableId && o.status === 'ABERTO');

          return {
            activeOrders: newOrders,
            tables: tableId ? state.tables.map(t => t.id === tableId && !tableHasMoreOrders ? { ...t, status: 'LIVRE' as const } : t) : state.tables,
            invoiceCounter: count + 1,
            activeTableId: null,
            activeOrderId: null,
            customerDisplayMode: tableId ? { ...state.customerDisplayMode, [tableId]: 'MARKETING' as const } : state.customerDisplayMode
          };
        });

        // Salvar no SQLite local
        const finalOrder = get().activeOrders.find(o => o.id === orderId);
        if (finalOrder && finalOrder.status === 'closed') {
          await localDataService.saveOrder(finalOrder);
          get().addNotification('success', 'Venda registrada localmente');
        }
      },

      // Outras funções existentes (implementações mínimas para compatibilidade)
      transferOrder: (orderId, targetTableId) => {
        set(state => {
          const order = state.activeOrders.find(o => o.id === orderId);
          if (!order) return state;
          
          return {
            activeOrders: state.activeOrders.map(o => o.id === orderId ? { ...o, tableId: targetTableId } : o),
            activeTableId: targetTableId
          };
        });
      },

      updateOrderPaymentMethod: (orderId, newMethod) => {
        set(state => ({
          activeOrders: state.activeOrders.map(o => o.id === orderId ? { ...o, paymentMethod: newMethod } : o)
        }));
      },

      updateTablePosition: (id, x, y) => set(state => ({
        tables: state.tables.map(t => t.id === id ? { ...t, x, y } : t)
      })),

      addTable: (table) => set(state => ({ tables: [...state.tables, table] })),
      updateTable: (table) => set(state => ({ tables: state.tables.map(t => t.id === table.id ? table : t) })),
      removeTable: (id) => {
        const hasActiveOrders = get().activeOrders.some(o => o.tableId === id && o.status === 'ABERTO');
        if (hasActiveOrders) {
          get().addNotification('error', 'Não é possível remover mesa com pedidos ativos.');
          return;
        }
        set(state => ({ tables: state.tables.filter(t => t.id !== id) }));
      },

      closeTable: (id) => set(state => {
        const hasActiveOrders = state.activeOrders.some(o => o.tableId === id && o.status === 'ABERTO');
        return hasActiveOrders ? state : {
          tables: state.tables.map(t => t.id === id ? { ...t, status: 'LIVRE' } : t)
        };
      }),

      updateOrderItemStatus: (orderId, itemIndex, status) => {
        set(state => ({
          activeOrders: state.activeOrders.map(o => 
            o.id === orderId 
              ? { ...o, items: o.items.map((item, idx) => idx === itemIndex ? { ...item, status } : item) }
              : o
          )
        }));
      },

      markOrderAsServed: (orderId) => {
        set(state => ({
          activeOrders: state.activeOrders.map(o => 
            o.id === orderId 
              ? { ...o, items: o.items.map(item => ({ ...item, status: 'SERVIDO' as const })) }
              : o
          )
        }));
      },

      toggleDishVisibility: (id) => set(state => ({
        menu: state.menu.map(d => d.id === id ? { ...d, isVisibleDigital: !d.isVisibleDigital } : d)
      })),

      toggleDishFeatured: (id) => set(state => ({
        menu: state.menu.map(d => d.id === id ? { ...d, isFeatured: !d.isFeatured } : d)
      })),

      toggleCategoryVisibility: (id) => set(state => ({
        categories: state.categories.map(c => c.id === id ? { ...c, isVisibleDigital: !c.isVisibleDigital } : c)
      })),

      addDish: (d) => set(state => ({ menu: [...state.menu, { ...d, isVisibleDigital: true }] })),
      updateDish: (d) => set(state => ({ menu: state.menu.map(x => x.id === d.id ? d : x) })),
      removeDish: (id) => set(state => ({ menu: state.menu.filter(x => x.id !== id) })),
      addCategory: (c) => set(state => ({ categories: [...state.categories, { ...c, isVisibleDigital: true }] })),
      updateCategory: (c) => set(state => ({ categories: state.categories.map(x => x.id === c.id ? c : x) })),
      removeCategory: (id) => set(state => ({ categories: state.categories.filter(x => x.id !== id) })),

      duplicateDish: (id) => {
        const original = get().menu.find(d => d.id === id);
        if (!original) return;

        const newDish: Dish = {
          ...original,
          id: `dish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: `${original.name} (Cópia)`,
        };

        set(state => ({ menu: [...state.menu, newDish] }));
        get().addNotification('success', `Produto "${original.name}" duplicado.`);
      },

      duplicateCategory: (id) => {
        const original = get().categories.find(c => c.id === id);
        if (!original) return;

        const newCatId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const newCategory: MenuCategory = {
          ...original,
          id: newCatId,
          name: `${original.name} (Cópia)`
        };

        const categoryProducts = get().menu.filter(d => d.categoryId === id);
        const newDishes = categoryProducts.map(d => ({
          ...d,
          id: `dish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: `${d.name} (Cópia)`,
          categoryId: newCatId
        }));
        
        set(state => ({ 
          categories: [...state.categories, newCategory],
          menu: [...state.menu, ...newDishes]
        }));

        get().addNotification('success', `Categoria "${original.name}" duplicada.`);
      },

      updateStockQuantity: (id, delta) => set(state => ({
        stock: state.stock.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s)
      })),

      addCustomer: (customer) => set(state => ({ customers: [...state.customers, customer] })),
      updateCustomer: (customer) => set(state => ({ customers: state.customers.map(c => c.id === customer.id ? customer : c) })),
      removeCustomer: (id) => set(state => ({ customers: state.customers.filter(c => c.id !== id) })),
      settleCustomerDebt: (id, amount) => set(state => ({
        customers: state.customers.map(c => c.id === id ? { ...c, balance: Math.max(0, c.balance - amount) } : c)
      })),

      addEmployee: (e) => set(state => ({ employees: [...state.employees, e] })),
      updateEmployee: (e) => set(state => ({ employees: state.employees.map(x => x.id === e.id ? e : x) })),
      removeEmployee: (id) => set(state => ({ employees: state.employees.filter(x => x.id !== id) })),
      
      clockIn: (employeeId) => {
        const record: AttendanceRecord = {
          id: `att-${Date.now()}`,
          employeeId,
          clockIn: new Date(),
          clockOut: undefined,
          breakDuration: 0,
          totalHours: 0,
          notes: ''
        };
        set(state => ({ attendance: [...state.attendance, record] }));
      },

      clockOut: (employeeId) => {
        set(state => ({
          attendance: state.attendance.map(record => 
            record.employeeId === employeeId && !record.clockOut
              ? { ...record, clockOut: new Date(), totalHours: 8 }
              : record
          )
        }));
      },

      externalClockSync: (bioId) => {
        console.log('Clock sync não implementado em modo local');
      },

      addWorkShift: (shift) => set(state => ({ workShifts: [...state.workShifts, shift] })),
      updateWorkShift: (shift) => set(state => ({ workShifts: state.workShifts.map(x => x.id === shift.id ? shift : x) })),
      removeWorkShift: (id) => set(state => ({ workShifts: state.workShifts.filter(x => x.id !== id) })),

      addReservation: (res) => set(state => ({ reservations: [...state.reservations, res] })),

      cancelEmptyTable: (tableId) => {
        const order = get().activeOrders.find(o => o.tableId === tableId && o.status === 'ABERTO');
        if (order && order.items.length === 0) {
          set(state => ({
            activeOrders: state.activeOrders.filter(o => o.id !== order.id),
            tables: state.tables.map(t => t.id === tableId ? { ...t, status: 'LIVRE' } : t)
          }));
          get().addNotification('info', 'Mesa vazia cancelada');
        }
      },

      addSubAccount: (tableId, name) => {
        const newOrder = get().createNewOrder(tableId, name);
        get().addNotification('info', `Sub-conta "${name}" criada`);
      },

      removeSubAccount: (orderId) => {
        const order = get().activeOrders.find(o => o.id === orderId);
        if (order && order.items.length === 0) {
          set(state => ({
            activeOrders: state.activeOrders.filter(o => o.id !== orderId)
          }));
          get().addNotification('info', 'Sub-conta removida');
        }
      },

      transferTable: (fromTableId, toTableId) => {
        const orders = get().activeOrders.filter(o => o.tableId === fromTableId && o.status === 'ABERTO');
        if (orders.length === 0) return;

        set(state => {
          const newOrders = state.activeOrders.map(o => 
            o.tableId === fromTableId ? { ...o, tableId: toTableId } : o
          );
          
          return {
            activeOrders: newOrders,
            tables: state.tables.map(t => {
              if (t.id === toTableId) return { ...t, status: 'OCUPADO' };
              if (t.id === fromTableId) return { ...t, status: 'LIVRE' };
              return t;
            })
          };
        });

        get().addNotification('success', `Mesa transferida com sucesso`);
      },

      addPaymentConfig: (config) => {
        const newConfig: PaymentMethodConfig = {
          ...config,
          id: `pm-${Date.now()}`
        };
        set(state => ({ paymentConfigs: [...state.paymentConfigs, newConfig] }));
      },

      updatePaymentConfig: (id, config) => {
        set(state => ({
          paymentConfigs: state.paymentConfigs.map(x => x.id === id ? { ...x, ...config } : x)
        }));
      },
    }),
    {
      name: 'tasca-vereda-storage',
      storage: customPersistenceStorage,
      version: 9,
    }
  )
);

// Inicializar o serviço local quando a aplicação começar
sqliteService.init().then(() => {
  console.log('[Store] Serviço SQLite inicializado');
}).catch(error => {
  console.error('[Store] Erro ao inicializar SQLite:', error);
});
