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
import { PsychologistProfilePage } from './pages/perfil/PsychologistProfilePage';
import { TerapiasListPage } from './pages/terapias/TerapiasListPage';
import { TherapyRequestsPage } from './pages/terapias/TherapyRequestsPage';
import { CreateTherapyPage } from './pages/terapias/CreateTherapyPage';
import { TherapyDetailPage } from './pages/terapias/TherapyDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                <AuthGuard>
                  <ChangePasswordPage />
                </AuthGuard>
              } />

              <Route path="perfil" element={
                <RoleGuard allowedRoles={['PSYCHOLOGIST', 'ADMIN_PSYCHOLOGIST']}>
                  <PsychologistProfilePage />
                </RoleGuard>
              } />

              <Route path="terapias" element={
                <RoleGuard allowedRoles={['PSYCHOLOGIST', 'ADMIN_PSYCHOLOGIST', 'ADMIN']}>
                  <TerapiasListPage />
                </RoleGuard>
              } />

              <Route path="terapias/nueva" element={
                <RoleGuard allowedRoles={['PSYCHOLOGIST', 'ADMIN_PSYCHOLOGIST']}>
                  <CreateTherapyPage />
                </RoleGuard>
              } />

              <Route path="terapias/:id" element={
                <RoleGuard allowedRoles={['PSYCHOLOGIST', 'ADMIN_PSYCHOLOGIST', 'ADMIN']}>
                  <TherapyDetailPage />
                </RoleGuard>
              } />

              <Route path="solicitudes" element={
                <RoleGuard allowedRoles={['PSYCHOLOGIST', 'ADMIN_PSYCHOLOGIST']}>
                  <TherapyRequestsPage />
                </RoleGuard>
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
