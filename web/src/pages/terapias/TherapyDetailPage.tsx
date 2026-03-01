import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { therapiesApi } from '../../api/therapies.api';
import { useSessions } from '../../hooks/useSessions';
import { useUpdateTherapy } from '../../hooks/useTherapies';
import { RecurrenceConfigurationForm } from './RecurrenceConfigurationForm';
import { ProposeSlotsForm } from './ProposeSlotsForm';
import { queryKeys } from '../../utils/query-keys';
import { Loader2, ArrowLeft, User, Calendar, DollarSign, MessageCircle, Clock, CheckCircle2, XCircle, RotateCcw, AlertCircle, ChevronRight, Edit2, Save, X, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasRole } from '../../utils/role-permissions';

const STATUS_LABELS: Record<string, { label: string, color: string, icon: any }> = {
  SCHEDULED: { label: 'Programada', color: 'bg-brand-cyan/10 text-brand-cyan', icon: Calendar },
  COMPLETED: { label: 'Completada', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelada', color: 'bg-rose-50 text-rose-600', icon: XCircle },
  POSTPONED: { label: 'Pospuesta', color: 'bg-amber-50 text-amber-600', icon: RotateCcw },
};

export const TherapyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sesiones' | 'notas' | 'objetivos'>('sesiones');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [showRecurrenceForm, setShowRecurrenceForm] = useState(false);
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [proposalType, setProposalType] = useState<'INITIAL' | 'EXTRAORDINARY'>('INITIAL');

  const { data: therapy, isLoading: isLoadingTherapy, isError } = useQuery({
    queryKey: queryKeys.therapies.detail(id!),
    queryFn: () => therapiesApi.get(id!),
    enabled: !!id,
  });

  const updateTherapyMutation = useUpdateTherapy();

  const { data: sessionsData, isLoading: isLoadingSessions } = useSessions({ therapy_id: id, per_page: 5 });
  const sessions = sessionsData?.data || [];

  if (isLoadingTherapy) {
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
  const isAssignedPsychologist = isPsychologist && therapy?.psychologist_id === user?.id;

  const handleStartEditingNotes = () => {
    setNotesDraft(therapy.notes || '');
    setIsEditingNotes(true);
  };

  const handleSaveNotes = () => {
    updateTherapyMutation.mutate({ 
      id: id!, 
      data: { notes: notesDraft } 
    }, {
      onSuccess: () => {
        setIsEditingNotes(false);
      }
    });
  };

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
            {isAssignedPsychologist && (
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

      {/* Main Content with Tabs */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-50 p-2">
          <button 
            onClick={() => setActiveTab('sesiones')}
            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sesiones' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Sesiones
          </button>
          <button 
            onClick={() => setActiveTab('objetivos')}
            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'objetivos' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Objetivos
          </button>
          {isAssignedPsychologist && (
            <button 
              onClick={() => setActiveTab('notas')}
              className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'notas' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Notas Privadas
            </button>
          )}
        </div>

        <div className="p-8 md:p-12">
          {activeTab === 'sesiones' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Gestión de Sesiones</h3>
                {isAssignedPsychologist && !showRecurrenceForm && !showProposeForm && (
                  <div className="flex gap-2">
                    {sessions.length === 0 ? (
                      <button 
                        onClick={() => { setProposalType('INITIAL'); setShowProposeForm(true); }}
                        className="px-4 py-2 bg-brand-cyan text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-cyan-dark transition-all flex items-center shadow-lg shadow-brand-cyan/20"
                      >
                        <Calendar size={14} className="mr-2" />
                        Agendar Sesión Inicial
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setShowRecurrenceForm(true)}
                          className="px-4 py-2 bg-brand-purple/10 text-brand-purple rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all flex items-center"
                        >
                          <RefreshCw size={14} className="mr-2" />
                          Configurar Seguimiento
                        </button>
                        <button 
                          onClick={() => { setProposalType('EXTRAORDINARY'); setShowProposeForm(true); }}
                          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center"
                        >
                          <Plus size={14} className="mr-2" />
                          Sesión Extraordinaria
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {showRecurrenceForm && (
                <RecurrenceConfigurationForm 
                  therapyId={id!}
                  onSuccess={() => setShowRecurrenceForm(false)}
                  onCancel={() => setShowRecurrenceForm(false)}
                  initialData={therapy.recurrence_config}
                />
              )}

              {showProposeForm && (
                <ProposeSlotsForm 
                  therapyId={id!}
                  sessionType={proposalType}
                  onSuccess={() => setShowProposeForm(false)}
                  onCancel={() => setShowProposeForm(false)}
                />
              )}

              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pt-4">Historial y Próximas Sesiones</h4>

              {isLoadingSessions ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-purple" /></div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-slate-400 font-medium italic">No hay sesiones registradas en esta terapia.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session: any) => {
                    const statusInfo = STATUS_LABELS[session.status] || { label: session.status, color: 'bg-slate-100', icon: AlertCircle };
                    const StatusIcon = statusInfo.icon;
                    const sessionDate = new Date(session.scheduled_at);

                    return (
                      <Link 
                        key={session.id}
                        to={`/sesiones/${session.id}`}
                        className="flex items-center justify-between p-5 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-[1.5rem] transition-all group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center space-x-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${statusInfo.color}`}>
                             <StatusIcon size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                               {sessionDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               {sessionDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs • {session.duration} min
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                           <span className="text-sm font-black text-slate-700">${session.effective_fee}</span>
                           <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-purple transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notas' && isPsychologist && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-4">Notas de la Terapia</h3>
              
              {isEditingNotes ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <textarea 
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Escribe las notas generales para esta terapia..."
                    className="w-full bg-slate-50 border-2 border-brand-purple/20 rounded-[2rem] p-8 text-slate-600 leading-relaxed min-h-[250px] focus:ring-brand-purple focus:border-brand-purple outline-none transition-all"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={handleSaveNotes}
                      disabled={updateTherapyMutation.isPending}
                      className="flex-1 py-4 bg-brand-purple text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-purple-dark transition-all shadow-lg shadow-brand-purple/20 flex items-center justify-center disabled:opacity-50"
                    >
                      {updateTherapyMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => setIsEditingNotes(false)}
                      className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 min-h-[150px]">
                    {therapy.notes ? (
                      <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{therapy.notes}</p>
                    ) : (
                      <p className="text-slate-400 italic">No hay notas generales registradas para esta terapia.</p>
                    )}
                  </div>
                  <button 
                    onClick={handleStartEditingNotes}
                    className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center"
                  >
                    <Edit2 size={16} className="mr-2" />
                    Editar Notas Generales
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'objetivos' && (
            <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <AlertCircle size={32} className="text-slate-300" />
               </div>
               <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Objetivos y Progreso</h3>
               <p className="text-slate-500 max-w-sm mx-auto font-medium italic">Esta funcionalidad estará disponible en la Fase 6 del desarrollo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
