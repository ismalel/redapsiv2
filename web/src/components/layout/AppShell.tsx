import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, User as UserIcon, LogOut, Users, Inbox, Calendar as CalendarIcon } from 'lucide-react';
import { hasRole } from '../../utils/role-permissions';

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/perfil')) return 'Mi Perfil';
    if (path.includes('/terapias/nueva')) return 'Nueva Terapia';
    if (path.includes('/terapias')) return 'Mis Terapias';
    if (path.includes('/sesiones')) return 'Agenda de Sesiones';
    if (path.includes('/solicitudes')) return 'Solicitudes';
    if (path.includes('/cambiar-contrasena')) return 'Cambiar Contraseña';
    return 'REDAPSI';
  };

  return (
    <div className="h-screen bg-app-bg flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-brand-purple text-white hidden md:flex flex-col shadow-2xl z-20 h-full">
        <div className="p-8 border-b border-white/10 flex items-center space-x-3 flex-shrink-0">
          <div className="bg-white/10 p-2 rounded-xl border border-white/20">
             <h1 className="text-2xl font-black italic tracking-tighter leading-none">R</h1>
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter">REDAPSI</h1>
        </div>
        
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] text-white/40 uppercase tracking-[0.25em] font-black">Menú Principal</div>
          
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm tracking-wide ${
                isActive ? 'bg-white text-brand-purple shadow-xl shadow-black/10' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          {(hasRole(user, 'PSYCHOLOGIST') || hasRole(user, 'ADMIN')) && (
            <>
              <NavLink 
                to="/terapias" 
                className={({ isActive }) => 
                  `flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm tracking-wide ${
                    isActive ? 'bg-white text-brand-purple shadow-xl shadow-black/10' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Users size={20} />
                <span>Mis Terapias</span>
              </NavLink>

              <NavLink 
                to="/sesiones" 
                className={({ isActive }) => 
                  `flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm tracking-wide ${
                    isActive ? 'bg-white text-brand-purple shadow-xl shadow-black/10' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <CalendarIcon size={20} />
                <span>Sesiones</span>
              </NavLink>
            </>
          )}

          {hasRole(user, 'PSYCHOLOGIST') && (
            <>
              <NavLink 
                to="/solicitudes" 
                className={({ isActive }) => 
                  `flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm tracking-wide ${
                    isActive ? 'bg-white text-brand-purple shadow-xl shadow-black/10' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Inbox size={20} />
                <span>Solicitudes</span>
              </NavLink>

              <NavLink 
                to="/perfil" 
                className={({ isActive }) => 
                  `flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm tracking-wide ${
                    isActive ? 'bg-white text-brand-purple shadow-xl shadow-black/10' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <UserIcon size={20} />
                <span>Mi Perfil</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="bg-brand-purple-dark/40 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-white overflow-hidden">
                   {user?.avatar_url ? (
                      <img src={`${import.meta.env.VITE_API_BASE_URL || ''}${user.avatar_url}`} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      user?.name?.[0]?.toUpperCase()
                   )}
                </div>
                <div className="flex-1 overflow-hidden">
                   <p className="text-xs font-black truncate">{user?.name}</p>
                   <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest truncate">{user?.role}</p>
                </div>
             </div>
             <button 
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white text-brand-purple rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-yellow hover:text-slate-800 transition-all duration-300 shadow-lg"
              >
                <LogOut size={14} />
                <span>Cerrar sesión</span>
              </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm z-10">
          <div className="text-slate-800 font-black text-lg tracking-tight uppercase tracking-[0.1em]">{getPageTitle()}</div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex flex-col items-end">
               <span className="text-xs font-black text-slate-800 leading-none mb-1">{user?.name}</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.email}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-50 flex items-center justify-center overflow-hidden">
               {user?.avatar_url ? (
                  <img src={`${import.meta.env.VITE_API_BASE_URL || ''}${user.avatar_url}`} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                  <UserIcon size={20} className="text-slate-300" />
               )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-10 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
