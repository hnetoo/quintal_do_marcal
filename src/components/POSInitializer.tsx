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
    console.log('[POS_INITIALIZER] Verificando dados...');
    
    // Verificar se os dados estão carregados
    if (menu.length === 0) {
      console.warn('[POS_INITIALIZER] Menu vazio, carregando dados mock...');
      // Forçar atualização através do store
      const state = useStore.getState();
      if (state.setMenu) {
        state.setMenu(MOCK_MENU.map((m: any) => ({...m, isVisibleDigital: true, isFeatured: false})));
      }
    }
    
    if (categories.length === 0) {
      console.warn('[POS_INITIALIZER] Categorias vazias, carregando dados mock...');
      const state = useStore.getState();
      if (state.setCategories) {
        state.setCategories(MOCK_CATEGORIES.map((c: any) => ({...c, isVisibleDigital: true})));
      }
    }
    
    if (tables.length === 0) {
      console.warn('[POS_INITIALIZER] Mesas vazias, carregando dados mock...');
      const state = useStore.getState();
      if (state.setTables) {
        state.setTables(MOCK_TABLES);
      }
    }
    
    console.log('[POS_INITIALIZER] Dados verificados:', {
      menu: menu.length,
      categories: categories.length,
      tables: tables.length
    });
  }, [menu.length, categories.length, tables.length]);

  return null; // Componente invisível
};

export default POSInitializer;
