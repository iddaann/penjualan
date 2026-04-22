// ============================================================
// TOKO APP - TypeScript Types
// ============================================================

export type UUID = string;
export type ISODate = string;

// ============================================================
// PRODUCT TYPES
// ============================================================
export interface Category {
  id: UUID;
  name: string;
  description?: string;
  color: string;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface Product {
  id: UUID;
  name: string;
  sku?: string;
  category_id?: UUID;
  description?: string;
  unit: string;
  selling_price: number;
  cost_price: number;
  current_stock: number;
  min_stock: number;
  image_url?: string;
  is_active: boolean;
  created_at: ISODate;
  updated_at: ISODate;
  // Joined
  category?: Category;
}

export type StockMovementType = 'in' | 'out' | 'adjustment';
export type StockMovementRefType = 'transaction' | 'restock' | 'adjustment';

export interface StockMovement {
  id: UUID;
  product_id: UUID;
  type: StockMovementType;
  quantity: number;
  unit_price?: number;
  reference_id?: UUID;
  reference_type?: StockMovementRefType;
  notes?: string;
  created_by?: string;
  created_at: ISODate;
  // Joined
  product?: Product;
}

// ============================================================
// TRANSACTION TYPES
// ============================================================
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

export interface Transaction {
  id: UUID;
  invoice_number: string;
  customer_name?: string;
  customer_phone?: string;
  payment_method: PaymentMethod;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  status: TransactionStatus;
  notes?: string;
  created_by?: string;
  created_at: ISODate;
  updated_at: ISODate;
  // Joined
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: UUID;
  transaction_id: UUID;
  product_id: UUID;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount_amount: number;
  subtotal: number;
  created_at: ISODate;
  // Joined
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  subtotal: number;
}

// ============================================================
// RESTOCK TYPES
// ============================================================
export type RestockStatus = 'ordered' | 'received' | 'partial' | 'cancelled';

export interface RestockOrder {
  id: UUID;
  order_number: string;
  supplier_name?: string;
  supplier_phone?: string;
  status: RestockStatus;
  total_cost: number;
  notes?: string;
  ordered_at?: ISODate;
  received_at?: ISODate;
  created_by?: string;
  created_at: ISODate;
  updated_at: ISODate;
  // Joined
  items?: RestockItem[];
}

export interface RestockItem {
  id: UUID;
  restock_order_id: UUID;
  product_id: UUID;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  created_at: ISODate;
  // Joined
  product?: Product;
}

// ============================================================
// EXPENSE TYPES
// ============================================================
export interface ExpenseCategory {
  id: UUID;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: ISODate;
}

export interface Expense {
  id: UUID;
  category_id?: UUID;
  title: string;
  description?: string;
  amount: number;
  payment_method: string;
  receipt_url?: string;
  expense_date: string;
  created_by?: string;
  created_at: ISODate;
  updated_at: ISODate;
  // Joined
  category?: ExpenseCategory;
}

// ============================================================
// AUDIT LOG TYPES
// ============================================================
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: UUID;
  table_name: string;
  record_id: UUID;
  action: AuditAction;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  changed_by?: string;
  changed_at: ISODate;
}

// ============================================================
// REPORT / DASHBOARD TYPES
// ============================================================
export interface DashboardSummary {
  totalSalesToday: number;
  totalTransactionsToday: number;
  totalExpensesToday: number;
  estimatedProfit: number;
  lowStockProducts: number;
  totalProducts: number;
}

export interface SalesReport {
  date: string;
  total_sales: number;
  total_transactions: number;
  total_profit: number;
}

export interface ExpenseReport {
  category: string;
  total: number;
  color: string;
}

export interface ProfitLossReport {
  period: string;
  revenue: number;
  cogs: number; // Cost of Goods Sold
  gross_profit: number;
  expenses: number;
  net_profit: number;
}

// ============================================================
// FORM TYPES
// ============================================================
export interface ProductFormData {
  name: string;
  sku: string;
  category_id: string;
  description: string;
  unit: string;
  selling_price: number;
  cost_price: number;
  min_stock: number;
  is_active: boolean;
}

export interface TransactionFormData {
  customer_name: string;
  customer_phone: string;
  payment_method: PaymentMethod;
  discount_amount: number;
  tax_amount: number;
  amount_paid: number;
  notes: string;
  items: CartItem[];
}

export interface RestockFormData {
  supplier_name: string;
  supplier_phone: string;
  status: RestockStatus;
  notes: string;
  received_at: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_cost: number;
  }[];
}

export interface ExpenseFormData {
  category_id: string;
  title: string;
  description: string;
  amount: number;
  payment_method: string;
  expense_date: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
}
