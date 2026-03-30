import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { MOCK_MENU, MOCK_CATEGORIES, MOCK_TABLES } from '../../constants';

/**
 * Componente para garantir que os dados do POS sejam inicializados corretamente
 * Evita que o terminal abra em branco
 */
const POSInitializer = () => {
  const { menu, categories, tables } = useStore();

  useEffect(() => {
    const isTauri = !!(window as any).__TAURI_INTERNALS__;
    console.log('[POS_INITIALIZER] 🔍 Verificando dados no ambiente:', isTauri ? 'TAURI WINDOWS' : 'WEB');
    
    // Verificar se os dados estão carregados com delay para garantir rehidratação
    const checkAndLoadData = () => {
      const state = useStore.getState();
      
      // Verificar menu
      if (menu.length === 0) {
        console.warn('[POS_INITIALIZER] ⚠️ Menu vazio, carregando dados mock...');
        if (state.setMenu) {
          state.setMenu(MOCK_MENU.map((m: any) => ({...m, isVisibleDigital: true, isFeatured: false})));
          console.log('[POS_INITIALIZER] ✅ Menu carregado com', MOCK_MENU.length, 'itens');
        }
      } else {
        console.log('[POS_INITIALIZER] ✓ Menu já carregado:', menu.length, 'itens');
      }
      
      // Verificar categorias
      if (categories.length === 0) {
        console.warn('[POS_INITIALIZER] ⚠️ Categorias vazias, carregando dados mock...');
        if (state.setCategories) {
          state.setCategories(MOCK_CATEGORIES.map((c: any) => ({...c, isVisibleDigital: true})));
          console.log('[POS_INITIALIZER] ✅ Categorias carregadas com', MOCK_CATEGORIES.length, 'itens');
        }
      } else {
        console.log('[POS_INITIALIZER] ✓ Categorias já carregadas:', categories.length, 'itens');
      }
      
      // Verificar mesas
      if (tables.length === 0) {
        console.warn('[POS_INITIALIZER] ⚠️ Mesas vazias, carregando dados mock...');
        if (state.setTables) {
          state.setTables(MOCK_TABLES);
          console.log('[POS_INITIALIZER] ✅ Mesas carregadas com', MOCK_TABLES.length, 'itens');
        }
      } else {
        console.log('[POS_INITIALIZER] ✓ Mesas já carregadas:', tables.length, 'itens');
      }
    };

    // Executar imediatamente
    checkAndLoadData();
    
    // Executar novamente após 500ms para garantir rehidratação do Zustand
    const timeoutId = setTimeout(checkAndLoadData, 500);
    
    return () => clearTimeout(timeoutId);
  }, [menu.length, categories.length, tables.length]);

  return null; // Componente invisível
};

export default POSInitializer;
