import React, { useState, useMemo } from 'react';
import { Task, User } from '../types';
import { ListTodo, Plus, Search, Filter, Clock, CheckCircle2, AlertCircle, Trash2, XCircle, ArrowRight, Calendar, Printer, FileDown, Settings, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TaskManagerProps {
  tasks: Task[];
  user: User;
  onAddTask: (t: Task) => void;
  onUpdateTask: (t: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ 
  tasks, user, onAddTask, onUpdateTask, onDeleteTask 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'PENDING',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, searchTerm, statusFilter]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('REPORTE DE MISIONES - GIRSU', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 14, 30);

    const tableData = filteredTasks.map(t => [
      t.title,
      t.description || '-',
      getStatusLabel(t.status),
      new Date(t.dueDate).toLocaleDateString('es-AR')
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Título', 'Descripción', 'Estado', 'Vencimiento']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [106, 71, 130] },
      styles: { fontSize: 8 }
    });

    doc.save(`reporte_misiones_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleAddTask = () => {
    if (!newTask.title) return;
    
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title!.toUpperCase(),
      description: newTask.description || '',
      status: newTask.status as any || 'PENDING',
      dueDate: newTask.dueDate || new Date().toISOString().split('T')[0]
    };

    onAddTask(task);
    setIsAdding(false);
    setNewTask({ title: '', description: '', status: 'PENDING', dueDate: new Date().toISOString().split('T')[0] });
  };

  const handleEditTask = () => {
    if (!editingTask || !editingTask.title) return;
    onUpdateTask(editingTask);
    setEditingTask(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 size={18} className="text-emerald-500"/>;
      case 'IN_PROGRESS': return <Clock size={18} className="text-indigo-500"/>;
      default: return <AlertCircle size={18} className="text-orange-500"/>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'FINALIZADA';
      case 'IN_PROGRESS': return 'EN PROCESO';
      default: return 'PENDIENTE';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Misiones y Tareas</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Control de Objetivos y Seguimiento Operativo</p>
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
              <Plus size={16}/> Nueva Misión
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
          <input 
            type="text" 
            placeholder="BUSCAR MISIONES..." 
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
            <option value="PENDING">PENDIENTES</option>
            <option value="IN_PROGRESS">EN PROCESO</option>
            <option value="COMPLETED">FINALIZADAS</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(task => (
          <div 
            key={task.id} 
            onClick={() => setSelectedTask(task)}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft p-8 flex flex-col justify-between group hover:border-[#6a4782]/30 transition-all cursor-pointer"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getStatusIcon(task.status)}
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{getStatusLabel(task.status)}</span>
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tabular-nums flex items-center gap-1">
                  <Calendar size={12}/> {new Date(task.dueDate).toLocaleDateString('es-AR')}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic leading-tight">{task.title}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase italic line-clamp-3 leading-relaxed">{task.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-8" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setSelectedTask(task)}
                className="p-3 bg-slate-50 hover:bg-indigo-50 hover:text-[#6a4782] rounded-xl text-slate-200 transition-all"
                title="Ver detalles"
              >
                <Eye size={14}/>
              </button>
              {user.role !== 'VIEWER' && (
                <>
                  {task.status !== 'COMPLETED' && (
                    <button 
                      onClick={() => onUpdateTask({ ...task, status: task.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED' })}
                      className="flex-1 bg-slate-50 hover:bg-[#6a4782] hover:text-white p-3 rounded-xl text-slate-400 transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"
                    >
                      {task.status === 'PENDING' ? 'Iniciar' : 'Finalizar'}
                    </button>
                  )}
                  <button 
                    onClick={() => setEditingTask(task)}
                    className="p-3 bg-slate-50 hover:bg-indigo-50 hover:text-[#6a4782] rounded-xl text-slate-200 transition-all"
                  >
                    <Settings size={14}/>
                  </button>
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-xl text-slate-200 transition-all"
                  >
                    <Trash2 size={14}/>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="col-span-full bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-soft">
            <div className="flex flex-col items-center opacity-20">
              <ListTodo size={48} className="mb-4"/>
              <p className="text-xs font-black uppercase tracking-widest">No hay misiones activas</p>
            </div>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Nueva Misión</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Título de la Misión</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EJ: REPARACIÓN DE COMPACTADOR V1"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Descripción / Detalles</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic min-h-[120px] resize-none"
                  placeholder="DETALLE DE LA TAREA A REALIZAR..."
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Fecha Límite</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newTask.dueDate}
                  onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleAddTask}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Asignar Misión
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

      {editingTask && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Editar Misión</h3>
              <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Título de la Misión</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EJ: REPARACIÓN DE COMPACTADOR V1"
                  value={editingTask.title}
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Descripción / Detalles</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic min-h-[120px] resize-none"
                  placeholder="DETALLE DE LA TAREA A REALIZAR..."
                  value={editingTask.description}
                  onChange={e => setEditingTask({...editingTask, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Estado</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={editingTask.status}
                  onChange={e => setEditingTask({...editingTask, status: e.target.value as any})}
                >
                  <option value="PENDING">PENDIENTE</option>
                  <option value="IN_PROGRESS">EN PROCESO</option>
                  <option value="COMPLETED">FINALIZADA</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Fecha Límite</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={editingTask.dueDate}
                  onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleEditTask}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Guardar Cambios
              </button>
              <button 
                onClick={() => setEditingTask(null)}
                className="px-8 py-5 border border-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all italic"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedTask.status)}
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <label className="text-[10px] font-black text-[#6a4782] uppercase tracking-widest block mb-4 italic">Descripción Detallada</label>
                <p className="text-sm font-bold text-slate-700 uppercase italic leading-relaxed whitespace-pre-wrap">{selectedTask.description || 'SIN DESCRIPCIÓN ADICIONAL'}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">Estado Actual</label>
                  <p className="text-xs font-black text-slate-900 uppercase italic">{getStatusLabel(selectedTask.status)}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">Fecha Límite</label>
                  <p className="text-xs font-black text-slate-900 uppercase italic">{new Date(selectedTask.dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <button 
                onClick={() => setSelectedTask(null)}
                className="w-full bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
