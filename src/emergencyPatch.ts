// EMERGENCY PATCH - Desabilita forceRealSync imediatamente
// Executar no console do browser para corrigir o problema

(function() {
  console.log('🔥 EMERGENCY PATCH - Desabilitando forceRealSync...');
  
  // Desabilitar todas as funções problemáticas
  if (typeof window !== 'undefined') {
    // Criar mock para forceRealSyncService
    window.forceRealSyncService = {
      forceRealSync: async () => {
        console.log('[EMERGENCY] forceRealSync desabilitado - modo offline');
        return Promise.resolve();
      },
      createRealProduct: async (product) => {
        console.log('[EMERGENCY] createRealProduct desabilitado - usando store local');
        // Usar store local em vez de Supabase
        if (window.useStore) {
          const store = window.useStore.getState();
          const localProduct = {
            ...product,
            id: `dish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            categoryId: product.category_id
          };
          store.addDish(localProduct);
          console.log('[EMERGENCY] Produto criado localmente:', localProduct);
          return localProduct;
        }
        return Promise.reject(new Error('Store não disponível'));
      },
      createRealCategories: async () => {
        console.log('[EMERGENCY] createRealCategories desabilitado - modo offline');
        return Promise.resolve();
      }
    };
    
    console.log('✅ EMERGENCY PATCH aplicado com sucesso!');
    console.log('🔄 Recarregue a página e tente criar produto novamente');
  }
})();
