import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-app-bg flex">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-brand-purple text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold italic tracking-tighter">REDAPSI</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {/* Nav links will be added in future phases */}
          <div className="px-4 py-2 text-sm text-white/60 uppercase tracking-widest font-semibold">Menú</div>
          <div className="px-4 py-2 bg-white/10 rounded-lg">Dashboard</div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* TopBar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div className="text-slate-500 font-medium">Dashboard</div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600 hidden sm:inline-block">{user?.email}</span>
            <button 
              onClick={logout}
              className="text-sm font-medium text-brand-purple hover:text-brand-purple-dark px-3 py-1 border border-brand-purple/20 rounded-md hover:bg-brand-purple/5 transition-all"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
