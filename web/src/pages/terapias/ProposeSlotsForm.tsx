import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { Loader2, Calendar, Clock, Plus, Trash2, Send, X, AlertCircle } from 'lucide-react';
import { queryKeys } from '../../utils/query-keys';

interface Props {
  therapyId: string;
  sessionType: 'INITIAL' | 'EXTRAORDINARY';
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProposeSlotsForm: React.FC<Props> = ({ therapyId, sessionType, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (proposedSlots: string[]) => {
      // Filter out empty strings and convert to ISO
      const validSlots = proposedSlots
        .filter(s => !!s)
        .map(s => new Date(s).toISOString());

      if (validSlots.length === 0) {
        throw new Error('Debes seleccionar al menos un horario.');
      }

      const response = await apiClient.post(`/therapies/${therapyId}/propositions`, {
        proposed_slots: validSlots,
        type: sessionType
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propositions', therapyId] });
      onSuccess();
    },
    onError: (err: any) => {
      const message = err.response?.data?.error?.message || err.message;
      setError(message);
    }
  });

  const addSlot = () => setSlots([...slots, '']);
  
  const removeSlot = (index: number) => {
    if (slots.length === 1) return;
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, value: string) => {
    const newSlots = [...slots];
    newSlots[index] = value;
    setSlots(newSlots);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(slots);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 rounded-[2rem] p-8 border-2 border-brand-cyan/10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
            <Calendar size={24} className="mr-3 text-brand-cyan" />
            Proponer Horarios
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-9">
            Sesión {sessionType === 'INITIAL' ? 'Inicial' : 'Extraordinaria'}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center text-rose-700 text-xs font-bold">
          <AlertCircle size={16} className="mr-2 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          Opciones de fecha y hora
        </label>
        
        {slots.map((slot, index) => (
          <div key={index} className="flex gap-2 group animate-in slide-in-from-left-2 duration-200">
            <div className="relative flex-1">
              <input 
                type="datetime-local"
                value={slot}
                onChange={(e) => updateSlot(index, e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-black focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-all pr-10"
              />
              <Clock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 group-hover:text-brand-cyan transition-colors" />
            </div>
            
            <button 
              type="button"
              onClick={() => removeSlot(index)}
              disabled={slots.length === 1}
              className="p-4 bg-white border-2 border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-100 rounded-2xl transition-all disabled:opacity-0"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button 
          type="button"
          onClick={addSlot}
          className="flex-1 py-4 bg-white border-2 border-brand-cyan/20 text-brand-cyan rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-cyan/5 transition-all flex items-center justify-center"
        >
          <Plus size={16} className="mr-2" />
          Agregar Opción
        </button>
        
        <button 
          type="submit"
          disabled={mutation.isPending}
          className="flex-[2] py-4 bg-brand-cyan text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-cyan-dark transition-all shadow-xl shadow-brand-cyan/20 flex items-center justify-center disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Send size={18} className="mr-2" />
              Enviar Propuesta a Consultante
            </>
          )}
        </button>
      </div>
      
      <p className="text-[10px] text-slate-400 font-medium italic text-center">
        * La consultante recibirá una notificación y podrá elegir uno de los horarios propuestos.
      </p>
    </form>
  );
};
