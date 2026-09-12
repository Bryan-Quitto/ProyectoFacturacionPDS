import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, ShoppingCart, FileText, LogOut, UserCheck } from 'lucide-react';

export type TabType = 'pos' | 'invoices';

interface AppLayoutProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  children,
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Barra Superior / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo y Nombre del Sistema */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl flex items-center justify-center shadow-sm">
                <Store className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Punto de Venta — Facturación
                </h1>
                <p className="text-xs text-slate-500 leading-none mt-0.5">
                  Sistema de Emisión de Facturas y Control de Inventario
                </p>
              </div>
            </div>

            {/* Pestañas de Navegación */}
            <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => onSelectTab('pos')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'pos'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Nueva Venta (POS)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('invoices')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'invoices'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Historial de Facturas</span>
              </button>
            </nav>

            {/* Usuario Activo y Cierre de Sesión */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Vendedor: {user?.fullName || user?.username || 'Usuario'}
                </span>
                <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-0.5">
                  Rol: Vendedor
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Cerrar sesión"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>

      {/* Pie de Página */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Proyecto Académico — Patrones de Diseño de Software (PDS) · UTA 2026</span>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Servicio en línea</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
