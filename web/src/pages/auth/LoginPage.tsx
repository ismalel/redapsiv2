import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const debugUsers = [
    { label: 'ADMIN', email: 'admin@redapsi.app', pass: 'Admin1234!' },
    { label: 'ADMIN_PSY', email: 'adminpsy@redapsi.app', pass: 'Admin1234!' },
    { label: 'PSY 1', email: 'psy1@redapsi.app', pass: 'Psych1234!' },
    { label: 'PSY 2', email: 'psy2@redapsi.app', pass: 'Psych1234!' },
  ];

  const fillForm = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const user = await login(data);
      if ((user as any)?.must_change_password) {
        navigate('/cambiar-contrasena');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      const code = error.response?.data?.error?.code;
      if (code === 'INVALID_CREDENTIALS') {
        setServerError('Correo o contraseña incorrectos.');
      } else {
        setServerError('Ocurrió un error al intentar iniciar sesión.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-brand-purple flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-10 border border-white/10">
        <header className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/logo.png" 
              alt="REDAPSI Logo" 
              className="h-20 w-auto object-contain" 
            />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
            Bienvenida
          </h1>
          <p className="text-slate-500 text-sm font-medium italic">
            Portal de Psicología Feminista
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
              {serverError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 flex items-center ml-1 uppercase tracking-[0.1em]">
                <User size={12} className="mr-1.5 text-brand-purple" />
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="tu@correo.com"
                className={`w-full px-5 py-3.5 rounded-2xl border-2 ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-brand-purple focus:bg-white'} outline-none transition-all duration-300 font-medium text-slate-700 text-sm`}
              />
              {errors.email && (
                <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 flex items-center ml-1 uppercase tracking-[0.1em]">
                <Lock size={12} className="mr-1.5 text-brand-purple" />
                Contraseña
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={`w-full px-5 py-3.5 rounded-2xl border-2 ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-brand-purple focus:bg-white'} outline-none transition-all duration-300 font-medium text-slate-700 text-sm`}
              />
              {errors.password && (
                <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pr-2">
            <button type="button" className="text-xs font-bold text-brand-purple hover:text-brand-purple-dark transition-colors underline underline-offset-4 decoration-2">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-black py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-brand-purple/30 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group uppercase tracking-widest text-sm mt-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Debug Access (Remove later)</p>
          <div className="grid grid-cols-2 gap-2">
            {debugUsers.map((u) => (
              <button
                key={u.label}
                type="button"
                onClick={() => fillForm(u.email, u.pass)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-purple hover:text-white hover:border-brand-purple transition-all"
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
        
        <footer className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.25em] leading-relaxed">
            Gestión Profesional <br />
            <span className="text-brand-purple font-black">REDAPSI © 2026</span>
          </p>
        </footer>
      </div>
    </div>
  );
};
