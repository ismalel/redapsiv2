import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../utils/role-permissions';

export const RoleGuard: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  if (user.role === 'CONSULTANT') {
    const handleLogout = () => {
      logout();
      window.location.href = '/iniciar-sesion';
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-app-bg px-4 text-center font-sans">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-lg w-full">
          <div className="flex justify-center mb-8">
            <img 
              src="/assets/logo.png" 
              alt="REDAPSI Logo" 
              className="h-24 w-auto grayscale opacity-50" 
            />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Usa la aplicación móvil</h1>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed italic">
            Como consultante, debes utilizar nuestra aplicación para Android o iOS para gestionar tus terapias y sesiones.
          </p>
          <button 
            onClick={handleLogout}
            className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-black py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl shadow-brand-purple/20 uppercase tracking-widest text-sm"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const isAuthorized = allowedRoles.some(role => hasRole(user, role));

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
