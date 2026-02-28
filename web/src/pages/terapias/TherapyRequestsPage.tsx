import React, { useState } from 'react';
import { useTherapyRequests, useRespondTherapyRequest } from '../../hooks/useTherapies';
import { Loader2, User, Check, X, Clock, AlertCircle } from 'lucide-react';

export const TherapyRequestsPage: React.FC = () => {
  const { data: requests, isLoading } = useTherapyRequests();
  const respondMutation = useRespondTherapyRequest();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleResponse = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await respondMutation.mutateAsync({ id, status });
      setFeedback({ 
        type: 'success', 
        msg: status === 'ACCEPTED' ? 'Solicitud aceptada correctamente' : 'Solicitud rechazada' 
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      setFeedback({ type: 'error', msg: 'Error al procesar la solicitud' });
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-purple" size={40} />
      </div>
    );
  }

  const pendingRequests = requests?.filter((r: any) => r.status === 'PENDING') || [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Solicitudes de Terapia</h1>
        <p className="text-slate-500 font-medium italic">Nuevas consultantes que desean iniciar un proceso contigo.</p>
      </header>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center shadow-sm animate-in fade-in slide-in-from-top-4 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' : 'bg-red-50 text-red-700 border-l-4 border-red-500'
        }`}>
          {feedback.type === 'success' ? <Check className="mr-3" /> : <AlertCircle className="mr-3" />}
          <p className="font-bold text-sm uppercase tracking-widest">{feedback.msg}</p>
        </div>
      )}

      {pendingRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No tienes solicitudes pendientes</h3>
          <p className="text-slate-500 mt-2">Te avisaremos cuando alguien quiera iniciar terapia contigo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request: any) => (
            <div key={request.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-purple/5 flex items-center justify-center overflow-hidden">
                  {request.consultant?.avatar_url ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL || ''}${request.consultant.avatar_url}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-brand-purple" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{request.consultant?.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{request.consultant?.email}</p>
                  <p className="text-xs text-slate-400 mt-1 italic">Recibida el {new Date(request.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {request.message && (
                <div className="flex-1 max-w-md bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-sm text-slate-600">
                  "{request.message}"
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleResponse(request.id, 'REJECTED')}
                  disabled={respondMutation.isPending}
                  className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  title="Rechazar"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={() => handleResponse(request.id, 'ACCEPTED')}
                  disabled={respondMutation.isPending}
                  className="flex items-center px-6 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                  <Check size={18} className="mr-2" />
                  Aceptar Terapia
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
