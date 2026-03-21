// Configuração Global - MODO OFFLINE PRIMEIRO
// Este arquivo garante que toda a aplicação funcione 100% offline

export const OFFLINE_FIRST_CONFIG = {
  // Força modo offline em todos os componentes
  forceOfflineMode: true,
  
  // Desabilita todas as chamadas diretas ao Supabase
  disableSupabaseDirectCalls: true,
  
  // Usa apenas store local (SQLite)
  useLocalStorage: true,
  
  // Configurações de fallback
  fallbacks: {
    // Se falhar chamada externa, usar dados locais
    useLocalDataOnExternalFailure: true,
    
    // Cache de dados locais
    enableLocalCache: true,
    
    // Sync automático desabilitado
    disableAutoSync: true
  },
  
  // Logging para debug
  logging: {
    enabled: true,
    prefix: '[OFFLINE-FIRST]'
  }
};

// Hook global para forçar modo offline
export const useOfflineFirst = () => {
  console.log(OFFLINE_FIRST_CONFIG.logging.prefix, 'Modo offline ativado globalmente');
  
  return {
    isOffline: OFFLINE_FIRST_CONFIG.forceOfflineMode,
    useLocalData: OFFLINE_FIRST_CONFIG.useLocalStorage,
    disableExternalCalls: OFFLINE_FIRST_CONFIG.disableSupabaseDirectCalls
  };
};

// Interceptor para desabilitar chamadas Supabase
export const createOfflineSupabaseClient = () => {
  return {
    from: () => {
      console.warn(OFFLINE_FIRST_CONFIG.logging.prefix, 'Chamada Supabase.from() bloqueada - use store local');
      return {
        select: () => ({ data: [], error: new Error('Modo offline ativo') }),
        insert: () => ({ data: null, error: new Error('Modo offline ativo') }),
        update: () => ({ data: null, error: new Error('Modo offline ativo') }),
        delete: () => ({ data: null, error: new Error('Modo offline ativo') }),
        upsert: () => ({ data: null, error: new Error('Modo offline ativo') }),
        eq: () => ({ data: [], error: new Error('Modo offline ativo') }),
        order: () => ({ data: [], error: new Error('Modo offline ativo') }),
        single: () => ({ data: null, error: new Error('Modo offline ativo') })
      };
    },
    storage: {
      from: () => ({
        upload: () => ({ data: null, error: new Error('Modo offline ativo') }),
        getPublicUrl: () => ({ publicUrl: '' }),
        download: () => ({ data: null, error: new Error('Modo offline ativo') }),
        remove: () => ({ data: null, error: new Error('Modo offline ativo') })
      })
    }
  };
};
