export interface Table {
  id: number;
  name: string;
  seats: number;
  x: number;
  y: number;
  zone: TableZone;
  shape: 'SQUARE' | 'ROUND';
  rotation: number;
  status: TableStatus;
}

export interface Order {
  id: string;
  tableId: number | null;
  type: OrderType;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: Date;
  total: number;
  taxTotal: number;
  profit: number;
  subAccountName?: string;
  customerId?: string;
  paymentMethod?: PaymentMethod;
  invoiceNumber?: string;
  hash?: string;
}

export interface OrderItem {
  dish: Dish;
  quantity: number;
  status: 'PENDENTE';
  notes?: string;
  unitPrice: number;
  unitCost: number;
  taxAmount: number;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  categoryId: string;
  image?: string;
  isAvailable: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  phone: string;
  status: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  color: string;
  workDaysPerMonth: number;
  dailyWorkHours: number;
  externalBioId: string;
}

export type TableZone = 'INTERIOR' | 'EXTERIOR' | 'TERRACE' | 'BAR';

export type TableStatus = 'free' | 'occupied' | 'LIVRE' | 'OCUPADO';

export type OrderType = 'LOCAL' | 'DELIVERY' | 'TAKEAWAY';

export type OrderStatus = 'open' | 'ABERTO' | 'closed' | 'FECHADO' | 'canceled' | 'CANCELADO';

export type PaymentMethod = 
  | 'NUMERARIO' 
  | 'TPA' 
  | 'MULTICAIXA' 
  | 'QR_CODE' 
  | 'TRANSFERENCIA' 
  | 'PAGAR_DEPOIS';

export type CashFlowStatus = 'open' | 'closed';

export interface StockItem {
  id: string;
  name: string;
  categoryId: string;
  currentStock: number;
  minStock: number;
  unitCost: number;
  unitPrice: number;
  isAvailable: boolean;
  lastUpdated: Date;
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface SystemSettings {
  restaurantName: string;
  appLogoUrl: string;
  currency: string;
  taxRate: number;
  taxRegime: "GERAL";
  phone: string;
  address: string;
  nif: string;
  commercialReg: string;
  capitalSocial: string;
  conservatoria: string;
  description: string;
  operatingHours: {
    monday: { open: string; close: string; };
    tuesday: { open: string; close: string; };
    wednesday: { open: string; close: string; };
    thursday: { open: string; close: string; };
    friday: { open: string; close: string; };
    saturday: { open: string; close: string; };
    sunday: { open: string; close: string; };
  };
  invoiceSeries: string;
  invoiceCounter: number;
  autoBackup: boolean;
  supabaseUrl: string;
  supabaseKey: string;
  email: string;
  website: string;
  agtSoftwareCertification: string;
  agtSoftwareVersion: string;
  customDigitalMenuUrl: string;
}
