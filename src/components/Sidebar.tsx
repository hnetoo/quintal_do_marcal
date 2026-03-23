
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, UtensilsCrossed, Package, Settings, 
  Banknote, Map as MapIcon, ChevronLeft, Menu, 
  LogOut, Target, BarChart3, FileText, HardDrive
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { PermissionKey } from '../../types';
import appLogo from '../assets/logo.png';

const Sidebar = () => {
  const { logout, currentUser, settings, updateSettings, notifications } = useStore();
  const isCollapsed = settings.isSidebarCollapsed;
  const notificationCount = notifications.length;

  const toggleSidebar = () => updateSettings({ isSidebarCollapsed: !isCollapsed });

  const navItems: { to: string; icon: React.ReactNode; label: string; permission?: PermissionKey }[] = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/pos", icon: <UtensilsCrossed size={20} />, label: "Terminal POS", permission: 'POS_SALES' },
    { to: "/profit-center", icon: <Target size={20} />, label: "Centro de Lucro", permission: 'FINANCE_VIEW' },
    { to: "/tables-layout", icon: <MapIcon size={20} />, label: "Mapa de Sala", permission: 'POS_SALES' },
    { to: "/inventory", icon: <Package size={20} />, label: "Menu & Stock", permission: 'STOCK_MANAGE' },
    { to: "/finance", icon: <Banknote size={20} />, label: "Financeiro Legal", permission: 'FINANCE_VIEW' },
    { to: "/analytics", icon: <BarChart3 size={20} />, label: "ANALYTICS", permission: 'FINANCE_VIEW' },
    { to: "/reports", icon: <FileText size={20} />, label: "RELATÓRIOS", permission: 'FINANCE_VIEW' },
    { to: "/database", icon: <HardDrive size={20} />, label: "Base de Dados", permission: 'SYSTEM_CONFIG' },
    { to: "/settings", icon: <Settings size={20} />, label: "Sistema", permission: 'SYSTEM_CONFIG' },
  ];

  const filteredItems = navItems.filter(item => {
    if (!currentUser) return false;
    if (!item.permission) return true;
    return currentUser.permissions.includes(item.permission);
  });

  return (
    <aside className={`${isCollapsed ? 'w-16 tablet:w-20' : 'w-56 tablet:w-72'} h-full glass-panel flex flex-col z-20 transition-all duration-300 border-r border-white/5 bg-slate-950`}>
      <div className="p-4 tablet:p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 tablet:gap-4 min-w-0">
            <img 
                src={settings.appLogoUrl || appLogo} 
                alt="Logo" 
                className="w-8 h-8 tablet:w-12 tablet:h-12 object-contain rounded-xl shrink-0 shadow-glow border border-white/10 bg-white/5 p-1" 
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs tablet:text-sm font-bold text-white truncate">Rest-IA</span>
              <span className="text-[8px] tablet:text-[10px] text-slate-400 truncate">POS System</span>
            </div>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 px-2 tablet:px-4 space-y-2 mt-2 tablet:mt-4 overflow-y-auto no-scrollbar">
        {filteredItems.map(item => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            className={({ isActive }) => `flex items-center gap-3 tablet:gap-4 px-3 tablet:px-5 py-3 tablet:py-4 rounded-xl tablet:rounded-2xl transition-all ${isActive ? 'bg-primary text-black shadow-glow' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
          >
            <div className="shrink-0">{item.icon}</div>
            {!isCollapsed && <span className="text-[9px] tablet:text-[10px] font-black uppercase tracking-[0.15em] truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 tablet:p-6 border-t border-white/5 bg-black/20">
        <div className="mb-4 px-3 tablet:px-5">
           <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{currentUser?.role}</span>
           </div>
           {!isCollapsed && <p className="text-[9px] tablet:text-[10px] font-bold text-white truncate">{currentUser?.name}</p>}
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 tablet:gap-4 px-3 tablet:px-5 py-3 tablet:py-4 text-red-500 hover:bg-red-500/10 transition-all rounded-xl tablet:rounded-2xl border border-transparent hover:border-red-500/20">
          <LogOut size={18} className="tablet:size-20" />
          {!isCollapsed && <span className="text-[9px] tablet:text-[10px] font-black uppercase tracking-widest">Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

