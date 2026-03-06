import React, { useMemo } from 'react';
import { Budget, Category, PurchaseOrder, User } from '../types';
import { Wallet, TrendingUp, TrendingDown, PieChart as PieIcon, ArrowRight, ShieldCheck, Activity, ListTree, Printer, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BudgetControlProps {
  budget: Budget;
  categories: Category[];
  orders: PurchaseOrder[];
  user: User;
  onNavigate: (v: any) => void;
}

export const BudgetControl: React.FC<BudgetControlProps> = ({ budget, categories, orders, user, onNavigate }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const stats = useMemo(() => {
    const totalCredito = categories.reduce((acc, cat) => {
      const alloc = (budget.allocations || []).find(a => a.categoryId === cat.id);
      const limit = alloc?.limit || (cat.subCategories || []).reduce((sAcc, s) => sAcc + s.limit, 0) || 0;
      return acc + limit;
    }, 0);

    const rafamOrders = orders.filter(o => o.status === 'RAFAM');
    const spentAmount = rafamOrders.reduce((acc, o) => acc + o.totalCost, 0);
    const pendingOrders = orders.filter(o => o.status === 'Ingresada');
    const committedAmount = pendingOrders.reduce((acc, o) => acc + o.totalCost, 0);
    
    const availableAmount = Math.max(0, totalCredito - (spentAmount + committedAmount));
    const executionPercent = totalCredito > 0 ? (spentAmount / totalCredito) * 100 : 0;

    const chartData = [
      { name: 'Ejecutado', value: spentAmount, color: '#6a4782' },
      { name: 'Comprometido', value: committedAmount, color: '#21b524' },
      { name: 'Disponible', value: availableAmount, color: '#facc15' }
    ].filter(d => d.value > 0);

    const categoryStats = categories.map(cat => {
      const catOrders = orders.filter(o => o.programId === cat.programId); // Simplified logic
      const catSpent = catOrders.filter(o => o.status === 'RAFAM').reduce((acc, o) => acc + o.totalCost, 0);
      const alloc = (budget.allocations || []).find(a => a.categoryId === cat.id);
      const limit = alloc?.limit || (cat.subCategories || []).reduce((sAcc, s) => sAcc + s.limit, 0) || 0;
      
      return {
        id: cat.id,
        name: cat.name,
        code: cat.code,
        spent: catSpent,
        limit: limit,
        percent: limit > 0 ? (catSpent / limit) * 100 : 0
      };
    }).sort((a, b) => b.spent - a.spent);

    return { totalCredito, spentAmount, committedAmount, availableAmount, executionPercent, chartData, categoryStats };
  }, [budget, categories, orders]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('REPORTE PRESUPUESTARIO - GIRSU', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 14, 30);

    doc.text(`Crédito Total: ${formatCurrency(stats.totalCredito)}`, 14, 45);
    doc.text(`Ejecutado: ${formatCurrency(stats.spentAmount)}`, 14, 50);
    doc.text(`Comprometido: ${formatCurrency(stats.committedAmount)}`, 14, 55);
    doc.text(`Disponible Real: ${formatCurrency(stats.availableAmount)}`, 14, 60);

    const tableData = stats.categoryStats.map(cat => [
      cat.code,
      cat.name,
      formatCurrency(cat.limit),
      formatCurrency(cat.spent),
      `${cat.percent.toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Código', 'Partida', 'Crédito', 'Ejecutado', '%']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [106, 71, 130] },
      styles: { fontSize: 7 }
    });

    doc.save(`reporte_presupuesto_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Control Presupuestario</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Monitoreo de Crédito rAFAM y Ejecución</p>
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
              onClick={() => onNavigate('CATEGORIES_MGMT')}
              className="flex-1 md:flex-none bg-white border border-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-soft italic"
            >
              <ListTree size={16}/> Gestionar Partidas
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#6a4782] rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-2">Crédito Total rAFAM</p>
          <h3 className="text-3xl font-black tabular-nums tracking-tighter">{formatCurrency(stats.totalCredito)}</h3>
          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-indigo-100 italic">
            <Activity size={14}/> Actualizado en tiempo real
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-soft">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ejecución Acumulada</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">{stats.executionPercent.toFixed(1)}%</h3>
            <TrendingUp className="text-[#21b524] mb-1" size={24}/>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-[#6a4782] transition-all duration-1000" style={{ width: `${stats.executionPercent}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Disponible Real</p>
          <h3 className="text-3xl font-black text-[#facc15] tabular-nums tracking-tighter">{formatCurrency(stats.availableAmount)}</h3>
          <p className="text-[9px] font-bold text-slate-500 uppercase mt-4 italic">Descontando FloQuis en trámite</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-soft">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-8 italic">Distribución del Gasto</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                  {stats.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 'bold' }} formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {stats.chartData.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: item.color }} />
                <p className="text-[8px] font-black text-slate-400 uppercase">{item.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-soft">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-8 italic">Partidas con Mayor Gasto</h3>
          <div className="space-y-4">
            {stats.categoryStats.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-end">
                  <button 
                    onClick={() => onNavigate('CATEGORIES_MGMT')}
                    disabled={user.role === 'VIEWER'}
                    className={`text-left group/cat ${user.role === 'VIEWER' ? 'cursor-default' : ''}`}
                  >
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest group-hover/cat:text-[#6a4782] transition-colors">{cat.code}</p>
                    <p className="text-[10px] font-black text-slate-700 uppercase italic truncate max-w-[200px] group-hover/cat:text-[#6a4782] transition-colors">{cat.name}</p>
                  </button>
                  <p className="text-[10px] font-black text-slate-900 tabular-nums">{formatCurrency(cat.spent)}</p>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-[#6a4782]/40" style={{ width: `${cat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
