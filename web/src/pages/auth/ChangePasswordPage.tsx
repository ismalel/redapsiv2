import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'La contraseña actual es requerida'),
  new_password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirm_password: z.string().min(1, 'La confirmación es requerida'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await apiClient.put('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      navigate('/dashboard');
    } catch (error: any) {
      const code = error.response?.data?.error?.code;
      if (code === 'INVALID_CURRENT_PASSWORD') {
        setServerError('La contraseña actual es incorrecta.');
      } else {
        setServerError('Ocurrió un error al intentar cambiar la contraseña.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-brand-purple p-6 text-center text-white">
          <h2 className="text-xl font-bold">Cambiar Contraseña</h2>
          <p className="text-purple-100 text-sm mt-1">Por seguridad, debes actualizar tu contraseña</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
                {serverError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Contraseña actual
              </label>
              <input
                {...register('current_password')}
                type="password"
                className={`w-full px-4 py-3 rounded-lg border ${errors.current_password ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-brand-purple'} focus:ring-4 focus:ring-brand-purple/10 outline-none transition-all`}
              />
              {errors.current_password && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.current_password.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Nueva contraseña
              </label>
              <input
                {...register('new_password')}
                type="password"
                className={`w-full px-4 py-3 rounded-lg border ${errors.new_password ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-brand-purple'} focus:ring-4 focus:ring-brand-purple/10 outline-none transition-all`}
              />
              {errors.new_password && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.new_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                {...register('confirm_password')}
                type="password"
                className={`w-full px-4 py-3 rounded-lg border ${errors.confirm_password ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-brand-purple'} focus:ring-4 focus:ring-brand-purple/10 outline-none transition-all`}
              />
              {errors.confirm_password && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.confirm_password.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-brand-purple/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
