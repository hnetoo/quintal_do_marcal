import React, { useState, useMemo, useEffect } from 'react';

import { useStore } from '../store/useStore';

import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

import { DollarSign, ShoppingBag, TrendingUp, Sparkles, Loader2, Activity, Target, ChefHat, MonitorOff, Printer, History, PieChart, Users } from 'lucide-react';

import { sqliteService } from '../lib/sqliteService';

import { printFinanceReport, printThermalInvoice } from '../lib/printService';

import { supabase } from '../lib/supabase';

import jsPDF from 'jspdf';

import html2canvas from 'html2canvas';



const Dashboard = () => {

  const { customers, menu, settings, addNotification, expenses, employees, activeOrders } = useStore();

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const [loadingAi, setLoadingAi] = useState(false);



  // Estados para filtros dos cards

  const [vendasTotaisFilter, setVendasTotaisFilter] = useState<'total' | 'mensal' | 'anual'>('total');

  const [impostoFilter, setImpostoFilter] = useState<'total' | 'mensal' | 'anual'>('total');

  const [despesasFilter, setDespesasFilter] = useState<'total' | 'mensal' | 'anual'>('total');



  // 🔥 DEFINIR VARIÁVEIS DE ESTADO PARA BLINDAGEM

  const [liquidezStatus, setLiquidezStatus] = useState<'seguro' | 'risco'>('seguro');

  const [reservaFiscal, setReservaFiscal] = useState(0);

  const [caixaDisponivel, setCaixaDisponivel] = useState(0);

  const [impostoIndustrial, setImpostoIndustrial] = useState(0);

  

  // 🔥 ESTADO CENTRAL ÚNICO - FONTE DE VERDADE

  const [dashboardData, setDashboardData] = useState({

    vendasHoje: 0,

    despesasHoje: 0,

    impostoHoje: 0,

    lucroHoje: 0,

    taxaReal: 6.5,

    todayOrders: [] as any[],

    todayExpenses: [] as any[],

    vendasPorModalidade: {} as Record<string, number>,

    vendasTotais: 0,

    despesasTotais: 0,

    chartData: [] as any[]

  });

  

  // 🔥 CARREGAR DADOS DO STORE UMA ÚNICA VEZ (COMO O FINANCEIRO)
  useEffect(() => {
    const loadDashboardData = () => {
      try {
        console.log('📊 [DASHBOARD] Carregando dados do STORE (como Financeiro)...');
        
        // 🔥 USAR activeOrders DO STORE (NÃO SQLITE)
        const today = new Date().toISOString().split('T')[0];
        
        // 🔥 FILTRAR COMO O FINANCEIRO: activeOrders do store
        const closedOrders = activeOrders.filter(o => ['FECHADO', 'closed', 'paid'].includes(o.status));
        
        const todayOrders = closedOrders.filter(order => {
          // 🔥 FILTRO DE DATA CORRETO: Usar timestamp como no Financeiro
          const orderDate = String(order.timestamp || '').split('T')[0];
          console.log('🔍 [DASHBOARD] Pedido - Data:', orderDate, 'Hoje:', today, 'Status:', order.status, 'Total:', order.total);
          return ['FECHADO', 'closed', 'paid'].includes(order.status) && orderDate === today;
        });
        
        // 🔥 FILTRAR DESPESAS DO STORE
        const todayExpenses = expenses.filter(expense => {
          // 🔥 FILTRO DE DATA CORRETO: Verificar múltiplos campos de data
          const expenseDate = String(expense.date || expense.createdAt || '').split('T')[0];
          console.log('🔍 [DASHBOARD] Despesa - Data:', expenseDate, 'Hoje:', today, 'Amount:', expense.amount);
          return expenseDate === today;
        });
        
        // 🔥 CÁLCULO ÚNICO: Lógica que já funciona (20.500 Kz)
        const vendasHoje = todayOrders.reduce((acc, order) => acc + (order.total || 0), 0);
        const despesasHoje = todayExpenses.reduce((acc, expense) => acc + Number(expense.amount || 0), 0);
        const taxaReal = 6.5;
        const impostoHoje = vendasHoje * (taxaReal / 100);
        const lucroHoje = vendasHoje - despesasHoje - impostoHoje;
        
        // 🔥 VENDAS POR MODALIDADE
        const vendasPorModalidade = todayOrders.reduce((acc: Record<string, number>, order) => {
          const method = order.paymentMethod || 'OUTRO';
          acc[method] = (acc[method] || 0) + (order.total || 0);
          return acc;
        }, {});
        
        // 🔥 DADOS DO GRÁFICO
        const chartData = [];
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayName = days[date.getDay()];
          
          const dayOrders = closedOrders.filter(order => {
            const orderDate = String(order.timestamp || '').split('T')[0];
            return ['FECHADO', 'closed', 'paid'].includes(order.status) && orderDate === dateStr;
          });
          
          const dayRevenue = dayOrders.reduce((acc, order) => acc + (order.total || 0), 0);
          chartData.push({ name: dayName, vendas: dayRevenue });
        }
        
        // 🔥 ATUALIZAR ESTADO CENTRAL
        setDashboardData({
          vendasHoje,
          despesasHoje,
          impostoHoje,
          lucroHoje,
          taxaReal,
          todayOrders,
          todayExpenses,
          vendasPorModalidade,
          vendasTotais: vendasHoje, // Simplificado para hoje
          despesasTotais: despesasHoje, // Simplificado para hoje
          chartData
        });
        
        console.log('💰 [DASHBOARD] Dados do STORE carregados:', {
          vendas: vendasHoje,
          despesas: despesasHoje,
          imposto: impostoHoje,
          lucro: lucroHoje,
          modalidades: Object.keys(vendasPorModalidade)
        });
        
      } catch (error) {
        console.error('❌ [DASHBOARD] Erro ao carregar dados do STORE:', error);
      }
    };
    
    loadDashboardData();
  }, [activeOrders, expenses]);



  // 🔥 ATUALIZAR ESTADOS BASEADOS NO DASHBOARD DATA CENTRAL

  React.useEffect(() => {

    const impostoIndustrialCalc = Math.max(0, dashboardData.lucroHoje) * 0.25;

    const retencaoFonte = dashboardData.impostoHoje;

    const reservaFiscalCalc = retencaoFonte + impostoIndustrialCalc;

    const caixaDisponivelCalc = dashboardData.vendasHoje - dashboardData.despesasHoje;

    const liquidezStatusCalc = caixaDisponivelCalc >= reservaFiscalCalc ? 'seguro' : 'risco';

    

    setImpostoIndustrial(impostoIndustrialCalc);

    setReservaFiscal(reservaFiscalCalc);

    setCaixaDisponivel(caixaDisponivelCalc);

    setLiquidezStatus(liquidezStatusCalc);

  }, [dashboardData.vendasHoje, dashboardData.despesasHoje, dashboardData.impostoHoje, dashboardData.lucroHoje]);



  // 🔥 VARIÁVEIS DE COMPATIBILIDADE PARA O JSX

  const vendasHoje = dashboardData.vendasHoje;

  const despesasHoje = dashboardData.despesasHoje;

  const impostoHoje = dashboardData.impostoHoje;

  const lucroHoje = dashboardData.lucroHoje;

  const taxaReal = dashboardData.taxaReal;

  const todayOrders = dashboardData.todayOrders;

  const todayExpenses = dashboardData.todayExpenses;

  const vendasTotais = dashboardData.vendasTotais;

  const despesasTotais = dashboardData.despesasTotais;

  // 🔥 VARIÁVEIS ADICIONAIS PARA COMPATIBILIDADE
  const staffHoje = employees
    ?.filter((staff: any) => staff.status === 'ATIVO')
    ?.reduce((sum: number, staff: any) => sum + (staff.salary || 0), 0) || 0;
    
  // 🔥 VARIÁVEIS DE COMPATIBILIDADE PARA O JSX
  const chartData = dashboardData.chartData;
  const ordersData = dashboardData.todayOrders;
  const expensesData = dashboardData.todayExpenses;
  
  // 🔥 FUNÇÕES DE FILTRO PARA COMPATIBILIDADE
  const filterDataByPeriod = (data: any[], type: 'total' | 'mensal' | 'anual', dateField: string = 'timestamp') => {
    if (type === 'total') return data;
    return data; // Simplificado para hoje
  };
  
  // 🔥 RECENT INVOICES PARA COMPATIBILIDADE
  const recentInvoices = todayOrders
    .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
    .slice(0, 5)
    .map(order => ({
      ...order,
      invoiceNumber: `INV-${String(order.id || '').slice(-6).toUpperCase()}`,
      tableId: order.tableId || 'N/A',
      total: order.total || 0,
      profit: (order.total || 0) * 0.3
    }));



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



  const handleExportTodayReport = async () => {

  try {

    console.log('📄 [DASHBOARD] Iniciando exportação PDF com jsPDF...');

    

    // 🔥 GERAR PDF COM jsPDF - COMPATÍVEL COM SQLITE LOCAL

    const pdf = new jsPDF('p', 'mm', 'a4');

    

    // Adicionar título

    pdf.setFontSize(20);

    pdf.text('Relatório de Vendas - SQLite Dashboard', 20, 20);

    

    // Adicionar data

    pdf.setFontSize(12);

    pdf.text(`Data: ${new Date().toLocaleDateString('pt-AO')}`, 20, 30);

    pdf.text(`Fonte: Base de Dados SQLite Local`, 20, 37);

    

    // 🔥 ADICIONAR DADOS REAIS DO SQLITE (todayGross = vendasHoje)

    let yPosition = 50;

    pdf.setFontSize(14);

    pdf.text('Resumo Financeiro (Hoje)', 20, yPosition);

    

    yPosition += 10;

    pdf.setFontSize(10);

    pdf.text(`Faturação Bruta (todayGross): ${formatKz(vendasHoje)}`, 20, yPosition);

    yPosition += 8;

    pdf.text(`Despesas Hoje: ${formatKz(despesasHoje)}`, 20, yPosition);

    yPosition += 8;

    pdf.text(`Imposto (${taxaReal}%): ${formatKz(impostoHoje)}`, 20, yPosition);

    yPosition += 8;

    pdf.text(`Lucro Real: ${formatKz(lucroHoje)}`, 20, yPosition);

    yPosition += 8;

    pdf.text(`Reserva Fiscal: ${formatKz(reservaFiscal)}`, 20, yPosition);

    yPosition += 8;

    pdf.text(`Caixa Disponível: ${formatKz(caixaDisponivel)}`, 20, yPosition);

    

    // Adicionar detalhes das ordens SQLite

    yPosition += 15;

    pdf.setFontSize(12);

    pdf.text(`Total de Ordens (FECHADO): ${ordersData.length}`, 20, yPosition);

    yPosition += 8;

    pdf.text(`Total de Despesas: ${expensesData.length}`, 20, yPosition);

    yPosition += 8;

    pdf.text(`Status de Liquidez: ${liquidezStatus}`, 20, yPosition);

    

    // Adicionar informação do banco de dados

    yPosition += 15;

    pdf.setFontSize(8);

    pdf.text('Relatório gerado a partir do banco de dados SQLite local', 20, yPosition);

    

    // Salvar o PDF

    const fileName = `relatorio-sqlite-${new Date().toISOString().split('T')[0]}.pdf`;

    pdf.save(fileName);

    

    addNotification('success', `Relatório PDF "${fileName}" exportado com sucesso!`);

    console.log('📄 [DASHBOARD] PDF SQLite exportado com sucesso');

    

  } catch (error) {

    console.error('❌ [DASHBOARD] Erro ao exportar PDF SQLite:', error);

    addNotification('error', 'Erro ao exportar relatório PDF do SQLite.');

  }

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

          title={`Imposto (${taxaReal}%)`}

          value={impostoHoje}

          icon={TrendingUp}

          color="orange"

          filter={impostoFilter}

          onFilterChange={setImpostoFilter}

          subtitle={`${taxaReal}% das vendas`}

        />



        {/* Card 7: Reserva Fiscal (V2) */}

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">

          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">

             <Activity size={64} />

          </div>

          <div className="flex items-center gap-2 mb-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">

            Reserva Fiscal

          </div>

          <p className={`text-2xl font-mono font-bold ${liquidezStatus === 'seguro' ? 'text-green-500' : 'text-red-500'}`}>

            {formatKz(reservaFiscal)}

          </p>

          <div className="mt-2 text-[10px] text-slate-500 font-bold">

            Retenção + Industrial

          </div>

        </div>



        {/* Card 8: Caixa Disponível */}

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">

          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">

             <DollarSign size={64} />

          </div>

          <div className="flex items-center gap-2 mb-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">

            Caixa Disponível

          </div>

          <p className={`text-2xl font-mono font-bold ${liquidezStatus === 'seguro' ? 'text-cyan-500' : 'text-red-500'}`}>

            {formatKz(caixaDisponivel)}

          </p>

          <div className="mt-2 text-[10px] text-slate-500 font-bold">

            Liquidez {liquidezStatus}

          </div>

        </div>



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

