import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { Loader2, Calendar, Clock, RefreshCw, Hash, Save, X } from 'lucide-react';
import { queryKeys } from '../../utils/query-keys';

const recurrenceSchema = z.object({
  day_of_week: z.coerce.number().min(0).max(6),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:mm requerido'),
  duration: z.coerce.number().min(15),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY']),
  sessions_count: z.coerce.number().optional().nullable(),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
});

type RecurrenceForm = z.infer<typeof recurrenceSchema>;

interface Props {
  therapyId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export const RecurrenceConfigurationForm: React.FC<Props> = ({ therapyId, onSuccess, onCancel, initialData }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors } } = useForm<RecurrenceForm>({
    resolver: zodResolver(recurrenceSchema),
    defaultValues: initialData ? {
      ...initialData,
      start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : ''
    } : {
      day_of_week: 1,
      start_time: '10:00',
      duration: 60,
      frequency: 'WEEKLY',
      sessions_count: null,
      start_date: new Date().toISOString().split('T')[0],
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: RecurrenceForm) => {
      // Ensure start_date is full ISO
      const isoDate = new Date(data.start_date).toISOString();
      const response = await apiClient.post(`/therapies/${therapyId}/recurrence`, {
        ...data,
        start_date: isoDate
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.therapies.detail(therapyId) });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      onSuccess();
    }
  });

  const DAYS = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
  ];

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="bg-slate-50 rounded-[2rem] p-8 border-2 border-brand-purple/10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
          <RefreshCw size={24} className="mr-3 text-brand-purple animate-spin-slow" />
          Configurar Seguimiento Recurrente
        </h3>
        <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Day of week */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
            <Calendar size={12} className="mr-1.5 text-brand-purple" />
            Día de la semana
          </label>
          <select 
            {...register('day_of_week')}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-black focus:ring-brand-purple focus:border-brand-purple outline-none transition-all"
          >
            {DAYS.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
          </select>
        </div>

        {/* Start Time */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
            <Clock size={12} className="mr-1.5 text-brand-purple" />
            Hora de inicio (HH:mm)
          </label>
          <input 
            type="time"
            {...register('start_time')}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-black focus:ring-brand-purple focus:border-brand-purple outline-none transition-all"
          />
          {errors.start_time && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.start_time.message}</p>}
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
            <RefreshCw size={12} className="mr-1.5 text-brand-purple" />
            Frecuencia
          </label>
          <select 
            {...register('frequency')}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-black focus:ring-brand-purple focus:border-brand-purple outline-none transition-all"
          >
            <option value="WEEKLY">Semanal</option>
            <option value="BIWEEKLY">Quincenal</option>
          </select>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
            <Clock size={12} className="mr-1.5 text-brand-purple" />
            Duración (minutos)
          </label>
          <input 
            type="number"
            {...register('duration')}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-black focus:ring-brand-purple focus:border-brand-purple outline-none transition-all"
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
            <Calendar size={12} className="mr-1.5 text-brand-purple" />
            Fecha de inicio
          </label>
          <input 
            type="date"
            {...register('start_date')}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-black focus:ring-brand-purple focus:border-brand-purple outline-none transition-all"
          />
        </div>

        {/* Sessions Count */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
            <Hash size={12} className="mr-1.5 text-brand-purple" />
            Cantidad de sesiones (opcional)
          </label>
          <input 
            type="number"
            placeholder="Dejar vacío para indefinido"
            {...register('sessions_count')}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-black focus:ring-brand-purple focus:border-brand-purple outline-none transition-all"
          />
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-4 bg-brand-purple text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-purple-dark transition-all shadow-xl shadow-brand-purple/20 flex items-center justify-center disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Save size={18} className="mr-2" />
              Confirmar Plan de Seguimiento
            </>
          )}
        </button>
      </div>
      
      <p className="text-[10px] text-slate-400 font-medium italic text-center">
        * Al confirmar, se generarán automáticamente las próximas sesiones y se bloqueará este horario en tu calendario para esta terapia.
      </p>
    </form>
  );
};
