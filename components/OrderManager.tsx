import React, { useState, useMemo, useRef } from 'react';
import { PurchaseOrder, Provider, Item, Category, User } from '../types';
import { ShoppingCart, Plus, Search, Filter, FileText, CheckCircle2, Clock, XCircle, Trash2, ArrowRight, Download, Scan, Loader2, Upload, DollarSign, Package, Printer, Edit2, FileDown } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderManagerProps {
  orders: PurchaseOrder[];
  providers: Provider[];
  items: Item[];
  categories: Category[];
  user: User;
  manualApiKey?: string;
  onAddOrder: (order: PurchaseOrder) => void;
  onUpdateOrder: (order: PurchaseOrder) => void;
  onDeleteOrder: (id: string) => void;
}

export const OrderManager: React.FC<OrderManagerProps> = ({ 
  orders, providers, items, categories, user, manualApiKey, onAddOrder, onUpdateOrder, onDeleteOrder 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newOrder, setNewOrder] = useState<Partial<PurchaseOrder>>({
    orderNumber: '',
    providerId: '',
    status: 'Ingresada',
    items: [],
    date: new Date().toISOString().split('T')[0],
    programId: 'prog-34',
    categoryId: '',
    totalCost: 0
  });

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setNewOrder({
      orderNumber: order.orderNumber,
      providerId: order.providerId,
      categoryId: order.categoryId || '',
      totalCost: order.totalCost,
      date: order.date,
      status: order.status,
      items: order.items,
      programId: order.programId
    });
    setIsAdding(true);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('REPORTE DE EXPEDIENTES - FLOQUI', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 14, 30);
    doc.text(`Usuario: ${user.name}`, 14, 35);

    const tableData = filteredOrders.map(order => [
      order.orderNumber,
      providers.find(p => p.id === order.providerId)?.name || 'Desconocido',
      new Date(order.date).toLocaleDateString('es-AR'),
      formatCurrency(order.totalCost),
      order.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Expediente', 'Proveedor', 'Fecha', 'Monto', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [106, 71, 130] }, // #6a4782
      styles: { fontSize: 8, font: 'helvetica' }
    });

    doc.save(`reporte_expedientes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleUpdateItem = (idx: number, field: string, value: any) => {
    if (!newOrder.items) return;
    const updatedItems = [...newOrder.items];
    updatedItems[idx] = { ...updatedItems[idx], [field]: value };
    
    // Recalculate total cost if price or quantity changed
    const newTotal = updatedItems.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
    
    setNewOrder({
      ...newOrder,
      items: updatedItems,
      totalCost: newTotal > 0 ? newTotal : newOrder.totalCost
    });
  };

  const handleRemoveItem = (idx: number) => {
    if (!newOrder.items) return;
    const updatedItems = newOrder.items.filter((_, i) => i !== idx);
    const newTotal = updatedItems.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
    setNewOrder({
      ...newOrder,
      items: updatedItems,
      totalCost: newTotal
    });
  };

  const handleAddItem = () => {
    const newItem = {
      itemId: 'manual-item',
      description: '',
      quantity: 1,
      price: 0
    };
    setNewOrder({
      ...newOrder,
      items: [...(newOrder.items || []), newItem]
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderNum = o.orderNumber || '';
      const matchesSearch = orderNum.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [orders, searchTerm, statusFilter]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const handleAddOrder = () => {
    if (!newOrder.orderNumber || !newOrder.providerId) return;
    
    if (editingOrder) {
      const updatedOrder: PurchaseOrder = {
        ...editingOrder,
        orderNumber: newOrder.orderNumber!,
        providerId: newOrder.providerId!,
        categoryId: newOrder.categoryId,
        totalCost: Number(newOrder.totalCost) || 0,
        date: newOrder.date || editingOrder.date,
        items: newOrder.items || editingOrder.items
      };
      onUpdateOrder(updatedOrder);
      setEditingOrder(null);
    } else {
      const order: PurchaseOrder = {
        id: Math.random().toString(36).substr(2, 9),
        orderNumber: newOrder.orderNumber!,
        providerId: newOrder.providerId!,
        categoryId: newOrder.categoryId,
        status: newOrder.status as any,
        items: newOrder.items || [],
        totalCost: Number(newOrder.totalCost) || 0,
        date: newOrder.date || new Date().toISOString().split('T')[0],
        programId: newOrder.programId || 'prog-34'
      };
      onAddOrder(order);
    }
    
    setIsAdding(false);
    setNewOrder({ orderNumber: '', providerId: '', categoryId: '', status: 'Ingresada', items: [], date: new Date().toISOString().split('T')[0], programId: 'prog-34', totalCost: 0 });
  };

  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const apiKey = manualApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error("No se detectó una clave de API. Por favor, configurá GEMINI_API_KEY en el menú Secrets.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { inlineData: { data: base64Data, mimeType: file.type } },
              { text: "Extrae la información de este documento de FloQui/Expediente. Identifica el número de expediente, el nombre del proveedor, el monto total y la lista de items con su descripción, cantidad y precio unitario." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              orderNumber: { type: Type.STRING, description: "Número de expediente (ej: EX-202X-XXXXXX-MUN-Q)" },
              providerName: { type: Type.STRING, description: "Nombre del proveedor" },
              totalAmount: { type: Type.NUMBER, description: "Monto total del expediente" },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    price: { type: Type.NUMBER }
                  },
                  required: ["description", "quantity", "price"]
                }
              }
            },
            required: ["orderNumber", "providerName", "totalAmount", "items"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');

      // Try to match provider
      const matchedProvider = providers.find(p => {
        const pName = p.name?.toLowerCase() || '';
        const dName = data.providerName?.toLowerCase() || '';
        return pName.includes(dName) || dName.includes(pName);
      });

      // Map items to internal format and try to match with existing items
      const mappedItems = (data.items || []).map((item: any) => {
        const matchedItem = items.find(i => {
          const iName = i.name?.toLowerCase() || '';
          const dDesc = item.description?.toLowerCase() || '';
          return iName.includes(dDesc) || dDesc.includes(iName);
        });
        
        return {
          itemId: matchedItem?.id || 'manual-item',
          description: item.description,
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0
        };
      });

      setNewOrder(prev => ({
        ...prev,
        orderNumber: data.orderNumber || prev.orderNumber,
        providerId: matchedProvider?.id || prev.providerId,
        totalCost: data.totalAmount || prev.totalCost,
        items: mappedItems
      }));
      
      setIsAdding(true);
    } catch (error: any) {
      console.error("Error scanning document:", error);
      alert(`Error al escanear: ${error.message || "Error desconocido"}`);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStatusUpdate = (order: PurchaseOrder, newStatus: 'RAFAM' | 'COMPLETED') => {
    if (newStatus === 'RAFAM') {
      setEditingOrder(order);
    } else if (newStatus === 'COMPLETED') {
      if (window.confirm('¿Confirmar recepción de mercadería? Esto incrementará el stock general.')) {
        onUpdateOrder({ ...order, status: 'COMPLETED' });
      }
    }
  };

  const confirmRafam = () => {
    if (editingOrder) {
      onUpdateOrder({ ...editingOrder, status: 'RAFAM' });
      setEditingOrder(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RAFAM': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Ingresada': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'COMPLETED': return 'bg-slate-900 text-white border-slate-900';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Gestión de FloQuis</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Control de Expedientes y Órdenes de Compra</p>
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
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf,image/*" 
                onChange={handleScanFile}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex-1 md:flex-none bg-white border border-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-soft italic"
              >
                {isScanning ? <Loader2 size={16} className="animate-spin"/> : <Scan size={16}/>}
                {isScanning ? 'Escaneando...' : 'Escanear PDF'}
              </button>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex-1 md:flex-none bg-[#6a4782] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg italic"
              >
                <Plus size={16}/> Nuevo Manual
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
            placeholder="BUSCAR POR NÚMERO DE EXPEDIENTE..." 
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
            <option value="Ingresada">INGRESADA (FLOQUI)</option>
            <option value="RAFAM">RAFAM (COMPROMETIDO)</option>
            <option value="COMPLETED">FINALIZADO (EN STOCK)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Expediente</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Proveedor</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Fecha</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Monto Total</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Estado</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length > 0 ? filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-[#6a4782] group-hover:text-white transition-all">
                        <FileText size={16}/>
                      </div>
                      <span className="text-xs font-black text-slate-900 uppercase italic">{order.orderNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase italic">
                      {providers.find(p => p.id === order.providerId)?.name || 'DESCONOCIDO'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase italic">{new Date(order.date).toLocaleDateString('es-AR')}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-black text-slate-900 tabular-nums">{formatCurrency(order.totalCost)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                      {order.status === 'COMPLETED' ? 'FINALIZADO (EN STOCK)' : order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.role !== 'VIEWER' && (
                        <>
                          {order.status === 'Ingresada' && (
                            <button 
                              onClick={() => handleEdit(order)}
                              className="p-2 text-slate-400 hover:text-[#6a4782] hover:bg-slate-50 rounded-xl transition-all"
                              title="Editar Expediente"
                            >
                              <Edit2 size={18}/>
                            </button>
                          )}
                          {order.status === 'Ingresada' && (
                            <button 
                              onClick={() => handleStatusUpdate(order, 'RAFAM')}
                              className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Pasar a RAFAM"
                            >
                              <CheckCircle2 size={18}/>
                            </button>
                          )}
                          {order.status === 'RAFAM' && (
                            <button 
                              onClick={() => handleStatusUpdate(order, 'COMPLETED')}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Ingresar Mercadería a Stock"
                            >
                              <Package size={18}/>
                            </button>
                          )}
                          <button 
                            onClick={() => onDeleteOrder(order.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18}/>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <ShoppingCart size={48} className="mb-4"/>
                      <p className="text-xs font-black uppercase tracking-widest">No hay expedientes registrados</p>
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
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                {editingOrder ? 'Editar Expediente' : 'Nuevo Expediente'}
              </h3>
              <button onClick={() => { setIsAdding(false); setEditingOrder(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">N° de Expediente / FloQui</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  placeholder="EX-2026-XXXXXX-MUN-Q"
                  value={newOrder.orderNumber}
                  onChange={e => setNewOrder({...newOrder, orderNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Proveedor</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newOrder.providerId}
                  onChange={e => setNewOrder({...newOrder, providerId: e.target.value})}
                >
                  <option value="">SELECCIONAR PROVEEDOR</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Fecha de Ingreso</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newOrder.date}
                  onChange={e => setNewOrder({...newOrder, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Partida Presupuestaria</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold uppercase outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                  value={newOrder.categoryId}
                  onChange={e => setNewOrder({...newOrder, categoryId: e.target.value})}
                >
                  <option value="">SELECCIONAR PARTIDA</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Monto Estimado</label>
                <input 
                  type="number" 
                  className={`w-full bg-slate-50 border rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic ${!newOrder.totalCost ? 'border-amber-200' : 'border-slate-100'}`}
                  placeholder="0"
                  value={newOrder.totalCost}
                  onChange={e => setNewOrder({...newOrder, totalCost: Number(e.target.value)})}
                />
              </div>
            </div>

            {newOrder.items && (
              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Detalle de Items</h4>
                  <button 
                    onClick={handleAddItem}
                    className="text-[9px] font-black text-[#6a4782] uppercase tracking-widest flex items-center gap-1 hover:underline"
                  >
                    <Plus size={12}/> Agregar Item
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                  {newOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex gap-3">
                        <input 
                          type="text"
                          placeholder="Descripción del item..."
                          className="flex-1 bg-white border border-slate-100 rounded-xl py-2 px-3 text-[10px] font-bold uppercase outline-none focus:border-[#6a4782] italic"
                          value={item.description}
                          onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                        />
                        <button 
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Cant.</label>
                          <input 
                            type="number"
                            className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-[10px] font-bold outline-none focus:border-[#6a4782]"
                            value={item.quantity}
                            onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Unit.</label>
                          <input 
                            type="number"
                            className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-[10px] font-bold outline-none focus:border-[#6a4782]"
                            value={item.price}
                            onChange={e => handleUpdateItem(idx, 'price', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtotal</label>
                          <div className="w-full bg-slate-100 border border-transparent rounded-xl py-2 px-3 text-[10px] font-black text-slate-600">
                            {formatCurrency(item.quantity * item.price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleAddOrder}
                disabled={!newOrder.orderNumber || !newOrder.providerId}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!newOrder.orderNumber || !newOrder.providerId ? 'Faltan Datos' : (editingOrder ? 'Guardar Cambios' : 'Registrar Expediente')}
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

      {editingOrder && !isAdding && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Aceptar en RAFAM</h3>
              <button onClick={() => setEditingOrder(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><XCircle size={24}/></button>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Expediente</p>
                <p className="text-lg font-black text-indigo-900 uppercase italic">{editingOrder.orderNumber}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Monto Final (Aceptado)</label>
                <div className="relative">
                  <DollarSign className="absolute left-5 top-5 text-slate-300" size={18}/>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-4 text-sm font-bold outline-none focus:border-[#6a4782] focus:bg-white transition-all italic"
                    value={editingOrder.totalCost}
                    onChange={e => setEditingOrder({...editingOrder, totalCost: Number(e.target.value)})}
                  />
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1 mt-2 italic">Confirme el monto final comprometido en rAFAM</p>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={confirmRafam}
                className="flex-1 bg-[#6a4782] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all italic"
              >
                Confirmar rAFAM
              </button>
              <button 
                onClick={() => setEditingOrder(null)}
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

