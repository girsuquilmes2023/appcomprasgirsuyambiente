export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export type ViewState = 
  | 'DASHBOARD' 
  | 'BUDGET' 
  | 'FLEET' 
  | 'ORDERS' 
  | 'PROVIDERS' 
  | 'CLOTHING' 
  | 'INVENTORY' 
  | 'STAFF' 
  | 'TASKS' 
  | 'CATEGORIES_MGMT'
  | 'NETWORK';

export interface Category {
  id: string;
  programId: string;
  name: string;
  code: string;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  code: string;
  limit: number;
  spent: number;
}

export interface Item {
  id: string;
  name: string;
  categoryId: string;
  subCategoryId: string;
  quantity: number;
  minStock: number;
  unit: string;
  price: number;
}

export interface Budget {
  total: number;
  spent: number;
  committed: number;
  lastUpdated: string;
  allocations: {
    categoryId: string;
    limit: number;
    spent: number;
    committed: number;
  }[];
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  providerId: string;
  categoryId?: string;
  items: { itemId: string; quantity: number; price: number }[];
  totalCost: number;
  status: 'PENDING' | 'RAFAM' | 'Ingresada' | 'COMPLETED' | 'CANCELLED';
  date: string;
  programId: string;
}

export interface Provider {
  id: string;
  name: string;
  cuit: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  contractEndDate?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  status: 'Operativo' | 'En Taller' | 'Fuera de Servicio';
  mileage: number;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost: number;
  mileage: number;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  cost: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo?: string;
  dueDate: string;
}

export interface Staff {
  id: string;
  name: string;
  dni: string;
  role: string;
  area: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Handout {
  id: string;
  staffId: string;
  itemId: string;
  quantity: number;
  date: string;
}

export interface Program {
  id: string;
  code: string;
  name: string;
}

export interface NetworkConfig {
  serverUrl: string;
  googleSheetUrl: string;
  autoSync: boolean;
  lastSync: string | null;
  isConnected: boolean;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type: string;
  description: string;
}

export interface Contract {
  id: string;
  providerId: string;
  startDate: string;
  endDate: string;
  amount: number;
  description: string;
}

export interface FullAppState {
  items: Item[];
  categories: Category[];
  programs: Program[];
  budget: Budget;
  vehicles: Vehicle[];
  maintenanceRecords: MaintenanceRecord[];
  providers: Provider[];
  contracts: Contract[];
  tasks: Task[];
  staff: Staff[];
  handouts: Handout[];
  orders: PurchaseOrder[];
  serviceRecords: ServiceRecord[];
  fuelLogs: FuelLog[];
}
