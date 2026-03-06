import React, { useState, useMemo } from 'react';
import { Staff, Item, Handout, User } from '../types';
import { Shirt, Plus, Search, Filter, History, User as UserIcon, Package, Calendar, Trash2, XCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ClothingMasterProps {
  staff: Staff[];
  items: Item[];
  handouts: Handout[];
  user: User;
  onAddHandout: (h: Handout) => void;
  onDeleteHandout: (id: string) => void;
}

export const ClothingMaster: React.FC<ClothingMasterProps> = ({ 
  staff, items, handouts, user, onAddHandout, onDeleteHandout 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');

  const [newHandout, setNewHandout] = useState<Partial<Handout>>({
    staffId: '',
    itemId: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0]
  });

  const clothingItems = useMemo(() => {
    return items.filter(i => i.categoryId.includes('2200')); // Indumentaria
  }, [items]);

  const filteredHandouts = useMemo(() => {
    return handouts.filter(h => {
      const person = staff.find(s => s.id === h.staffId);
      const item = items.find(i => i.id === h.itemId);
      const matchesSearch = person?.name.toLowerCase().includes(searchTerm.toLowerCase()) || item?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStaff = staffFilter === 'ALL' || h.staffId === staffFilter;
      return matchesSearch && matchesStaff;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [handouts, staff, items, searchTerm, staffFilter]);

  const handleAddHandout = () => {
    if (!newHandout.staffId || !newHandout.itemId) return;
    
    const handout: Handout = {
      id: Math.random().toString(36).substr(2, 9),
      staffId: newHandout.staffId!,
      itemId: newHandout.itemId!,
      quantity: Number(newHandout.quantity) || 1,
      date: newHandout.date || new Date().toISOString().split('T')[0]
    };

    onAddHandout(handout);
    setIsAdding(false);
    setNewHandout({ staffId: '', itemId: '', quantity: 1, date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Entrega de Indumentaria</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Control de EPP y Ropa de Trabajo</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#6a4782] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg italic"
        >
          <Plus size={16}/> Registrar Entrega
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
          <input 
            type="text" 
            placeholder="BUSCAR POR AGENTE O PRENDA..." 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase outline-none focus:border-[#6a4782] transition-all italic"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
          <select 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase outline-none appearance-none focus:border-[#6a4782] transition-all italic"
            value={staffFilter}
            onChange={e => setStaffFilter(e.target.value)}
          >
            <option value="ALL">TODOS LOS AGENTES</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Agente</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Prenda / EPP</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Cantidad</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Fecha</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHandouts.length > 0 ? filteredHandouts.map(handout => {
                const person = staff.find(s => s.id === handout.staffId);
                const item = items.find(i => i.id === handout.itemId);
                return (
                  <tr key={handout.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#6a4782] group-hover:text-white transition-all">
                          <UserIcon size={14}/>
                        </div>
                        <span className="text-xs font-black text-slate-900 uppercase italic">{person?.name || 'DESCONOCIDO'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Shirt size={14} className="text-slate-300"/>
                        <span className="text-[10px] font-bold text-slate-500 uppercase italic">{item?.name || 'DESCONOCIDO'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-black text-slate-900 tabular-nums">{handout.quantity}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase italic">{new Date(handout.date).toLocaleDateString('es-AR')}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => onDeleteHandout(handout.id)}
                        className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Shirt size={48} className="mb-4"/>
                      <p className="text-xs font-black uppercase tracking-widest">No hay entregas registradas</p>
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
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Registrar Entrega</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Agente Receptor</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newHandout.staffId}
                  onChange={e => setNewHandout({...newHandout, staffId: e.target.value})}
                >
                  <option value="">SELECCIONAR AGENTE</option>
                  {staff.filter(s => s.status === 'ACTIVE').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Prenda / EPP</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newHandout.itemId}
                  onChange={e => setNewHandout({...newHandout, itemId: e.target.value})}
                >
                  <option value="">SELECCIONAR PRENDA</option>
                  {clothingItems.map(i => <option key={i.id} value={i.id}>{i.name} (STOCK: {i.quantity})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Cantidad</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newHandout.quantity}
                  onChange={e => setNewHandout({...newHandout, quantity: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Fecha de Entrega</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newHandout.date}
                  onChange={e => setNewHandout({...newHandout, date: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleAddHandout}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Confirmar Entrega
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
