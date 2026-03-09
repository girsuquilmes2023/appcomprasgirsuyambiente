import React, { useState, useMemo } from 'react';
import { Item, Category, User } from '../types';
import { Package, Plus, Search, Filter, AlertTriangle, Trash2, Edit2, ArrowRight, XCircle, ChevronDown, ChevronUp, Printer, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InventoryManagerProps {
  items: Item[];
  categories: Category[];
  user: User;
  onAddItem: (item: Item) => void;
  onUpdateItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ 
  items, categories, user, onAddItem, onUpdateItem, onDeleteItem 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '',
    categoryId: '',
    subCategoryId: '',
    quantity: 0,
    minStock: 5,
    unit: 'UNIDADES',
    price: 0
  });

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || i.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, categoryFilter]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.categoryId]) groups[item.categoryId] = [];
      groups[item.categoryId].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('REPORTE DE STOCK - GIRSU', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 14, 30);

    const tableData = filteredItems.map(item => [
      item.name,
      categories.find(c => c.id === item.categoryId)?.name || 'Sin Categoría',
      item.quantity.toString(),
      item.unit,
      item.quantity <= item.minStock ? 'CRÍTICO' : 'OK'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Artículo', 'Categoría', 'Stock', 'Unidad', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [106, 71, 130] },
      styles: { fontSize: 8 }
    });

    doc.save(`reporte_stock_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.categoryId) return;
    
    const item: Item = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name!,
      categoryId: newItem.categoryId!,
      subCategoryId: newItem.subCategoryId || '',
      quantity: Number(newItem.quantity) || 0,
      minStock: Number(newItem.minStock) || 5,
      unit: newItem.unit || 'UNIDADES',
      price: Number(newItem.price) || 0
    };

    onAddItem(item);
    setIsAdding(false);
    setNewItem({ name: '', categoryId: '', subCategoryId: '', quantity: 0, minStock: 5, unit: 'UNIDADES', price: 0 });
  };

  const handleEditItem = () => {
    if (!editingItem || !editingItem.name || !editingItem.categoryId) return;
    onUpdateItem(editingItem);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Control de Stock</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Gestión de Suministros e Insumos</p>
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
              onClick={() => setIsAdding(true)}
              className="flex-1 md:flex-none bg-[#6a4782] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg italic"
            >
              <Plus size={16}/> Nuevo Insumo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
          <input 
            type="text" 
            placeholder="BUSCAR INSUMO..." 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase outline-none focus:border-[#6a4782] transition-all italic"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
          <select 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase outline-none appearance-none focus:border-[#6a4782] transition-all italic"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">TODAS LAS CATEGORÍAS</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedItems).map(([catId, catItems]) => {
          const category = categories.find(c => c.id === catId);
          const isExpanded = expandedCategory === catId;
          
          return (
            <div key={catId} className="bg-white rounded-[2rem] border border-slate-100 shadow-soft overflow-hidden">
              <button 
                onClick={() => setExpandedCategory(isExpanded ? null : catId)}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#6a4782]/10 flex items-center justify-center text-[#6a4782]">
                    <Package size={20}/>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{category?.name || 'SIN CATEGORÍA'}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{catItems.length} ARTÍCULOS</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-slate-300"/> : <ChevronDown size={20} className="text-slate-300"/>}
              </button>

              {isExpanded && (
                <div className="px-8 pb-8 animate-fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-50">
                          <th className="py-4 text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Artículo</th>
                          <th className="py-4 text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Stock</th>
                          <th className="py-4 text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Unidad</th>
                          <th className="py-4 text-[8px] font-black text-slate-300 uppercase tracking-widest italic text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {catItems.map(item => (
                          <tr key={item.id} className="group">
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-900 uppercase italic">{item.name}</span>
                                {item.quantity <= item.minStock && (
                                  <span className="flex items-center gap-1 text-[8px] font-black text-red-500 uppercase mt-1">
                                    <AlertTriangle size={10}/> Stock Crítico
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`text-xs font-black tabular-nums ${item.quantity <= item.minStock ? 'text-red-600' : 'text-slate-900'}`}>
                                {item.quantity}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className="text-[9px] font-bold text-slate-400 uppercase italic">{item.unit}</span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {user.role !== 'VIEWER' && (
                                  <>
                                    <button 
                                      onClick={() => setEditingItem(item)}
                                      className="p-2 text-slate-200 hover:text-[#6a4782] hover:bg-indigo-50 rounded-xl transition-all"
                                    >
                                      <Edit2 size={16}/>
                                    </button>
                                    <button 
                                      onClick={() => onDeleteItem(item.id)}
                                      className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                      <Trash2 size={16}/>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(groupedItems).length === 0 && (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-soft">
            <div className="flex flex-col items-center opacity-20">
              <Package size={48} className="mb-4"/>
              <p className="text-xs font-black uppercase tracking-widest">No se encontraron artículos</p>
            </div>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Nuevo Insumo</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre del Artículo</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EJ: GUANTES DE NITRILO"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Categoría</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newItem.categoryId}
                  onChange={e => {
                    const cat = categories.find(c => c.id === e.target.value);
                    setNewItem({...newItem, categoryId: e.target.value, subCategoryId: cat?.subCategories?.[0]?.id || ''});
                  }}
                >
                  <option value="">SELECCIONAR CATEGORÍA</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Unidad de Medida</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newItem.unit}
                  onChange={e => setNewItem({...newItem, unit: e.target.value})}
                >
                  <option value="UNIDADES">UNIDADES</option>
                  <option value="PARES">PARES</option>
                  <option value="LITROS">LITROS</option>
                  <option value="KILOS">KILOS</option>
                  <option value="CAJAS">CAJAS</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Stock Actual</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newItem.quantity}
                  onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Stock Mínimo (Alerta)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newItem.minStock}
                  onChange={e => setNewItem({...newItem, minStock: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleAddItem}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Guardar Insumo
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

      {editingItem && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Editar Insumo</h3>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre del Artículo</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EJ: GUANTES DE NITRILO"
                  value={editingItem.name}
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Categoría</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={editingItem.categoryId}
                  onChange={e => {
                    const cat = categories.find(c => c.id === e.target.value);
                    setEditingItem({...editingItem, categoryId: e.target.value, subCategoryId: cat?.subCategories?.[0]?.id || ''});
                  }}
                >
                  <option value="">SELECCIONAR CATEGORÍA</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Unidad de Medida</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={editingItem.unit}
                  onChange={e => setEditingItem({...editingItem, unit: e.target.value})}
                >
                  <option value="UNIDADES">UNIDADES</option>
                  <option value="PARES">PARES</option>
                  <option value="LITROS">LITROS</option>
                  <option value="KILOS">KILOS</option>
                  <option value="CAJAS">CAJAS</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Stock Actual</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={editingItem.quantity}
                  onChange={e => setEditingItem({...editingItem, quantity: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Stock Mínimo (Alerta)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={editingItem.minStock}
                  onChange={e => setEditingItem({...editingItem, minStock: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleEditItem}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Guardar Cambios
              </button>
              <button 
                onClick={() => setEditingItem(null)}
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
