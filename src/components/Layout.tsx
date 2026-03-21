import React, { useState } from 'react';
import { ChevronRight, Menu, X } from 'lucide-react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  title,
  subtitle,
  sidebar,
  header,
  className = ""
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-white font-sans select-none">
      
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[9999] w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-black shadow-lg hover:shadow-glow transition-all hover:scale-105 active:scale-95"
        title="Menu"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="hidden lg:flex fixed top-4 left-4 z-[9999] w-12 h-12 bg-primary rounded-lg items-center justify-center text-black shadow-lg hover:shadow-glow transition-all hover:scale-105 active:scale-95"
        title="Alternar Sidebar"
      >
        <ChevronRight size={20} className={`transition-transform ${!isSidebarCollapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Sidebar */}
      {sidebar && (
        <>
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar Container */}
          <div className={`
            fixed lg:relative top-0 left-0 z-50
            ${isSidebarCollapsed ? 'w-0' : 'w-64 lg:w-24 xl:w-24'}
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            bg-slate-950 border-r border-white/5 flex flex-col transition-all duration-300
            h-full overflow-hidden
          `}>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
              {sidebar}
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden relative ${sidebar ? (isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-24') : ''}`}>
        
        {/* Header */}
        {(title || subtitle || header) && (
          <div className="header-main">
            <div className="max-w-7xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  {title && (
                    <h1 className="text-responsive-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-slate-400 text-xs md:text-sm mt-1">{subtitle}</p>
                  )}
                </div>
                {header && (
                  <div className="flex items-center gap-3 md:gap-4">
                    {header}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="content-container">
          <div className="content-scroll">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  hover?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  title,
  subtitle,
  className = "",
  hover = true
}) => {
  return (
    <div className={`
      card-responsive
      ${hover ? 'group' : ''}
      ${className}
    `}>
      {(title || subtitle) && (
        <div className="p-4 md:p-6 border-b border-white/5">
          {title && (
            <h3 className="text-responsive-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-slate-400 text-xs md:text-sm">{subtitle}</p>
          )}
        </div>
      )}
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  type?: 'products' | 'categories' | 'default';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = "",
  type = 'default'
}) => {
  const gridClasses = {
    products: 'products-grid',
    categories: 'categories-grid',
    default: 'grid-responsive'
  };

  return (
    <div className={`${gridClasses[type]} ${className}`}>
      {children}
    </div>
  );
};

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="modal-responsive">
      <div className={`modal-content-responsive ${sizeClasses[size]}`}>
        {/* Header */}
        {title && (
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/10 bg-slate-800/50">
            <h3 className="text-responsive-lg font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 md:p-6 max-h-[calc(90vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ResponsiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = "",
  type = 'button'
}) => {
  const variantClasses = {
    primary: 'bg-primary text-black hover:brightness-110 shadow-lg shadow-primary/20',
    secondary: 'bg-slate-700/50 text-white hover:bg-slate-600/50',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white',
    ghost: 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        btn-responsive rounded-lg font-medium transition-all duration-200
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default ResponsiveLayout;
