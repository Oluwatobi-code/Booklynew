
export type SalesSource = 'WhatsApp' | 'Instagram' | 'Facebook' | 'TikTok' | 'Walk-in' | 'Phone Call' | 'Other';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  tier: 'New' | 'Returning' | 'VIP';
  totalSpent: number;
  orderCount: number;
  lastOrderDate?: string;
}

export interface Order {
  id: string;
  customerId?: string; // Optional now for quick sales
  customerName: string;
  items: OrderItem[];
  total: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Delivered';
  source: SalesSource;
  paymentMethod: 'Cash' | 'Wallet' | 'Transfer';
  note?: string;
}

export interface Product {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
}

export interface BusinessProfile {
  name: string;
  currency: string;
  phone: string;
  email: string;
  footerNote: string;
  vipThreshold: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export interface AppState {
  isLoggedIn: boolean;
  profile: BusinessProfile;
  orders: Order[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  isOnline: boolean;
  settings: {
    showFab: boolean;
    soundEnabled: boolean;
  };
}
