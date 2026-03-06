import React, { useState, useMemo } from 'react';
import { Staff, User } from '../types';
import { Users, Plus, Search, Filter, UserCheck, UserX, Trash2, XCircle, ArrowRight, Shield } from 'lucide-react';

interface StaffManagerProps {
  staff: Staff[];
  user: User;
  onAddStaff: (s: Staff) => void;
  onUpdateStaff: (s: Staff) => void;
  onDeleteStaff: (id: string) => void;
}

export const StaffManager: React.FC<StaffManagerProps> = ({ 
  staff, user, onAddStaff, onUpdateStaff, onDeleteStaff 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [newStaff, setNewStaff] = useState<Partial<Staff>>({
    name: '',
    dni: '',
    role: 'Operario',
    area: 'GIRSU',
    status: 'ACTIVE'
  });

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.dni.includes(searchTerm);
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [staff, searchTerm, statusFilter]);

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.dni) return;
    
    const person: Staff = {
      id: Math.random().toString(36).substr(2, 9),
      name: newStaff.name!.toUpperCase(),
      dni: newStaff.dni!,
      role: newStaff.role || 'Operario',
      area: newStaff.area || 'GIRSU',
      status: newStaff.status as any || 'ACTIVE'
    };

    onAddStaff(person);
    setIsAdding(false);
    setNewStaff({ name: '', dni: '', role: 'Operario', area: 'GIRSU', status: 'ACTIVE' });
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Gestión de Personal</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Control de Recursos Humanos y Áreas</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#6a4782] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg italic"
        >
          <Plus size={16}/> Alta de Agente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
          <input 
            type="text" 
            placeholder="BUSCAR POR NOMBRE O DNI..." 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase outline-none focus:border-[#6a4782] transition-all italic"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
          <select 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase outline-none appearance-none focus:border-[#6a4782] transition-all italic"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">TODOS LOS ESTADOS</option>
            <option value="ACTIVE">ACTIVOS</option>
            <option value="INACTIVE">BAJAS / LICENCIAS</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Agente</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">DNI</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Rol / Función</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Área</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Estado</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStaff.length > 0 ? filteredStaff.map(person => (
                <tr key={person.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#6a4782] group-hover:text-white transition-all">
                        <Users size={18}/>
                      </div>
                      <span className="text-xs font-black text-slate-900 uppercase italic">{person.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tabular-nums">{person.dni}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase italic">{person.role}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase italic">{person.area}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${person.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {person.status === 'ACTIVE' ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onUpdateStaff({ ...person, status: person.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                        className="p-2 text-slate-300 hover:text-[#6a4782] hover:bg-[#6a4782]/10 rounded-xl transition-all"
                      >
                        {person.status === 'ACTIVE' ? <UserX size={18}/> : <UserCheck size={18}/>}
                      </button>
                      <button 
                        onClick={() => onDeleteStaff(person.id)}
                        className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Users size={48} className="mb-4"/>
                      <p className="text-xs font-black uppercase tracking-widest">No hay personal registrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Alta de Agente</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EJ: JUAN PEREZ"
                  value={newStaff.name}
                  onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">DNI</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="XXXXXXXX"
                  value={newStaff.dni}
                  onChange={e => setNewStaff({...newStaff, dni: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Rol / Función</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newStaff.role}
                  onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                >
                  <option value="Operario">OPERARIO</option>
                  <option value="Chofer">CHOFER</option>
                  <option value="Administrativo">ADMINISTRATIVO</option>
                  <option value="Supervisor">SUPERVISOR</option>
                  <option value="Director">DIRECTOR</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Área</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newStaff.area}
                  onChange={e => setNewStaff({...newStaff, area: e.target.value})}
                >
                  <option value="GIRSU">GIRSU</option>
                  <option value="Ambiente">AMBIENTE</option>
                  <option value="Espacios Verdes">ESPACIOS VERDES</option>
                  <option value="Administración">ADMINISTRACIÓN</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Estado</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newStaff.status}
                  onChange={e => setNewStaff({...newStaff, status: e.target.value as any})}
                >
                  <option value="ACTIVE">ACTIVO</option>
                  <option value="INACTIVE">INACTIVO</option>
                </select>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleAddStaff}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Registrar Agente
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="px-8 py-5 border border-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all italic"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
