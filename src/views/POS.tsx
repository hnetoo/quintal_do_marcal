
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Dish, PaymentMethod, Order, Table, Customer } from '../types';
import { 
  Search, Minus, Plus, CreditCard, LayoutGrid, Printer, 
  Banknote, X, Utensils, MoveHorizontal, Sparkles, Loader2,
  ChevronRight, Grid3X3, Tag, ShoppingBasket, FileText,
  UserPlus, History, LogOut, CheckCircle2, MoreVertical,
  ChevronLeft, Layout, Clock, QrCode, ArrowRightLeft, User, Users, Monitor, Shield, Settings, Trash2, Check, DollarSign,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { printThermalInvoice, printTableReview, printCashClosing } from '../lib/printService';
import ThermalPrinterManager from '../lib/thermalPrinterConfig';
import LazyImage from '../components/LazyImage';
import PaymentModal from '../components/PaymentModal';
import POSInitializer from '../components/POSInitializer';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const POS = () => {
  console.log('[POS] Componente iniciando...');
  
  try {
    const navigate = useNavigate();
    const { 
      tables, categories, menu, activeOrders, customers, activeTableId, activeOrderId,
      setActiveTable, setActiveOrder, createNewOrder, addToOrder, removeFromOrder, checkoutTable, 
      updateOrderPaymentMethod,
      updateTablePosition, addTable, updateTable, removeTable, closeTable,
      currentUser, logout, settings, updateSettings, notifications, addNotification,
      paymentConfigs, customerDisplayMode, setCustomerDisplayMode
    } = useStore();

    console.log('[POS] Store carregado:', { tables: tables.length, categories: categories.length, menu: menu.length });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [newSubAccountName, setNewSubAccountName] = useState('');
  const [transferTargetTableId, setTransferTargetTableId] = useState<number | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'METHOD' | 'CUSTOMER'>('METHOD');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSubaccountModalOpen, setIsSubaccountModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isChangePaymentModalOpen, setIsChangePaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSubAccount, setSelectedSubAccount] = useState<any>(null);
  
  // Estado de zoom para o POS
  const [posZoomLevel, setPosZoomLevel] = useState(1);

  // Funções de zoom para o POS
  const handlePosZoomIn = () => {
    setPosZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const handlePosZoomOut = () => {
    setPosZoomLevel(prev => Math.max(prev - 0.1, 0.4)); // Mínimo de 40%
  };

  // Funções para ajustar quantidade diretamente no carrinho
  const handleIncreaseQuantity = (itemIndex: number) => {
    console.log('[POS DEBUG] Aumentando quantidade do item:', itemIndex);
    
    if (!currentOrder) {
      console.error('[POS ERROR] currentOrder é null');
      return;
    }
    
    if (!currentOrder.items || !Array.isArray(currentOrder.items)) {
      console.error('[POS ERROR] currentOrder.items não é um array:', currentOrder.items);
      return;
    }
    
    if (!currentOrder.items[itemIndex]) {
      console.error('[POS ERROR] Item não encontrado no índice:', itemIndex);
      return;
    }
    
    const item = currentOrder.items[itemIndex];
    
    try {
      // Validação adicional dos dados
      if (typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
        console.error('[POS ERROR] Tipos inválidos:', { quantity: item.quantity, unitPrice: item.unitPrice });
        return;
      }
      
      console.log('[POS DEBUG] Item atual:', { ...item });
      
      // Atualiza o item diretamente no array (imutabilidade)
      const updatedItems = [...currentOrder.items];
      updatedItems[itemIndex] = { 
        ...item, 
        quantity: item.quantity + 1 
      };
      
      // Recalcula o total do pedido com validação
      const newTotal = updatedItems.reduce((sum, currentItem) => {
        if (typeof currentItem.quantity === 'number' && typeof currentItem.unitPrice === 'number') {
          return sum + (currentItem.unitPrice * currentItem.quantity);
        }
        return sum;
      }, 0);
      
      // Atualiza o pedido com segurança
      const updatedOrder = { 
        ...currentOrder, 
        items: updatedItems,
        total: newTotal
      };
      
      console.log('[POS DEBUG] Pedido atualizado:', { 
        oldTotal: currentOrder.total, 
        newTotal, 
        itemsCount: updatedItems.length 
      });
      
      // Atualiza localmente primeiro
      setActiveOrder(updatedOrder.id);
      
      // Atualiza no store através dos activeOrders
      const state = useStore.getState();
      if (state && state.activeOrders) {
        const updatedActiveOrders = state.activeOrders.map(order => 
          order.id === currentOrder.id ? updatedOrder : order
        );
        useStore.setState({ activeOrders: updatedActiveOrders });
      }
      
    } catch (error) {
      console.error('[POS ERROR] Erro ao aumentar quantidade:', error);
      addNotification('error', 'Erro ao atualizar quantidade');
    }
  };

  const handleDecreaseQuantity = (itemIndex: number) => {
    if (!currentOrder || !currentOrder.items[itemIndex]) return;
    const item = currentOrder.items[itemIndex];
    if (item.quantity <= 1) return;
    
    try {
      // Atualiza o item diretamente no array
      const updatedItems = [...currentOrder.items];
      updatedItems[itemIndex] = { ...item, quantity: item.quantity - 1 };
      
      // Recalcula o total do pedido
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      
      // Atualiza o pedido com segurança
      const updatedOrder = { 
        ...currentOrder, 
        items: updatedItems,
        total: newTotal
      };
      
      // Atualiza localmente primeiro
      setActiveOrder(updatedOrder.id);
      
      // Atualiza no store através dos activeOrders
      const { activeOrders } = useStore.getState();
      const updatedActiveOrders = activeOrders.map(order => 
        order.id === currentOrder.id ? updatedOrder : order
      );
      useStore.setState({ activeOrders: updatedActiveOrders });
      
    } catch (error) {
      console.error('Erro ao diminuir quantidade:', error);
    }
  };
  
  const addSubAccount = () => {
    if (!activeTableId) return;
    
    // Criar subconta com itens atuais
    const subAccount = {
      id: `sub-${Date.now()}`,
      name: `Subconta ${subAccounts.length + 1}`,
      items: [...(currentOrder?.items || [])],
      total: currentOrder?.total || 0,
      createdAt: new Date()
    };
    
    setSubAccounts([...subAccounts, subAccount]);
    // Limpar pedido atual
    setActiveOrder(null);
    addNotification('success', 'Subconta criada com sucesso');
  };

  const removeSubAccount = (id: string) => {
    setSubAccounts(subAccounts.filter(sa => sa.id !== id));
    addNotification('success', 'Subconta removida');
  };

  const transferTable = (sourceTableId: number, targetTableId: number) => {
    try {
      console.log(`[POS] Transferindo mesa ${sourceTableId} para ${targetTableId}`);
      
      const state = useStore.getState();
      
      // Encontrar todos os pedidos da mesa de origem
      const sourceOrders = state.activeOrders.filter(order => order.tableId === sourceTableId);
      
      if (sourceOrders.length === 0) {
        addNotification('error', 'Não há pedidos para transferir nesta mesa');
        return;
      }
      
      // Atualizar todos os pedidos para a nova mesa
      const updatedOrders = state.activeOrders.map(order => {
        if (order.tableId === sourceTableId) {
          return {
            ...order,
            tableId: targetTableId,
            timestamp: new Date() // Atualizar timestamp
          };
        }
        return order;
      });
      
      // Atualizar o store
      useStore.setState({ activeOrders: updatedOrders });
      
      // Limpar seleções atuais
      setActiveTable(null);
      setActiveOrder(null);
      
      addNotification('success', `Mesa ${sourceTableId} transferida para ${targetTableId} com ${sourceOrders.length} pedido(s)`);
      
    } catch (error) {
      console.error('[POS ERROR] Erro ao transferir mesa:', error);
      addNotification('error', 'Erro ao transferir mesa');
    }
  };
  
  // Estados para subcontas
  const [subAccounts, setSubAccounts] = useState<any[]>([]);
  
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [cashOpeningAmount, setCashOpeningAmount] = useState(0);
  const [isCashOpeningModalOpen, setIsCashOpeningModalOpen] = useState(false);
  const [todayCashFlow, setTodayCashFlow] = useState<any>(null);
  
  const [orderToChangeId, setOrderToChangeId] = useState<string | null>(null);
  
  // Estados para responsividade
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detectar tamanho de tela
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Verificar estado do caixa ao carregar
  useEffect(() => {
    checkCashStatus();
  }, []);

  // Função para verificar status do caixa
  const checkCashStatus = async () => {
    try {
      // SQLite-first - verificar caixa localmente
      const today = new Date().toISOString().split('T')[0];
      // Por enquanto, sempre considera caixa aberto localmente
      setIsCashOpen(true);
      setCashOpeningAmount(0);
      console.log('[POS] Caixa local verificado - modo offline');
    } catch (error) {
      console.log('[CAIXA] Erro ao verificar caixa:', error);
      setIsCashOpen(false);
      setTodayCashFlow(null);
    }
  };
  
  const currentOrder = activeOrders.find(o => o.id === activeOrderId);
  
  // LOG DE DEBUG PARA PRODUTOS NO POS - REMOVIDO
  useEffect(() => {
    // Sem logs para evitar erros
  }, [menu.length, categories.length]);
  
  // VALIDAÇÃO DOS LOGS - DEBUG DO FILTRO
  const filteredByCategory = menu.filter(d => {
    const matchesCategory = selectedCategoryId === 'TODOS' || d.categoryId === selectedCategoryId;
    return matchesCategory;
  });
  const filteredBySearch = filteredByCategory.filter(d => 
    typeof d.name === 'string' && d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // LOG DE DEPURAÇÃO PARA IMAGENS - REMOVIDO
  // Sem logs para evitar erros
  
  // Função de impressão direta - SEM CONFIGURAÇÃO
  const handleDirectPrint = (order: any, customer?: any) => {
    console.log(`[POS] Imprimindo diretamente: ${order.invoiceNumber}`);
    
    try {
      // Impressão direta usando window.print()
      printThermalInvoice(order, menu, settings, customer);
      addNotification('success', 'Impressão disparada com sucesso!');
    } catch (printError) {
      console.error('[POS] Erro na impressão direta:', printError);
      addNotification('error', 'Falha na impressão. Tente novamente.');
    }
  };
  
  const closedToday = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return activeOrders.filter(o => {
      if (o.status !== 'closed') return false;
      const orderDate = new Date(o.timestamp).toLocaleDateString('en-CA');
      return orderDate === todayStr;
    });
  }, [activeOrders]);

  const handleTableClick = (table: Table) => {
    setActiveTable(table.id);
    const existingOrder = activeOrders.find(o => o.tableId === table.id && o.status === 'open');
    if (existingOrder) {
      setActiveOrder(existingOrder.id);
    } else {
      const newId = createNewOrder(table.id);
      setActiveOrder(newId);
    }
  };

  const handleOpenCustomerDisplay = (targetTableId?: number | any) => {
    const target = typeof targetTableId === 'number' ? targetTableId : (activeTableId || 0);
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}#/customer-display/${target}`;
    window.open(url, 'RESTIACustomerDisplay', 'width=1200,height=800');
    addNotification('info', `Monitor do Cliente para Mesa ${target} ativo.`);
  };

  const handleCashClosingClick = async () => {
    try {
      console.log('[FECHO] Iniciando fecho de caixa...');
      addNotification('info', 'A processar fecho de caixa...');
      
      // Buscar pedidos fechados hoje do store local
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = activeOrders.filter(order => {
        if (order.status !== 'closed') return false;
        
        // Verificar se o pedido é de hoje
        const orderDate = new Date(order.timestamp || Date.now()).toISOString().split('T')[0];
        return orderDate === today;
      });

      console.log('[FECHO] Pedidos encontrados:', todayOrders.length);
      console.log('[FECHO] Pedidos:', todayOrders);

      if (todayOrders.length === 0) {
        addNotification('error', 'Nenhuma venda encontrada para fechar o caixa hoje.');
        return;
      }

      // Agrupar por payment_method (Cash, Multicaixa, etc.)
      const groupedByPayment = todayOrders.reduce((acc: any, order: any) => {
        const method = order.paymentMethod || 'OUTRO';
        const total = parseFloat(order.total) || 0;
        if (!acc[method]) acc[method] = 0;
        acc[method] += total;
        return acc;
      }, {});

      console.log('[FECHO] Agrupamento por método:', groupedByPayment);

      // Formatar dados para impressão
      const formattedOrders = (todayOrders || []).map(order => ({
        id: order.id,
        tableId: String(order.tableId || ''),
        total: parseFloat(order.total) || 0,
        paymentMethod: order.paymentMethod || 'OUTRO',
        timestamp: order.timestamp || new Date().toISOString(),
        items: [] // Não precisamos dos itens para o relatório de fecho
      }));

      console.log('[FECHO] Dados formatados:', formattedOrders);
      console.log('[FECHO] Total geral:', formattedOrders.reduce((sum, o) => sum + o.total, 0));

      // Chamar função de impressão existente com os dados
      printCashClosing(formattedOrders, settings, currentUser?.name || 'Operador', paymentConfigs);
      addNotification('success', `Relatório de Fecho gerado com ${todayOrders.length} vendas.`);
      
    } catch (err) {
      console.error('[FECHO] Erro ao processar fecho:', err);
      addNotification('error', `Falha ao processar fecho: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const handleChangePayment = (method: PaymentMethod) => {
    if (!orderToChangeId) return;
    // Apenas atualiza o banco local para o relatório de fecho sair perfeito
    updateOrderPaymentMethod(orderToChangeId, method);
    addNotification('success', 'Meio de pagamento atualizado administrativamente.');
    setIsChangePaymentModalOpen(false);
    setOrderToChangeId(null);
  };

  const handleAddSubAccount = () => {
    if (!activeTableId || !newSubAccountName.trim()) {
      addNotification('error', 'Nome da subconta é obrigatório');
      return;
    }
    
    try {
      console.log('[POS] Criando subconta:', newSubAccountName);
      
      // Criar nova subconta com itens atuais
      const newSubAccount = {
        id: `sub-${Date.now()}`,
        tableId: activeTableId,
        subAccountName: newSubAccountName.trim(),
        items: currentOrder ? [...currentOrder.items] : [],
        total: currentOrder ? currentOrder.total : 0,
        status: 'open' as const,
        type: 'subaccount' as const,
        timestamp: new Date(),
        taxTotal: currentOrder ? currentOrder.taxTotal : 0,
        profit: currentOrder ? currentOrder.profit : 0
      };
      
      // Adicionar ao store com type assertion para contornar erro temporariamente
      const state = useStore.getState();
      const updatedActiveOrders = [...state.activeOrders, newSubAccount as any];
      useStore.setState({ activeOrders: updatedActiveOrders });
      
      // Limpar o pedido atual se tiver itens
      if (currentOrder && currentOrder.items.length > 0) {
        setActiveOrder(null);
      }
      
      // Limpar formulário
      setNewSubAccountName('');
      setIsSubaccountModalOpen(false);
      
      addNotification('success', `Subconta "${newSubAccountName}" criada com sucesso`);
      
    } catch (error) {
      console.error('[POS ERROR] Erro ao criar subconta:', error);
      addNotification('error', 'Erro ao criar subconta');
    }
  };

  // 🛡️ FUNÇÕES BLINDADAS DE GESTÃO DE SUBCONTAS
  const handleDeleteSubAccount = async (subAccountId: string) => {
    if (!confirm('Tem certeza que deseja apagar esta subconta? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      console.log('[POS] Apagando subconta:', subAccountId);
      setIsFinalizing(true); // Prevenir múltiplos cliques
      
      // SQLite-first - remover localmente apenas
      console.log('[POS] Subconta removida localmente');

      // Remover subconta da visualização E atualizar estado
      removeSubAccount(subAccountId);
      
      // 🔄 FORÇAR ATUALIZAÇÃO DE ESTADO
      if (activeOrderId === subAccountId) {
        setActiveOrder(null); // Limpar seleção se era a subconta ativa
      }
      
      addNotification('success', 'Subconta apagada com sucesso');
      
    } catch (error) {
      console.error('[POS] Erro ao apagar subconta:', error);
      addNotification('error', 'Erro ao apagar subconta');
    } finally {
      setIsFinalizing(false); // Liberar cliques
    }
  };

  const handleCloseSubAccount = (subAccount: any) => {
    console.log('[POS] Fechando subconta:', subAccount);
    
    // Verificar se a subconta tem itens antes de abrir o modal
    if (!subAccount.items || subAccount.items.length === 0) {
      addNotification('error', 'Esta subconta não tem itens para fechar.');
      return;
    }
    
    setSelectedSubAccount(subAccount);
    setIsPaymentModalOpen(true);
    
    // Forçar atualização do estado para garantir que o modal apareça
    setTimeout(() => {
      console.log('[POS] Modal de pagamento deve estar aberto para subconta:', subAccount.subAccountName);
    }, 100);
  };

  const handleTransferTable = () => {
    if (!activeTableId || !transferTargetTableId) return;
    transferTable(activeTableId, transferTargetTableId);
    setIsTransferModalOpen(false);
    setTransferTargetTableId(null);
    setActiveTable(null);
    setActiveOrder(null);
  };

  const handleAddToOrder = (dish: Dish, quantity: number = 1) => {
    if (!activeTableId) return;
    addToOrder(activeTableId, dish, quantity);
    setLastAddedItemId(dish.id);
    setTimeout(() => setLastAddedItemId(null), 2000);
  };

  const tableSubAccounts = useMemo(() => {
    if (!activeTableId) return [];
    return activeOrders.filter(o => o.tableId === activeTableId && o.status === 'open');
  }, [activeOrders, activeTableId]);

  const handleCheckoutFinal = async (method: PaymentMethod, customerId?: string) => {
    if (!currentOrder) return;
    
    // Se for Pagar Depois e não tiver cliente selecionado, abrir modal de clientes
    if (method === 'PAGAR_DEPOIS' && !customerId && checkoutStep === 'METHOD') {
      setSelectedPaymentMethod(method);
      setCheckoutStep('CUSTOMER');
      return;
    }

    // Garantir que currentOrderId sempre tenha um valor
    const currentOrderId = currentOrder?.id || 'unknown';
    const orderData = currentOrder; // Salvar dados do pedido antes de qualquer alteração
    const customerData = customers.find(c => c.id === orderData.customerId);
    
    console.log(`[POS] Finalizando pedido ${currentOrderId} com método ${method}`);
    
    // TENTAR FINALIZAÇÃO NO BANCO (pode falhar com 401)
    try {
      console.log('[POS] Iniciando persistência da ordem...');
      const result = await checkoutTable(currentOrder.id, method, customerId);
      
      console.log('[POS] Resultado do checkoutTable:', result);
      
      // VERIFICAÇÃO CRÍTICA: Persistir itens do carrinho (independente do resultado)
      console.log('[POS] Verificando itens do carrinho:', currentOrder.items);
      console.log('[POS] ID do pedido atual:', currentOrder.id);
      
      if (currentOrder.items && currentOrder.items.length > 0) {
        console.log('[POS] Iniciando persistência dos itens na tabela order_items...');
        
        try {
          // BLOCO OBRIGATÓRIO: Inserir itens na tabela order_items
          // VERIFICAÇÃO: currentOrder.id é válido?
          if (!currentOrder.id) {
            console.error('[POS] ERRO FATAL: currentOrder.id é inválido:', currentOrder.id);
            addNotification('error', 'ID do pedido inválido. Não é possível salvar itens.');
            return;
          }
          
          const itemsToInsert = (currentOrder.items || []).map(item => {
            // VERIFICAÇÃO: item.dish.id é válido?
            if (!item.dish.id) {
              console.error('[POS] ERRO: item.dish.id é inválido:', item);
              return null;
            }
            
            return {
              order_id: currentOrder.id,
              product_id: item.dish.id,
              quantity: item.quantity,
              unit_price: item.dish.price,
              total_price: item.quantity * item.dish.price
            };
          }).filter(item => item !== null); // Remover itens inválidos

          if (itemsToInsert.length === 0) {
            console.error('[POS] ERRO: Nenhum item válido para inserir após verificação');
            addNotification('error', 'Nenhum item válido para salvar.');
            return;
          }

          console.log('[POS] Itens formatados para inserção:', itemsToInsert);

          // SQLite-first - itens já salvos pelo store
          console.log('[POS] Itens já salvos localmente pelo store SQLite-first');
          addNotification('success', `${itemsToInsert.length} itens processados com sucesso!`);
        } catch (error) {
          console.error('[POS] Erro ao processar itens:', error);
        }
      } else {
        console.warn('[POS] Pedido sem itens para persistir:', currentOrder);
        addNotification('warning', 'Pedido sem itens para salvar');
      }
      
      if (result) {
        console.log('[POS] Ordem persistida com sucesso:', result);
        addNotification('success', 'Venda registada com sucesso!');
      } else {
        console.error('[POS] Falha ao persistir ordem:', result);
        addNotification('error', 'Erro ao salvar pedido');
      }
    } catch (error) {
      console.error('[POS] Erro ao persistir ordem:', error);
      addNotification('error', 'Erro ao salvar pedido');
    }
    
    // Resetar estado de finalização após sucesso
    setTimeout(() => {
      setIsFinalizing(false);
    }, 2000);
    
    // Fechar modal e resetar estado
    setIsCheckoutModalOpen(false);
    setCheckoutStep('METHOD');
    setSelectedPaymentMethod(null);
    setSelectedCustomerId(undefined);
    
    // IMPRESSÃO DIRETA E LIMPEZA COMPLETA DO CARRINHO
    // Usar as variáveis que já estão disponíveis no escopo
    setTimeout(() => {
      try {
        if (!currentOrder?.id) {
          console.log('[POS] Sem pedido para imprimir');
          return;
        }
        
        console.log(`[POS] Imprimindo pedido ${currentOrder.id}`);
        
        // Buscar dados atuais
        const state = useStore.getState();
        const orderToPrint = state.activeOrders.find(o => o.id === currentOrder.id) || currentOrder;
        const customerToPrint = state.customers.find(c => c.id === orderToPrint.customerId);
        
        // Impressão direta apenas se não estiver imprimindo
        if (typeof handleDirectPrint === 'function') {
          handleDirectPrint(orderToPrint, customerToPrint);
        }
        
        // Reset completo
        setActiveOrder(null);
        setActiveTable(null);
        setIsHistoryOpen(false);
        
        addNotification('success', 'Venda concluída com sucesso!');
      } catch (error) {
        console.error('[POS] Erro na impressão:', error);
        addNotification('error', 'Erro na impressão');
      }
    }, 1000); // Aumentado para 1 segundo para garantir que o estado foi salvo
  };

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { 
    style: 'currency', currency: 'AOA', maximumFractionDigits: 0 
  }).format(val);

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans select-none">
      {/* Inicializador do POS - Garante que os dados sejam carregados */}
      <POSInitializer />
      
      {/* Controles de Zoom do POS - Fixos no topo */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 bg-black/50 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
        <button 
          onClick={handlePosZoomIn}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          title="Aumentar zoom do POS"
        >
          <ZoomIn size={20} />
        </button>
        <button 
          onClick={handlePosZoomOut}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          title="Diminuir zoom do POS"
        >
          <ZoomOut size={20} />
        </button>
        <div className="text-center text-white text-xs font-bold bg-white/10 rounded-lg px-2 py-1">
          {Math.round(posZoomLevel * 100)}%
        </div>
      </div>
      
      {/* Botão de Toggle da Sidebar - SEMPRE VISÍVEL */}
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="fixed top-4 left-4 z-[9999] w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-black shadow-lg hover:shadow-glow transition-all"
        title="Alternar Sidebar"
        aria-label="Alternar Sidebar"
      >
        <ChevronRight size={20} className={`transition-transform ${!isSidebarCollapsed ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Sidebar Categorias */}
      <div className={`${isSidebarCollapsed ? 'w-0' : 'w-12 sm:w-14 md:w-16 lg:w-12'} bg-slate-950 border-r border-white/5 flex flex-col items-center py-1 sm:py-2 md:py-3 gap-1 sm:gap-2 md:gap-3 z-40 relative transition-all duration-300`}>
         <div className="flex-1 flex flex-col items-center gap-3 sm:gap-4 md:gap-6 overflow-y-auto no-scrollbar w-full py-1 sm:py-2 md:py-3">
           <button 
              onClick={() => setSelectedCategoryId('TODOS')} 
              className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 rounded-xl sm:rounded-[1.5rem] md:rounded-2xl flex items-center justify-center transition-all ${selectedCategoryId === 'TODOS' ? 'bg-primary text-black shadow-glow scale-105' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}
              title="Ver todos os produtos"
              aria-label="Ver todos os produtos"
           >
              <Grid3X3 size={window.innerWidth < 640 ? 18 : window.innerWidth < 768 ? 20 : 24} />
           </button>
           {categories.map(cat => (
             <button 
               key={cat.id} 
               onClick={() => setSelectedCategoryId(cat.id)} 
               className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 rounded-xl sm:rounded-[1.5rem] md:rounded-2xl flex flex-col items-center justify-center transition-all group ${selectedCategoryId === cat.id ? 'bg-primary text-black shadow-glow scale-105' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}
               title={`Categoria: ${cat.name}`}
               aria-label={`Categoria: ${cat.name}`}
             >
                <Tag size={window.innerWidth < 640 ? 16 : window.innerWidth < 768 ? 18 : 20} />
                <span className="text-[6px] sm:text-[6px] md:text-[7px] font-black uppercase mt-1 opacity-60 truncate w-full text-center px-1">{cat.name}</span>
             </button>
           ))}
         </div>

         {/* Botões Administrativos na parte inferior da sidebar */}
         <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-white/5 w-full items-center">
            <button 
              onClick={() => setIsHistoryOpen(true)} 
              className="w-14 h-14 rounded-2xl bg-white/5 text-slate-500 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center group"
              title="Histórico de Turno"
            >
              <History size={22} className="group-hover:rotate-[-10deg] transition-transform" />
            </button>
            
            {/* Botão de configuração removido - Impressão direta */}
            
            <button 
              onClick={() => {
                const state = useStore.getState();
                const lastOrder = state.activeOrders.find(o => o.status === 'closed');
                if (lastOrder) {
                  console.log('[POS] Reimprimindo último pedido:', lastOrder.invoiceNumber);
                  handleDirectPrint(lastOrder, state.customers.find(c => c.id === lastOrder.customerId));
                } else {
                  addNotification('error', 'Nenhum pedido fechado encontrado para reimprimir.');
                }
              }}
              className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center group"
              title="Reimprimir Último"
            >
              <Printer size={20} className="group-hover:scale-110 transition-transform" />
            </button>
            
            <button 
              onClick={handleCashClosingClick}
              className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all flex flex-col items-center justify-center gap-1 group shadow-lg shadow-emerald-500/5"
              title="Fechar Caixa"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[12px] font-black text-white truncate block leading-tight">FECHO</span>
            </button>
         </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 sm:h-24 bg-slate-900/40 backdrop-blur-md border-b border-white/5 flex items-center px-6 sm:px-10 justify-between shrink-0">
           <div className="flex items-center gap-6">
              <button onClick={() => { setActiveTable(null); setActiveOrder(null); }} className="group flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                <Layout size={20} /> 
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Mesas</span>
              </button>
              {activeTableId && (
                <div className="flex items-center gap-4">
                   <div className="w-1 h-8 bg-primary rounded-full shadow-glow"></div>
                   <div className="flex items-center gap-6">
                      <div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Mesa {activeTableId}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{currentOrder?.subAccountName}</p>
                          {tableSubAccounts.length > 1 && (
                            <div className="flex gap-1">
                              {tableSubAccounts.map(sa => (
                                <button 
                                  key={sa.id}
                                  onClick={() => setActiveOrder(sa.id)}
                                  className={`w-2 h-2 rounded-full transition-all ${sa.id === activeOrderId ? 'bg-primary scale-125 shadow-glow' : 'bg-white/20 hover:bg-white/40'}`}
                                  title={sa.subAccountName}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 ml-4">
                        <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-xl">
                          <button 
                            onClick={() => setIsSubaccountModalOpen(true)}
                            className="p-2 bg-white/5 border border-white/5 rounded-lg text-slate-400 hover:text-primary transition-all"
                            title="Nova Subconta"
                          >
                            <UserPlus size={16} />
                          </button>
                          <button 
                            onClick={() => setIsTransferModalOpen(true)}
                            className="p-2 bg-white/5 border border-white/5 rounded-lg text-slate-400 hover:text-orange-500 transition-all"
                            title="Transferir Mesa"
                          >
                            <ArrowRightLeft size={16} />
                          </button>
                        </div>
                        
                        <div className="h-8 w-px bg-white/10"></div>
                        
                        <button 
                          onClick={() => {
                            if (activeTableId) {
                              closeTable(activeTableId);
                              setActiveTable(null);
                              setActiveOrder(null);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all group/close"
                          title="Fechar Mesa (Libertar mesa sem pedidos)"
                        >
                          <X size={16} className="group-hover/close:rotate-90 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Fechar Mesa</span>
                        </button>
                      </div>
                   </div>
                </div>
              )}
           </div>
           
          <div className="flex items-center gap-4">
              <div className="h-10 w-px bg-white/10 mx-2 hidden xl:block"></div>

              <div className="flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                <button 
                  onClick={handleOpenCustomerDisplay} 
                  className="flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all group" 
                  title="Abrir 2.º Ecrã"
                >
                  <Monitor size={18} className="group-hover:scale-110 transition-transform" />
                </button>

                {activeTableId && (
                  <button 
                    onClick={() => {
                      const currentMode = customerDisplayMode[activeTableId] || 'MARKETING';
                      const newMode = currentMode === 'MARKETING' ? 'ORDER_SUMMARY' : 'MARKETING';
                      setCustomerDisplayMode(activeTableId, newMode);
                      addNotification('info', `2.º Ecrã: Modo ${newMode === 'ORDER_SUMMARY' ? 'Pagamento' : 'Marketing'}`);
                    }}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                      customerDisplayMode[activeTableId] === 'ORDER_SUMMARY' 
                        ? 'bg-primary text-black shadow-glow' 
                        : 'bg-white/5 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <CreditCard size={16} />
                    {customerDisplayMode[activeTableId] === 'ORDER_SUMMARY' ? 'Mostrar Marketing' : 'Enviar p/ Pagamento'}
                  </button>
                )}
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6 no-scrollbar bg-slate-900/10" style={{ transform: `scale(${posZoomLevel})`, transformOrigin: 'top center' }}>
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 lg:mb-10 gap-4">
             <div>
               <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Explorar Itens</p>
               <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight mt-1">Selecione produtos para adicionar ao pedido</h3>
             </div>
             <div className="relative w-full max-w-xs md:max-w-sm lg:max-w-md group">
               <div className="absolute inset-0 rounded-2xl bg-primary/20 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
               <div className="relative flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/[0.06] border border-primary/40 rounded-xl sm:rounded-2xl shadow-glow">
                 <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-primary text-black shrink-0">
                   <Search size={window.innerWidth < 640 ? 14 : 16} />
                 </div>
                 <input 
                   type="text" 
                   placeholder="Pesquisar item por nome…" 
                   className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-slate-400" 
                   value={searchTerm} 
                   onChange={e => setSearchTerm(e.target.value)} 
                 />
               </div>
             </div>
           </div>
           {!activeTableId ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 animate-in fade-in zoom-in duration-700">
                 {tables.map((table) => {
                    const isOccupied = activeOrders.some(o => o.tableId === table.id && o.status === 'open');
                    return (
                      <button 
                        key={table.id} 
                        onClick={() => handleTableClick(table)}
                        className={`h-20 w-full rounded-md border-2 flex flex-col items-center justify-center p-2 transition-all active:scale-90 relative group ${!isOccupied ? 'border-white/5 bg-white/[0.02] hover:border-primary/50 hover:bg-white/[0.05]' : 'border-primary bg-primary/10 shadow-glow scale-105'}`}
                      >
                         <span className={`text-[6px] font-black uppercase tracking-[0.1em] ${!isOccupied ? 'text-slate-600' : 'text-primary/60'}`}>{table.name}</span>
                         <span className={`text-lg font-black italic tracking-tighter leading-none ${!isOccupied ? 'text-white' : 'text-primary'}`}>{table.id}</span>
                         
                         {isOccupied && (
                           <div className="absolute -top-1 -right-1 flex gap-0.5">
                             <div className="w-3 h-3 bg-primary text-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                               <Users size={8} />
                             </div>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 closeTable(table.id);
                               }}
                               className="w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all scale-0 group-hover:scale-100"
                               title="Fechar Mesa"
                             >
                               <X size={8} />
                             </button>
                           </div>
                         )}
                      </button>
                    );
                 })}
              </div>
           ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 md:gap-4 lg:gap-6 animate-in fade-in zoom-in duration-700 overflow-y-auto max-h-[calc(100vh-200px)] p-2 sm:p-3 md:p-4">
                 {filteredBySearch.map((dish) => (
                    <button 
                      key={dish.id} 
                      onClick={() => handleAddToOrder(dish)} 
                      className={`group bg-white/[0.03] rounded-xl sm:rounded-[1.5rem] lg:rounded-[2.5rem] border-2 overflow-hidden flex flex-col transition-all active:scale-95 relative hover:shadow-2xl ${lastAddedItemId === dish.id ? 'border-primary shadow-glow scale-105' : 'border-white/5 hover:border-primary/30 hover:bg-white/[0.06]'}`}
                    >
                       <div className="aspect-[4/4] w-full overflow-hidden relative">
                          <LazyImage src={dish.image} alt={dish.name} containerClassName="w-full h-full" className="group-hover:scale-110 transition-all duration-1000 ease-out" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                          
                          {lastAddedItemId === dish.id && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px] animate-in fade-in zoom-in duration-300">
                               <div className="bg-primary text-black p-2 sm:p-3 lg:p-4 rounded-full shadow-2xl scale-110">
                                  <Plus size={window.innerWidth < 640 ? 20 : window.innerWidth < 768 ? 24 : 32} strokeWidth={4} />
                               </div>
                            </div>
                          )}
                          
                          <div className="absolute bottom-4 sm:bottom-5 lg:bottom-6 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 text-left transform group-hover:translate-y-[-2px] sm:group-hover:translate-y-[-4px] transition-transform">
                             <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                               <div className="h-px w-4 sm:w-6 lg:w-8 bg-primary/50"></div>
                               <p className="text-[10px] sm:text-[11px] lg:text-[12px] font-black text-primary uppercase tracking-widest">{formatKz(dish.price)}</p>
                             </div>
                             <h4 className="text-white font-black text-[10px] sm:text-[11px] md:text-[12px] lg:text-sm xl:text-base truncate uppercase tracking-tighter leading-tight drop-shadow-lg">{dish.name}</h4>
                          </div>
                       </div>
                    </button>
                 ))}
              </div>
           )}
        </div>
      </div>

      {/* Painel Lateral do Pedido */}
      <div className={`w-full max-w-[280px] sm:max-w-[320px] md:max-w-[350px] lg:max-w-[400px] border-l border-white/5 bg-slate-950 flex flex-col h-full transition-all duration-500 shadow-2xl z-50 ${!activeOrderId ? 'translate-x-full' : ''}`}>
         {activeOrderId && (
           <>
             <div className="p-2 sm:p-3 md:p-4 lg:p-6 border-b border-white/5 bg-slate-900/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 sm:justify-between mb-2 sm:mb-4 md:mb-6 lg:mb-8 gap-2 sm:gap-4">
                   <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow"></div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter truncate">Pedido #{(typeof activeOrderId === 'string' ? activeOrderId.slice(-4) : 'N/A')}</h3>
                      </div>
                      {selectedSubAccount && (
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">{selectedSubAccount.subAccountName}</p>
                      )}
                   </div>
                   <div className="flex gap-1 sm:gap-2">
                     <button 
                       onClick={() => {
                         console.log('[POS] Imprimindo consulta...');
                         if (currentOrder) {
                           printTableReview(currentOrder, menu, settings);
                         }
                       }} 
                       className="p-2 sm:p-3 bg-white/5 text-slate-400 hover:text-primary rounded-lg sm:rounded-xl border border-white/10 transition-all"
                       title="Imprimir Consulta"
                     >
                        <Printer size={window.innerWidth < 640 ? 16 : 20}/>
                     </button>
                     {/* Botão de fecho melhorado */}
                     {selectedSubAccount && selectedSubAccount.subAccountName !== 'Principal' ? (
                       <button
                         onClick={() => handleCloseSubAccount(selectedSubAccount)}
                         className="p-3 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl border border-green-500/30 transition-all"
                         title="Fechar Subconta"
                       >
                         <Check size={20}/>
                       </button>
                     ) : (
                       <button 
                         onClick={() => { setActiveOrder(null); setActiveTable(null); }} 
                         className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all"
                         title="Fechar Mesa"
                       >
                         <X size={20}/>
                       </button>
                     )}
                   </div>
                 </div>
                
                {tableSubAccounts.length > 1 && (
                  <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-2">
                    {tableSubAccounts.map(sa => (
                      <div key={sa.id} className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveOrder(sa.id)}
                          className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${sa.id === activeOrderId ? 'bg-primary text-black border-primary shadow-glow' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}
                        >
                          {sa.subAccountName}
                        </button>
                        {sa.subAccountName !== 'Principal' && (
                          <>
                            <button
                              onClick={() => handleCloseSubAccount(sa)}
                              className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                              title="Fechar Subconta"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteSubAccount(sa.id)}
                              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Apagar Subconta"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6 space-y-1 sm:space-y-2 md:space-y-3 no-scrollbar bg-slate-950/50">
                {currentOrder?.items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 sm:gap-3 md:gap-4 opacity-40">
                    <ShoppingBasket size={window.innerWidth < 640 ? 24 : window.innerWidth < 768 ? 32 : 48} strokeWidth={1} />
                    <p className="text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]">Carrinho Vazio</p>
                  </div>
                ) : (
                  currentOrder?.items.map((item, idx) => {
                    const dish = menu.find(d => d.id === item.dish?.id);
                    return (
                      <div key={idx} className="flex flex-col gap-2 p-2 bg-white/[0.03] rounded-lg border border-white/5 group hover:border-primary/20 transition-all animate-in fade-in slide-in-from-right-4 duration-300">
                         {/* Nome do produto no topo */}
                         <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white text-[12px] uppercase tracking-tight whitespace-normal break-words flex-1">{dish?.name || `Produto ${idx + 1}`}</h4>
                            <span className="text-[10px] font-mono font-bold text-primary/80 ml-2">{formatKz(item.unitPrice * item.quantity)}</span>
                         </div>
                         
                         {/* Botões de ação embaixo */}
                         <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                               <button onClick={() => removeFromOrder(currentOrder?.id || '', idx)} className="w-6 h-6 rounded bg-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-colors">
                                 <Trash2 size={12} />
                               </button>
                               <button onClick={() => handleDecreaseQuantity(idx)} className="w-6 h-6 rounded bg-white/5 text-slate-500 hover:text-white transition-colors">-</button>
                               <span className="w-6 text-center font-black text-white text-[10px]">{item.quantity}</span>
                               <button onClick={() => handleIncreaseQuantity(idx)} className="w-6 h-6 rounded bg-primary text-black transition-transform active:scale-90">+</button>
                            </div>
                         </div>
                      </div>
                    );
                  })
                )}
             </div>

             <div className="p-2 sm:p-3 md:p-4 lg:p-6 bg-slate-900/40 backdrop-blur-md border-t border-white/5">
                <div className="space-y-1 sm:space-y-2 md:space-y-3 mb-2 sm:mb-4 md:mb-6 lg:mb-8">
                   <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Subtotal</span>
                      <span className="text-xs sm:text-sm font-bold font-mono">{formatKz(currentOrder?.total || 0)}</span>
                   </div>
                   <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Taxas (Incluso)</span>
                      <span className="text-xs sm:text-sm font-bold font-mono">{formatKz(0)}</span>
                   </div>
                   <div className="pt-2 sm:pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-[0.3em]">Total</span>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-primary text-glow">{formatKz(currentOrder?.total || 0)}</h3>
                   </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button 
                    onClick={() => setActiveOrder(null)} 
                    className="flex-1 py-3 sm:py-4 md:py-5 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Suspender
                  </button>
                  <button 
                    onClick={() => {
                      if (isFinalizing) return;
                      if (!currentOrder?.items.length) return;
                      setIsPaymentModalOpen(true);
                    }} 
                    disabled={!currentOrder?.items.length || isFinalizing} 
                    className="flex-[2] py-5 bg-primary text-black rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-glow hover:brightness-110 active:scale-[0.98] disabled:opacity-10 transition-all"
                  >
                    {isFinalizing ? 'Finalizando...' : 'Finalizar Pedido'}
                  </button>
                </div>
             </div>
           </>
         )}
      </div>

      {/* Modal de Subcontas */}
      {isSubaccountModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel p-8 rounded-[2.5rem] border border-white/10 animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-white italic uppercase mb-6">Nova Subconta</h3>
            <p className="text-slate-400 text-sm mb-6">Atribua um nome personalizado para identificar este grupo na Mesa {activeTableId}.</p>
            
            <input 
              type="text" 
              value={newSubAccountName}
              onChange={e => setNewSubAccountName(e.target.value)}
              placeholder="Ex: Grupo Amigos, Família Silva..."
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary mb-8"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAddSubAccount()}
            />

            <div className="flex gap-4">
              <button 
                onClick={() => setIsSubaccountModalOpen(false)}
                className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddSubAccount}
                className="flex-1 py-4 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-glow"
              >
                Criar Subconta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferência de Mesa */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
          <div className="max-w-2xl w-full glass-panel p-10 rounded-[2.5rem] border border-white/10 animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-white italic uppercase mb-2">Transferir Mesa {activeTableId}</h3>
            <p className="text-slate-400 text-sm mb-8">Selecione a mesa de destino. Todos os itens e subcontas serão movidos.</p>
            
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 mb-10 max-h-[40vh] overflow-y-auto p-2 no-scrollbar">
              {tables.filter(t => t.id !== activeTableId).map(table => {
                const isOccupied = activeOrders.some(o => o.tableId === table.id && o.status === 'open');
                return (
                  <button 
                    key={table.id}
                    onClick={() => setTransferTargetTableId(table.id)}
                    className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${transferTargetTableId === table.id ? 'border-primary bg-primary/20 scale-110 shadow-glow' : isOccupied ? 'border-orange-500/30 bg-orange-500/5 opacity-60 cursor-not-allowed' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                    disabled={isOccupied}
                  >
                    <span className="text-[10px] font-black text-white">{table.id}</span>
                    {isOccupied && <span className="text-[7px] font-black text-orange-500 uppercase">Ocupada</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => { setIsTransferModalOpen(false); setTransferTargetTableId(null); }}
                className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleTransferTable}
                disabled={!transferTargetTableId}
                className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-500/20 disabled:opacity-20"
              >
                Confirmar Transferência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico e Modal de Alteração de Pagamento */}
      {isHistoryOpen && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 z-[120] p-12 animate-in slide-in-from-right duration-500 shadow-2xl">
           <div className="flex justify-between items-center mb-12">
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Turno Atual</h3>
              <button onClick={() => setIsHistoryOpen(false)} className="p-4 bg-white/5 rounded-xl text-slate-500 hover:text-white"><X size={24}/></button>
           </div>
           <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-200px)] no-scrollbar pr-2">
              {closedToday.map(order => (
                <div key={order.id} className="p-8 bg-white/[0.03] rounded-[2rem] border border-white/5 flex flex-col gap-4 group hover:border-primary/40 transition-all">
                   <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase mb-2 tracking-widest">{order.invoiceNumber}</p>
                        <h4 className="text-white font-bold text-lg italic tracking-tighter">Mesa {order.tableId} • {formatKz(order.total)}</h4>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full mt-2 inline-block">{order.paymentMethod?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setOrderToChangeId(order.id); setIsChangePaymentModalOpen(true); }} className="p-4 bg-white/5 rounded-xl text-slate-400 hover:text-primary transition-all" title="Mudar Pagamento (Sem re-imprimir)"><ArrowRightLeft size={20}/></button>
                        <button 
                            onClick={() => {
                                console.log(`[POS] Solicitando reimpressão do pedido ${order.invoiceNumber}`);
                                handleDirectPrint(order, customers.find(c => c.id === order.customerId));
                            }} 
                            className="min-h-[44px] min-w-[44px] p-4 bg-white/5 rounded-xl text-slate-400 hover:text-primary transition-all border border-white/5" 
                            title="Reimprimir"
                        >
                            <Printer size={20}/>
                        </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Modal Alterar Pagamento - Puramente Administrativo */}
      {isChangePaymentModalOpen && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-8 backdrop-blur-xl animate-in zoom-in duration-300">
           <div className="glass-panel p-12 rounded-[3rem] w-full max-w-4xl border border-white/10 text-center">
              <div className="flex items-center justify-center gap-4 text-orange-500 mb-6 font-black uppercase text-xs tracking-widest bg-orange-500/10 w-fit mx-auto px-6 py-2 rounded-full border border-orange-500/20">
                 <Shield size={16}/> Atualização no Histórico de Fecho
              </div>
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-10">Mudar Forma de Pagamento</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {paymentConfigs.filter(c => c.isActive).map(method => (
                   <button 
                     key={method.id} 
                     onClick={() => handleChangePayment(method.type)}
                     className="p-10 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/10 transition-all transform active:scale-95"
                   >
                      <Banknote size={40} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{method.name}</span>
                   </button>
                 ))}
              </div>
              <button onClick={() => setIsChangePaymentModalOpen(false)} className="mt-10 text-slate-500 font-black uppercase text-xs tracking-widest hover:text-white transition-all">Cancelar</button>
           </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-8 backdrop-blur-xl animate-in zoom-in duration-300">
           <div className="glass-panel p-12 rounded-[3rem] w-full max-w-4xl border border-white/10 shadow-2xl animate-in zoom-in duration-500">
              
              {checkoutStep === 'METHOD' ? (
                <>
                  <div className="text-center mb-10">
                     <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Escolha o Meio de Pagamento</h3>
                     <p className="text-sm text-primary font-mono font-bold mt-2">Pagar: {formatKz(currentOrder?.total || 0)}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {paymentConfigs.filter(c => c.isActive).map(method => (
                       <button 
                         key={method.id} 
                         onClick={() => handleCheckoutFinal(method)}
                         className="min-h-[44px] min-w-[44px] p-4 sm:p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-2 sm:gap-4 hover:border-primary hover:bg-primary/5 transition-all transform active:scale-95"
                       >
                          <Banknote size={32} className="text-slate-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{method.name}</span>
                       </button>
                     ))}
                     {/* Fallback para Pagar Depois se não estiver configurado explicitamente */}
                     {!paymentConfigs.some(c => c.type === 'PAGAR_DEPOIS' && c.isActive) && (
                       <button 
                         onClick={() => handleCheckoutFinal('PAGAR_DEPOIS')}
                         className="min-h-[44px] min-w-[44px] p-4 sm:p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-2 sm:gap-4 hover:border-purple-500 hover:bg-purple-500/5 transition-all transform active:scale-95"
                       >
                          <User size={32} className="text-slate-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Pagar Depois</span>
                       </button>
                     )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-10">
                     <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Selecionar Cliente</h3>
                     <p className="text-sm text-purple-500 font-mono font-bold mt-2">Venda a Crédito: {formatKz(currentOrder?.total || 0)}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                     {customers.map(customer => (
                       <button 
                         key={customer.id} 
                         onClick={() => handleCheckoutFinal(selectedPaymentMethod!, customer.id)}
                         className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-start gap-2 hover:border-primary hover:bg-primary/5 transition-all text-left"
                       >
                          <span className="text-white font-bold text-sm uppercase">{customer.name}</span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo: {formatKz(customer.balance)}</span>
                       </button>
                     ))}
                  </div>
                  <button 
                    onClick={() => setCheckoutStep('METHOD')}
                    className="w-full mt-6 py-4 bg-white/5 border border-white/10 rounded-xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white"
                  >
                    Voltar aos Métodos
                  </button>
                </>
              )}

              <button 
                onClick={() => {
                  setIsCheckoutModalOpen(false);
                  setCheckoutStep('METHOD');
                }} 
                className="w-full mt-10 py-5 bg-white/5 border border-white/10 rounded-xl text-slate-500 font-black uppercase text-xs tracking-widest hover:text-white transition-all"
              >
                Cancelar Venda
              </button>
           </div>
        </div>
      )}

    {/* Modal de Pagamento */}
    <PaymentModal
      isOpen={isPaymentModalOpen}
      onClose={() => {
        setIsPaymentModalOpen(false);
        setSelectedSubAccount(null);
      }}
      onConfirm={async (paymentMethod: string, customerNif?: string) => {
        try {
          setIsFinalizing(true);
          setIsPaymentModalOpen(false);
          
          if (selectedSubAccount) {
            // 🛡️ FECHAMENTO DE SUBCONTA BLINDADO (PRESERVAR ITENS PARA DASHBOARD)
            console.log('[POS] Fechando subconta:', selectedSubAccount);
            
            // Usar store para finalizar (SQLite-first)
            await checkoutTable(selectedSubAccount.id, paymentMethod, selectedCustomerId);
            
            // Remover subconta da visualização (mesmo com itens, pois está sendo fechada)
            removeSubAccount(selectedSubAccount.id);
            
            // 🔄 FORÇAR ATUALIZAÇÃO DE ESTADO
            if (activeOrderId === selectedSubAccount.id) {
              setActiveOrder(null); // Limpar seleção se era a subconta ativa
            }
            
            addNotification('success', 'Subconta fechada com sucesso');
            
          } else {
            // 🛡️ FECHAMENTO DE PEDIDO NORMAL (EXISTENTE)
            if (currentOrder) {
              // Usar store para finalizar (SQLite-first)
              await checkoutTable(currentOrder.id, paymentMethod, selectedCustomerId);
              
              // Chamar função de impressão apenas uma vez
              await handleCheckoutFinal(paymentMethod as PaymentMethod, selectedCustomerId);
            }
          }
          
        } catch (error) {
          console.error('Erro ao finalizar pedido:', error);
          setIsFinalizing(false);
          alert('Erro ao finalizar pedido. Tente novamente.');
        } finally {
          setSelectedSubAccount(null);
        }
      }}
      orderNumber={selectedSubAccount?.id || currentOrder?.id || 'N/A'}
      totalAmount={selectedSubAccount?.total || currentOrder?.total || 0}
    />

  </div>
  );
  
  } catch (error) {
    console.error('[POS FATAL] Erro ao renderizar componente:', error);
    console.log('[POS DEBUG] Tipo do erro:', typeof error);
    console.log('[POS DEBUG] Mensagem:', error instanceof Error ? error.message : String(error));
    console.log('[POS DEBUG] Stack:', error instanceof Error ? error.stack : 'Sem stack');
    
    // Mostrar alert com informações detalhadas
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`ERRO NO POS: ${errorMessage}`);
    
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-red-500 text-2xl font-bold mb-4">Erro no POS</h1>
          <p className="text-white mb-2">Erro: {errorMessage}</p>
          <p className="text-gray-400 text-sm">Verifique o console para detalhes</p>
        </div>
      </div>
    );
  }
};

export default POS;




