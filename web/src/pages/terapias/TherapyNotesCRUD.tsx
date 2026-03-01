import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { therapiesApi } from '../../api/therapies.api';
import { Loader2, Plus, Edit2, Trash2, Save, X, FileText, Calendar, Search } from 'lucide-react';

interface Props {
  therapyId: string;
}

export const TherapyNotesCRUD: React.FC<Props> = ({ therapyId }) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchBy] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: notes, isLoading } = useQuery({
    queryKey: ['therapy-notes', therapyId],
    queryFn: () => therapiesApi.notes.list(therapyId),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) => therapiesApi.notes.create(therapyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapy-notes', therapyId] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; content: string } }) => 
      therapiesApi.notes.update(therapyId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapy-notes', therapyId] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => therapiesApi.notes.delete(therapyId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapy-notes', therapyId] });
    }
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const handleEdit = (note: any) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: { title, content } });
    } else {
      createMutation.mutate({ title, content });
    }
  };

  const filteredNotes = notes?.filter((n: any) => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-purple" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Buscar en mis notas..."
            value={searchTerm}
            onChange={(e) => setSearchBy(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:border-brand-purple focus:bg-white transition-all outline-none"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
        </div>
        
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center px-6 py-3 bg-brand-purple text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-purple-dark transition-all shadow-lg shadow-brand-purple/20"
          >
            <Plus size={18} className="mr-2" />
            Nueva Nota
          </button>
        )}
      </header>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 border-2 border-brand-purple/20 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
              {editingId ? 'Editar Nota' : 'Nueva Nota Privada'}
            </h3>
            <button type="button" onClick={resetForm} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Título de la nota..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black focus:border-brand-purple focus:bg-white outline-none transition-all"
            />
            <textarea 
              placeholder="Escribe el contenido aquí..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 text-sm leading-relaxed focus:border-brand-purple focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button 
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-4 bg-brand-purple text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-purple-dark transition-all shadow-lg shadow-brand-purple/20 flex items-center justify-center disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  {editingId ? 'Guardar Cambios' : 'Crear Nota'}
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={resetForm}
              className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileText size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-medium italic">
              {searchTerm ? 'No se encontraron notas que coincidan.' : 'No hay notas registradas para esta terapia.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note: any) => (
            <div key={note.id} className="group bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-purple/10 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-brand-purple transition-colors">
                    {note.title}
                  </h4>
                  <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Calendar size={12} className="mr-1.5" />
                    Actualizado el {new Date(note.updated_at).toLocaleString('es-ES')}
                  </div>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(note)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-brand-purple hover:bg-brand-purple/5 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => window.confirm('¿Eliminar esta nota permanentemente?') && deleteMutation.mutate(note.id)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
