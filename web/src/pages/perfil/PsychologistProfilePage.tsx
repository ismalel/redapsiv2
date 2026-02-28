import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  useOwnPsychologistProfile, 
  useUpdatePsychologistProfile, 
  useSetAvailability 
} from '../../hooks/usePsychologist';
import { uploadApi } from '../../api/upload.api';
import { useAuth } from '../../context/AuthContext';
import { AvailabilityEditor } from './AvailabilityEditor';
import { 
  User as UserIcon, 
  FileText, 
  Tag, 
  DollarSign, 
  Globe, 
  Briefcase, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera
} from 'lucide-react';

const profileSchema = z.object({
  license_number: z.string().min(1, 'La cédula profesional es requerida'),
  specializations: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  bio: z.string().min(10, 'La biografía debe tener al menos 10 caracteres').optional(),
  session_fee: z.number().min(0, 'El costo debe ser mayor o igual a 0'),
  modalities: z.array(z.string()).min(1, 'Selecciona al menos una modalidad'),
  languages: z.array(z.string()).min(1, 'Selecciona al menos un idioma'),
  years_experience: z.number().int().min(0, 'Los años de experiencia no pueden ser negativos'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export const PsychologistProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { data: profile, isLoading, isError } = useOwnPsychologistProfile();
  const updateProfile = useUpdatePsychologistProfile();
  const setAvailability = useSetAvailability();
  const [activeTab, setActiveTab] = useState<'info' | 'availability'>('info');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      modalities: [],
      languages: []
    }
  });

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg(null);
    } else {
      setErrorMsg(msg);
      setSuccessMsg(null);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 5000);
  };

  useEffect(() => {
    if (profile) {
      reset({
        license_number: profile.license_number || '',
        specializations: Array.isArray(profile.specializations) ? profile.specializations.join(', ') : '',
        bio: profile.bio || '',
        session_fee: profile.session_fee ? Number(profile.session_fee) : 0,
        modalities: Array.isArray(profile.modalities) ? profile.modalities : [],
        languages: Array.isArray(profile.languages) ? profile.languages : [],
        years_experience: profile.years_experience || 0,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile.mutateAsync(data);
      showFeedback('success', 'Perfil actualizado correctamente');
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Error al actualizar el perfil';
      showFeedback('error', msg);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await uploadApi.uploadAvatar(file);
      await updateProfile.mutateAsync({ avatar_url: url });
      
      // Update global auth user state to reflect new avatar immediately
      if (user) {
        updateUser({ ...user, avatar_url: url });
      }
      
      showFeedback('success', 'Foto de perfil actualizada');
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Error al subir la imagen';
      showFeedback('error', msg);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleArrayItem = (field: 'modalities' | 'languages', value: string) => {
    const current = watch(field);
    if (current.includes(value)) {
      setValue(field, current.filter(i => i !== value));
    } else {
      setValue(field, [...current, value]);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-purple" size={40} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-6 rounded-xl flex items-center">
        <AlertCircle className="mr-3" size={24} />
        <div>
          <h3 className="font-bold">Error al cargar el perfil</h3>
          <p className="text-sm">No pudimos obtener tus datos. Intenta de nuevo más tarde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tu Perfil Profesional</h1>
          <p className="text-slate-500 font-medium italic">Gestiona tu información pública y horarios de atención.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === 'info' 
                ? 'bg-white text-brand-purple shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Información
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === 'availability' 
                ? 'bg-white text-brand-purple shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Disponibilidad
          </button>
        </div>
      </header>

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 px-4 py-4 rounded-xl flex items-center shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="mr-3" size={20} />
          <p className="font-bold text-sm uppercase tracking-widest">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 rounded-xl flex items-center shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="mr-3" size={20} />
          <p className="font-bold text-sm uppercase tracking-widest">{errorMsg}</p>
        </div>
      )}

      {activeTab === 'info' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {/* Profile Card & Avatar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center">
              <div className="relative group mb-6">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                  accept="image/*"
                />
                <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transition-transform hover:scale-[1.02]">
                  {isUploading ? (
                    <Loader2 className="animate-spin text-brand-purple" size={32} />
                  ) : user?.avatar_url ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL || ''}${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={64} className="text-slate-300" />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2.5 bg-brand-purple text-white rounded-full shadow-lg hover:bg-brand-purple-dark transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera size={18} />
                </button>
              </div>
              
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{profile?.user?.name}</h2>
              <p className="text-brand-purple font-bold text-sm uppercase tracking-widest mb-4">Psicóloga REDAPSI</p>
              
              <div className="w-full border-t border-slate-100 pt-6 mt-2 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-black uppercase tracking-tighter text-[10px]">Cédula</span>
                  <span className="text-slate-700 font-bold">{profile?.license_number}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-black uppercase tracking-tighter text-[10px]">Experiencia</span>
                  <span className="text-slate-700 font-bold">{profile?.years_experience} años</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500 flex items-center ml-1 uppercase tracking-[0.1em]">
                    <FileText size={12} className="mr-1.5 text-brand-purple" />
                    Cédula Profesional
                  </label>
                  <input
                    {...register('license_number')}
                    className={`w-full px-5 py-3 rounded-xl border-2 ${errors.license_number ? 'border-red-300 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-brand-purple focus:bg-white'} outline-none transition-all duration-300 font-medium text-slate-700 text-sm`}
                  />
                  {errors.license_number && <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.license_number.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500 flex items-center ml-1 uppercase tracking-[0.1em]">
                    <Briefcase size={12} className="mr-1.5 text-brand-purple" />
                    Años de Experiencia
                  </label>
                  <input
                    {...register('years_experience', { valueAsNumber: true })}
                    type="number"
                    className={`w-full px-5 py-3 rounded-xl border-2 ${errors.years_experience ? 'border-red-300 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-brand-purple focus:bg-white'} outline-none transition-all duration-300 font-medium text-slate-700 text-sm`}
                  />
                  {errors.years_experience && <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.years_experience.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500 flex items-center ml-1 uppercase tracking-[0.1em]">
                  <Tag size={12} className="mr-1.5 text-brand-purple" />
                  Especializaciones (separadas por coma)
                </label>
                <input
                  {...register('specializations')}
                  placeholder="Ansiedad, Trauma, Perspectiva de Género..."
                  className={`w-full px-5 py-3 rounded-xl border-2 ${errors.specializations ? 'border-red-300 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-brand-purple focus:bg-white'} outline-none transition-all duration-300 font-medium text-slate-700 text-sm`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500 flex items-center ml-1 uppercase tracking-[0.1em]">
                  <FileText size={12} className="mr-1.5 text-brand-purple" />
                  Biografía Profesional
                </label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  className={`w-full px-5 py-3 rounded-xl border-2 ${errors.bio ? 'border-red-300 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-brand-purple focus:bg-white'} outline-none transition-all duration-300 font-medium text-slate-700 text-sm resize-none`}
                />
                {errors.bio && <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.bio.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500 flex items-center ml-1 uppercase tracking-[0.1em]">
                    <DollarSign size={12} className="mr-1.5 text-brand-purple" />
                    Costo por Sesión
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      {...register('session_fee', { valueAsNumber: true })}
                      type="number"
                      className={`w-full pl-8 pr-5 py-3 rounded-xl border-2 ${errors.session_fee ? 'border-red-300 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-brand-purple focus:bg-white'} outline-none transition-all duration-300 font-medium text-slate-700 text-sm`}
                    />
                  </div>
                  {errors.session_fee && <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.session_fee.message}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 flex items-center ml-1 uppercase tracking-[0.1em]">
                    <Globe size={12} className="mr-1.5 text-brand-purple" />
                    Idiomas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['es', 'en', 'pt', 'fr'].map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleArrayItem('languages', lang)}
                        className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                          watch('languages').includes(lang)
                            ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {lang === 'es' ? 'Español' : lang === 'en' ? 'Inglés' : lang === 'pt' ? 'Portugués' : 'Francés'}
                      </button>
                    ))}
                  </div>
                  {errors.languages && <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.languages.message}</p>}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-[11px] font-black text-slate-500 flex items-center ml-1 uppercase tracking-[0.1em]">
                  <Globe size={12} className="mr-1.5 text-brand-purple" />
                  Modalidades de Atención
                </label>
                <div className="flex flex-wrap gap-2">
                  {['virtual', 'in_person'].map(mod => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => toggleArrayItem('modalities', mod)}
                      className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                        watch('modalities').includes(mod)
                          ? 'bg-brand-cyan text-white shadow-md shadow-brand-cyan/20'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {mod === 'virtual' ? 'Virtual' : 'Presencial'}
                    </button>
                  ))}
                </div>
                {errors.modalities && <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.modalities.message}</p>}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-slate-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                >
                  {updateProfile.isPending ? 'Actualizando...' : 'Guardar Información del Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <AvailabilityEditor 
            initialSlots={profile?.availability_slots || []} 
            onSave={async (slots) => {
              try {
                await setAvailability.mutateAsync(slots);
                showFeedback('success', 'Horarios actualizados correctamente');
              } catch (error: any) {
                const msg = error.response?.data?.error?.message || 'Error al actualizar horarios';
                showFeedback('error', msg);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
