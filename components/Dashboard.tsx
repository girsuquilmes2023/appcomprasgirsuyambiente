import React, { useMemo } from 'react';
import { Item, Category, Budget, ViewState, User, Task, PurchaseOrder, Contract, Provider } from '../types';
import { ShieldCheck, ShoppingCart, Wallet, Package, Activity, Truck, Bell, ArrowRight, Printer, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  items: Item[];
  categories: Category[];
  budget: Budget;
  tasks?: Task[];
  orders?: PurchaseOrder[];
  contracts?: Contract[];
  providers?: Provider[];
  user: User;
  onNavigate: (view: ViewState) => void; 
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  items, categories, budget, tasks = [], orders = [], providers = [], onNavigate
}) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const stats = useMemo(() => {
    const totalCreditoDinamico = categories.reduce((acc, cat) => {
      const alloc = (budget.allocations || []).find(a => a.categoryId === cat.id);
      const limit = alloc?.limit || (cat.subCategories || []).reduce((sAcc, s) => sAcc + s.limit, 0) || 0;
      return acc + limit;
    }, 0);

    const lowStockItems = items.filter(i => i.quantity <= i.minStock);
    const pendingTasksList = tasks.filter(t => t.status === 'PENDING');
    
    const rafamOrders = orders.filter(o => o.status === 'RAFAM');
    const spentAmount = rafamOrders.reduce((acc, o) => acc + o.totalCost, 0);
    const pendingOrders = orders.filter(o => o.status === 'Ingresada');
    const committedAmount = pendingOrders.reduce((acc, o) => acc + o.totalCost, 0);
    
    const availableAmount = Math.max(0, totalCreditoDinamico - (spentAmount + committedAmount));
    const executionPercent = totalCreditoDinamico > 0 ? (spentAmount / totalCreditoDinamico) * 100 : 0;
    
    const today = new Date();
    const providerAlerts = providers.filter(p => {
      if (!p.contractEndDate) return false;
      const end = new Date(p.contractEndDate);
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 60;
    }).map(p => {
        const end = new Date(p.contractEndDate!);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { name: p.name, days: diffDays };
    });

    const chartData = [
      { name: 'Ejecutado (RAFAM)', value: spentAmount, color: '#6a4782' }, 
      { name: 'En Trámite (FloQui)', value: committedAmount, color: '#21b524' }, 
      { name: 'Disponible Real', value: availableAmount, color: '#facc15' }, 
    ].filter(d => d.value > 0);

    const categoriesWithExpenses = categories.map(cat => {
      const catOrders = orders.filter(o => o.categoryId === cat.id && (o.status === 'RAFAM' || o.status === 'Ingresada'));
      const spent = catOrders.filter(o => o.status === 'RAFAM').reduce((acc, o) => acc + o.totalCost, 0);
      const committed = catOrders.filter(o => o.status === 'Ingresada').reduce((acc, o) => acc + o.totalCost, 0);
      const alloc = (budget.allocations || []).find(a => a.categoryId === cat.id);
      const limit = alloc?.limit || (cat.subCategories || []).reduce((sAcc, s) => sAcc + s.limit, 0) || 0;
      
      return {
        name: cat.name,
        spent,
        committed,
        limit,
        available: Math.max(0, limit - (spent + committed))
      };
    }).filter(c => c.limit > 0);

    return { 
      totalCreditoDinamico,
      lowStock: lowStockItems.length, 
      pendingTasks: pendingTasksList.length, 
      executionPercent, 
      committedAmount, 
      chartData,
      availableAmount,
      providerAlerts,
      categoriesWithExpenses
    };
  }, [items, tasks, budget, orders, categories, providers]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('MONITOR DE GESTIÓN - GIRSU', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 14, 30);

    doc.text(`Ejecución Presupuestaria: ${stats.executionPercent.toFixed(1)}%`, 14, 45);
    doc.text(`Crédito Total: ${formatCurrency(stats.totalCreditoDinamico)}`, 14, 50);
    doc.text(`Disponible Real: ${formatCurrency(stats.availableAmount)}`, 14, 55);
    doc.text(`Items con Stock Bajo: ${stats.lowStock}`, 14, 60);
    doc.text(`Misiones Pendientes: ${stats.pendingTasks}`, 14, 65);

    const tableData = stats.categoriesWithExpenses.map(c => [
      c.name,
      formatCurrency(c.limit),
      formatCurrency(c.spent),
      formatCurrency(c.committed),
      formatCurrency(c.available)
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Partida', 'Crédito', 'Ejecutado', 'FloQui', 'Disponible']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [106, 71, 130] },
      styles: { fontSize: 7 }
    });

    doc.save(`reporte_dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-soft">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#6a4782]/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-[#6a4782] p-2 rounded-xl"><ShieldCheck size={18} className="text-white" /></div>
              <div className="flex flex-col">
                <span className="text-[#6a4782] font-black text-[10px] uppercase tracking-[0.4em]">Ambiente y GIRSU</span>
              </div>
              <button 
                onClick={handleDownloadPDF}
                className="ml-auto p-2 text-slate-300 hover:text-[#6a4782] transition-colors"
                title="Descargar PDF"
              >
                <FileDown size={18}/>
              </button>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">Monitor de<br/><span className="text-[#6a4782]">Gestión Integral</span></h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 min-w-[200px]">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Ejecución rAFAM</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">{stats.executionPercent.toFixed(1)}%</p>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-[#6a4782] transition-all duration-1000" style={{width: `${stats.executionPercent}%`}} />
              </div>
            </div>
            <div className="bg-[#6a4782] p-6 rounded-[2rem] shadow-xl text-white min-w-[200px]">
              <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest mb-1.5 leading-none">Crédito rAFAM</p>
              <p className="text-xl md:text-2xl font-black tabular-nums tracking-tighter leading-none">{formatCurrency(stats.totalCreditoDinamico)}</p>
            </div>
          </div>
        </div>
      </div>

      {stats.providerAlerts.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-[2.5rem] p-8 animate-pulse shadow-lg shadow-orange-100">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-lg"><Bell size={24}/></div>
                <div>
                    <h2 className="text-xl font-black text-orange-900 uppercase tracking-tighter leading-none italic">Alertas de Vencimiento</h2>
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1 italic">Contratos de servicios próximos a caducar (60 días)</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.providerAlerts.slice(0, 3).map((alert, idx) => (
                    <div key={idx} className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-orange-200 flex justify-between items-center group hover:bg-white transition-all">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 uppercase truncate italic">{alert.name}</p>
                            <p className={`text-[9px] font-black uppercase mt-1 ${alert.days < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                {alert.days < 0 ? 'CONTRATO VENCIDO' : `Vence en ${alert.days} días`}
                            </p>
                        </div>
                        <button onClick={() => onNavigate('PROVIDERS')} className="p-2 text-orange-400 hover:text-orange-600 transition-colors">
                            <ArrowRight size={20}/>
                        </button>
                    </div>
                ))}
            </div>
          </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'BUDGET', label: 'Finanzas', icon: <Wallet size={18}/>, desc: 'Estado Presupuesto' },
          { id: 'ORDERS', label: 'FloQui', icon: <ShoppingCart size={18}/>, desc: 'En Trámite' },
          { id: 'FLEET', label: 'Flota', icon: <Truck size={18}/>, desc: 'Arreglos' },
          { id: 'INVENTORY', label: 'Stock', icon: <Package size={18}/>, desc: 'Suministros' },
        ].map(tile => (
          <button key={tile.id} onClick={() => onNavigate(tile.id as ViewState)} className="group bg-white p-6 rounded-[2rem] shadow-soft border border-slate-100 hover:border-[#6a4782]/30 text-left h-32 flex flex-col justify-between transition-all active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#6a4782] group-hover:bg-[#6a4782] group-hover:text-white transition-all shadow-sm">{tile.icon}</div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{tile.label}</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{tile.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-soft lg:col-span-2 flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/2 h-48 relative">
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Disponible</p>
                <p className="text-xl font-black text-slate-900 leading-none">{stats.totalCreditoDinamico > 0 ? ((stats.availableAmount / stats.totalCreditoDinamico) * 100).toFixed(0) : 0}%</p>
             </div>
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                    {stats.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 'bold' }} formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 space-y-3">
             <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 italic leading-none">Salud Financiera</h3>
             {stats.chartData.map((item, idx) => (
               <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900 tabular-nums">{formatCurrency(item.value)}</span>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-soft space-y-3">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 italic leading-none">Status Operativo</h3>
          <button onClick={() => onNavigate('INVENTORY')} className="w-full p-4.5 bg-slate-50 rounded-2xl flex justify-between items-center group hover:bg-red-50 border border-transparent hover:border-red-100 transition-all active:scale-95">
              <span className="text-[9px] font-black uppercase text-slate-400">Stock Crítico</span>
              <span className="text-xl font-black text-red-600 tabular-nums leading-none">{stats.lowStock}</span>
          </button>
          <button onClick={() => onNavigate('TASKS')} className="w-full p-4.5 bg-slate-50 rounded-2xl flex justify-between items-center group hover:bg-[#6a4782]/10 border border-transparent hover:border-[#6a4782]/30 transition-all active:scale-95">
              <span className="text-[9px] font-black uppercase text-slate-400">Misiones Activas</span>
              <span className="text-xl font-black text-[#6a4782] tabular-nums leading-none">{stats.pendingTasks}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-soft">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] italic leading-none">Desglose por Partidas</h3>
          <button onClick={() => onNavigate('CATEGORIES_MGMT')} className="text-[9px] font-black text-[#6a4782] uppercase tracking-widest hover:underline">Gestionar Partidas</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.categoriesWithExpenses.map((cat, idx) => (
            <div key={idx} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black text-slate-900 uppercase truncate italic flex-1 mr-2">{cat.name}</p>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ejecución</p>
                  <p className="text-[10px] font-black text-[#6a4782]">{cat.limit > 0 ? ((cat.spent / cat.limit) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Gastado</span>
                  <span className="text-slate-900">{formatCurrency(cat.spent)}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">En Trámite</span>
                  <span className="text-[#21b524]">{formatCurrency(cat.committed)}</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#6a4782]" style={{ width: `${Math.min(100, (cat.spent / cat.limit) * 100)}%` }} />
                  <div className="h-full bg-[#21b524]" style={{ width: `${Math.min(100, (cat.committed / cat.limit) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest pt-1">
                  <span className="text-slate-400">Disponible</span>
                  <span className="text-slate-900">{formatCurrency(cat.available)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl border-b-8 border-[#21b524]">
        <div className="flex items-center gap-5">
           <div className="bg-[#21b524]/20 p-4 rounded-2xl text-[#21b524]"><ShoppingCart size={22} /></div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Comprometido en FloQuis</p>
              <p className="text-2xl font-black text-[#21b524] tracking-tighter tabular-nums leading-none">{formatCurrency(stats.committedAmount)}</p>
           </div>
        </div>
        <button onClick={() => onNavigate('ORDERS')} className="w-full md:w-auto px-8 py-4 bg-[#6a4782] hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg italic">Ver Expedientes</button>
      </div>
    </div>
  );
};
