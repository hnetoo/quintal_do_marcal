import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Activity, Download, FileText, AlertCircle, ShoppingCart, Users, Filter, Calendar, BarChart3, Utensils, Beer, CreditCard, Wallet, Smartphone, Package, Clock, Target, AlertTriangle, TrendingDown, Receipt, UserCheck, PieChart, LineChart, FileDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { sqliteService } from '../lib/sqliteService';
import { PDFExportService } from '../lib/pdfExportService';

const Reports = () => {
  const { settings, menu, activeOrders, employees, stock } = useStore();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);

  // Estados para os 7 Cards
  const [vendasPorArtigo, setVendasPorArtigo] = useState({ data: [] as any[], loading: false });
  const [financasDetalhadas, setFinancasDetalhadas] = useState({ data: [] as any[], loading: false });
  const [rhEFaltas, setRhEFaltas] = useState({ data: [] as any[], loading: false });
  const [mapaDespesas, setMapaDespesas] = useState({ data: [] as any[], loading: false });
  const [topRentabilidade, setTopRentabilidade] = useState({ data: [] as any[], loading: false });
  const [fluxoPorTurno, setFluxoPorTurno] = useState({ data: [] as any[], loading: false });
  const [alertasStock, setAlertasStock] = useState({ data: [] as any[], loading: false });

  // Formatar moeda
  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Funções de exportação PDF
  const exportVendasPorArtigoPDF = async () => {
    console.log('[PDF] Iniciando exportação de Vendas por Artigo...');
    try {
      const ordersData = await sqliteService.getOrders();
      console.log('[PDF] Dados obtidos:', ordersData.length, 'pedidos');
      await PDFExportService.exportVendasPorArtigo(ordersData, menu, {
        title: 'Relatório de Vendas por Artigo',
        startDate: dateRange.start,
        endDate: dateRange.end,
        settings
      });
      console.log('[PDF] PDF gerado com sucesso!');
    } catch (error) {
      console.error('[PDF] Erro ao exportar vendas por artigo:', error);
    }
  };

  const exportDespesasPDF = async () => {
    console.log('[PDF] Iniciando exportação de Despesas...');
    try {
      const expensesData = await sqliteService.getExpenses();
      console.log('[PDF] Dados obtidos:', expensesData.length, 'despesas');
      await PDFExportService.exportDespesas(expensesData, employees, {
        title: 'Relatório de Despesas Completo',
        startDate: dateRange.start,
        endDate: dateRange.end,
        settings
      });
      console.log('[PDF] PDF de despesas gerado com sucesso!');
    } catch (error) {
      console.error('[PDF] Erro ao exportar despesas:', error);
    }
  };

  const exportFinanceiroMasterPDF = async () => {
    console.log('[PDF] Iniciando exportação do Relatório Financeiro Master...');
    try {
      const ordersData = await sqliteService.getOrders();
      const expensesData = await sqliteService.getExpenses();
      console.log('[PDF] Dados obtidos:', ordersData.length, 'pedidos,', expensesData.length, 'despesas');
      await PDFExportService.exportFinanceiroTotal(ordersData, expensesData, employees, {
        title: 'Relatório Financeiro Master',
        startDate: dateRange.start,
        endDate: dateRange.end,
        settings
      });
      console.log('[PDF] Relatório Master gerado com sucesso!');
    } catch (error) {
      console.error('[PDF] Erro ao exportar relatório financeiro master:', error);
    }
  };

  const exportMapaDespesasPDF = async () => {
    console.log('[PDF] Iniciando exportação do Mapa de Despesas...');
    try {
      const expensesData = await sqliteService.getExpenses();
      console.log('[PDF] Dados obtidos:', expensesData.length, 'despesas');
      await PDFExportService.exportMapaDespesas(expensesData, employees, {
        title: 'Mapa de Despesas Detalhado',
        startDate: dateRange.start,
        endDate: dateRange.end,
        settings
      });
      console.log('[PDF] Mapa de despesas gerado com sucesso!');
    } catch (error) {
      console.error('[PDF] Erro ao exportar mapa de despesas:', error);
    }
  };

  // CARD 1: VENDAS POR ARTIGO - Usando Store Local
  const fetchVendasPorArtigo = async () => {
    setVendasPorArtigo(prev => ({ ...prev, loading: true }));
    try {
      // Processar vendas por artigo a partir dos pedidos ativos
      const vendasMap = new Map();
      
      activeOrders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const product = menu.find(p => p.id === item.dish);
          const productName = product?.name || 'Produto Sem Nome';
          const key = productName;
          const existing = vendasMap.get(key) || { 
            nome: key, 
            quantidade: 0, 
            categoria: product?.categoryId ? 'Categoria' : 'Sem Categoria' 
          };
          existing.quantidade += item.quantity || 1;
          vendasMap.set(key, existing);
        });
      });

      const result = Array.from(vendasMap.values());
      setVendasPorArtigo({ data: result, loading: false });
    } catch (error: any) {
      console.error('Erro ao buscar vendas por artigo:', error);
      setVendasPorArtigo({ 
        data: [{ mensagem: `Erro ao carregar dados: ${error.message}`, tipo: 'erro' }], 
        loading: false 
      });
    }
  };

  // CARD 2: FINANÇAS DETALHADAS - Usando SQLite Local
  const fetchResumoFinanceiro = async () => {
    setFinancasDetalhadas(prev => ({ ...prev, loading: true }));
    try {
      const { start, end } = dateRange;
      
      // Buscar dados do SQLite Local
      const ordersData = await sqliteService.getOrders();
      const expensesData = await sqliteService.getExpenses();
      
      // Filtrar por data se necessário
      const filteredOrders = start && end 
        ? ordersData.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= new Date(start) && orderDate <= new Date(end);
          })
        : ordersData;
        
      const filteredExpenses = start && end
        ? expensesData.filter(expense => {
            const expenseDate = new Date(expense.created_at);
            return expenseDate >= new Date(start) && expenseDate <= new Date(end);
          })
        : expensesData;

      const totalReceita = filteredOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
      const totalDespesas = filteredExpenses.reduce((sum: number, expense: any) => sum + (expense.amount_kz || 0), 0);
      
      // Adicionar despesas fixas de Staff (salários) - Do store local
      const staffExpenses = employees
        ?.filter((staff: any) => staff.status === 'ATIVO')
        ?.reduce((sum: number, staff: any) => sum + (staff.salary || 0), 0) || 0;
      
      const totalDespesasComStaff = totalDespesas + staffExpenses;
      const lucroLiquido = totalReceita - totalDespesasComStaff;

      // Agrupar despesas por categoria
      const despesasPorCategoria = new Map();
      filteredExpenses.forEach(expense => {
        const categoria = expense.category || 'Sem Categoria';
        const existing = despesasPorCategoria.get(categoria) || { categoria, total: 0 };
        existing.total += expense.amount_kz || 0;
        despesasPorCategoria.set(categoria, existing);
      });

      const result = {
        totalReceita,
        totalDespesas: totalDespesasComStaff,
        lucroLiquido,
        despesasPorCategoria: Array.from(despesasPorCategoria.values())
      };

      setFinancasDetalhadas({ data: [result], loading: false });
    } catch (error: any) {
      console.error('Erro ao buscar finanças detalhadas:', error);
      setFinancasDetalhadas({ 
        data: [{ mensagem: `Erro ao carregar dados: ${error.message}`, tipo: 'erro' }], 
        loading: false 
      });
    }
  };

  // CARD 3: RH E FALTAS - Usando Store Local
  const fetchRhEFaltas = async () => {
    setRhEFaltas(prev => ({ ...prev, loading: true }));
    try {
      if (!employees || employees.length === 0) {
        setRhEFaltas({ 
          data: [{ 
            mensagem: 'Nenhum funcionário registado',
            tipo: 'info'
          }], 
          loading: false 
        });
        return;
      }

      // Processar dados dos funcionários
      const result = employees.map((staff: any) => {
        const diasFalta = staff.absences || 0;
        const salarioBase = staff.salary || 0;
        const descontoDiario = salarioBase / 30;
        const totalDesconto = descontoDiario * diasFalta;
        const salarioLiquido = salarioBase - totalDesconto;

        return {
          nome: staff.name || 'Funcionário Sem Nome',
          salarioBase,
          diasFalta,
          descontoDiario,
          totalDesconto,
          salarioLiquido
        };
      });

      setRhEFaltas({ data: result, loading: false });
    } catch (error) {
      console.error('Erro ao buscar RH e faltas:', error);
      setRhEFaltas({ 
        data: [{ 
          mensagem: 'Erro ao carregar dados de RH',
          tipo: 'erro'
        }], 
        loading: false 
      });
    }
  };

  // CARD 4: MAPA DE DESPESAS - Usando SQLite e Store Local
  const fetchMapaDespesas = async () => {
    setMapaDespesas(prev => ({ ...prev, loading: true }));
    try {
      const { start, end } = dateRange;
      
      // Buscar despesas do SQLite Local
      const expensesData = await sqliteService.getExpenses();
      
      // Filtrar por data se necessário
      const filteredExpenses = start && end
        ? expensesData.filter(expense => {
            const expenseDate = new Date(expense.created_at);
            return expenseDate >= new Date(start) && expenseDate <= new Date(end);
          })
        : expensesData;

      // Agrupar por tipo de despesa
      const despesasMap = new Map();
      filteredExpenses.forEach((expense: any) => {
        const tipo = expense.category || 'Outros';
        const existing = despesasMap.get(tipo) || { tipo, total: 0, itens: [] };
        existing.total += expense.amount_kz || 0;
        existing.itens.push({
          descricao: expense.description,
          valor: expense.amount_kz
        });
        despesasMap.set(tipo, existing);
      });

      const result = Array.from(despesasMap.values()).sort((a: any, b: any) => b.total - a.total);
      
      // Adicionar despesas de Staff como categoria fixa - Do store local
      const staffExpenses = employees
        ?.filter((staff: any) => staff.status === 'ATIVO')
        ?.reduce((sum: number, staff: any) => sum + (staff.salary || 0), 0) || 0;
      
      if (staffExpenses > 0) {
        result.push({
          tipo: 'Staff',
          total: staffExpenses,
          itens: employees
            ?.filter((staff: any) => staff.status === 'ATIVO')
            ?.map((staff: any) => ({
              descricao: staff.name || 'Funcionário',
              valor: staff.salary
            })) || []
        });
      }
      
      setMapaDespesas({ data: result, loading: false });
    } catch (error: any) {
      console.error('Erro ao buscar mapa de despesas:', error);
      setMapaDespesas({ 
        data: [{ mensagem: `Erro ao carregar dados: ${error.message}`, tipo: 'erro' }], 
        loading: false 
      });
    }
  };

  // CARD 5: TOP RENTABILIDADE - Usando Store Local
  const fetchTopRentabilidade = async () => {
    setTopRentabilidade(prev => ({ ...prev, loading: true }));
    try {
      const result = menu
        ?.map((product: any) => ({
          nome: product.name,
          precoVenda: product.price || 0,
          precoCusto: product.costPrice || 0,
          margem: (product.price || 0) - (product.costPrice || 0),
          margemPercentual: product.price > 0 ? ((product.price - (product.costPrice || 0)) / product.price) * 100 : 0
        }))
        .filter((p: any) => p.precoCusto > 0) // Apenas produtos com custo definido
        .sort((a: any, b: any) => b.margem - a.margem)
        .slice(0, 10) || [];

      setTopRentabilidade({ data: result, loading: false });
    } catch (error: any) {
      console.error('Erro ao buscar top rentabilidade:', error);
      setTopRentabilidade({ 
        data: [{ mensagem: `Erro ao carregar dados: ${error.message}`, tipo: 'erro' }], 
        loading: false 
      });
    }
  };

  // CARD 6: FLUXO POR TURNO - Usando Store Local
  const fetchFluxoPorTurno = async () => {
    setFluxoPorTurno(prev => ({ ...prev, loading: true }));
    try {
      // Agrupar por turno (manhã, tarde, noite)
      const turnos: any = {
        'Manhã (6h-12h)': { total: 0, pedidos: 0 },
        'Tarde (12h-18h)': { total: 0, pedidos: 0 },
        'Noite (18h-24h)': { total: 0, pedidos: 0 }
      };
      
      activeOrders.forEach((order: any) => {
        const hour = new Date(order.timestamp).getHours();
        let turno = 'Noite (18h-24h)';
        
        if (hour >= 6 && hour < 12) turno = 'Manhã (6h-12h)';
        else if (hour >= 12 && hour < 18) turno = 'Tarde (12h-18h)';
        
        turnos[turno].total += order.total || 0;
        turnos[turno].pedidos += 1;
      });

      const result = Object.entries(turnos).map(([turno, dados]) => ({
        turno,
        ...dados
      }));

      setFluxoPorTurno({ data: result, loading: false });
    } catch (error: any) {
      console.error('Erro ao buscar fluxo por turno:', error);
      setFluxoPorTurno({ 
        data: [{ mensagem: `Erro ao carregar dados: ${error.message}`, tipo: 'erro' }], 
        loading: false 
      });
    }
  };

  // CARD 7: ALERTAS DE STOCK - Usando Store Local
  const fetchAlertasStock = async () => {
    setAlertasStock(prev => ({ ...prev, loading: true }));
    try {
      const alertas = stock
        ?.filter((item: any) => (item.quantity || 0) < (item.minThreshold || 5))
        ?.map((item: any) => ({
          nome: item.name,
          stockAtual: item.quantity || 0,
          stockMinimo: item.minThreshold || 5,
          status: (item.quantity || 0) === 0 ? 'CRÍTICO' : 'BAIXO'
        })) || [];

      setAlertasStock({ data: alertas, loading: false });
    } catch (error: any) {
      console.error('Erro ao buscar alertas de stock:', error);
      setAlertasStock({ 
        data: [{ mensagem: `Erro ao carregar dados: ${error.message}`, tipo: 'erro' }], 
        loading: false 
      });
    }
  };

  // Carregar todos os dados
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchVendasPorArtigo(),
        fetchResumoFinanceiro(),
        fetchRhEFaltas(),
        fetchMapaDespesas(),
        fetchTopRentabilidade(),
        fetchFluxoPorTurno(),
        fetchAlertasStock()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [dateRange]);

  return (
    <div className="p-6 bg-slate-950 text-white h-screen overflow-y-auto !important">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">REST IA - Relatórios e Analytics</h1>
        
        {/* Filtros de Data */}
        <div className="flex gap-4 mb-6">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            placeholder="Data Início"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            placeholder="Data Fim"
          />
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Cards Especiais de Relatórios Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Card Especial: Relatório de Despesas Completo */}
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-800/50 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-red-400">
              <Receipt size={20} />
              Relatório de Despesas Completo
            </h3>
            <button
              onClick={exportDespesasPDF}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              title="Exportar PDF"
            >
              <FileDown size={16} />
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Exporte todas as despesas do período com detalhamento por categoria, incluindo Staff, Insumos e operacionais.
          </p>
          <div className="text-xs text-slate-500">
            Campos: Data, Descrição, Categoria, Valor | Total acumulado no rodapé
          </div>
        </div>

        {/* Card Especial: Relatório Financeiro Master */}
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-800/50 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-green-400">
              <TrendingUp size={20} />
              Relatório Financeiro Master
            </h3>
            <button
              onClick={exportFinanceiroMasterPDF}
              className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              title="Exportar PDF"
            >
              <FileDown size={16} />
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Relatório completo consolidando Receitas, Impostos (IVA {settings.taxRate}%), Despesas e Lucro Líquido.
          </p>
          <div className="text-xs text-slate-500">
            Análise de rentabilidade e distribuição de custos com base no regime fiscal: {settings.taxRegime}
          </div>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Vendas por Artigo */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart size={20} />
              Vendas por Artigo
            </h3>
            <button
              onClick={exportVendasPorArtigoPDF}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="Exportar PDF"
            >
              <FileDown size={16} />
            </button>
          </div>
          {vendasPorArtigo.loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {vendasPorArtigo.data.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-slate-800 rounded">
                  <span className="text-sm">{item.nome || item.mensagem}</span>
                  {item.quantidade && <span className="font-bold">{item.quantidade}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Finanças Detalhadas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <DollarSign size={20} />
              Finanças Detalhadas
            </h3>
            <button
              onClick={exportFinanceiroMasterPDF}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="Exportar PDF"
            >
              <FileDown size={16} />
            </button>
          </div>
          {financasDetalhadas.loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="space-y-3">
              {financasDetalhadas.data.map((item: any, index: number) => (
                <div key={index}>
                  {item.mensagem ? (
                    <p className="text-sm text-slate-400">{item.mensagem}</p>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Receitas:</span>
                        <span className="text-green-400 font-bold">{formatKz(item.totalReceita)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Despesas:</span>
                        <span className="text-red-400 font-bold">{formatKz(item.totalDespesas)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Lucro Líquido:</span>
                        <span className={`font-bold ${item.lucroLiquido >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatKz(item.lucroLiquido)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: RH e Faltas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users size={20} />
            RH e Faltas
          </h3>
          {rhEFaltas.loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rhEFaltas.data.map((item: any, index: number) => (
                <div key={index}>
                  {item.mensagem ? (
                    <p className="text-sm text-slate-400">{item.mensagem}</p>
                  ) : (
                    <div className="p-2 bg-slate-800 rounded">
                      <div className="font-medium">{item.nome}</div>
                      <div className="text-xs text-slate-400">
                        Salário: {formatKz(item.salarioBase)} | Faltas: {item.diasFalta}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 4: Mapa de Despesas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <PieChart size={20} />
              Mapa de Despesas
            </h3>
            <button
              onClick={exportMapaDespesasPDF}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="Exportar PDF"
            >
              <FileDown size={16} />
            </button>
          </div>
          {mapaDespesas.loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mapaDespesas.data.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-slate-800 rounded">
                  <span className="text-sm">{item.tipo || item.mensagem}</span>
                  {item.total && <span className="font-bold">{formatKz(item.total)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 5: Top Rentabilidade */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Top Rentabilidade
          </h3>
          {topRentabilidade.loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {topRentabilidade.data.map((item: any, index: number) => (
                <div key={index}>
                  {item.mensagem ? (
                    <p className="text-sm text-slate-400">{item.mensagem}</p>
                  ) : (
                    <div className="p-2 bg-slate-800 rounded">
                      <div className="font-medium text-sm">{item.nome}</div>
                      <div className="text-xs text-green-400">
                        Margem: {formatKz(item.margem)} ({item.margemPercentual.toFixed(1)}%)
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 6: Fluxo por Turno */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock size={20} />
            Fluxo por Turno
          </h3>
          {fluxoPorTurno.loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="space-y-2">
              {fluxoPorTurno.data.map((item: any, index: number) => (
                <div key={index}>
                  {item.mensagem ? (
                    <p className="text-sm text-slate-400">{item.mensagem}</p>
                  ) : (
                    <div className="p-2 bg-slate-800 rounded">
                      <div className="font-medium text-sm">{item.turno}</div>
                      <div className="text-xs text-slate-400">
                        {item.pedidos} pedidos | {formatKz(item.total)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 7: Alertas de Stock */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Alertas de Stock
          </h3>
          {alertasStock.loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alertasStock.data.map((item: any, index: number) => (
                <div key={index}>
                  {item.mensagem ? (
                    <p className="text-sm text-slate-400">{item.mensagem}</p>
                  ) : (
                    <div className={`p-2 rounded ${item.status === 'CRÍTICO' ? 'bg-red-900/30' : 'bg-yellow-900/30'}`}>
                      <div className="font-medium text-sm">{item.nome}</div>
                      <div className="text-xs text-slate-400">
                        Stock: {item.stockAtual}/{item.stockMinimo}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
