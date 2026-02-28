import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './guards/AuthGuard';
import { GuestGuard } from './guards/GuestGuard';
import { RoleGuard } from './guards/RoleGuard';
import { AppShell } from './components/layout/AppShell';

// Pages - Lazy loading will be implemented as they grow
import { LoginPage } from './pages/auth/LoginPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/iniciar-sesion" element={
              <GuestGuard>
                <LoginPage />
              </GuestGuard>
            } />

            {/* Protected Routes */}
            <Route path="/" element={
              <AuthGuard>
                <RoleGuard allowedRoles={['ADMIN', 'PSYCHOLOGIST', 'ADMIN_PSYCHOLOGIST']}>
                  <AppShell />
                </RoleGuard>
              </AuthGuard>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Bienvenida a REDAPSI</h2>
                  <p className="text-slate-600">Has iniciado sesión correctamente.</p>
                </div>
              } />
              
              <Route path="cambiar-contrasena" element={
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md mx-auto mt-12">
                  <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">Cambiar Contraseña</h2>
                  <p className="text-slate-600 text-sm mb-6 text-center italic">Este formulario se implementará para usuarios con el marcador must_change_password=true.</p>
                </div>
              } />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
