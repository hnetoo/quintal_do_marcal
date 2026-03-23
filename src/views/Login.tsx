
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ChefHat, Delete, User, Shield, Wallet, Utensils, ArrowLeft, ChevronRight, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { User as UserType } from '../../types';
import appLogo from '../assets/logo.png';

const Login = () => {
  const { login, users, settings } = useStore();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.8));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || pin.length < 4) return;
    
    // Limpar notificações de erro anteriores antes de tentar login
    const { removeNotification, notifications } = useStore.getState();
    notifications.forEach(n => removeNotification((n as any).id));
    
    try {
      // EXCEÇÃO: Se for usuário OWNER, redirecionar para /owner/login
      if (selectedUser.role === 'OWNER') {
        navigate('/owner/login');
        return;
      }
      
      // Fixed: Removed rememberMe as login only accepts (pin, userId)
      const success = login(pin, selectedUser.id);
      if (success) {
        navigate('/dashboard'); // Redirecionamento explícito após sucesso
      } else {
        setError(true);
        setPin('');
      }
    } catch (e) {
      console.error("Erro crítico no login:", e);
      setError(true);
      setPin('');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield size={24} />;
      case 'CAIXA': return <Wallet size={24} />;
      case 'COZINHA': return <ChefHat size={24} />;
      case 'GARCOM': return <Utensils size={24} />;
      default: return <User size={24} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'from-purple-500 to-indigo-600';
      case 'CAIXA': return 'from-blue-500 to-cyan-600';
      case 'COZINHA': return 'from-orange-500 to-red-600';
      case 'GARCOM': return 'from-green-500 to-emerald-600';
      default: return 'from-slate-500 to-slate-700';
    }
  };

  const renderLogo = () => {
    return (
      <img 
        src={appLogo} 
        alt="REST IA" 
        className="w-auto h-24 mx-auto mb-8 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
      />
    );
  };

  // Garante que a lista de usuários não é nula
  const userList = users || [];

  return (
    <div className="h-screen w-full bg-background flex items-center justify-center relative overflow-hidden font-sans">
      {/* Controles de Zoom - Responsivos */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 bg-black/50 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
        <button 
          onClick={handleZoomIn}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          title="Aumentar zoom"
        >
          <ZoomIn size={20} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          title="Diminuir zoom"
        >
          <ZoomOut size={20} />
        </button>
        <div className="text-center text-white text-xs font-bold bg-white/10 rounded-lg px-2 py-1">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Background animado - responsivo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Container principal com zoom aplicado */}
      <div className="w-full max-w-lg z-10 px-6" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}>
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          {renderLogo()}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
            {settings?.restaurantName || 'REST IA'}
          </h1>
          <p className="text-slate-400 mt-2 font-medium tracking-widest text-xs sm:text-sm uppercase">Sistema de Gestão Inteligente</p>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-6 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden min-h-[400px] sm:min-h-[520px] flex flex-col justify-center">
            {!selectedUser ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-1">Quem está a entrar?</h2>
                        <p className="text-slate-400 text-sm">Selecione o seu perfil de operador</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {userList.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => setSelectedUser(user as any)}
                                className="group relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 transition-all duration-300 text-left overflow-hidden flex flex-col gap-2 sm:gap-3"
                            >
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <div className="scale-75 sm:scale-100">
                                      {getRoleIcon(user.role)}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm sm:text-base group-hover:text-primary transition-colors">{user.name}</p>
                                    <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{user.role}</p>
                                </div>
                                <ChevronRight className="absolute right-3 sm:right-4 bottom-3 sm:bottom-4 text-slate-700 group-hover:text-primary group-hover:translate-x-1 transition-all" size={window.innerWidth < 640 ? 16 : 20} />
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <button 
                        onClick={() => { setSelectedUser(null); setPin(''); setError(false); }}
                        className="absolute top-6 left-6 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="text-center mb-6 pt-4">
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${getRoleColor(selectedUser.role)} flex items-center justify-center text-white shadow-xl mx-auto mb-4 border-4 border-background`}>
                            <div className="scale-75 sm:scale-100">
                              {getRoleIcon(selectedUser.role)}
                            </div>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">{selectedUser.name}</h2>
                        <p className="text-primary text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase mt-1">{selectedUser.role}</p>
                    </div>

                    <div className="mb-6">
                        <div className={`flex justify-center gap-2 sm:gap-4 mb-4 ${error ? 'animate-shake' : ''}`}>
                            {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-primary border-primary shadow-glow' : 'border-slate-700'}`}></div>
                            ))}
                        </div>
                        {error && <p className="text-center text-red-500 text-xs font-bold uppercase tracking-tighter animate-pulse">PIN Incorreto</p>}
                        {!error && <p className="text-center text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest h-5">Introduza o seu PIN</p>}
                    </div>

                    <div className="flex justify-center mb-6">
                        <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                />
                                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${rememberMe ? 'bg-primary border-primary shadow-glow' : 'border-slate-700 bg-white/5 group-hover:border-slate-500'}`}>
                                    <Check size={window.innerWidth < 640 ? 12 : 16} className="text-black stroke-[4px]" />
                                </div>
                            </div>
                            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors ${rememberMe ? 'text-primary' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                Lembrar-me
                            </span>
                        </label>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8 px-2 sm:px-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button 
                            key={num} 
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-primary hover:text-black text-lg sm:text-xl font-bold text-slate-300 transition-all active:scale-95 border border-white/5"
                            >
                            {num}
                            </button>
                        ))}
                        <div className="h-12 sm:h-14"></div>
                        <button 
                            onClick={() => handleNumberClick('0')}
                            className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-primary hover:text-black text-lg sm:text-xl font-bold text-slate-300 transition-all active:scale-95 border border-white/5"
                        >
                            0
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all active:scale-95 border border-red-500/20"
                        >
                            <Delete size={window.innerWidth < 640 ? 16 : 20} />
                        </button>
                    </div>

                    <button 
                        onClick={(e) => handleLogin(e)}
                        disabled={pin.length !== 4}
                        className="w-full py-4 sm:py-5 bg-primary text-black rounded-xl sm:rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-glow disabled:opacity-30 hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                        AUTENTICAR
                    </button>
                </div>
            )}
        </div>
        <p className="text-center text-slate-600 text-[10px] mt-8 uppercase font-bold tracking-widest cursor-help hover:text-slate-400 transition-colors">
            HELDER NETO © 2025
        </p>
      </div>
    </div>
  );
};

export default Login;




