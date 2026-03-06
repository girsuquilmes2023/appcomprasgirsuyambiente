import React, { useState, useMemo } from 'react';
import { Provider, User } from '../types';
import { Building2, Plus, Search, Filter, Mail, Phone, MapPin, Calendar, Bell, Trash2, XCircle, ArrowRight, Printer, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProviderManagerProps {
  providers: Provider[];
  user: User;
  onAddProvider: (p: Provider) => void;
  onUpdateProvider: (p: Provider) => void;
  onDeleteProvider: (id: string) => void;
}

export const ProviderManager: React.FC<ProviderManagerProps> = ({ 
  providers, user, onAddProvider, onUpdateProvider, onDeleteProvider 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [newProvider, setNewProvider] = useState<Partial<Provider>>({
    name: '',
    cuit: '',
    email: '',
    phone: '',
    address: '',
    category: 'SERVICIOS',
    contractEndDate: ''
  });

  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.cuit.includes(searchTerm);
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [providers, searchTerm, categoryFilter]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('REPORTE DE PROVEEDORES - GIRSU', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 14, 30);

    const tableData = filteredProviders.map(p => [
      p.name,
      p.category || '-',
      p.cuit || '-',
      p.phone || '-',
      p.email || '-'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Nombre', 'Rubro', 'CUIT', 'Teléfono', 'Email']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [106, 71, 130] },
      styles: { fontSize: 8 }
    });

    doc.save(`reporte_proveedores_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.cuit) return;
    
    const provider: Provider = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProvider.name!.toUpperCase(),
      cuit: newProvider.cuit!,
      email: newProvider.email || '',
      phone: newProvider.phone || '',
      address: newProvider.address || '',
      category: newProvider.category || 'SERVICIOS',
      contractEndDate: newProvider.contractEndDate || undefined
    };

    onAddProvider(provider);
    setIsAdding(false);
    setNewProvider({ name: '', cuit: '', email: '', phone: '', address: '', category: 'SERVICIOS', contractEndDate: '' });
  };

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const end = new Date(dateStr);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60;
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Proveedores y Servicios</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Control de Contratos y Contactos Comerciales</p>
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
              <Plus size={16}/> Nuevo Proveedor
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
          <input 
            type="text" 
            placeholder="BUSCAR POR NOMBRE O CUIT..." 
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
            <option value="ALL">TODOS LOS RUBROS</option>
            <option value="SERVICIOS">SERVICIOS</option>
            <option value="SUMINISTROS">SUMINISTROS</option>
            <option value="REPUESTOS">REPUESTOS</option>
            <option value="OBRAS">OBRAS</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map(provider => (
          <div key={provider.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft p-8 space-y-6 group hover:border-[#6a4782]/30 transition-all relative overflow-hidden">
            {isExpiringSoon(provider.contractEndDate) && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest animate-pulse">
                Vencimiento Próximo
              </div>
            )}
            
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic leading-tight">{provider.name}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">CUIT: {provider.cuit}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-400">
                <Mail size={14}/>
                <span className="text-[10px] font-bold uppercase italic truncate">{provider.email || 'SIN EMAIL'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Phone size={14}/>
                <span className="text-[10px] font-bold uppercase italic">{provider.phone || 'SIN TELÉFONO'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin size={14}/>
                <span className="text-[10px] font-bold uppercase italic truncate">{provider.address || 'SIN DIRECCIÓN'}</span>
              </div>
              {provider.contractEndDate && (
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${isExpiringSoon(provider.contractEndDate) ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                  <Calendar size={14}/>
                  <span className="text-[9px] font-black uppercase tracking-widest">Fin Contrato: {new Date(provider.contractEndDate).toLocaleDateString('es-AR')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button className="flex-1 bg-slate-50 hover:bg-[#6a4782] hover:text-white p-3 rounded-xl text-slate-400 transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest">
                <ArrowRight size={14}/> Ver Historial
              </button>
              {user.role !== 'VIEWER' && (
                <button 
                  onClick={() => onDeleteProvider(provider.id)}
                  className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-xl text-slate-200 transition-all"
                >
                  <Trash2 size={14}/>
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredProviders.length === 0 && (
          <div className="col-span-full bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-soft">
            <div className="flex flex-col items-center opacity-20">
              <Building2 size={48} className="mb-4"/>
              <p className="text-xs font-black uppercase tracking-widest">No hay proveedores registrados</p>
            </div>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Nuevo Proveedor</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Razón Social</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EJ: SERVICIOS AMBIENTALES S.A."
                  value={newProvider.name}
                  onChange={e => setNewProvider({...newProvider, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">CUIT</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="30-XXXXXXXX-X"
                  value={newProvider.cuit}
                  onChange={e => setNewProvider({...newProvider, cuit: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Rubro</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newProvider.category}
                  onChange={e => setNewProvider({...newProvider, category: e.target.value})}
                >
                  <option value="SERVICIOS">SERVICIOS</option>
                  <option value="SUMINISTROS">SUMINISTROS</option>
                  <option value="REPUESTOS">REPUESTOS</option>
                  <option value="OBRAS">OBRAS</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Email de Contacto</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="PROVEEDOR@EMAIL.COM"
                  value={newProvider.email}
                  onChange={e => setNewProvider({...newProvider, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Vencimiento de Contrato</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newProvider.contractEndDate}
                  onChange={e => setNewProvider({...newProvider, contractEndDate: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleAddProvider}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Guardar Proveedor
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
