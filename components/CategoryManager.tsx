import React, { useState } from 'react';
import { Category, SubCategory, Program, User } from '../types';
import { Wallet, Plus, Trash2, Edit3, XCircle, Save, ChevronDown, ChevronRight, DollarSign, ListTree, Printer, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CategoryManagerProps {
  categories: Category[];
  programs: Program[];
  user: User;
  onUpdateCategories: (categories: Category[]) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, programs, user, onUpdateCategories }) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [editingSub, setEditingSub] = useState<{catId: string, sub: SubCategory} | null>(null);
  
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    code: '',
    programId: programs[0]?.id || '',
    subCategories: []
  });

  const [isAddingSub, setIsAddingSub] = useState<string | null>(null);
  const [newSub, setNewSub] = useState<Partial<SubCategory>>({
    name: '',
    code: '',
    limit: 0,
    spent: 0
  });

  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('ESTRUCTURA DE PARTIDAS - GIRSU', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 14, 30);

    const tableData: any[] = [];
    categories.forEach(cat => {
      tableData.push([cat.code, cat.name, '', '']);
      (cat.subCategories || []).forEach(sub => {
        tableData.push(['', `  ${sub.code} - ${sub.name}`, formatCurrency(sub.limit), formatCurrency(sub.spent)]);
      });
    });

    autoTable(doc, {
      startY: 40,
      head: [['Código', 'Partida / Subpartida', 'Límite', 'Ejecutado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [106, 71, 130] },
      styles: { fontSize: 7 }
    });

    doc.save(`reporte_partidas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.code) return;
    const cat: Category = {
      id: `c-${Math.random().toString(36).substr(2, 9)}`,
      name: newCategory.name,
      code: newCategory.code,
      programId: newCategory.programId || programs[0]?.id,
      subCategories: []
    };
    onUpdateCategories([...categories, cat]);
    setIsAddingCategory(false);
    setNewCategory({ name: '', code: '', programId: programs[0]?.id, subCategories: [] });
  };

  const handleEditCategory = () => {
    if (!editingCategory || !editingCategory.name || !editingCategory.code) return;
    const updated = categories.map(c => c.id === editingCategory.id ? editingCategory : c);
    onUpdateCategories(updated);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('¿Eliminar esta partida y todas sus subpartidas?')) {
      onUpdateCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleAddSubCategory = (catId: string) => {
    if (!newSub.name || !newSub.code) return;
    const updated = categories.map(c => {
      if (c.id === catId) {
        const sub: SubCategory = {
          id: `s-${Math.random().toString(36).substr(2, 9)}`,
          name: newSub.name!,
          code: newSub.code!,
          limit: Number(newSub.limit) || 0,
          spent: 0
        };
        return { ...c, subCategories: [...(c.subCategories || []), sub] };
      }
      return c;
    });
    onUpdateCategories(updated);
    setIsAddingSub(null);
    setNewSub({ name: '', code: '', limit: 0, spent: 0 });
  };

  const handleEditSubCategory = () => {
    if (!editingSub || !editingSub.sub.name || !editingSub.sub.code) return;
    const updated = categories.map(c => {
      if (c.id === editingSub.catId) {
        return {
          ...c,
          subCategories: (c.subCategories || []).map(s => s.id === editingSub.sub.id ? editingSub.sub : s)
        };
      }
      return c;
    });
    onUpdateCategories(updated);
    setEditingSub(null);
  };

  const handleDeleteSub = (catId: string, subId: string) => {
    const updated = categories.map(c => {
      if (c.id === catId) {
        return { ...c, subCategories: (c.subCategories || []).filter(s => s.id !== subId) };
      }
      return c;
    });
    onUpdateCategories(updated);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Estructura de Partidas</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Gestión de Presupuesto y Clasificadores</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleDownloadPDF}
            className="flex-1 md:flex-none bg-white border border-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-soft italic"
          >
            <FileDown size={16}/> Descargar PDF
          </button>
          {user.role !== 'VIEWER' && (
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="flex-1 md:flex-none bg-[#6a4782] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg italic"
            >
              <Plus size={16}/> Nueva Partida Principal
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-soft overflow-hidden transition-all">
            <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer" onClick={() => toggleExpand(cat.id)}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-400">
                  {expandedCategories.includes(cat.id) ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{cat.code} • {programs.find(p => p.id === cat.programId)?.code}</p>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{cat.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Crédito Total</p>
                  <p className="text-xs font-black text-slate-900 tabular-nums">
                    {formatCurrency((cat.subCategories || []).reduce((acc, s) => acc + s.limit, 0))}
                  </p>
                </div>
                {user.role !== 'VIEWER' && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }}
                      className="p-2 text-slate-200 hover:text-[#6a4782] hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit3 size={18}/>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {expandedCategories.includes(cat.id) && (
              <div className="px-6 pb-6 border-t border-slate-50 pt-4 space-y-3 bg-slate-50/30">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Subpartidas / Clasificadores</h4>
                  {user.role !== 'VIEWER' && (
                    <button 
                      onClick={() => setIsAddingSub(cat.id)}
                      className="text-[9px] font-black text-[#6a4782] uppercase tracking-widest flex items-center gap-1 hover:underline"
                    >
                      <Plus size={12}/> Añadir Subpartida
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(cat.subCategories || []).map(sub => (
                    <div key={sub.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center group">
                      <div>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{sub.code}</p>
                        <p className="text-[10px] font-black text-slate-700 uppercase italic">{sub.name}</p>
                        <p className="text-[10px] font-black text-[#21b524] mt-1">{formatCurrency(sub.limit)}</p>
                      </div>
                      {user.role !== 'VIEWER' && (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setEditingSub({ catId: cat.id, sub: sub })}
                            className="p-2 text-slate-100 group-hover:text-[#6a4782] transition-all"
                          >
                            <Edit3 size={14}/>
                          </button>
                          <button 
                            onClick={() => handleDeleteSub(cat.id, sub.id)}
                            className="p-2 text-slate-100 group-hover:text-red-400 transition-all"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {isAddingSub === cat.id && (
                  <div className="mt-4 p-6 bg-white rounded-3xl border border-[#6a4782]/20 shadow-xl animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Código</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-[10px] font-bold uppercase outline-none focus:border-[#6a4782] transition-all"
                          placeholder="X.X.X.X"
                          value={newSub.code}
                          onChange={e => setNewSub({...newSub, code: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-[10px] font-bold uppercase outline-none focus:border-[#6a4782] transition-all"
                          placeholder="Nombre de subpartida"
                          value={newSub.name}
                          onChange={e => setNewSub({...newSub, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto Límite</label>
                        <input 
                          type="number" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-[10px] font-bold outline-none focus:border-[#6a4782] transition-all"
                          placeholder="0"
                          value={newSub.limit}
                          onChange={e => setNewSub({...newSub, limit: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => handleAddSubCategory(cat.id)}
                        className="flex-1 bg-[#6a4782] text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                      >
                        Guardar Subpartida
                      </button>
                      <button 
                        onClick={() => setIsAddingSub(null)}
                        className="px-4 py-2 border border-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isAddingCategory && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Nueva Partida</h3>
              <button onClick={() => setIsAddingCategory(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Programa rAFAM</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newCategory.programId}
                  onChange={e => setNewCategory({...newCategory, programId: e.target.value})}
                >
                  {programs.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Código de Partida</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="X.X.X.X"
                  value={newCategory.code}
                  onChange={e => setNewCategory({...newCategory, code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre de la Partida</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EJ: SERVICIOS BÁSICOS"
                  value={newCategory.name}
                  onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleAddCategory}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Crear Partida
              </button>
              <button 
                onClick={() => setIsAddingCategory(false)}
                className="px-8 py-5 border border-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all italic"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Editar Partida</h3>
              <button onClick={() => setEditingCategory(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Programa rAFAM</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={editingCategory.programId}
                  onChange={e => setEditingCategory({...editingCategory, programId: e.target.value})}
                >
                  {programs.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Código de Partida</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="X.X.X.X"
                  value={editingCategory.code}
                  onChange={e => setEditingCategory({...editingCategory, code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre de la Partida</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EJ: SERVICIOS BÁSICOS"
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleEditCategory}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Guardar Cambios
              </button>
              <button 
                onClick={() => setEditingCategory(null)}
                className="px-8 py-5 border border-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all italic"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSub && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Editar Subpartida</h3>
              <button onClick={() => setEditingSub(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Código</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="X.X.X.X"
                  value={editingSub.sub.code}
                  onChange={e => setEditingSub({...editingSub, sub: {...editingSub.sub, code: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="Nombre de subpartida"
                  value={editingSub.sub.name}
                  onChange={e => setEditingSub({...editingSub, sub: {...editingSub.sub, name: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Monto Límite</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="0"
                  value={editingSub.sub.limit}
                  onChange={e => setEditingSub({...editingSub, sub: {...editingSub.sub, limit: Number(e.target.value)}})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleEditSubCategory}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Guardar Cambios
              </button>
              <button 
                onClick={() => setEditingSub(null)}
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
