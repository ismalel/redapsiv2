import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Calendar, AlertCircle } from 'lucide-react';

interface Slot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  type: 'AVAILABLE' | 'BLOCKED';
}

interface AvailabilityEditorProps {
  initialSlots: Slot[];
  onSave: (slots: Slot[]) => Promise<void>;
}

const DAYS = [
  'Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'
];

const FULL_DAYS = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

export const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({ initialSlots, onSave }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal/Form state for adding new slot
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState<Slot>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
    type: 'AVAILABLE'
  });

  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  const timeToMinutes = (time: string) => {
    const [hrs, mins] = time.split(':').map(Number);
    return hrs * 60 + mins;
  };

  const minutesToTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const checkOverlap = (day: number, start: string, end: string, excludeId?: string) => {
    const newStart = timeToMinutes(start);
    const newEnd = timeToMinutes(end);

    if (newEnd <= newStart) return 'La hora de fin debe ser posterior a la de inicio';

    // Range validation: 6 AM to 10 PM
    if (newStart < START_HOUR * 60 || newEnd > (END_HOUR + 1) * 60) {
      return `El horario debe estar entre las ${START_HOUR}:00 y las ${END_HOUR + 1}:00`;
    }

    const daySlots = slots.filter(s => s.day_of_week === day && s.id !== excludeId);
    
    for (const slot of daySlots) {
      const existingStart = timeToMinutes(slot.start_time);
      const existingEnd = timeToMinutes(slot.end_time);

      if (newStart < existingEnd && newEnd > existingStart) {
        return `Este horario se traslapa con un slot existente (${slot.start_time} - ${slot.end_time})`;
      }
    }

    return null;
  };

  const handleGridClick = (dayIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    
    // Snap to 30 minute intervals
    const clickedMinutes = Math.floor(relativeY / 30) * 30;
    const startTotalMinutes = (START_HOUR * 60) + clickedMinutes;
    const endTotalMinutes = startTotalMinutes + 60; // Default 1 hour duration

    setNewSlot({
      day_of_week: dayIndex,
      start_time: minutesToTime(startTotalMinutes),
      end_time: minutesToTime(Math.min(endTotalMinutes, (END_HOUR + 1) * 60)),
      type: 'AVAILABLE'
    });
    setShowAddModal(true);
  };

  const addSlot = () => {
    const overlapError = checkOverlap(newSlot.day_of_week, newSlot.start_time, newSlot.end_time);
    if (overlapError) {
      setError(overlapError);
      return;
    }

    setSlots([...slots, { ...newSlot, id: Math.random().toString(36).substr(2, 9) }]);
    setShowAddModal(false);
    setError(null);
  };

  const removeSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Remove temporary IDs before saving
      const cleanSlots = slots.map(({ id, ...rest }) => rest);
      await onSave(cleanSlots as any);
      setError(null);
    } catch (err: any) {
      setError('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to calculate position in grid
  const getSlotStyle = (slot: Slot) => {
    const startMins = timeToMinutes(slot.start_time);
    const endMins = timeToMinutes(slot.end_time);
    const duration = endMins - startMins;
    
    // Each hour is 60px height. Position is relative to START_HOUR
    const top = ((startMins - (START_HOUR * 60)) / 60) * 60;
    const height = (duration / 60) * 60;

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mt-6 flex flex-col h-[800px]">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white z-30">
        <div>
          <h3 className="text-xl font-black text-slate-800 flex items-center">
            <Calendar size={22} className="mr-2 text-brand-purple" />
            Agenda Semanal
          </h3>
          <p className="text-xs text-slate-500 font-medium">Haz clic en el calendario para crear un bloque (6:00 - 22:00).</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-70 uppercase tracking-widest text-xs"
          >
            {isSaving ? 'Guardando...' : 'Guardar Agenda'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2 rounded-r-lg animate-in slide-in-from-top-2">
          <AlertCircle size={16} />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-0 relative">
        <div className="min-w-[800px] relative">
          {/* Day Headers - Sticky and Smaller */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] sticky top-0 bg-white z-20 border-b border-slate-200 shadow-sm">
            <div className="bg-slate-50 h-8"></div>
            {DAYS.map((day, i) => (
              <div key={i} className="text-center font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 py-2 border-l border-slate-100 bg-slate-50">
                {day}
              </div>
            ))}
          </div>

          {/* Time Rows & Columns */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] relative h-[1020px]">
            {/* Time Labels */}
            <div className="bg-white border-r border-slate-200">
              {HOURS.map(h => (
                <div key={h} className="h-[60px] text-[10px] font-bold text-slate-400 text-right pr-3 pt-1 border-b border-slate-50">
                  {`${h.toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>

            {/* Grid Columns */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div 
                key={i} 
                onClick={(e) => handleGridClick(i, e)}
                className="border-l border-slate-200 relative group h-full bg-white hover:bg-slate-50/50 cursor-pointer transition-colors"
              >
                {/* Visual grid lines - More visible */}
                {HOURS.map(h => (
                  <div key={h} className="h-[60px] border-b border-slate-200/60"></div>
                ))}
                
                {/* Slots for this day */}
                {slots.filter(s => s.day_of_week === i).map(slot => (
                  <div
                    key={slot.id}
                    onClick={(e) => e.stopPropagation()} // Prevent adding another slot when clicking an existing one
                    style={getSlotStyle(slot)}
                    className={`absolute left-1 right-1 rounded-lg border-2 p-2 shadow-sm pointer-events-auto transition-all hover:z-10 group/slot overflow-hidden cursor-default ${
                      slot.type === 'AVAILABLE' 
                        ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan-dark' 
                        : 'bg-slate-200 border-slate-400 text-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start h-full">
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black leading-none mb-1">
                          {slot.type === 'AVAILABLE' ? 'DISPONIBLE' : 'BLOQUEADO'}
                        </p>
                        <p className="text-[9px] font-bold opacity-70">
                          {slot.start_time} - {slot.end_time}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeSlot(slot.id!); }}
                        className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors text-slate-400 opacity-0 group-hover/slot:opacity-100"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">Agregar Horario</h4>
              <p className="text-sm text-slate-500 font-medium italic">Define un nuevo bloque en tu agenda.</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Bloque</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewSlot({...newSlot, type: 'AVAILABLE'})}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                      newSlot.type === 'AVAILABLE' 
                        ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' 
                        : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    Disponible
                  </button>
                  <button
                    onClick={() => setNewSlot({...newSlot, type: 'BLOCKED'})}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                      newSlot.type === 'BLOCKED' 
                        ? 'border-slate-800 bg-slate-800 text-white' 
                        : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    Bloqueado
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Día de la Semana</label>
                <select
                  value={newSlot.day_of_week}
                  onChange={(e) => setNewSlot({...newSlot, day_of_week: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-brand-purple outline-none"
                >
                  {FULL_DAYS.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</label>
                  <input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-brand-purple outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
                  <input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-brand-purple outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-3 bg-white border-2 border-slate-200 text-slate-400 font-black rounded-xl uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={addSlot}
                className="flex-1 px-6 py-3 bg-brand-purple text-white font-black rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-brand-purple/20 hover:bg-brand-purple-dark transition-all"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
