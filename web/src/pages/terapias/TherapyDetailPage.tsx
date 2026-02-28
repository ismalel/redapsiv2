import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { therapiesApi } from '../../api/therapies.api';
import { Loader2, ArrowLeft, User, Calendar, DollarSign, MessageCircle, Clock } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { hasRole } from '../../utils/role-permissions';

export const TherapyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: therapy, isLoading, isError } = useQuery({
    queryKey: ['therapy', id],
    queryFn: () => therapiesApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-purple" size={40} />
      </div>
    );
  }

  if (isError || !therapy) {
    return (
      <div className="bg-red-50 p-8 rounded-3xl text-center border border-red-100">
        <h3 className="text-xl font-bold text-red-800">Terapia no encontrada</h3>
        <p className="text-red-600 mt-2 mb-6">No pudimos cargar la información de este proceso.</p>
        <button 
          onClick={() => navigate('/terapias')}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  const isPsychologist = hasRole(user, 'PSYCHOLOGIST');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <button 
        onClick={() => navigate('/terapias')}
        className="flex items-center text-sm font-bold text-slate-400 hover:text-brand-purple transition-colors uppercase tracking-widest"
      >
        <ArrowLeft size={16} className="mr-2" />
        Volver a mis terapias
      </button>

      {/* Header Info */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-3xl bg-brand-cyan/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {therapy.consultant?.avatar_url ? (
                <img src={`${import.meta.env.VITE_API_BASE_URL || ''}${therapy.consultant.avatar_url}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-brand-cyan" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">{therapy.consultant?.name}</h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  therapy.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {therapy.status === 'ACTIVE' ? 'Activa' : 'Pendiente'}
                </span>
              </div>
              <p className="text-slate-500 font-medium italic">{therapy.consultant?.email}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {isPsychologist && (
              <button className="flex items-center px-6 py-4 bg-brand-purple text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-purple/20 hover:bg-brand-purple-dark transition-all">
                <MessageCircle size={18} className="mr-2" />
                Abrir Chat
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-slate-50">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar size={16} className="text-brand-purple" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidad</span>
            </div>
            <p className="text-lg font-bold text-slate-700 capitalize">{therapy.modality}</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign size={16} className="text-brand-purple" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo por sesión</span>
            </div>
            <p className="text-lg font-bold text-slate-700">${therapy.billing_plan?.default_fee}</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center space-x-2 mb-2">
              <Clock size={16} className="text-brand-purple" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de cobro</span>
            </div>
            <p className="text-lg font-bold text-slate-700">{therapy.billing_plan?.billing_type === 'PER_SESSION' ? 'Por Sesión' : 'Recurrente'}</p>
          </div>
        </div>
      </div>

      {/* Tabs Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest">Próximas Sesiones</h3>
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-slate-400 font-medium italic">No hay sesiones programadas aún.</p>
              {isPsychologist && (
                <button className="mt-4 text-brand-purple font-bold text-sm hover:underline">Proponer horarios</button>
              )}
            </div>
          </section>

          {isPsychologist && (
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest">Notas de la Terapia</h3>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 min-h-[100px]">
                {therapy.notes ? (
                  <p className="text-slate-600 whitespace-pre-wrap">{therapy.notes}</p>
                ) : (
                  <p className="text-slate-400 italic">No hay notas registradas para esta terapia.</p>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-1 space-y-8">
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest">Objetivos</h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-400 italic">Esta funcionalidad estará disponible en la Fase 6.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
