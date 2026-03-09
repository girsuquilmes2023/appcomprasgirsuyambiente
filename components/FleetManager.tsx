import React, { useState, useMemo, useRef } from 'react';
import { Vehicle, MaintenanceRecord, FuelLog, User } from '../types';
import { Truck, Plus, Search, Filter, AlertTriangle, Wrench, Fuel, History, Settings, XCircle, Trash2, ArrowRight, Upload, Printer, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FleetManagerProps {
  vehicles: Vehicle[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  user: User;
  onAddVehicle: (v: Vehicle) => void;
  onUpdateVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onAddMaintenance: (m: MaintenanceRecord) => void;
  onAddFuel: (f: FuelLog) => void;
}

export const FleetManager: React.FC<FleetManagerProps> = ({ 
  vehicles, maintenance, fuelLogs, user, onAddVehicle, onUpdateVehicle, onDeleteVehicle, onAddMaintenance, onAddFuel 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<Vehicle | null>(null);
  const [fuelVehicle, setFuelVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    plate: '',
    model: '',
    type: 'Compactador',
    status: 'Operativo',
    mileage: 0
  });

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || v.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('REPORTE DE FLOTA - GIRSU', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 14, 30);

    const tableData = filteredVehicles.map(v => [
      v.plate,
      v.model,
      v.type,
      v.status,
      `${v.mileage.toLocaleString()} KM`,
      maintenance.filter(m => m.vehicleId === v.id).length.toString()
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Patente', 'Modelo', 'Tipo', 'Estado', 'Kilometraje', 'Mant.']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [106, 71, 130] },
      styles: { fontSize: 8 }
    });

    doc.save(`reporte_flota_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleAddVehicle = () => {
    if (!newVehicle.plate || !newVehicle.model) return;
    
    const vehicle: Vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      plate: newVehicle.plate!.toUpperCase(),
      model: newVehicle.model!,
      type: newVehicle.type || 'Compactador',
      status: newVehicle.status as any || 'Operativo',
      mileage: Number(newVehicle.mileage) || 0
    };

    onAddVehicle(vehicle);
    setIsAdding(false);
    setNewVehicle({ plate: '', model: '', type: 'Compactador', status: 'Operativo', mileage: 0 });
  };

  const handleEditVehicle = () => {
    if (!editingVehicle || !editingVehicle.plate || !editingVehicle.model) return;
    onUpdateVehicle(editingVehicle);
    setEditingVehicle(null);
  };

  const [newMaintenance, setNewMaintenance] = useState<Partial<MaintenanceRecord>>({
    description: '',
    cost: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddMaintenanceRecord = () => {
    if (!maintenanceVehicle || !newMaintenance.description) return;
    const record: MaintenanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      vehicleId: maintenanceVehicle.id,
      date: newMaintenance.date || new Date().toISOString().split('T')[0],
      description: newMaintenance.description!,
      cost: Number(newMaintenance.cost) || 0
    };
    onAddMaintenance(record);
    onUpdateVehicle({ ...maintenanceVehicle, status: 'En Taller' });
    setMaintenanceVehicle(null);
    setNewMaintenance({ description: '', cost: 0, date: new Date().toISOString().split('T')[0] });
  };

  const [newFuel, setNewFuel] = useState<Partial<FuelLog>>({
    liters: 0,
    cost: 0,
    mileage: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddFuelRecord = () => {
    if (!fuelVehicle || !newFuel.liters) return;
    const record: FuelLog = {
      id: Math.random().toString(36).substr(2, 9),
      vehicleId: fuelVehicle.id,
      date: newFuel.date || new Date().toISOString().split('T')[0],
      liters: Number(newFuel.liters) || 0,
      cost: Number(newFuel.cost) || 0,
      mileage: Number(newFuel.mileage) || fuelVehicle.mileage
    };
    onAddFuel(record);
    if (record.mileage > fuelVehicle.mileage) {
      onUpdateVehicle({ ...fuelVehicle, mileage: record.mileage });
    }
    setFuelVehicle(null);
    setNewFuel({ liters: 0, cost: 0, mileage: 0, date: new Date().toISOString().split('T')[0] });
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Import vehicles
        if (data.vehicles && Array.isArray(data.vehicles)) {
          data.vehicles.forEach((v: any) => {
            if (v.plate && v.model) {
              onAddVehicle({
                id: v.id || Math.random().toString(36).substr(2, 9),
                plate: v.plate.toUpperCase(),
                model: v.model,
                type: v.type || 'Compactador',
                status: v.status || 'Operativo',
                mileage: Number(v.mileage) || 0
              });
            }
          });
        }

        // Import maintenance
        if (data.maintenance && Array.isArray(data.maintenance)) {
          data.maintenance.forEach((m: any) => {
            onAddMaintenance({
              id: m.id || Math.random().toString(36).substr(2, 9),
              vehicleId: m.vehicleId,
              date: m.date || new Date().toISOString().split('T')[0],
              description: m.description || '',
              cost: Number(m.cost) || 0
            });
          });
        }

        // Import fuel logs
        if (data.fuelLogs && Array.isArray(data.fuelLogs)) {
          data.fuelLogs.forEach((f: any) => {
            onAddFuel({
              id: f.id || Math.random().toString(36).substr(2, 9),
              vehicleId: f.vehicleId,
              date: f.date || new Date().toISOString().split('T')[0],
              liters: Number(f.liters) || 0,
              cost: Number(f.cost) || 0,
              mileage: Number(f.mileage) || 0
            });
          });
        }

        alert("Importación finalizada con éxito");
      } catch (err) {
        console.error("Error parsing JSON:", err);
        alert("Error al procesar el archivo JSON");
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operativo': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'En Taller': return 'text-orange-500 bg-orange-50 border-orange-100';
      case 'Fuera de Servicio': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Gestión de Flota</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Control de Camiones y Maquinaria Pesada</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleDownloadPDF}
            className="flex-1 md:flex-none bg-white border border-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-soft italic"
          >
            <FileDown size={16}/> Descargar PDF
          </button>
          {user.role !== 'VIEWER' && (
            <>
              <input 
                type="file" 
                ref={jsonInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleImportJson}
              />
              <button 
                onClick={() => jsonInputRef.current?.click()}
                className="flex-1 md:flex-none bg-white border border-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-soft italic"
              >
                <Upload size={16}/> Importar JSON
              </button>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex-1 md:flex-none bg-[#6a4782] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg italic"
              >
                <Plus size={16}/> Alta de Vehículo
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
          <input 
            type="text" 
            placeholder="BUSCAR POR PATENTE O MODELO..." 
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
            <option value="Operativo">OPERATIVO</option>
            <option value="En Taller">EN TALLER</option>
            <option value="Fuera de Servicio">FUERA DE SERVICIO</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft p-8 space-y-6 group hover:border-[#6a4782]/30 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black tracking-widest uppercase">{vehicle.plate}</span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic pt-2">{vehicle.model}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{vehicle.type}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(vehicle.status)}`}>
                {vehicle.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Kilometraje</p>
                <p className="text-sm font-black text-slate-900 tabular-nums">{vehicle.mileage.toLocaleString()} KM</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Mantenimientos</p>
                <p className="text-sm font-black text-slate-900 tabular-nums">{maintenance.filter(m => m.vehicleId === vehicle.id).length}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {user.role !== 'VIEWER' && (
                <>
                  <button 
                    onClick={() => setMaintenanceVehicle(vehicle)}
                    className="flex-1 bg-slate-50 hover:bg-[#6a4782] hover:text-white p-3 rounded-xl text-slate-400 transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"
                  >
                    <Wrench size={14}/> Taller
                  </button>
                  <button 
                    onClick={() => setFuelVehicle(vehicle)}
                    className="flex-1 bg-slate-50 hover:bg-[#21b524] hover:text-white p-3 rounded-xl text-slate-400 transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"
                  >
                    <Fuel size={14}/> Carga
                  </button>
                  <button 
                    onClick={() => setEditingVehicle(vehicle)}
                    className="p-3 bg-slate-50 hover:bg-indigo-50 hover:text-[#6a4782] rounded-xl text-slate-200 transition-all"
                  >
                    <Settings size={14}/>
                  </button>
                  <button 
                    onClick={() => onDeleteVehicle(vehicle.id)}
                    className="p-3 bg-slate-50 hover:bg-red-500 hover:text-white rounded-xl text-slate-200 transition-all"
                  >
                    <Trash2 size={14}/>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-soft">
            <div className="flex flex-col items-center opacity-20">
              <Truck size={48} className="mb-4"/>
              <p className="text-xs font-black uppercase tracking-widest">No se encontraron vehículos</p>
            </div>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Alta de Vehículo</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Patente</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="AF-123-XY"
                  value={newVehicle.plate}
                  onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Modelo / Marca</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EJ: VOLKSWAGEN CONSTELLATION"
                  value={newVehicle.model}
                  onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Tipo de Unidad</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newVehicle.type}
                  onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}
                >
                  <option value="Compactador">COMPACTADOR</option>
                  <option value="Volcador">VOLCADOR</option>
                  <option value="Roll-Off">ROLL-OFF</option>
                  <option value="Pala Cargadora">PALA CARGADORA</option>
                  <option value="Camioneta">CAMIONETA</option>
                  <option value="Auto">AUTO</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Kilometraje Inicial</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newVehicle.mileage}
                  onChange={e => setNewVehicle({...newVehicle, mileage: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleAddVehicle}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Registrar Unidad
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

      {editingVehicle && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Editar Vehículo</h3>
              <button onClick={() => setEditingVehicle(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Patente</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="AF-123-XY"
                  value={editingVehicle.plate}
                  onChange={e => setEditingVehicle({...editingVehicle, plate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Modelo / Marca</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EJ: VOLKSWAGEN CONSTELLATION"
                  value={editingVehicle.model}
                  onChange={e => setEditingVehicle({...editingVehicle, model: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Tipo de Unidad</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={editingVehicle.type}
                  onChange={e => setEditingVehicle({...editingVehicle, type: e.target.value})}
                >
                  <option value="Compactador">COMPACTADOR</option>
                  <option value="Volcador">VOLCADOR</option>
                  <option value="Roll-Off">ROLL-OFF</option>
                  <option value="Pala Cargadora">PALA CARGADORA</option>
                  <option value="Camioneta">CAMIONETA</option>
                  <option value="Auto">AUTO</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Estado</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={editingVehicle.status}
                  onChange={e => setEditingVehicle({...editingVehicle, status: e.target.value as any})}
                >
                  <option value="Operativo">OPERATIVO</option>
                  <option value="En Taller">EN TALLER</option>
                  <option value="Fuera de Servicio">FUERA DE SERVICIO</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Kilometraje Actual</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={editingVehicle.mileage}
                  onChange={e => setEditingVehicle({...editingVehicle, mileage: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleEditVehicle}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Guardar Cambios
              </button>
              <button 
                onClick={() => setEditingVehicle(null)}
                className="px-8 py-5 border border-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all italic"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {maintenanceVehicle && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Registrar Mantenimiento</h3>
              <button onClick={() => setMaintenanceVehicle(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>
            <p className="text-[10px] font-black text-[#6a4782] uppercase tracking-widest mb-6">Unidad: {maintenanceVehicle.plate} - {maintenanceVehicle.model}</p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Descripción del Arreglo</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic min-h-[100px] resize-none"
                  placeholder="EJ: CAMBIO DE ACEITE Y FILTROS"
                  value={newMaintenance.description}
                  onChange={e => setNewMaintenance({...newMaintenance, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Costo Aproximado</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newMaintenance.cost}
                  onChange={e => setNewMaintenance({...newMaintenance, cost: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleAddMaintenanceRecord}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Registrar y Enviar a Taller
              </button>
            </div>
          </div>
        </div>
      )}

      {fuelVehicle && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Carga de Combustible</h3>
              <button onClick={() => setFuelVehicle(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>
            <p className="text-[10px] font-black text-[#21b524] uppercase tracking-widest mb-6">Unidad: {fuelVehicle.plate} - {fuelVehicle.model}</p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Litros</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                    value={newFuel.liters}
                    onChange={e => setNewFuel({...newFuel, liters: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Costo</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                    value={newFuel.cost}
                    onChange={e => setNewFuel({...newFuel, cost: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Kilometraje al Cargar</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newFuel.mileage || fuelVehicle.mileage}
                  onChange={e => setNewFuel({...newFuel, mileage: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleAddFuelRecord}
                className="flex-1 bg-[#21b524] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Registrar Carga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
