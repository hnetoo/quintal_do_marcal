import { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  ChevronRight, Grid3X3, Tag, History, Printer, LogOut, 
  Layout, Clock, Users, CircleDot, Plus, Search
} from 'lucide-react';

const POS = () => {
  const { 
    menu, categories, tables, activeOrders, addNotification,
    setActiveTable, setActiveOrder, addToOrder
  } = useStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('TODOS');
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { 
    style: 'currency', currency: 'AOA', maximumFractionDigits: 0 
  }).format(val);

  const handleTableClick = (table: any) => {
    setActiveTableId(table.id);
    setActiveTable(table.id);
    // Criar ordem se não existir
    const existingOrder = activeOrders.find((o: any) => o.tableId === table.id && o.status === 'open');
    if (!existingOrder) {
      const newOrder = {
        id: `order_${Date.now()}`,
        tableId: table.id,
        items: [],
        status: 'open',
        createdAt: new Date().toISOString()
      };
      // Adicionar ordem ao store
      const state = useStore.getState();
      state.activeOrders.push(newOrder);
      setActiveOrder(newOrder.id);
    } else {
      setActiveOrder(existingOrder.id);
    }
  };

  const handleAddToOrder = (dish: any) => {
    if (!activeTableId) return;
    
    const state = useStore.getState();
    const currentOrder = state.activeOrders.find(o => o.tableId === activeTableId && o.status === 'open');
    
    if (currentOrder) {
      const newItem = {
        dish,
        quantity: 1,
        id: `item_${Date.now()}`
      };
      
      // Adicionar item diretamente à ordem
      currentOrder.items.push(newItem);
      addNotification('success', `${dish.name} adicionado ao pedido`);
    }
  };

  const filteredBySearch = menu.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryId === 'TODOS' || dish.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-white font-sans select-none">
      
      {/* Botão de Toggle da Sidebar */}
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="fixed top-4 left-4 z-[9999] w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg flex items-center justify-center text-black shadow-lg hover:shadow-glow transition-all hover:scale-105 active:scale-95"
        title="Alternar Sidebar"
      >
        <ChevronRight size={16} className={`transition-transform ${!isSidebarCollapsed ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Sidebar Categorias Responsiva */}
      <div className={`${isSidebarCollapsed ? 'w-0' : 'w-16 md:w-24'} bg-slate-950 border-r border-white/5 flex flex-col items-center py-6 md:py-10 gap-4 md:gap-8 z-40 relative transition-all duration-300`}>
         <div className="flex-1 flex flex-col items-center gap-4 md:gap-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 w-full px-2">
           <button 
              onClick={() => setSelectedCategoryId('TODOS')} 
              className={`w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${selectedCategoryId === 'TODOS' ? 'bg-primary text-black shadow-glow scale-105' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}
              title="Ver todos os produtos"
           >
              <Grid3X3 size={16} className="md:size-24" />
           </button>
           {categories.map(cat => (
             <button 
               key={cat.id} 
               onClick={() => setSelectedCategoryId(cat.id)} 
               className={`w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-xl md:rounded-2xl flex flex-col items-center justify-center transition-all group ${selectedCategoryId === cat.id ? 'bg-primary text-black shadow-glow scale-105' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}
               title={`Categoria: ${cat.name}`}
             >
                <Tag size={16} className="md:size-20" />
                <span className="text-[6px] md:text-[7px] font-black uppercase mt-1 opacity-60 truncate w-full text-center px-1">{cat.name}</span>
             </button>
           ))}
         </div>

         {/* Botões Administrativos */}
         <div className="flex flex-col gap-3 md:gap-4 mt-auto pt-4 md:pt-6 border-t border-white/5 w-full items-center">
            <button 
              className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/5 text-slate-500 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center group"
              title="Histórico de Turno"
            >
              <History size={16} className="md:size-22 group-hover:rotate-[-10deg] transition-transform" />
            </button>
            
            <button 
              className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center group"
              title="Reimprimir Último"
            >
              <Printer size={16} className="md:size-20 group-hover:scale-110 transition-transform" />
            </button>
            
            <button 
              className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center group"
              title="Fechar Caixa"
            >
              <LogOut size={16} className="md:size-20 group-hover:scale-110 transition-transform" />
            </button>
         </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header Responsivo */}
        <header className="h-16 md:h-24 bg-slate-900/40 backdrop-blur-md border-b border-white/5 flex items-center px-4 md:px-10 justify-between shrink-0">
           <div className="flex items-center gap-3 md:gap-6">
              <button onClick={() => { setActiveTable(null); setActiveOrder(null); setActiveTableId(null); }} className="group flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-slate-400 hover:text-white transition-all">
                <Layout size={16} className="md:size-20" /> 
                <span className="text-[8px] md:text-[11px] font-black uppercase tracking-[0.2em] hidden sm:block">Mesas</span>
              </button>
           </div>
           
           <div className="flex items-center gap-3 md:gap-6">
              <div className="hidden sm:flex items-center gap-2 text-slate-400">
                <Clock size={16} className="md:size-20" />
                <span className="text-xs md:text-sm font-mono">{new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-slate-400">
                <Users size={16} className="md:size-20" />
                <span className="text-xs md:text-sm font-mono">Operador</span>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <CircleDot size={16} />
                <span className="text-xs md:text-sm font-bold">Caixa Aberto</span>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 bg-slate-900/10">
           <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 md:mb-10 gap-4">
             <div>
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Explorar Itens</p>
               <h3 className="text-lg md:text-xl font-black text-white tracking-tight mt-1">
                 {!activeTableId ? 'Selecione uma mesa' : `Mesa ${activeTableId} - Selecione produtos`}
               </h3>
             </div>
             
             {activeTableId && (
               <div className="relative w-full lg:w-auto max-w-xs md:max-w-sm group">
                 <div className="absolute inset-0 rounded-2xl bg-primary/20 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
                 <div className="relative flex items-center gap-3 px-4 py-2.5 bg-white/[0.06] border border-primary/40 rounded-2xl shadow-glow">
                   <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-black shrink-0">
                     <Search size={16} />
                   </div>
                   <input 
                     type="text" 
                     placeholder="Pesquisar item por nome…" 
                     className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-400" 
                     value={searchTerm} 
                     onChange={e => setSearchTerm(e.target.value)} 
                   />
                 </div>
               </div>
             )}
           </div>
           
           {!activeTableId ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                 {tables.map((table: any) => {
                    const isOccupied = activeOrders.some((o: any) => o.tableId === table.id && o.status === 'open');
                    return (
                      <button 
                        key={table.id} 
                        onClick={() => handleTableClick(table)}
                        className={`aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center gap-3 transition-all active:scale-90 relative group ${!isOccupied ? 'border-white/5 bg-white/[0.02] hover:border-primary/50 hover:bg-white/[0.05]' : 'border-primary bg-primary/10 shadow-glow scale-105'}`}
                      >
                         <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${!isOccupied ? 'text-slate-600' : 'text-primary/60'}`}>{table.name}</span>
                         <span className={`text-4xl md:text-5xl font-black italic tracking-tighter leading-none ${!isOccupied ? 'text-white' : 'text-primary'}`}>{table.id}</span>
                         
                         {isOccupied && (
                           <div className="absolute -top-3 -right-3 flex gap-1">
                             <div className="w-6 h-6 md:w-8 md:h-8 bg-primary text-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                               <Users size={12} className="md:size-14" />
                             </div>
                           </div>
                         )}
                      </button>
                    );
                 })}
              </div>
           ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                 {filteredBySearch.map((dish: any) => (
                    <button 
                      key={dish.id} 
                      onClick={() => handleAddToOrder(dish)} 
                      className={`group bg-white/[0.03] rounded-[2.5rem] border-2 overflow-hidden flex flex-col transition-all active:scale-95 relative hover:shadow-2xl border-white/5 hover:border-primary/30 hover:bg-white/[0.06]`}
                    >
                       <div className="aspect-[4/4] w-full overflow-hidden relative">
                          {dish.image && (
                            <>
                              <img 
                                src={dish.image} 
                                alt={dish.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 ease-out" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                            </>
                          )}
                          
                          <div className="absolute bottom-4 left-4 right-4 text-left transform group-hover:translate-y-[-4px] transition-transform">
                             <div className="flex items-center gap-2 mb-2">
                               <div className="h-px w-6 bg-primary/50"></div>
                               <p className="text-[10px] md:text-[12px] font-black text-primary uppercase tracking-widest">{formatKz(dish.price)}</p>
                             </div>
                             <h4 className="text-white font-black text-sm md:text-lg truncate uppercase tracking-tighter leading-tight drop-shadow-lg">{dish.name}</h4>
                          </div>
                          
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-primary/90 text-black p-2 rounded-lg">
                              <Plus size={16} />
                            </div>
                          </div>
                       </div>
                    </button>
                 ))}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default POS;
