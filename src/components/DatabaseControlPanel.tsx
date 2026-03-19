import React, { useState, useEffect } from 'react';
import { Database, Trash2, Download, Upload, RefreshCw, HardDrive, Calendar, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { localDataService } from '../lib/localDataService';
import { useStore } from '../store/useStore';

const DatabaseControlPanel: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<string>('Nunca');
  const { addNotification } = useStore();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const databaseStats = await localDataService.getDatabaseStats();
      setStats(databaseStats);
      setLastCleanup(databaseStats.lastCleanup || 'Nunca');
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      addNotification('error', 'Erro ao carregar estatísticas da base de dados');
    } finally {
      setLoading(false);
    }
  };

  const handleForceCleanup = async () => {
    if (!confirm('Tem certeza que deseja executar a limpeza manual? Esta ação irá remover dados antigos e não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    try {
      await localDataService.forceCleanup();
      addNotification('success', 'Limpeza manual concluída com sucesso');
      await loadStats();
    } catch (error) {
      console.error('Erro na limpeza manual:', error);
      addNotification('error', 'Erro ao executar limpeza manual');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const exportData = await localDataService.exportData();
      
      // Criar blob e download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasca_vereda_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addNotification('success', 'Dados exportados com sucesso');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      addNotification('error', 'Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!confirm('Importar dados irá substituir os dados atuais. Deseja continuar?')) {
        return;
      }

      setLoading(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        await localDataService.importData(data);
        addNotification('success', 'Dados importados com sucesso');
        await loadStats();
      } catch (error) {
        console.error('Erro ao importar dados:', error);
        addNotification('error', 'Erro ao importar dados. Verifique o formato do arquivo.');
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };

  const getCleanupStatus = () => {
    if (!lastCleanup || lastCleanup === 'Nunca') return { status: 'warning', text: 'Nunca executada', color: 'text-orange-500' };
    
    const cleanupDate = new Date(lastCleanup);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - cleanupDate.getFullYear()) * 12 + (now.getMonth() - cleanupDate.getMonth());
    
    if (monthsDiff === 0) return { status: 'success', text: 'Atualizada', color: 'text-green-500' };
    if (monthsDiff <= 1) return { status: 'info', text: 'Recente', color: 'text-blue-500' };
    return { status: 'warning', text: 'Antiga', color: 'text-orange-500' };
  };

  const cleanupStatus = getCleanupStatus();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Database className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Base de Dados Local</h2>
            <p className="text-slate-400">Gestão e manutenção do SQLite</p>
          </div>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="text-slate-400" size={20} />
            <span className="text-slate-400 text-sm">Armazenamento</span>
          </div>
          <p className="text-xl font-bold text-white">{stats?.size || 'N/A'}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-slate-400" size={20} />
            <span className="text-slate-400 text-sm">Última Limpeza</span>
          </div>
          <p className={`text-xl font-bold ${cleanupStatus.color}`}>{cleanupStatus.text}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Database className="text-slate-400" size={20} />
            <span className="text-slate-400 text-sm">Pedidos</span>
          </div>
          <p className="text-xl font-bold text-white">{stats?.orders || 0}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-slate-400" size={20} />
            <span className="text-slate-400 text-sm">Despesas</span>
          </div>
          <p className="text-xl font-bold text-white">{stats?.expenses || 0}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="glass-panel p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings size={20} className="text-primary" />
          Operações de Manutenção
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleForceCleanup}
            disabled={loading}
            className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-all disabled:opacity-50"
          >
            <Trash2 size={20} />
            <div className="text-left">
              <p className="font-semibold">Limpeza Manual</p>
              <p className="text-xs opacity-80">Remover dados antigos (3+ meses)</p>
            </div>
          </button>

          <button
            onClick={handleExportData}
            disabled={loading}
            className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-all disabled:opacity-50"
          >
            <Download size={20} />
            <div className="text-left">
              <p className="font-semibold">Exportar Dados</p>
              <p className="text-xs opacity-80">Backup completo em JSON</p>
            </div>
          </button>

          <button
            onClick={handleImportData}
            disabled={loading}
            className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg hover:bg-green-500/20 transition-all disabled:opacity-50"
          >
            <Upload size={20} />
            <div className="text-left">
              <p className="font-semibold">Importar Dados</p>
              <p className="text-xs opacity-80">Restaurar de backup</p>
            </div>
          </button>

          <div className="flex items-center gap-3 p-4 bg-slate-500/10 border border-slate-500/30 text-slate-400 rounded-lg">
            <CheckCircle size={20} />
            <div className="text-left">
              <p className="font-semibold">Limpeza Automática</p>
              <p className="text-xs opacity-80">Mensal (1º dia do mês)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="glass-panel p-6 rounded-xl border-l-4 border-l-blue-500">
        <h3 className="text-lg font-semibold text-white mb-3">Informações do Sistema</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Tipo de Base de Dados:</span>
            <span className="text-white font-medium">SQLite Local</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Localização:</span>
            <span className="text-white font-medium">Pasta da Aplicação</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Modo Offline:</span>
            <span className="text-green-400 font-medium">Sempre Ativo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Sincronização:</span>
            <span className="text-orange-400 font-medium">Desativada</span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {cleanupStatus.status === 'warning' && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-center gap-3 text-orange-400">
            <AlertTriangle size={20} />
            <div>
              <p className="font-semibold">Atenção: Limpeza Necessária</p>
              <p className="text-sm">A limpeza automática não foi executada recentemente. Considere executar uma limpeza manual para otimizar o espaço.</p>
            </div>
          </div>
        </div>
      )}

      {cleanupStatus.status === 'success' && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">Sistema Otimizado</p>
              <p className="text-sm">A base de dados está atualizada e otimizada.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseControlPanel;
