import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateTherapy } from '../../hooks/useTherapies';
import { User, Mail, Video, DollarSign, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const createTherapySchema = z.object({
  consultant_email: z.string().email('Ingresa un correo válido'),
  consultant_name: z.string().min(2, 'El nombre es muy corto'),
  modality: z.string().min(1, 'Selecciona una modalidad'),
  notes: z.string().optional(),
  billing_plan: z.object({
    billing_type: z.enum(['PER_SESSION', 'RECURRING']),
    default_fee: z.number().min(0, 'El costo no puede ser negativo'),
  }),
});

type CreateTherapyForm = z.infer<typeof createTherapySchema>;

export const CreateTherapyPage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateTherapy();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTherapyForm>({
    resolver: zodResolver(createTherapySchema),
    defaultValues: {
      modality: 'virtual',
      billing_plan: {
        billing_type: 'PER_SESSION',
        default_fee: 500,
      }
    }
  });

  const onSubmit = async (data: CreateTherapyForm) => {
    try {
      await createMutation.mutateAsync(data);
      navigate('/terapias');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error?.message || 'Error al crear la terapia');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-bold text-slate-400 hover:text-brand-purple transition-colors uppercase tracking-widest"
      >
        <ArrowLeft size={16} className="mr-2" />
        Volver
      </button>

      <header>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Iniciar Nueva Terapia</h1>
        <p className="text-slate-500 font-medium italic">Registra a una nueva consultante y establece las bases del proceso.</p>
      </header>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl flex items-center shadow-sm animate-in shake duration-500">
          <AlertCircle className="mr-3" />
          <p className="font-bold text-sm uppercase tracking-widest">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10 space-y-8">
        {/* Consultant Info */}
        <section className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-50 pb-4">1. Datos de la Consultante</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center">
                <User size={12} className="mr-1.5 text-brand-purple" />
                Nombre Completo
              </label>
              <input
                {...register('consultant_name')}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-brand-purple focus:bg-white outline-none transition-all font-bold text-slate-700"
                placeholder="Ej. María García"
              />
              {errors.consultant_name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.consultant_name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center">
                <Mail size={12} className="mr-1.5 text-brand-purple" />
                Correo Electrónico
              </label>
              <input
                {...register('consultant_email')}
                type="email"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-brand-purple focus:bg-white outline-none transition-all font-bold text-slate-700"
                placeholder="consultante@ejemplo.com"
              />
              {errors.consultant_email && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.consultant_email.message}</p>}
            </div>
          </div>
        </section>

        {/* Therapy Settings */}
        <section className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-50 pb-4">2. Configuración del Proceso</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center">
                <Video size={12} className="mr-1.5 text-brand-purple" />
                Modalidad
              </label>
              <select
                {...register('modality')}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-brand-purple focus:bg-white outline-none transition-all font-bold text-slate-700 appearance-none"
              >
                <option value="virtual">Virtual</option>
                <option value="in_person">Presencial</option>
                <option value="hybrid">Híbrida</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center">
                <DollarSign size={12} className="mr-1.5 text-brand-purple" />
                Costo por Sesión
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                <input
                  {...register('billing_plan.default_fee', { valueAsNumber: true })}
                  type="number"
                  className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-brand-purple focus:bg-white outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Notas iniciales (privadas)</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-brand-purple focus:bg-white outline-none transition-all font-bold text-slate-700 resize-none"
              placeholder="Observaciones previas o contexto del inicio..."
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full py-5 bg-brand-purple hover:bg-brand-purple-dark text-white font-black rounded-2xl transition-all shadow-xl shadow-brand-purple/20 flex items-center justify-center disabled:opacity-70 uppercase tracking-[0.2em] text-sm"
        >
          {createMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <CheckCircle size={20} className="mr-2" />
              Crear Terapia e Invitar
            </>
          )}
        </button>
        
        <p className="text-[10px] text-center text-slate-400 font-medium px-8 italic">
          Al crear la terapia, se enviará una invitación automática a la consultante con sus credenciales de acceso.
        </p>
      </form>
    </div>
  );
};
