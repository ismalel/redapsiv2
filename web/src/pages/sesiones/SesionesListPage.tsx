import React, { useState } from 'react';
import { useSessions } from '../../hooks/useSessions';
import { Loader2, Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_LABELS: Record<string, { label: string, color: string, icon: any }> = {
  SCHEDULED: { label: 'Programada', color: 'bg-brand-cyan/10 text-brand-cyan', icon: Calendar },
  COMPLETED: { label: 'Completada', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelada', color: 'bg-rose-50 text-rose-600', icon: XCircle },
  POSTPONED: { label: 'Pospuesta', color: 'bg-amber-50 text-amber-600', icon: RotateCcw },
};

export const SesionesListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSessions({ page, per_page: 10 });
  const sessions = data?.data || [];
  const totalPages = data?.meta?.total_pages || 1;

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
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Agenda de Sesiones</h1>
          <p className="text-slate-500 font-medium italic">Visualiza y gestiona tus próximas citas y el historial.</p>
        </div>
      </header>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No hay sesiones registradas</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Las sesiones aparecerán aquí una vez que se agenden citas en tus terapias activas.
          </p>
          <Link 
            to="/terapias"
            className="inline-flex items-center px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-slate-900 transition-all"
          >
            Ver mis terapias
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Consultante</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha y Hora</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Duración</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Honorarios</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sessions.map((session: any) => {
                    const statusInfo = STATUS_LABELS[session.status] || { label: session.status, color: 'bg-slate-100', icon: AlertCircle };
                    const StatusIcon = statusInfo.icon;
                    const sessionDate = new Date(session.scheduled_at);

                    return (
                      <tr key={session.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center overflow-hidden shrink-0">
                              {session.therapy?.consultant?.avatar_url ? (
                                <img src={`${import.meta.env.VITE_API_BASE_URL || ''}${session.therapy.consultant.avatar_url}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={18} className="text-brand-cyan" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm leading-tight group-hover:text-brand-purple transition-colors">
                                {session.therapy?.consultant?.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{session.therapy?.modality}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm font-bold text-slate-700">
                              <Calendar size={14} className="mr-2 text-slate-300" />
                              {sessionDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </div>
                            <div className="flex items-center text-xs text-slate-400 font-medium">
                              <Clock size={14} className="mr-2 text-slate-300" />
                              {sessionDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-600">{session.duration} min</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-slate-800">
                          ${session.effective_fee}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest space-x-1.5 ${statusInfo.color}`}>
                            <StatusIcon size={12} />
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/sesiones/${session.id}`}
                            className="inline-flex items-center px-4 py-2 bg-slate-50 text-slate-600 hover:bg-brand-purple hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Gestionar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Página {page} de {totalPages}
              </p>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-brand-purple hover:border-brand-purple disabled:opacity-50 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-brand-purple hover:border-brand-purple disabled:opacity-50 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
