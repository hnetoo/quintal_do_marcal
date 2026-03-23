import { createClient } from '@supabase/supabase-js';

// Configuração hardcoded para produção MSI - GARANTIR FUNCIONAMENTO
const SUPABASE_CONFIG = {
  url: 'https://tjqljzpbxucuiknxqnju.supabase.co',
  anonKey: 'sb_publishable_4_-dAijU63HvYN1p9Ri7aA_f-Cl2cBh'
};

// Tentar usar variáveis de ambiente primeiro (para desenvolvimento)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_CONFIG.url;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey;

console.log('[SUPABASE] Configuração:', {
  url: supabaseUrl,
  hasEnv: !!import.meta.env.VITE_SUPABASE_URL,
  isProduction: !import.meta.env.VITE_SUPABASE_URL
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE] Erro: Configuração não encontrada');
  console.error('[SUPABASE] Usando configuração hardcoded para produção');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'rest-ia-auth',
      storage: window.localStorage
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'rest-ia-app/1.0.8',
        'X-Platform': (window as any).__TAURI__ ? 'desktop' : 'web'
      }
    }
  }
);
