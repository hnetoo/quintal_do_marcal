#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "console"
)]

use serde_json::Value;
use tauri::Manager;

#[tauri::command]
async fn check_configuration() -> Result<bool, String> {
    // Versão simplificada - sempre retorna false para forçar setup
    Ok(false)
}

#[tauri::command]
async fn initialize_database() -> Result<String, String> {
    // Versão simplificada - apenas retorna sucesso
    Ok("Banco de dados inicializado com sucesso".to_string())
}

#[tauri::command]
async fn get_app_version() -> Result<String, String> {
    Ok("1.0.6".to_string())
}

#[tauri::command]
async fn save_config(supabase_url: String, _supabase_key: String) -> Result<String, String> {
    // Versão simplificada - apenas log
    println!("Configuração salva: URL={}, Key={}", supabase_url, "****");
    Ok("Configuração salva com sucesso".to_string())
}

#[tauri::command]
async fn load_config() -> Result<Value, String> {
    // Versão simplificada - retorna configuração vazia
    Ok(serde_json::json!({
        "supabase_url": "",
        "supabase_key": ""
    }))
}

#[tauri::command]
async fn check_system_requirements() -> Result<String, String> {
    let mut issues = Vec::new();
    
    // Verificar Windows version
    #[cfg(windows)]
    {
        use std::process::Command;
        
        // Verificar WebView2
        let webview_check = Command::new("reg")
            .args(["query", "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{56F18EAD-BE22-465A-9395-30DC2D6EF638}", "/v", "pv"])
            .output();
        
        match webview_check {
            Ok(output) if output.status.success() => {
                // WebView2 encontrado
            }
            Ok(_) => {
                issues.push("WebView2 Runtime não encontrado. A aplicação pode não funcionar corretamente.".to_string());
            }
            Err(_) => {
                issues.push("Não foi possível verificar o WebView2 Runtime.".to_string());
            }
        }
        
        // Verificar Visual C++ Redistributable
        let vc_check = Command::new("reg")
            .args(["query", "HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\TypeLib", "/f", "*Microsoft*VC*"])
            .output();
        
        match vc_check {
            Ok(output) if output.status.success() && !output.stdout.is_empty() => {
                // VC++ Redistributable encontrado
            }
            _ => {
                issues.push("Visual C++ Redistributable pode não estar instalado. Instale o Microsoft Visual C++ Redistributable 2019 ou superior.".to_string());
            }
        }
    }
    
    if issues.is_empty() {
        Ok("Todos os requisitos do sistema estão OK".to_string())
    } else {
        Err(format!("Problemas encontrados:\n{}", issues.join("\n")))
    }
}

fn main() {
    println!("🚀 Iniciando Rest-IA Desktop...");

    let result = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init()) // 🔥 ADICIONADO PLUGIN DIALOG
        .setup(|app| {
            // DevTools desativado para evitar erros
            #[cfg(debug_assertions)]
            {
                // Apenas em modo debug
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_configuration,
            initialize_database,
            get_app_version,
            save_config,
            load_config,
            check_system_requirements
        ])
        .run(tauri::generate_context!());

    match result {
        Ok(_) => println!("✅ Rest-IA iniciado com sucesso!"),
        Err(e) => {
            eprintln!("❌ Erro ao iniciar aplicação Tauri: {}", e);
            // Tentar mostrar diálogo de erro se possível
            std::process::exit(1);
        }
    }
}
