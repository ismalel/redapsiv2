import React from 'react';
import { useTherapies } from '../../hooks/useTherapies';
import { Loader2, User, MessageCircle, Calendar, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TerapiasListPage: React.FC = () => {
  const { data, isLoading } = useTherapies();
  const therapies = data?.data || [];

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-purple" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mis Terapias</h1>
          <p className="text-slate-500 font-medium italic">Gestiona tus procesos terapéuticos activos y pendientes.</p>
        </div>
        
        <Link 
          to="/terapias/nueva"
          className="flex items-center px-6 py-3 bg-brand-purple text-white hover:bg-brand-purple-dark rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-purple/20"
        >
          <Plus size={18} className="mr-2" />
          Nueva Terapia
        </Link>
      </header>

      {therapies.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No tienes terapias activas</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Comienza invitando a una nueva consultante o revisa las solicitudes pendientes.
          </p>
          <Link 
            to="/terapias/nueva"
            className="inline-flex items-center px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-slate-900 transition-all"
          >
            Invitar Consultante
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {therapies.map((therapy: any) => (
            <div key={therapy.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-brand-purple/20 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-cyan/10 flex items-center justify-center overflow-hidden">
                    {therapy.consultant?.avatar_url ? (
                      <img src={`${import.meta.env.VITE_API_BASE_URL || ''}${therapy.consultant.avatar_url}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-brand-cyan" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 leading-tight group-hover:text-brand-purple transition-colors">
                      {therapy.consultant?.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{therapy.modality}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  therapy.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {therapy.status === 'ACTIVE' ? 'Activa' : 'Pendiente'}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-slate-500">
                  <MessageCircle size={16} className="mr-2 text-slate-300" />
                  <span className="truncate">{therapy.consultant?.email}</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <Calendar size={16} className="mr-2 text-slate-300" />
                  <span>Registrada el {new Date(therapy.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link 
                  to={`/terapias/${therapy.id}`}
                  className="flex-1 text-center py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Ver Detalle
                </Link>
                <button className="px-4 py-3 bg-brand-purple/10 text-brand-purple rounded-xl hover:bg-brand-purple hover:text-white transition-all">
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
