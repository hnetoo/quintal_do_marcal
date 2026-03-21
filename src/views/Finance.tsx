import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  TrendingUp, DollarSign, Banknote, LayoutDashboard, History, PiggyBank,
  Printer, ShieldCheck, FileText, Lock, Database, Search, Download, 
  ArrowUpRight, PieChart, BarChart as BarChartIcon, Activity, Loader2,
  CreditCard, ArrowRightLeft, QrCode, Plus, Trash2, Edit2, Check
} from 'lucide-react';
import { printThermalInvoice, printFinanceReport } from '../lib/printService';
import { generateSAFT, downloadSAFT } from '../lib/saftService';
import { PaymentMethodConfig, Order, Expense, ExpenseCategory, ExpenseStatus } from '../../types';

const formatKz = (val: number | undefined | null) => {
  const safeVal = val?.toString()?.replace(/[^\d.-]/g, '') || "0";
  const numVal = parseFloat(safeVal) || 0;
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(numVal);
};

const Finance = () => {
  const { activeOrders, settings, menu, customers, addNotification, paymentConfigs, addPaymentConfig, updatePaymentConfig, expenses, addExpense, updateExpense, removeExpense, approveExpense } = useStore();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SALES' | 'AUDIT' | 'LEGAL' | 'CONFIG' | 'EXPENSES'>('OVERVIEW');
  const [saftLoading, setSaftLoading] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState<Omit<PaymentMethodConfig, 'id'>>({
    name: '',
    type: 'NUMERARIO',
    icon: 'Banknote',
    isActive: true
  });
  
  // Estados para despesas - MODO OFFLINE
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>({
    description: '',
    amount: 0,
    category: 'OUTROS' as ExpenseCategory,
    status: 'PENDENTE',
    date: new Date().toISOString().split('T')[0]
  });

  // Cálculos financeiros - MODO OFFLINE
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'PENDENTE').reduce((sum, expense) => sum + expense.amount, 0);
  const approvedExpenses = expenses.filter(e => e.status === 'APROVADO').reduce((sum, expense) => sum + expense.amount, 0);

  // Função para imprimir relatório de vendas
  const handlePrintSale = (paymentMethod: string, total: number) => {
    const title = `Relatório de Vendas - ${paymentMethod}`;
    const data = [[paymentMethod, new Date().toLocaleDateString('pt-AO'), formatKz(total), formatKz(total * 0.065)]];
    const columns = ['Método', 'Data', 'Bruto', 'IVA'];
    printFinanceReport(title, data, columns, settings);
  };
  const closedOrders = useMemo(() => activeOrders.filter(o => ['FECHADO', 'closed', 'paid'].includes(o.status)), [activeOrders]);
  const today = new Date().toISOString().split('T')[0];

  // Calcular métricas em tempo real (sem useMemo para debug)
  const calculateMetrics = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // DEBUG: Mostrar data e dados brutos
    console.log('[FINANCE] DEBUG - Data de hoje:', today);
    console.log('[FINANCE] DEBUG - ActiveOrders totais:', activeOrders.length);
    console.log('[FINANCE] DEBUG - ClosedOrders:', closedOrders.length);
    console.log('[FINANCE] DEBUG - Expenses totais:', expenses.length);
    
    // DEBUG: Mostrar pedidos com suas datas
    const todayOrdersDebug = closedOrders.filter(o => {
      const orderDate = String(o.timestamp || '').split('T')[0];
      console.log('[FINANCE] DEBUG - Pedido:', {
        id: o.id,
        status: o.status,
        timestamp: o.timestamp,
        date: orderDate,
        total: o.total
      });
      return orderDate === today;
    });
    
    const gross = closedOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const tax = closedOrders.reduce((acc, o) => acc + (o.taxTotal || 0), 0);
    const profit = closedOrders.reduce((acc, o) => acc + (o.profit || 0), 0);
    
    // VENDAS DE HOJE - mesmo filtro do Dashboard
    const todayOrders = todayOrdersDebug;
    const todayGross = todayOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const todayProfit = todayOrders.reduce((acc, o) => acc + (o.profit || 0), 0);
    
    // DEBUG: Mostrar despesas com suas datas
    const todayExpensesDebug = expenses.filter(expense => {
      const expenseDate = String(expense.date || expense.createdAt || '').split('T')[0];
      console.log('[FINANCE] DEBUG - Despesa:', {
        id: expense.id,
        date: expense.date,
        createdAt: expense.createdAt,
        computedDate: expenseDate,
        amount: expense.amount
      });
      return expenseDate === today;
    });
    
    const todayExpenses = todayExpensesDebug;
    const todayExpensesTotal = todayExpenses.reduce((acc, exp) => acc + Number(exp.amount || 0), 0);
    
    // LUCRO LÍQUIDO REAL DE HOJE
    const todayNetProfit = todayGross - todayExpensesTotal;
    
    console.log('[FINANCE] DEBUG - Cálculos finais:', {
      todayOrders: todayOrders.length,
      todayGross,
      todayExpenses: todayExpenses.length,
      todayExpensesTotal,
      todayNetProfit
    });
    
    // Agrupar pagamentos por método - APENAS DE HOJE com mapeamento correto
    const payments = todayOrders.reduce((acc: any, o) => {
      let methodId = o.paymentMethod || 'OUTRO';
      
      // GARANTIR QUE methodId NUNCA SEJA NULL
      if (!methodId || methodId === 'null' || methodId === null) {
        methodId = 'OUTRO';
      }
      
      // DEBUG: Mostrar método original e mapeado
      console.log('[FINANCE] Método Original:', o.paymentMethod, '→ Método Mapeado:', methodId);
      
      // MAPEAR MÉTODOS DE PAGAMENTO CORRETAMENTE
      switch (String(methodId).toLowerCase()) {
        case 'cash':
        case 'numerário':
        case 'numerario':
          methodId = 'Numerário';
          break;
        case 'card':
        case 'tpa':
        case 'multicaixa':
        case 'pos':
        case 'debit':
        case 'credit':
          methodId = 'TPA/Multicaixa';
          break;
        case 'transfer':
        case 'transferência':
        case 'transferencia':
        case 'bank':
          methodId = 'Transferência';
          break;
        case 'mpesa':
        case 'm-pesa':
          methodId = 'M-Pesa';
          break;
        case 'express':
        case 'expresso':
        case 'qr_code':
        case 'qr-code':
          methodId = 'Express';
          break;
        default:
          methodId = 'OUTRO';
      }
      
      console.log('[FINANCE] Método Final:', methodId, 'Valor:', o.total);
      acc[methodId] = (acc[methodId] || 0) + (o.total || 0);
      return acc;
    }, {});
    
    // DEBUG: Mostrar valores calculados
    console.log('[FINANCE] Cálculos de Hoje:', {
      today,
      totalOrders: closedOrders.length,
      todayOrders: todayOrders.length,
      todayGross,
      todayExpenses: todayExpenses.length,
      todayExpensesTotal,
      todayNetProfit,
      paymentConfigs: paymentConfigs.filter(c => c.isActive).length,
      payments: Object.keys(payments)
    });

    return { gross, tax, profit, todayGross, todayProfit, todayNetProfit, todayExpensesTotal, payments };
  };

  const metrics = calculateMetrics();

  const handleExportSAFT = async () => {
    setSaftLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const xml = generateSAFT(activeOrders, customers, menu, settings, { month: new Date().getMonth(), year: new Date().getFullYear() });
      downloadSAFT(xml, `SAFT_AO_${settings.nif}.xml`);
      addNotification('success', 'SAF-T AO Gerado com Sucesso.');
    } finally {
      setSaftLoading(false);
    }
  };

  const handleExportFinanceReport = () => {
    if (closedOrders.length === 0) {
      addNotification('warning', 'Nenhuma venda para exportar.');
      return;
    }
    
    const title = 'Relatório Financeiro Geral';
    const columns = ['Documento', 'Data', 'Total (Kz)', 'IVA (Kz)', 'Método'];
    const data = closedOrders.map(o => [
      o.invoiceNumber,
      new Date(o.timestamp).toLocaleString('pt-AO'),
      formatKz(o.total),
      formatKz(o.taxTotal),
      o.paymentMethod || 'N/A'
    ]);

    printFinanceReport(title, data, columns, settings);
    addNotification('success', 'Relatório exportado com sucesso.');
  };

  // Funções para despesas - MODO OFFLINE
  const handleAddExpense = async () => {
    if (!newExpense.description || newExpense.amount <= 0) {
      addNotification('error', 'Preencha todos os campos obrigatórios.');
      return;
    }
    
    if (isSubmitting) {
      console.log('[FINANCE] Bloqueado: Já existe uma operação em andamento');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Criar despesa local
      const expense: Omit<Expense, 'id'> = {
        description: newExpense.description,
        amount: newExpense.amount,
        category: newExpense.category,
        status: 'PENDENTE',
        date: newExpense.date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Adicionar ao store local
      addExpense(expense);
      
      console.log('[FINANCE] Despesa adicionada com sucesso (offline):', expense);
      addNotification('success', 'Despesa adicionada com sucesso!');
      
      // Limpar formulário
      setNewExpense({
        description: '',
        amount: 0,
        category: 'OUTROS' as ExpenseCategory,
        status: 'PENDENTE',
        date: new Date().toISOString().split('T')[0]
      });
      setIsAddingExpense(false);
    } catch (error) {
      console.error('[FINANCE] Erro ao adicionar despesa:', error);
      addNotification('error', 'Falha ao adicionar despesa');
    } finally {
      setIsSubmitting(false);
    }
  };
      
      const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      status: expense.status,
      date: expense.date || new Date().toISOString().split('T')[0]
    });
  };

  const handleUpdateExpense = () => {
    if (!editingExpense || !newExpense.description || newExpense.amount <= 0) {
      addNotification('error', 'Preencha todos os campos obrigatórios.');
      return;
    }
    
    updateExpense(editingExpense.id, {
      ...newExpense,
      updatedAt: new Date()
    });
    setEditingExpense(null);
    setNewExpense({
      description: '',
      amount: 0,
      category: 'OUTROS',
      status: 'PENDENTE',
      date: new Date().toISOString().split('T')[0]
      // REMOVIDO: paymentMethod, createdAt, receipt, notes (NÃO EXISTEM NA TABELA)
    });
    addNotification('success', 'Despesa atualizada com sucesso.');
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Tem certeza que deseja apagar esta despesa?')) {
      removeExpense(id);
      addNotification('success', 'Despesa removida com sucesso.');
    }
  };

  const handleApproveExpense = (expense: Expense) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    approveExpense(expense.id, currentUser.name || 'Sistema');
    addNotification('success', 'Despesa aprovada com sucesso.');
  };

  const getCategoryColor = (category: ExpenseCategory) => {
    switch (category) {
      case 'ALIMENTACAO': return 'text-orange-500';
      case 'BEBIDAS': return 'text-blue-500';
      case 'MATERIAL_LIMPEZA': return 'text-green-500';
      case 'UTILIDADES': return 'text-yellow-500';
      case 'REPARACOES': return 'text-red-500';
      case 'MARKETING': return 'text-purple-500';
      default: return 'text-slate-500';
    }
  };

  const getStatusColor = (status: ExpenseStatus) => {
    switch (status) {
      case 'PENDENTE': return 'text-yellow-500';
      case 'APROVADO': return 'text-blue-500';
      case 'PAGO': return 'text-green-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 h-full overflow-y-auto no-scrollbar bg-background">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
             <PiggyBank size={18} className="animate-pulse" />
             <span className="text-xs font-mono font-bold tracking-[0.3em] uppercase">Módulo de Integridade Financeira</span>
          </div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Finanças & Legal</h2>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleExportFinanceReport}
            className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <Download size={16} /> Exportar Relatório
          </button>
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
             {[
               { id: 'OVERVIEW', label: 'Rendimento', icon: LayoutDashboard },
               { id: 'SALES', label: 'Vendas', icon: History },
               { id: 'CONFIG', label: 'Pagamentos', icon: Banknote },
               { id: 'EXPENSES', label: 'Despesas', icon: DollarSign },
               { id: 'AUDIT', label: 'Auditoria AGT', icon: FileText },
               { id: 'LEGAL', label: 'Certificação', icon: ShieldCheck }
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap
                   ${activeTab === tab.id ? 'bg-primary text-black shadow-glow' : 'text-slate-500 hover:text-slate-300'}
                 `}
               >
                 <tab.icon size={16} /> {tab.label}
               </button>
             ))}
          </div>
        </div>
      </header>

      <div className="animate-in fade-in duration-500">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-10 rounded-[3rem] border border-primary/40 bg-primary/5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 text-primary opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={80}/></div>
                   <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">Lucro Líquido Real (Hoje)</p>
                        <h3 className="text-5xl font-mono font-bold text-white text-glow mb-4">{formatKz(metrics.todayNetProfit)}</h3>
                        <div className="flex items-center gap-6 mt-6">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-500 uppercase">Faturação Bruta</span>
                                <span className="text-lg font-mono font-bold text-white">{formatKz(metrics.todayGross)}</span>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-500 uppercase">Despesas Hoje</span>
                                <span className="text-lg font-mono font-bold text-red-500">{formatKz(metrics.todayExpensesTotal)}</span>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-500 uppercase">Lucro Líquido</span>
                                <span className="text-lg font-mono font-bold text-emerald-500">{formatKz(metrics.todayNetProfit)}</span>
                            </div>
                        </div>
                   </div>
                </div>
                <div className="glass-panel p-10 rounded-[3rem] border border-white/5 flex flex-col justify-center">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><PieChart size={16}/> Fluxo por Modalidade</h4>
                   <div className="space-y-4">
                      {paymentConfigs.filter(c => c.isActive).map((config) => {
                        // Buscar valor pelo nome do método de pagamento
                        const paymentValue = metrics.payments[config.name] || 0;
                        return (
                          <div key={config.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                             <div className="flex items-center gap-3">
                                <span className="text-primary"><Banknote size={16}/></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase">{config.name}</span>
                             </div>
                             <span className="text-sm font-mono font-bold text-white">{formatKz(paymentValue)}</span>
                          </div>
                        );
                      })}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'SALES' && (
          <div className="glass-panel rounded-[3rem] border border-white/5 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5">
                   <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="px-8 py-6">Documento</th>
                      <th className="px-8 py-6">Data</th>
                      <th className="px-8 py-6">Bruto</th>
                      <th className="px-8 py-6">IVA</th>
                      <th className="px-8 py-6 text-right">Ação</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {paymentConfigs.filter(c => c.isActive).length > 0 ? (
                      paymentConfigs.filter(c => c.isActive).map((config) => {
                        const total = metrics.payments[config.name] || 0;
                        return (
                          <tr key={config.id} className="hover:bg-white/5 transition-colors">
                             <td className="px-8 py-6 font-bold text-white text-xs">{config.name}</td>
                             <td className="px-8 py-6 text-xs text-slate-500 font-mono">{new Date().toLocaleDateString('pt-AO')}</td>
                             <td className="px-8 py-6 font-mono font-bold text-white">{formatKz(total)}</td>
                             <td className="px-8 py-6 font-mono text-orange-500">{formatKz(total * 0.065)}</td>
                             <td className="px-8 py-6 text-right">
                                <button 
                                  onClick={() => handlePrintSale(config.name, total)}
                                  className="p-3 bg-white/5 text-slate-400 hover:text-primary rounded-xl transition-all"
                                  title="Imprimir recibo"
                                >
                                   <Printer size={18}/>
                                </button>
                             </td>
                          </tr>
                        );
                      })
                   ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-500">
                           Nenhuma venda registrada hoje
                        </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'CONFIG' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Modos de Pagamento</h3>
                <button 
                  onClick={() => setIsAddingPayment(true)}
                  className="px-6 py-3 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-widest shadow-glow flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Plus size={16} /> Novo Modo
                </button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentConfigs.map((config) => (
                  <div key={config.id} className={`glass-panel p-6 rounded-3xl border ${config.isActive ? 'border-white/10' : 'border-red-500/20 opacity-60'} flex flex-col gap-6`}>
                     <div className="flex justify-between items-start">
                        <div className="p-4 bg-white/5 rounded-2xl text-primary">
                           <Banknote size={24} />
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => updatePaymentConfig(config.id, { isActive: !config.isActive })}
                             className={`p-2 rounded-lg border transition-all ${config.isActive ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-black' : 'border-slate-500/30 text-slate-500 hover:bg-slate-500 hover:text-white'}`}
                           >
                              <Check size={16} />
                           </button>
                        </div>
                     </div>
                     <div>
                        <h4 className="text-white font-bold uppercase tracking-tighter">{config.name}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase mt-1">{config.type}</p>
                     </div>
                  </div>
                ))}
             </div>

             {isAddingPayment && (
               <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
                  <div className="max-w-md w-full glass-panel p-10 rounded-[3rem] border border-white/10">
                     <h3 className="text-2xl font-black text-white italic uppercase mb-8">Novo Modo de Pagamento</h3>
                     <div className="space-y-6">
                        <div>
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nome do Modo</label>
                           <input 
                             type="text"
                             className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary"
                             placeholder="Ex: Multicaixa, Express, etc"
                             value={newPayment.name}
                             onChange={e => setNewPayment({...newPayment, name: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Tipo Base</label>
                           <select 
                             className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary"
                             value={newPayment.type}
                             onChange={e => setNewPayment({...newPayment, type: e.target.value as any})}
                           >
                              <option value="NUMERARIO">Numerário</option>
                              <option value="TPA">TPA / Cartão</option>
                              <option value="TRANSFERENCIA">Transferência</option>
                              <option value="QR_CODE">QR Code / Referência</option>
                              <option value="PAGAR_DEPOIS">Conta Corrente / Pagar Depois</option>
                           </select>
                        </div>
                        <div className="flex gap-4 pt-4">
                           <button 
                             onClick={() => setIsAddingPayment(false)}
                             className="flex-1 py-4 bg-white/5 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all"
                           >
                             Cancelar
                           </button>
                           <button 
                             onClick={() => {
                               if (newPayment.name) {
                                 addPaymentConfig(newPayment);
                                 setIsAddingPayment(false);
                                 setNewPayment({ name: '', type: 'NUMERARIO', icon: 'Banknote', isActive: true });
                                 addNotification('success', 'Modo de pagamento adicionado.');
                               }
                             }}
                             className="flex-1 py-4 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-glow"
                           >
                             Salvar
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'EXPENSES' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Gestão de Despesas</h3>
              <button 
                onClick={() => setIsAddingExpense(true)}
                className="px-6 py-3 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-widest shadow-glow flex items-center gap-2 hover:scale-105 transition-all"
              >
                <Plus size={16} /> Nova Despesa
              </button>
            </div>

            {/* Lista de Despesas */}
            <div className="glass-panel rounded-[3rem] border border-white/5 overflow-hidden">
              {/* Total de Despesas - Card em Destaque */}
              <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Total de Despesas</h3>
                      <p className="text-sm text-red-300">Soma de todas as despesas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white">
                      {formatKz(totalExpenses)}
                    </div>
                    <p className="text-xs text-red-300 uppercase tracking-wider">
                      {expenses.length} despesas
                    </p>
                  </div>
                </div>
              </div>
              
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {expenses.slice(-20).map(expense => (
                    <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-white text-sm">{expense.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[8px] font-black uppercase ${getCategoryColor(expense.category)}`}>
                          {expense.category?.replace('_', ' ') || 'OUTROS'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white">{formatKz(expense.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[8px] font-black uppercase ${getStatusColor(expense.status)}`}>
                          {expense.status?.replace('_', ' ') || 'PENDENTE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {new Date(expense.date || expense.createdAt || new Date()).toLocaleDateString('pt-AO')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleEditExpense(expense)}
                            className="p-2 bg-white/5 text-slate-400 hover:text-primary rounded-lg transition-all"
                            title="Editar despesa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-2 bg-white/5 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                            title="Apagar despesa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'AUDIT' && (
          <div className="max-w-4xl mx-auto space-y-8">
             <div className="glass-panel p-10 rounded-[3rem] border border-primary/20 bg-primary/5 text-center">
                <ShieldCheck size={64} className="text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Exportação SAF-T AO</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 max-w-xl mx-auto">Gere o ficheiro oficial de auditoria tributária conforme a Versão 1.01 da AGT Angola. Este ficheiro contém todos os registos de faturas e clientes do período atual.</p>
                <div className="flex justify-center gap-4">
                   <button onClick={handleExportSAFT} disabled={saftLoading} className="px-10 py-5 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow flex items-center gap-3">
                      {saftLoading ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
                      Exportar SAF-T do Mês
                   </button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'LEGAL' && (
          <div className="glass-panel p-12 rounded-[4rem] border-white/5 bg-white text-slate-900 shadow-2xl">
             <div className="text-center mb-12">
                <h1 className="text-3xl font-black uppercase mb-2">CERTIFICAÇÃO REST IA OS</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Dossier Técnico de Conformidade Legal</p>
                <div className="w-24 h-1 bg-primary mx-auto mt-6"></div>
             </div>
             <section className="space-y-8 text-sm">
                <div>
                   <h4 className="font-black uppercase mb-4 border-b border-slate-200 pb-2">Arquitetura de Segurança</h4>
                   <p className="leading-relaxed">O sistema utiliza o algoritmo SHA-256 para geração de Hash Chaining em cada fatura, garantindo a imutabilidade dos dados. Processado por software validado pela AGT sob o certificado: <span className="font-mono font-bold">{settings.agtCertificate}</span>.</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="p-5 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Série Autorizada</p>
                      <p className="font-bold">{settings.invoiceSeries}</p>
                   </div>
                   <div className="p-5 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Regime de IVA</p>
                      <p className="font-bold">Taxa Normal (14%)</p>
                   </div>
                </div>
             </section>
          </div>
        )}
      </div>

      {/* Modal para Adicionar/Editar Despesa */}
      {(isAddingExpense || editingExpense) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel p-8 rounded-[3rem] border border-white/10">
            <h3 className="text-2xl font-black text-white italic uppercase mb-8">
              {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Descrição</label>
                <input 
                  type="text"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary"
                  placeholder="Ex: Compra de material de limpeza"
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Categoria</label>
                <input 
                  type="text"
                  className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary"
                  placeholder="Ex: REPARACOES, ALIMENTACAO, etc."
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Valor (Kz)</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                />
              </div>
              {/* REMOVIDO: Campo paymentMethod (NÃO EXISTE NA TABELA) */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Data</label>
                <input 
                  type="date"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary"
                  value={newExpense.date || new Date().toISOString().split('T')[0]}
                  onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
              {/* REMOVIDO: Campos receipt e notes (NÃO EXISTEM NA TABELA) */}
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => {
                    setIsAddingExpense(false);
                    setEditingExpense(null);
                    setNewExpense({
                      description: '',
                      amount: 0,
                      category: 'OUTROS', // CATEGORIA VÁLIDA
                      status: 'PENDENTE',
                      date: new Date().toISOString().split('T')[0]
                      // REMOVIDO: paymentMethod, receipt, notes (NÃO EXISTEM NA TABELA)
                    });
                  }}
                  className="flex-1 py-4 bg-white/5 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                  disabled={isSubmitting}
                  className={`flex-1 py-4 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all ${
                    isSubmitting
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                      : 'bg-primary text-black hover:brightness-110'
                  }`}
                >
                  {(isSubmitting) ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      A guardar...
                    </span>
                  ) : (
                    editingExpense ? 'Atualizar' : 'Adicionar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;




