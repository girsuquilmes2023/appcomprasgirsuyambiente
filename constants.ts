import { Category, Budget, Program, Vehicle, Contract } from './types';

export const PROGRAMS: Program[] = [
  { id: 'prog-01', code: '01.00.00', name: 'Administración y Conducción Ambiente' },
  { id: 'prog-34', code: '34.00.00', name: 'Gestión Ambiental y Espacios Verdes' },
];

export const CATEGORIES: Category[] = [
  // --- PROGRAMA 01 (ADMINISTRACIÓN) ---
  { 
    id: 'c-3100-01', programId: 'prog-01', name: 'Servicios Básicos', code: '3.1.0.0',
    subCategories: [
      { id: '3110', name: 'Energía Eléctrica', code: '3.1.1.0', limit: 85000000, spent: 0 },
      { id: '3120', name: 'Agua', code: '3.1.2.0', limit: 25000000, spent: 0 },
      { id: '3130', name: 'Gas', code: '3.1.3.0', limit: 12000000, spent: 0 },
      { id: '3140', name: 'Teléfono / Internet', code: '3.1.4.0', limit: 18000000, spent: 0 }
    ]
  },
  { 
    id: 'c-3500-01', programId: 'prog-01', name: 'Servicios Técnicos y Profesionales', code: '3.5.0.0',
    subCategories: [
      { id: '3510', name: 'Estudios e Investigaciones', code: '3.5.1.0', limit: 45000000, spent: 0 },
      { id: '3550', name: 'Publicidad y Propaganda', code: '3.5.5.0', limit: 30000000, spent: 0 }
    ]
  },

  // --- PROGRAMA 34 (OPERATIVO AMBIENTE / GIRSU) ---
  { 
    id: 'c-2200-34', programId: 'prog-34', name: 'Indumentaria y Textiles', code: '2.2.0.0',
    subCategories: [
      { id: '2220', name: 'Prendas de Vestir (Ropa)', code: '2.2.2.0', limit: 535481882, spent: 0 },
      { id: '2230', name: 'Guantes, Botas y EPP', code: '2.2.3.0', limit: 145000000, spent: 0 }
    ]
  },
  { 
    id: 'c-2500-34', programId: 'prog-34', name: 'Combustibles y Químicos', code: '2.5.0.0',
    subCategories: [
      { id: '2560', name: 'Combustibles y Lubricantes', code: '2.5.6.0', limit: 4369805595, spent: 0 },
      { id: '2520', name: 'Productos Farmacéuticos', code: '2.5.2.0', limit: 45000000, spent: 0 },
      { id: '2550', name: 'Insecticidas y Fumigantes', code: '2.5.5.0', limit: 120000000, spent: 0 }
    ]
  },
  { 
    id: 'c-2400-34', programId: 'prog-34', name: 'Cuero y Caucho', code: '2.4.0.0',
    subCategories: [
      { id: '2440', name: 'Neumáticos y Cámaras', code: '2.4.4.0', limit: 867606497, spent: 0 }
    ]
  },
  { 
    id: 'c-2900-34', programId: 'prog-34', name: 'Repuestos y Accesorios', code: '2.9.0.0',
    subCategories: [
      { id: '2960', name: 'Repuestos Maquinaria/Camión', code: '2.9.6.0', limit: 1102829287, spent: 0 },
      { id: '2920', name: 'Repuestos de Edificios', code: '2.9.2.0', limit: 35000000, spent: 0 }
    ]
  },
  { 
    id: 'c-3200-34', programId: 'prog-34', name: 'Alquileres', code: '3.2.0.0',
    subCategories: [
      { id: '3220', name: 'Alquiler de Maquinaria', code: '3.2.2.0', limit: 10672000000, spent: 0 },
      { id: '3210', name: 'Alquiler de Edificios', code: '3.2.1.0', limit: 150000000, spent: 0 }
    ]
  },
  { 
    id: 'c-3300-34', programId: 'prog-34', name: 'Mantenimiento y Reparación', code: '3.3.0.0',
    subCategories: [
      { id: '3320', name: 'Mantenimiento Vehículos', code: '3.3.2.0', limit: 866865856, spent: 0 },
      { id: '3330', name: 'Mantenimiento Maquinaria', code: '3.3.3.0', limit: 450000000, spent: 0 },
      { id: '3350', name: 'Mantenimiento Espacios Verdes', code: '3.3.5.0', limit: 1600000000, spent: 0 }
    ]
  }
];

export const INITIAL_BUDGET: Budget = {
  total: 24231907753.71,
  spent: 0,
  committed: 0,
  lastUpdated: new Date().toISOString(),
  allocations: CATEGORIES.map(cat => ({
    categoryId: cat.id,
    limit: (cat.subCategories || []).reduce((acc, sub) => acc + sub.limit, 0) || 10000000,
    spent: 0,
    committed: 0
  }))
};

export const INITIAL_ITEMS_MOCK: any[] = [];
export const INITIAL_VEHICLES_MOCK: Vehicle[] = [
    { id: 'v1', plate: 'AF-123-XY', model: 'Volkswagen Constellation 17.280', type: 'Compactador', status: 'Operativo', mileage: 45000 },
    { id: 'v2', plate: 'AG-987-ZZ', model: 'Iveco Tector 170E28', type: 'Volcador', status: 'Operativo', mileage: 12000 },
    { id: 'v3', plate: 'AD-555-RR', model: 'Ford Cargo 1722', type: 'Compactador', status: 'En Taller', mileage: 185000 }
];
export const INITIAL_CONTRACTS_MOCK: Contract[] = [];
