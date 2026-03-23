import { invoke } from '@tauri-apps/api/core';

export interface SystemCheckResult {
  success: boolean;
  message: string;
  issues: string[];
}

export async function checkSystemRequirements(): Promise<SystemCheckResult> {
  try {
    const result = await invoke<string>('check_system_requirements');
    return {
      success: true,
      message: result,
      issues: []
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao verificar requisitos do sistema',
      issues: [error as string]
    };
  }
}

export async function showSystemDialog() {
  const check = await checkSystemRequirements();
  
  if (!check.success) {
    console.error('❌ Problemas no sistema:', check.issues);
    
    // Mostrar diálogo de erro usando console e fallback
    console.error(`Rest-IA - Problemas de Sistema:\n\n${check.issues.join('\n')}`);
    
    // Fallback para alert
    if (typeof alert !== 'undefined') {
      alert(`Rest-IA - Problemas de Sistema:\n\n${check.issues.join('\n')}\n\n` +
        'Soluções recomendadas:\n' +
        '1. Instale Microsoft Edge WebView2 Runtime\n' +
        '2. Instale Microsoft Visual C++ Redistributable 2019 ou superior\n' +
        '3. Reinicie o computador após instalação');
    }
  } else {
    console.log('✅ Sistema OK:', check.message);
  }
}
