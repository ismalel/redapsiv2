import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useCompleteSession, useCancelSession, usePostponeSession, useConfirmPostpone, useSessionNotes, useCreateSessionNote, useAttachSessionMedia } from '../../hooks/useSessions';
import { useUpload } from '../../hooks/useUpload';
import { Loader2, Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle, RotateCcw, FileText, Paperclip, Lock, Unlock, Send, MoreVertical, DollarSign, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasRole } from '../../utils/role-permissions';

const STATUS_LABELS: Record<string, { label: string, color: string, icon: any }> = {
  SCHEDULED: { label: 'Programada', color: 'bg-brand-cyan/10 text-brand-cyan', icon: Calendar },
  COMPLETED: { label: 'Completada', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelada', color: 'bg-rose-50 text-rose-600', icon: XCircle },
  POSTPONED: { label: 'Pospuesta', color: 'bg-amber-50 text-amber-600', icon: RotateCcw },
};

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'notas' | 'archivos'>('info');
  
  const { data: session, isLoading } = useSession(id!);
  const { data: notes, isLoading: isLoadingNotes } = useSessionNotes(id!);
  
  const completeMutation = useCompleteSession();
  const cancelMutation = useCancelSession();
  const postponeMutation = usePostponeSession();
  const confirmPostponeMutation = useConfirmPostpone();
  const createNoteMutation = useCreateSessionNote();
  const attachMediaMutation = useAttachSessionMedia();
  const uploadMutation = useUpload();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [postponeDate, setPostponeDate] = useState('');

  if (isLoading || !session) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-purple" size={40} />
      </div>
    );
  }

  const isPsychologist = hasRole(user, 'PSYCHOLOGIST');
  const isAssignedPsychologist = isPsychologist && session.therapy?.psychologist_id === user?.id;
  const statusInfo = STATUS_LABELS[session.status] || { label: session.status, color: 'bg-slate-100', icon: AlertCircle };
  const StatusIcon = statusInfo.icon;
  const sessionDate = new Date(session.scheduled_at);

  const handleComplete = () => {
    if (window.confirm('¿Estás segura de marcar esta sesión como completada?')) {
      completeMutation.mutate(id!);
    }
  };

  const handleCancel = () => {
    cancelMutation.mutate({ id: id!, reason: cancelReason }, {
      onSuccess: () => {
        setShowCancelModal(false);
        setCancelReason('');
      }
    });
  };

  const handlePostpone = () => {
    if (!postponeDate) return;
    postponeMutation.mutate({ id: id!, new_date: new Date(postponeDate).toISOString() }, {
      onSuccess: () => {
        setShowPostponeModal(false);
        setPostponeDate('');
      }
    });
  };

  const handleConfirmPostpone = () => {
    if (window.confirm('¿Confirmar la nueva fecha propuesta para esta sesión?')) {
      confirmPostponeMutation.mutate(id!);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    createNoteMutation.mutate({ 
      sessionId: id!, 
      content: noteContent, 
      is_private: isPrivate 
    }, {
      onSuccess: () => {
        setNoteContent('');
        setIsPrivate(false);
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { url } = await uploadMutation.mutateAsync({ file, folder: 'sessions' });
      await attachMediaMutation.mutateAsync({ id: id!, media_url: url });
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Error al subir el archivo. Por favor, intenta de nuevo.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-3xl bg-brand-cyan/10 flex items-center justify-center overflow-hidden shrink-0 border-4 border-white shadow-xl">
              {session.therapy?.consultant?.avatar_url ? (
                <img src={`${import.meta.env.VITE_API_BASE_URL || ''}${session.therapy.consultant.avatar_url}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-brand-cyan" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">{session.therapy?.consultant?.name}</h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 ${statusInfo.color}`}>
                  <StatusIcon size={12} />
                  <span>{statusInfo.label}</span>
                </span>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{session.therapy?.modality} • Sesión #{session.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {session.status === 'SCHEDULED' && isAssignedPsychologist && (
              <button 
                onClick={handleComplete}
                className="px-6 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center"
              >
                <CheckCircle2 size={16} className="mr-2" />
                Completar
              </button>
            )}
            {session.status === 'SCHEDULED' && (isAssignedPsychologist || hasRole(user, 'CONSULTANT')) && (
              <>
                <button 
                  onClick={() => setShowPostponeModal(true)}
                  className="px-6 py-3 bg-amber-500 text-white hover:bg-amber-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center"
                >
                  <RotateCcw size={16} className="mr-2" />
                  Posponer
                </button>
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="px-6 py-3 bg-rose-500 text-white hover:bg-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 flex items-center"
                >
                  <XCircle size={16} className="mr-2" />
                  Cancelar
                </button>
              </>
            )}
            {session.status === 'POSTPONED' && isAssignedPsychologist && (
              <button 
                onClick={handleConfirmPostpone}
                className="px-6 py-3 bg-brand-purple text-white hover:bg-brand-purple-dark rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-purple/20 flex items-center"
              >
                <Calendar size={16} className="mr-2" />
                Confirmar Nueva Fecha
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 p-2">
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 flex items-center justify-center py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <AlertCircle size={16} className="mr-2" />
            Información
          </button>
          <button 
            onClick={() => setActiveTab('notas')}
            className={`flex-1 flex items-center justify-center py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'notas' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <FileText size={16} className="mr-2" />
            Notas
          </button>
          <button 
            onClick={() => setActiveTab('archivos')}
            className={`flex-1 flex items-center justify-center py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'archivos' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <Paperclip size={16} className="mr-2" />
            Archivos
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                  <Calendar size={18} className="mr-2 text-brand-cyan" />
                  Detalles de la Cita
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha</span>
                    <span className="text-sm font-black text-slate-700">{sessionDate.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hora</span>
                    <span className="text-sm font-black text-slate-700">{sessionDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duración</span>
                    <span className="text-sm font-black text-slate-700">{session.duration} minutos</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                  <DollarSign size={18} className="mr-2 text-emerald-500" />
                  Finanzas
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Honorarios</span>
                    <span className="text-xl font-black text-slate-800">${session.effective_fee}</span>
                  </div>
                  {session.status === 'CANCELLED' && (
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-2">
                       <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Motivo de cancelación</span>
                       <p className="text-sm font-medium text-rose-700 italic">"{session.cancel_reason || 'No especificado'}"</p>
                    </div>
                  )}
                  {session.status === 'POSTPONED' && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                       <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Nueva fecha propuesta</span>
                       <p className="text-sm font-black text-amber-700">
                          {new Date(session.postponed_to!).toLocaleString('es-ES', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} hs
                       </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notas' && (
            <div className="space-y-8">
              {/* Note Form */}
              <form onSubmit={handleAddNote} className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100">
                <div className="mb-4">
                  <textarea 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Escribe una nota sobre la sesión..."
                    className="w-full bg-white rounded-2xl border-slate-200 p-4 text-sm font-medium focus:ring-brand-purple focus:border-brand-purple min-h-[120px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  {isAssignedPsychologist && (
                    <button 
                      type="button"
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPrivate ? 'bg-amber-100 text-amber-700' : 'bg-brand-cyan/10 text-brand-cyan'}`}
                    >
                      {isPrivate ? <Lock size={14} /> : <Unlock size={14} />}
                      <span>{isPrivate ? 'Nota Privada' : 'Nota Pública'}</span>
                    </button>
                  )}
                  <div className={!isAssignedPsychologist ? 'w-full flex justify-end' : ''}>
                    <button 
                      type="submit"
                      disabled={!noteContent.trim() || createNoteMutation.isPending}
                      className="px-6 py-3 bg-brand-purple text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-purple-dark transition-all shadow-lg shadow-brand-purple/20 flex items-center disabled:opacity-50"
                    >
                      <Send size={16} className="mr-2" />
                      Guardar Nota
                    </button>
                  </div>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-4">
                {isLoadingNotes ? (
                   <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : notes?.length === 0 ? (
                   <p className="text-center text-slate-400 italic text-sm py-8">No hay notas en esta sesión.</p>
                ) : (
                  notes?.map((note: any) => (
                    <div key={note.id} className={`p-6 rounded-[1.5rem] border ${note.is_private ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs text-slate-400">
                             {note.author?.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 leading-none">{note.author?.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(note.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        {note.is_private && (
                          <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg">
                            <Lock size={10} className="mr-1" /> Privada
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'archivos' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Archivos adjuntos</h3>
                  {isAssignedPsychologist && (
                    <>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMutation.isPending || attachMediaMutation.isPending}
                        className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50"
                      >
                        {uploadMutation.isPending || attachMediaMutation.isPending ? (
                          <Loader2 size={14} className="mr-2 animate-spin" />
                        ) : (
                          <Upload size={14} className="mr-2" />
                        )}
                        Subir Archivo
                      </button>
                    </>
                  )}
               </div>
               
               {session.media_urls?.length === 0 ? (
                 <div className="bg-slate-50 rounded-[1.5rem] p-12 text-center border-2 border-dashed border-slate-200">
                    <Paperclip size={32} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400 italic">No hay archivos en esta sesión.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {session.media_urls?.map((url: string, index: number) => (
                      <a 
                        key={index}
                        href={`${import.meta.env.VITE_API_BASE_URL || ''}${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all text-center"
                      >
                         <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-cyan/10 transition-colors">
                            <Paperclip size={20} className="text-slate-400 group-hover:text-brand-cyan" />
                         </div>
                         <p className="text-[10px] font-black text-slate-500 uppercase truncate">Archivo {index + 1}</p>
                      </a>
                    ))}
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-xl font-black text-slate-800 mb-2">Cancelar Sesión</h3>
              <p className="text-slate-500 text-sm mb-6">Por favor, indica el motivo de la cancelación. Se notificará a la otra parte.</p>
              <textarea 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Motivo de cancelación..."
                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm font-medium mb-6 min-h-[100px]"
              />
              <div className="flex space-x-3">
                 <button onClick={() => setShowCancelModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Descartar</button>
                 <button onClick={handleCancel} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20">Confirmar</button>
              </div>
           </div>
        </div>
      )}

      {/* Postpone Modal */}
      {showPostponeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-xl font-black text-slate-800 mb-2">Posponer Sesión</h3>
              <p className="text-slate-500 text-sm mb-6">Selecciona una nueva fecha y hora propuesta para esta sesión.</p>
              <input 
                type="datetime-local"
                value={postponeDate}
                onChange={(e) => setPostponeDate(e.target.value)}
                className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm font-black mb-6"
              />
              <div className="flex space-x-3">
                 <button onClick={() => setShowPostponeModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Descartar</button>
                 <button onClick={handlePostpone} disabled={!postponeDate} className="flex-1 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50">Confirmar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const Plus = ({ size, className }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
