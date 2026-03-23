import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Sparkles, Loader2, Activity, Target, ChefHat, MonitorOff, Printer, History, PieChart, Users } from 'lucide-react';
import { sqliteService } from '../lib/sqliteService';
import { printFinanceReport, printThermalInvoice } from '../lib/printService';

const Dashboard = () => {
  const { customers, menu, settings, addNotification, expenses, employees } = useStore();
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Estados para filtros dos cards
  const [vendasTotaisFilter, setVendasTotaisFilter] = useState<'total' | 'mensal' | 'anual'>('total');
  const [impostoFilter, setImpostoFilter] = useState<'total' | 'mensal' | 'anual'>('total');
  const [despesasFilter, setDespesasFilter] = useState<'total' | 'mensal' | 'anual'>('total');

  // Dados do SQLite Local
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);

  // Carregar dados do SQLite
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📊 [DASHBOARD] Iniciando carregamento de dados do SQLite...');
        
        // Buscar ordens e despesas do SQLite
        const orders = await sqliteService.getOrders();
        const expenses = await sqliteService.getExpenses();
        
        console.log('📊 [DASHBOARD] Ordens carregadas:', orders.length);
        console.log('📊 [DASHBOARD] Despesas carregadas:', expenses.length);
        console.log('📊 [DASHBOARD] Taxa atual:', settings.taxRate);
        
        setOrdersData(orders);
        setExpensesData(expenses);
        
        // 🔍 FORÇAR REHIDRATAÇÃO DO STORE
        if (orders.length > 0) {
          console.log('📊 [DASHBOARD] Forçando atualização do store com', orders.length, 'ordens');
          // Disparar evento de atualização para o store
          window.dispatchEvent(new CustomEvent('sqlite-data-updated', { 
            detail: { orders, expenses } 
          }));
        }
      } catch (error) {
        console.error('❌ [DASHBOARD] Erro ao carregar dados do SQLite:', error);
      }
    };
    
    loadData();
    
    // 🔍 ESCUTAR ATUALIZAÇÕES DO SQLITE
    const handleSQLiteUpdate = (event: any) => {
      console.log('📊 [DASHBOARD] Recebendo atualização do SQLite:', event.detail);
      if (event.detail.orders) setOrdersData(event.detail.orders);
      if (event.detail.expenses) setExpensesData(event.detail.expenses);
    };
    
    window.addEventListener('sqlite-data-updated', handleSQLiteUpdate);
    
    return () => {
      window.removeEventListener('sqlite-data-updated', handleSQLiteUpdate);
    };
  }, [settings.taxRate]);

  // Funções de filtro de data
  const getDateRange = (type: 'mensal' | 'anual') => {
    const now = new Date();
    let start: Date, end: Date;

    if (type === 'mensal') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    return { start, end };
  };

  // Filtrar dados por período
  const filterDataByPeriod = (data: any[], type: 'total' | 'mensal' | 'anual', dateField: string = 'created_at') => {
    if (type === 'total') return data;

    const { start, end } = getDateRange(type);
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  };

  // Cálculos dinâmicos baseados nos filtros
  const vendasTotais = useMemo(() => {
    const filteredOrders = filterDataByPeriod(ordersData, vendasTotaisFilter);
    const total = filteredOrders
      .filter(order => ['FECHADO', 'closed', 'paid'].includes(order.status))
      .reduce((acc, order) => acc + (order.total_amount || order.total_price || 0), 0);
    
    console.log('💰 [DASHBOARD] Vendas totais calculadas:', total, 'de', filteredOrders.length, 'ordens');
    return total;
  }, [ordersData, vendasTotaisFilter]);

  const impostoAcumulado = useMemo(() => {
    const taxa = settings.taxRate || 7; // Fallback para 7% se undefined
    const imposto = vendasTotais * (taxa / 100);
    console.log('💰 [DASHBOARD] Imposto calculado:', imposto, 'com taxa de', taxa + '%');
    return imposto;
  }, [vendasTotais, settings.taxRate]);

  const despesasTotais = useMemo(() => {
    const filteredExpenses = filterDataByPeriod(expensesData, despesasFilter);
    const expensesSum = filteredExpenses.reduce((acc, exp) => acc + (exp.amount_kz || exp.amount || 0), 0);
    
    // Adicionar despesas de Staff
    const staffExpenses = employees
      ?.filter((staff: any) => staff.status === 'ATIVO')
      ?.reduce((sum: number, staff: any) => sum + (staff.salary || 0), 0) || 0;
    
    const total = expensesSum + staffExpenses;
    console.log('💰 [DASHBOARD] Despesas totais calculadas:', total, '(', expensesSum, '+', staffExpenses, ')');
    return total;
  }, [expensesData, despesasFilter, employees]);

  // Cálculo do lucro hoje (com taxa dinâmica do banco)
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = ordersData.filter(order => 
    String(order.created_at || '').split('T')[0] === today &&
    ['FECHADO', 'closed', 'paid'].includes(order.status)
  );
  const todayExpenses = expensesData.filter(exp => 
    String(exp.created_at || '').split('T')[0] === today
  );

  const vendasHoje = todayOrders.reduce((acc, order) => acc + (order.total_amount || order.total_price || 0), 0);
  const despesasHoje = todayExpenses.reduce((acc, exp) => acc + (exp.amount_kz || exp.amount || 0), 0);
  
  // 🔍 USAR TAXA DO BANCO DE DADOS (7% se estiver configurado)
  const taxaReal = settings.taxRate || 7;
  const impostoHoje = vendasHoje * (taxaReal / 100);
  const lucroHoje = vendasHoje - despesasHoje - impostoHoje;
  
  console.log('💰 [DASHBOARD] Lucro hoje calculado:', {
    vendas: vendasHoje,
    despesas: despesasHoje,
    taxa: taxaReal + '%',
    imposto: impostoHoje,
    lucro: lucroHoje
  });
  
  const staffHoje = employees
    ?.filter((staff: any) => staff.status === 'ATIVO')
    ?.reduce((sum: number, staff: any) => sum + (staff.salary || 0), 0) || 0;

  // Dados para o gráfico
  const chartData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];

      const dayOrders = ordersData.filter(order => 
        String(order.created_at || '').split('T')[0] === dateStr &&
        ['FECHADO', 'closed', 'paid'].includes(order.status)
      );

      const dayRevenue = dayOrders.reduce((acc, order) => acc + (order.total_amount || 0), 0);

      data.push({
        name: dayName,
        vendas: dayRevenue
      });
    }

    return data;
  }, [ordersData]);

  // Log de vendas recente
  const recentInvoices = useMemo(() => {
    return todayOrders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(order => ({
        ...order,
        invoiceNumber: `INV-${String(order.id || '').slice(-6).toUpperCase()}`,
        tableId: order.table_id || 'N/A',
        total: order.total_amount || 0,
        profit: (order.total_amount || 0) * 0.3 // Lucro estimado de 30%
      }));
  }, [todayOrders]);

  const handleAIAnalysis = async () => {
    setLoadingAi(true);
    try {
      // Simulação de análise IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAiAnalysis({
        insights: ['Vendas em alta', 'Stock otimizado', 'Equipe eficiente'],
        recommendations: ['Manter estratégia atual', 'Investir em marketing', 'Expandir horário'],
        riskLevel: 'low'
      });
      addNotification('success', 'Análise tática concluída com sucesso!');
    } catch (error) {
      addNotification('error', 'Erro na análise tática');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleExportTodayReport = () => {
    const todayMetrics = {
      orders: todayOrders,
      revenue: vendasHoje,
      expenses: despesasHoje + staffHoje,
      profit: lucroHoje
    };
    printFinanceReport('Relatório de Vendas de Hoje', todayMetrics.orders, ['id', 'total', 'timestamp'], settings);
    addNotification('success', 'Relatório exportado com sucesso.');
  };

  const handleReprint = (order: any) => {
    const customer = customers.find(c => c.id === order.customerId);
    printThermalInvoice(order, menu, settings, customer);
  };

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { 
      style: 'currency', 
      currency: 'AOA', 
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(val);
  };

  // Componente de Card com botões de filtro
  const FilterableCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'slate',
    filter, 
    onFilterChange,
    subtitle,
    showFilters = true 
  }: {
    title: string;
    value: number;
    icon: any;
    color?: string;
    filter: 'total' | 'mensal' | 'anual';
    onFilterChange: (filter: 'total' | 'mensal' | 'anual') => void;
    subtitle?: string;
    showFilters?: boolean;
  }) => (
    <div className={`glass-panel p-6 rounded-2xl relative overflow-hidden group border-${color}/20 bg-${color}/5`}>
      <div className={`absolute top-0 right-0 p-4 text-${color} opacity-10 group-hover:opacity-20 transition-opacity`}>
        <Icon size={64} />
      </div>
      <div className={`flex items-center gap-2 mb-4 text-${color === 'primary' ? 'primary' : 'slate-400'} text-[10px] font-black uppercase tracking-[0.2em]`}>
        {title}
      </div>
      <p className="text-2xl font-mono font-bold text-white text-glow">{formatKz(value)}</p>
      {subtitle && (
        <div className="mt-2 text-[10px] text-slate-500 font-bold">
          {subtitle}
        </div>
      )}
      {showFilters && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onFilterChange('total')}
            className={`px-3 py-1 text-[8px] font-bold uppercase rounded transition-all ${
              filter === 'total' 
                ? 'bg-primary text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => onFilterChange('mensal')}
            className={`px-3 py-1 text-[8px] font-bold uppercase rounded transition-all ${
              filter === 'mensal' 
                ? 'bg-primary text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => onFilterChange('anual')}
            className={`px-3 py-1 text-[8px] font-bold uppercase rounded transition-all ${
              filter === 'anual' 
                ? 'bg-primary text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Anual
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 h-full overflow-y-auto no-scrollbar bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800/40 via-background to-background">
      
      <header className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
             <Activity size={16} className="animate-pulse"/>
             <span className="text-xs font-mono font-bold tracking-widest uppercase">REST IA OS v1.0.5</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Painel de Comando</h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportTodayReport}
            className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <Printer size={16} /> Exportar Hoje
          </button>
          <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${(settings as any).kdsEnabled ? 'bg-primary/10 border-primary text-primary shadow-glow' : 'bg-orange-500/10 border-orange-500 text-orange-500'}`}>
             {(settings as any).kdsEnabled ? <ChefHat size={18} /> : <MonitorOff size={18} />}
             <span className="text-[10px] font-black uppercase tracking-widest">Cozinha: {(settings as any).kdsEnabled ? 'Digital' : 'Manual'}</span>
          </div>
          <button 
            onClick={handleAIAnalysis}
            disabled={loadingAi}
            className="relative group overflow-hidden px-6 py-2.5 rounded-lg bg-primary/10 border border-primary/50 text-primary hover:bg-primary hover:text-white transition-all duration-300"
          >
            <div className="flex items-center gap-2 relative z-10 font-medium">
              {loadingAi ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} />}
              <span>Análise Tática (IA)</span>
            </div>
            <div className="absolute inset-0 bg-primary/20 blur-lg group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* PRIMEIRA LINHA - CARDS ORIGINAIS */}
        
        {/* Card 1: Faturação Hoje */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <DollarSign size={64} />
          </div>
          <div className="flex items-center gap-2 mb-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            Faturação Hoje
          </div>
          <p className="text-2xl font-mono font-bold text-white">{formatKz(vendasHoje)}</p>
          <div className="mt-2 text-[10px] text-slate-500 font-bold">
             {todayOrders.length} Faturas Emitidas
          </div>
        </div>

        {/* Card 2: Despesas Hoje */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <ShoppingBag size={64} />
          </div>
          <div className="flex items-center gap-2 mb-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            Despesas Hoje
          </div>
          <p className="text-2xl font-mono font-bold text-white">{formatKz(despesasHoje)}</p>
          <div className="mt-2 text-[10px] text-orange-500 font-bold">
             {todayExpenses.length} Registros
          </div>
        </div>

        {/* Card 3: Custos Staff */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Users size={64} />
          </div>
          <div className="flex items-center gap-2 mb-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            Custos Staff
          </div>
          <p className="text-2xl font-mono font-bold text-white">{formatKz(staffHoje)}</p>
          <div className="mt-2 text-[10px] text-blue-500 font-bold">
             {employees.length} Funcionários
          </div>
        </div>

        {/* Card 4: Lucro Operacional */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Target size={64} />
          </div>
          <div className="flex items-center gap-2 mb-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            Lucro Operacional
          </div>
          <p className="text-2xl font-mono font-bold text-white text-glow">
            {formatKz(vendasHoje - despesasHoje - staffHoje)}
          </p>
          <div className="mt-2 text-[10px] text-emerald-500 font-bold">
             Vendas - (Despesas + Staff)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* SEGUNDA LINHA - CARDS NOVOS */}
        
        {/* Card 5: Vendas Totais */}
        <FilterableCard
          title="Vendas Totais"
          value={vendasTotais}
          icon={DollarSign}
          color="emerald"
          filter={vendasTotaisFilter}
          onFilterChange={setVendasTotaisFilter}
          subtitle={`${filterDataByPeriod(ordersData, vendasTotaisFilter).filter(o => ['FECHADO', 'closed', 'paid'].includes(o.status)).length} Vendas`}
        />

        {/* Card 6: Imposto Acumulado */}
        <FilterableCard
          title={`Imposto (${settings.taxRate}%)`}
          value={impostoAcumulado}
          icon={TrendingUp}
          color="orange"
          filter={impostoFilter}
          onFilterChange={setImpostoFilter}
          subtitle={`${settings.taxRate}% das vendas`}
        />

        {/* Card 7: Despesas Totais */}
        <FilterableCard
          title="Despesas Totais"
          value={despesasTotais}
          icon={ShoppingBag}
          color="red"
          filter={despesasFilter}
          onFilterChange={setDespesasFilter}
          subtitle={`${expenses.length + employees.length} Registros`}
        />

        {/* Card 8: Lucro Real (Hoje) */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group border-primary/20 bg-primary/5">
          <div className="absolute top-0 right-0 p-4 text-primary opacity-10 group-hover:opacity-20 transition-opacity">
             <PieChart size={64} />
          </div>
          <div className="flex items-center gap-2 mb-4 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            Lucro Real (Hoje)
          </div>
          <p className="text-2xl font-mono font-bold text-white text-glow">{formatKz(lucroHoje)}</p>
          <div className="mt-2 text-[10px] text-primary/80 font-bold">
             Margem: {vendasHoje > 0 ? ((lucroHoje / vendasHoje) * 100).toFixed(1) : '0'}%
          </div>
          <div className="mt-2 text-[8px] text-slate-500">
             Imposto ({settings.taxRate}%): {formatKz(impostoHoje)}
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target size={18} className="text-primary" />
                  Fluxo de Receita Semanal
              </h3>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    cursor={{stroke: '#06b6d4', strokeWidth: 1}}
                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px'}}
                    formatter={(value: number) => [`${formatKz(value)}`, 'Vendas']}
                  />
                  <Area type="monotone" dataKey="vendas" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <History size={18} className="text-primary" />
                   Log de Vendas Ativo
                </h3>
             </div>
             <div className="space-y-3">
                {recentInvoices.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group">
                     <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{order.invoiceNumber}</p>
                        <p className="text-sm font-bold text-white">Mesa {order.tableId} • {formatKz(order.total)}</p>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="text-right mr-2">
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Lucro</p>
                            <p className="text-xs font-mono font-bold text-white">+{formatKz(order.profit)}</p>
                        </div>
                        <button 
                          onClick={() => handleReprint(order)}
                          className="p-3 bg-white/10 text-white rounded-xl hover:bg-primary hover:text-black transition-all"
                        >
                            <Printer size={18} />
                        </button>
                     </div>
                  </div>
                ))}
                {recentInvoices.length === 0 && <p className="text-center text-slate-500 py-4 text-xs italic uppercase">Nenhuma fatura emitida hoje.</p>}
             </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-primary/30 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-6 text-primary">
             <Sparkles size={18} />
             <h3 className="text-lg font-bold">Análise Tática IA</h3>
          </div>
          
          {aiAnalysis ? (
            <div className="space-y-4 flex-1">
              <div>
                <h4 className="text-sm font-bold text-primary mb-2">Insights Detetados</h4>
                <ul className="space-y-1">
                  {aiAnalysis?.insights?.map((insight: any, index: number) => (
                    <li key={index} className="text-xs text-slate-300 flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-emerald-500 mb-2">Recomendações</h4>
                <ul className="space-y-1">
                  {aiAnalysis?.recommendations?.map((rec: any, index: number) => (
                    <li key={index} className="text-xs text-slate-300 flex items-center gap-2">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <button 
                onClick={handleAIAnalysis}
                disabled={loadingAi}
                className="w-full py-8 bg-primary/10 border border-primary/30 rounded-2xl hover:bg-primary/20 transition-all group"
              >
                <div className="flex flex-col items-center gap-3">
                  {loadingAi ? <Loader2 className="animate-spin text-primary" size={32} /> : <Sparkles className="text-primary group-hover:scale-110 transition-transform" size={32} />}
                  <span className="text-primary font-bold">{loadingAi ? 'Analisando...' : 'Iniciar Análise Tática'}</span>
                  <span className="text-xs text-slate-400">IA irá analisar padrões de vendas</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
