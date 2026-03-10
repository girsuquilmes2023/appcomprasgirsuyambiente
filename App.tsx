import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewState, Item, Budget, PurchaseOrder, NetworkConfig, Category, Task, Staff, Handout, User, ServiceRecord, Program, Provider, MaintenanceRecord, FuelLog, Vehicle, Contract, FullAppState } from './types';
import { CATEGORIES, INITIAL_ITEMS_MOCK, INITIAL_BUDGET, PROGRAMS, INITIAL_VEHICLES_MOCK, INITIAL_CONTRACTS_MOCK } from './constants';
import { loadFromGoogleSheets, syncWithGoogleSheets } from './services/googleSheetService';

import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { InventoryManager } from './components/InventoryManager';
import { OrderManager } from './components/OrderManager';
import { FleetManager } from './components/FleetManager';
import { TaskManager } from './components/TaskManager';
import { ProviderManager } from './components/ProviderManager';
import { BudgetControl } from './components/BudgetControl';
import { CategoryManager } from './components/CategoryManager';
import { NetworkSettings } from './components/NetworkSettings';

import { 
  Activity, ShoppingCart, Truck, Package, ListTodo, Users, 
  LogOut, ShieldCheck, Wallet, Settings, Shirt, Building2, ListTree, AlertTriangle
} from 'lucide-react';

const SESSION_VERSION = '2.2'; 

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const currentVersion = localStorage.getItem('girsu_session_version');
    if (currentVersion !== SESSION_VERSION) {
      localStorage.removeItem('girsu_auth_user');
      localStorage.setItem('girsu_session_version', SESSION_VERSION);
      return null;
    }
    const savedUser = localStorage.getItem('girsu_auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isCloudReady, setIsCloudReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'IDLE' | 'SYNCED' | 'ERROR' | 'OFFLINE'>('IDLE');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const safeParse = (key: string, fallback: any) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved || saved === '[]' || saved === '{}' || saved === 'null') return fallback;
      return JSON.parse(saved);
    } catch (e) { return fallback; }
  };

  const [programs, setPrograms] = useState<Program[]>(() => safeParse('girsu_programs', PROGRAMS));
  const [categories, setCategories] = useState<Category[]>(() => safeParse('girsu_categories', CATEGORIES));
  const [items, setItems] = useState<Item[]>(() => safeParse('girsu_items', INITIAL_ITEMS_MOCK));
  const [budget, setBudget] = useState<Budget>(() => safeParse('girsu_budget', INITIAL_BUDGET));
  const [providers, setProviders] = useState<Provider[]>(() => safeParse('girsu_providers', []));
  const [contracts, setContracts] = useState<Contract[]>(() => safeParse('girsu_contracts', INITIAL_CONTRACTS_MOCK));
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => safeParse('girsu_orders', []));
  const [tasks, setTasks] = useState<Task[]>(() => safeParse('girsu_tasks', []));
  const [staff, setStaff] = useState<Staff[]>(() => safeParse('girsu_staff', []));
  const [handouts, setHandouts] = useState<Handout[]>(() => safeParse('girsu_handouts', []));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => safeParse('girsu_vehicles', INITIAL_VEHICLES_MOCK));
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => safeParse('girsu_fuel_logs', []));
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => safeParse('girsu_maintenance', []));
  const [serviceRecords] = useState<ServiceRecord[]>(() => safeParse('girsu_services', []));
  
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>(() => {
    const saved = localStorage.getItem('girsu_network_config');
    const envUrl = process.env.GOOGLE_SHEET_URL || 'https://script.google.com/macros/s/AKfycbyZHV6O570L2mRviVp3cxiiH3NLER4Y-Z4J9w3LcVtEbObPG53e-gnwyxQyIou_ssk7/exec';
    
    if (saved) {
      const parsed = JSON.parse(saved);
      // Update if it's a placeholder or if the env URL changed and it's the same as the old default
      if (!parsed.googleSheetUrl || 
          parsed.googleSheetUrl.includes('YOUR_URL') || 
          (parsed.googleSheetUrl === 'https://script.google.com/macros/s/AKfycbyZHV6O570L2mRviVp3cxiiH3NLER4Y-Z4J9w3LcVtEbObPG53e-gnwyxQyIou_ssk7/exec' && envUrl !== parsed.googleSheetUrl)) {
        parsed.googleSheetUrl = envUrl;
      }
      return parsed;
    }
    return { serverUrl: '', googleSheetUrl: envUrl, autoSync: true, lastSync: null, isConnected: true };
  });

  const providerAlertCount = useMemo(() => {
    const today = new Date();
    return providers.filter(p => {
        if (!p.contractEndDate) return false;
        const end = new Date(p.contractEndDate);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 60;
    }).length;
  }, [providers]);

  const persistState = useCallback(async (forceCloud: boolean = false) => {
    if (isBooting) return;
    setIsSyncing(true);
    const fullState: FullAppState = { items, categories, programs, budget, vehicles, maintenanceRecords, providers, contracts, tasks, staff, handouts, orders, serviceRecords, fuelLogs };
    try {
      localStorage.setItem('girsu_categories', JSON.stringify(categories));
      localStorage.setItem('girsu_items', JSON.stringify(items));
      localStorage.setItem('girsu_budget', JSON.stringify(budget));
      localStorage.setItem('girsu_orders', JSON.stringify(orders));
      localStorage.setItem('girsu_vehicles', JSON.stringify(vehicles));
      localStorage.setItem('girsu_maintenance', JSON.stringify(maintenanceRecords));
      localStorage.setItem('girsu_fuel_logs', JSON.stringify(fuelLogs));
      localStorage.setItem('girsu_tasks', JSON.stringify(tasks));
      localStorage.setItem('girsu_staff', JSON.stringify(staff));
      localStorage.setItem('girsu_handouts', JSON.stringify(handouts));
      localStorage.setItem('girsu_providers', JSON.stringify(providers));
      localStorage.setItem('girsu_network_config', JSON.stringify(networkConfig));
      
      if (networkConfig.googleSheetUrl && (isCloudReady || forceCloud)) {
         await syncWithGoogleSheets(networkConfig.googleSheetUrl, fullState);
         setCloudStatus('SYNCED');
      }
    } catch (e) { setCloudStatus('ERROR'); }
    finally { setTimeout(() => setIsSyncing(false), 500); }
  }, [items, categories, budget, providers, contracts, orders, staff, handouts, tasks, networkConfig, isCloudReady, vehicles, maintenanceRecords, serviceRecords, fuelLogs, programs, isBooting]);

  useEffect(() => {
    const timer = setTimeout(() => { if (!isBooting) persistState(); }, 1500);
    return () => clearTimeout(timer);
  }, [items, categories, budget, orders, staff, contracts, vehicles, maintenanceRecords, fuelLogs, tasks, providers, persistState, isBooting]);

  useEffect(() => {
    const boot = async () => {
      const url = networkConfig.googleSheetUrl;
      
      // Safety timeout to prevent getting stuck in booting
      const timeoutId = setTimeout(() => {
        if (isBooting) {
          console.warn("Boot timeout reached");
          setIsBooting(false);
          setIsCloudReady(true);
        }
      }, 5000);

      if (url) {
        try {
          const cloudData = await loadFromGoogleSheets(url);
          if (cloudData) {
            if (cloudData.categories) setCategories(cloudData.categories);
            if (cloudData.items) setItems(cloudData.items);
            if (cloudData.budget) setBudget(cloudData.budget);
            if (cloudData.orders) setOrders(cloudData.orders);
            if (cloudData.staff) setStaff(cloudData.staff);
            if (cloudData.tasks) setTasks(cloudData.tasks);
            if (cloudData.vehicles) setVehicles(cloudData.vehicles);
            if (cloudData.maintenanceRecords) setMaintenanceRecords(cloudData.maintenanceRecords);
            if (cloudData.providers) setProviders(cloudData.providers);
            setCloudStatus('SYNCED');
          }
          setIsCloudReady(true);
        } catch (err) { 
          console.error("Boot error:", err);
          setCloudStatus('ERROR'); 
          setIsCloudReady(true); 
        }
      } else { 
        setCloudStatus('OFFLINE'); 
        setIsCloudReady(true); 
      }
      clearTimeout(timeoutId);
      setIsBooting(false);
    };
    boot();
  }, [networkConfig.googleSheetUrl]);

  const handleNavigate = (v: ViewState) => { setView(v); setIsMobileMenuOpen(false); };
  const handleLogout = () => { if (window.confirm("¿Cerrar sesión?")) { setUser(null); localStorage.removeItem('girsu_auth_user'); } };

  // Handlers
  const addItem = (item: Item) => setItems([...items, item]);
  const updateItem = (item: Item) => setItems(items.map(i => i.id === item.id ? item : i));
  const deleteItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const addOrder = (order: PurchaseOrder) => setOrders([...orders, order]);
  const updateOrder = (order: PurchaseOrder) => {
    const previousOrder = orders.find(o => o.id === order.id);
    setOrders(orders.map(o => o.id === order.id ? order : o));

    // If status changed to COMPLETED, update stock
    if (order.status === 'COMPLETED' && previousOrder?.status !== 'COMPLETED') {
      setItems(prevItems => {
        const newItems = [...prevItems];
        order.items.forEach(orderItem => {
          const itemIdx = newItems.findIndex(i => i.id === orderItem.itemId);
          if (itemIdx !== -1) {
            newItems[itemIdx] = {
              ...newItems[itemIdx],
              quantity: newItems[itemIdx].quantity + orderItem.quantity
            };
          }
        });
        return newItems;
      });
    }
  };
  const deleteOrder = (id: string) => setOrders(orders.filter(o => o.id !== id));

  const addVehicle = (v: Vehicle) => setVehicles([...vehicles, v]);
  const updateVehicle = (v: Vehicle) => setVehicles(vehicles.map(item => item.id === v.id ? v : item));
  const deleteVehicle = (id: string) => setVehicles(vehicles.filter(v => v.id !== id));

  const addStaff = (s: Staff) => setStaff([...staff, s]);
  const updateStaff = (s: Staff) => setStaff(staff.map(item => item.id === s.id ? s : item));
  const deleteStaff = (id: string) => setStaff(staff.filter(s => s.id !== id));

  const addTask = (t: Task) => setTasks([...tasks, t]);
  const updateTask = (t: Task) => setTasks(tasks.map(item => item.id === t.id ? t : item));
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const addProvider = (p: Provider) => setProviders([...providers, p]);
  const updateProvider = (p: Provider) => setProviders(providers.map(item => item.id === p.id ? p : item));
  const deleteProvider = (id: string) => setProviders(providers.filter(p => p.id !== id));

  const addHandout = (h: Handout) => {
    setHandouts([...handouts, h]);
    setItems(items.map(i => i.id === h.itemId ? { ...i, quantity: i.quantity - h.quantity } : i));
  };
  const deleteHandout = (id: string) => setHandouts(handouts.filter(h => h.id !== id));

  const addMaintenance = (m: MaintenanceRecord) => setMaintenanceRecords([...maintenanceRecords, m]);
  const addFuel = (f: FuelLog) => setFuelLogs([...fuelLogs, f]);

  const updateCategories = (newCats: Category[]) => {
    setCategories(newCats);
    // Update budget allocations if needed
    const newAllocations = newCats.map(cat => {
      const existing = budget.allocations.find(a => a.categoryId === cat.id);
      const limit = (cat.subCategories || []).reduce((acc, sub) => acc + sub.limit, 0);
      return {
        categoryId: cat.id,
        limit: limit || existing?.limit || 0,
        spent: existing?.spent || 0,
        committed: existing?.committed || 0
      };
    });
    setBudget({ ...budget, allocations: newAllocations, lastUpdated: new Date().toISOString() });
  };

  const updateNetworkConfig = (cfg: NetworkConfig) => setNetworkConfig(cfg);

  const hasApiKey = useMemo(() => {
    const key = process.env.GEMINI_API_KEY;
    return !!key && key.length > 5;
  }, []);

  if (!user) return <Login onLogin={(u) => { setUser(u); localStorage.setItem('girsu_auth_user', JSON.stringify(u)); }} />;
  if (isBooting) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-white font-sans italic">Iniciando Protocolos de Seguridad...</div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white relative overflow-x-hidden font-sans italic">
      <aside className={`fixed inset-y-0 left-0 z-[80] w-72 bg-white text-slate-900 flex flex-col h-full transition-transform duration-300 border-r border-slate-100 shadow-xl md:sticky md:top-0 md:translate-x-0 md:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-50 font-black text-[#6a4782] flex items-center gap-3">
          <ShieldCheck className="text-[#21b524]" size={24}/>
          GESTIÓN AMBIENTE Y GIRSU
        </div>
        <nav className="flex-1 p-5 space-y-1">
          {[
            { id: 'DASHBOARD', icon: <Activity size={18}/>, label: 'Panel' }, 
            { id: 'BUDGET', icon: <Wallet size={18}/>, label: 'Finanzas' },
            { id: 'CATEGORIES_MGMT', icon: <ListTree size={18}/>, label: 'Partidas' },
            { id: 'FLEET', icon: <Truck size={18}/>, label: 'Flota' }, 
            { id: 'ORDERS', icon: <ShoppingCart size={18}/>, label: 'FloQui' }, 
            { id: 'PROVIDERS', icon: <Building2 size={18}/>, label: 'Proveedores', badge: providerAlertCount },
            { id: 'INVENTORY', icon: <Package size={18}/>, label: 'Stock General' },
            { id: 'TASKS', icon: <ListTodo size={18}/>, label: 'Misiones' }
          ].map(btn => (
            <button key={btn.id} onClick={() => handleNavigate(btn.id as ViewState)} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${view === btn.id ? 'bg-[#6a4782]/10 text-[#6a4782] font-black' : 'text-slate-400 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-4">
                {btn.icon} <span className="text-[10px] uppercase tracking-widest">{btn.label}</span>
              </div>
              {btn.badge !== undefined && btn.badge > 0 && (
                  <span className="bg-orange-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{btn.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-50 space-y-4">
          <button onClick={() => handleNavigate('NETWORK')} className="w-full flex items-center gap-4 px-5 py-2 rounded-xl text-slate-400 hover:bg-slate-50 transition-all font-black uppercase text-[9px] tracking-widest">
            <Settings size={16}/> Configuración
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-2 rounded-xl text-red-400 hover:bg-red-50 transition-all font-black uppercase text-[9px] tracking-widest">
            <LogOut size={16}/> Salir
          </button>
          <div className="pt-2 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300">PINI COMPANY ®</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 lg:p-12 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto flex-1 w-full relative min-h-full flex flex-col">
          {/* Status Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${cloudStatus === 'SYNCED' ? 'bg-green-500 animate-pulse' : cloudStatus === 'ERROR' ? 'bg-red-500' : 'bg-slate-300'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {cloudStatus === 'SYNCED' ? 'Nube Sincronizada' : cloudStatus === 'ERROR' ? 'Error de Conexión' : 'Modo Local'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {!hasApiKey && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 text-[9px] font-black uppercase tracking-tighter">
                  <AlertTriangle size={12} /> IA Desactivada (Falta Key en Configuración)
                </div>
              )}
              {isSyncing && (
                <div className="flex items-center gap-2 text-blue-600 text-[9px] font-black uppercase tracking-widest">
                  <Activity size={12} className="animate-spin" /> Guardando...
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            {view === 'DASHBOARD' && <Dashboard 
              items={items} 
              categories={categories} 
              budget={budget} 
              tasks={tasks} 
              orders={orders} 
              providers={providers} 
              staff={staff}
              user={user} 
              onNavigate={(v) => {
                handleNavigate(v);
              }} 
              onSelectTask={(taskId) => {
                setSelectedTaskId(taskId);
                handleNavigate('TASKS');
              }}
            />}
            {view === 'INVENTORY' && <InventoryManager items={items} categories={categories} user={user} onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem} />}
            {view === 'ORDERS' && <OrderManager orders={orders} providers={providers} items={items} categories={categories} user={user} onAddOrder={addOrder} onUpdateOrder={updateOrder} onDeleteOrder={deleteOrder} />}
            {view === 'FLEET' && <FleetManager vehicles={vehicles} maintenance={maintenanceRecords} fuelLogs={fuelLogs} user={user} onAddVehicle={addVehicle} onUpdateVehicle={updateVehicle} onDeleteVehicle={deleteVehicle} onAddMaintenance={addMaintenance} onAddFuel={addFuel} />}
            {view === 'TASKS' && <TaskManager 
              tasks={tasks} 
              user={user} 
              onAddTask={addTask} 
              onUpdateTask={updateTask} 
              onDeleteTask={deleteTask} 
              initialSelectedTaskId={selectedTaskId}
              onClearSelectedTask={() => setSelectedTaskId(null)}
            />}
            {view === 'PROVIDERS' && <ProviderManager providers={providers} user={user} onAddProvider={addProvider} onUpdateProvider={updateProvider} onDeleteProvider={deleteProvider} />}
            {view === 'BUDGET' && <BudgetControl budget={budget} categories={categories} orders={orders} user={user!} onNavigate={handleNavigate} />}
            {view === 'CATEGORIES_MGMT' && <CategoryManager categories={categories} programs={programs} user={user!} onUpdateCategories={updateCategories} />}
            {view === 'NETWORK' && <NetworkSettings 
              config={networkConfig} 
              user={user} 
              onUpdateConfig={updateNetworkConfig} 
              onSyncNow={() => persistState(true)} 
              isSyncing={isSyncing}
              onExportData={() => {
                const fullState: FullAppState = { items, categories, programs, budget, vehicles, maintenanceRecords, providers, contracts, tasks, staff, handouts, orders, serviceRecords, fuelLogs };
                const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup_completo_girsu_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              onRestoreData={(data: FullAppState) => {
                if (data.categories) setCategories(data.categories);
                if (data.items) setItems(data.items);
                if (data.budget) setBudget(data.budget);
                if (data.orders) setOrders(data.orders);
                if (data.staff) setStaff(data.staff);
                if (data.tasks) setTasks(data.tasks);
                if (data.vehicles) setVehicles(data.vehicles);
                if (data.maintenanceRecords) setMaintenanceRecords(data.maintenanceRecords);
                if (data.providers) setProviders(data.providers);
                if (data.fuelLogs) setFuelLogs(data.fuelLogs);
                if (data.handouts) setHandouts(data.handouts);
                if (data.contracts) setContracts(data.contracts);
                if (data.programs) setPrograms(data.programs);
                // Force a sync to cloud after restore
                setTimeout(() => persistState(true), 1000);
              }}
            />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
