import { supabase } from '../lib/supabase';
import type {
  Product, ProductFormData,
  Category,
  Transaction, TransactionFormData, TransactionItem,
  RestockOrder, RestockFormData,
  Expense, ExpenseFormData, ExpenseCategory,
  StockMovement,
  AuditLog,
  DashboardSummary, SalesReport, ExpenseReport, ProfitLossReport,
} from '../types';
import { generateInvoiceNumber, generateOrderNumber, getTodayRange, getMonthRange } from '../utils/helpers';

// ============================================================
// PRODUCTS
// ============================================================
export const productService = {
  async getAll(filters?: { category_id?: string; is_active?: boolean; search?: string }) {
    let query = supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('name');

    if (filters?.category_id) query = query.eq('category_id', filters.category_id);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

    const { data, error } = await query;
    return { data: data as Product[] | null, error: error?.message };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();
    return { data: data as Product | null, error: error?.message };
  },

  async create(form: ProductFormData) {
    const { data, error } = await supabase
      .from('products')
      .insert([form])
      .select()
      .single();
    return { data: data as Product | null, error: error?.message };
  },

  async update(id: string, form: Partial<ProductFormData>) {
    const { data, error } = await supabase
      .from('products')
      .update(form)
      .eq('id', id)
      .select()
      .single();
    return { data: data as Product | null, error: error?.message };
  },

  async delete(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return { error: error?.message };
  },

  async getLowStock() {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .filter('current_stock', 'lte', supabase.rpc('get_min_stock_filter'))
      .eq('is_active', true);
    return { data: data as Product[] | null, error: error?.message };
  },
};

// ============================================================
// CATEGORIES
// ============================================================
export const categoryService = {
  async getAll() {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    return { data: data as Category[] | null, error: error?.message };
  },

  async create(form: { name: string; description?: string; color?: string }) {
    const { data, error } = await supabase.from('categories').insert([form]).select().single();
    return { data: data as Category | null, error: error?.message };
  },

  async update(id: string, form: Partial<Category>) {
    const { data, error } = await supabase.from('categories').update(form).eq('id', id).select().single();
    return { data: data as Category | null, error: error?.message };
  },

  async delete(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    return { error: error?.message };
  },
};

// ============================================================
// STOCK MOVEMENTS
// ============================================================
export const stockMovementService = {
  async getByProduct(productId: string) {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    return { data: data as StockMovement[] | null, error: error?.message };
  },

  async getAll(limit = 50) {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*, product:products(name, sku, unit)')
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: data as StockMovement[] | null, error: error?.message };
  },

  async create(movement: Omit<StockMovement, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('stock_movements').insert([movement]).select().single();
    return { data: data as StockMovement | null, error: error?.message };
  },
};

// ============================================================
// TRANSACTIONS
// ============================================================
export const transactionService = {
  async getAll(filters?: { status?: string; start?: string; end?: string; search?: string }) {
    let query = supabase
      .from('transactions')
      .select('*, items:transaction_items(*, product:products(name, unit))')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.start) query = query.gte('created_at', filters.start);
    if (filters?.end) query = query.lte('created_at', filters.end);
    if (filters?.search) query = query.ilike('invoice_number', `%${filters.search}%`);

    const { data, error } = await query;
    return { data: data as Transaction[] | null, error: error?.message };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, items:transaction_items(*, product:products(name, unit))')
      .eq('id', id)
      .single();
    return { data: data as Transaction | null, error: error?.message };
  },

  async create(form: TransactionFormData) {
    const invoiceNumber = generateInvoiceNumber();
    const subtotal = form.items.reduce((s, i) => s + i.subtotal, 0);
    const totalAmount = subtotal - form.discount_amount + form.tax_amount;
    const changeAmount = form.amount_paid - totalAmount;

    // Insert transaction
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert([{
        invoice_number: invoiceNumber,
        customer_name: form.customer_name || null,
        customer_phone: form.customer_phone || null,
        payment_method: form.payment_method,
        subtotal,
        discount_amount: form.discount_amount,
        tax_amount: form.tax_amount,
        total_amount: totalAmount,
        amount_paid: form.amount_paid,
        change_amount: Math.max(0, changeAmount),
        status: 'completed',
        notes: form.notes || null,
      }])
      .select()
      .single();

    if (txError) return { data: null, error: txError.message };

    // Insert items
    const items = form.items.map(i => ({
      transaction_id: txData.id,
      product_id: i.product.id,
      product_name: i.product.name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      cost_price: i.product.cost_price,
      discount_amount: i.discount_amount,
      subtotal: i.subtotal,
    }));

    const { error: itemsError } = await supabase.from('transaction_items').insert(items);
    if (itemsError) return { data: null, error: itemsError.message };

    // Record stock movements for each item
    const movements = form.items.map(i => ({
      product_id: i.product.id,
      type: 'out' as const,
      quantity: i.quantity,
      unit_price: i.unit_price,
      reference_id: txData.id,
      reference_type: 'transaction' as const,
      notes: `Terjual - ${invoiceNumber}`,
    }));

    await supabase.from('stock_movements').insert(movements);

    return { data: txData as Transaction, error: null };
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    return { data: data as Transaction | null, error: error?.message };
  },

  async delete(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    return { error: error?.message };
  },
};

// ============================================================
// RESTOCK ORDERS
// ============================================================
export const restockService = {
  async getAll(filters?: { status?: string; search?: string }) {
    let query = supabase
      .from('restock_orders')
      .select('*, items:restock_items(*, product:products(name, unit))')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.search) query = query.ilike('order_number', `%${filters.search}%`);

    const { data, error } = await query;
    return { data: data as RestockOrder[] | null, error: error?.message };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('restock_orders')
      .select('*, items:restock_items(*, product:products(name, unit))')
      .eq('id', id)
      .single();
    return { data: data as RestockOrder | null, error: error?.message };
  },

  async create(form: RestockFormData) {
    const orderNumber = generateOrderNumber();
    const totalCost = form.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

    const { data: orderData, error: orderError } = await supabase
      .from('restock_orders')
      .insert([{
        order_number: orderNumber,
        supplier_name: form.supplier_name || null,
        supplier_phone: form.supplier_phone || null,
        status: form.status,
        total_cost: totalCost,
        notes: form.notes || null,
        received_at: form.status === 'received' ? form.received_at || new Date().toISOString() : null,
      }])
      .select()
      .single();

    if (orderError) return { data: null, error: orderError.message };

    const items = form.items.map(i => ({
      restock_order_id: orderData.id,
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_cost: i.unit_cost,
      subtotal: i.quantity * i.unit_cost,
    }));

    const { error: itemsError } = await supabase.from('restock_items').insert(items);
    if (itemsError) return { data: null, error: itemsError.message };

    // If received, update stock
    if (form.status === 'received') {
      const movements = form.items.map(i => ({
        product_id: i.product_id,
        type: 'in' as const,
        quantity: i.quantity,
        unit_price: i.unit_cost,
        reference_id: orderData.id,
        reference_type: 'restock' as const,
        notes: `Restok - ${orderNumber}`,
      }));
      await supabase.from('stock_movements').insert(movements);

      // Update cost price
      for (const item of form.items) {
        await supabase.from('products').update({ cost_price: item.unit_cost }).eq('id', item.product_id);
      }
    }

    return { data: orderData as RestockOrder, error: null };
  },

  async update(id: string, form: Partial<RestockFormData>) {
    const { data, error } = await supabase
      .from('restock_orders')
      .update(form)
      .eq('id', id)
      .select()
      .single();
    return { data: data as RestockOrder | null, error: error?.message };
  },

  async delete(id: string) {
    const { error } = await supabase.from('restock_orders').delete().eq('id', id);
    return { error: error?.message };
  },
};

// ============================================================
// EXPENSES
// ============================================================
export const expenseService = {
  async getAll(filters?: { category_id?: string; start?: string; end?: string }) {
    let query = supabase
      .from('expenses')
      .select('*, category:expense_categories(*)')
      .order('expense_date', { ascending: false });

    if (filters?.category_id) query = query.eq('category_id', filters.category_id);
    if (filters?.start) query = query.gte('expense_date', filters.start);
    if (filters?.end) query = query.lte('expense_date', filters.end);

    const { data, error } = await query;
    return { data: data as Expense[] | null, error: error?.message };
  },

  async create(form: ExpenseFormData) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...form, category_id: form.category_id || null }])
      .select('*, category:expense_categories(*)')
      .single();
    return { data: data as Expense | null, error: error?.message };
  },

  async update(id: string, form: Partial<ExpenseFormData>) {
    const { data, error } = await supabase
      .from('expenses')
      .update(form)
      .eq('id', id)
      .select('*, category:expense_categories(*)')
      .single();
    return { data: data as Expense | null, error: error?.message };
  },

  async delete(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    return { error: error?.message };
  },

  async getCategories() {
    const { data, error } = await supabase.from('expense_categories').select('*').order('name');
    return { data: data as ExpenseCategory[] | null, error: error?.message };
  },
};

// ============================================================
// DASHBOARD & REPORTS
// ============================================================
export const reportService = {
  async getDashboardSummary(): Promise<{ data: DashboardSummary | null; error: string | null }> {
    const { start, end } = getTodayRange();

    const [salesRes, expensesRes, productsRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('total_amount, subtotal, items:transaction_items(quantity, cost_price)')
        .eq('status', 'completed')
        .gte('created_at', start)
        .lte('created_at', end),
      supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', start.split('T')[0]),
      supabase
        .from('products')
        .select('current_stock, min_stock, is_active')
        .eq('is_active', true),
    ]);

    if (salesRes.error) return { data: null, error: salesRes.error.message };

    const totalSales = (salesRes.data || []).reduce((s, t) => s + t.total_amount, 0);
    const totalTransactions = salesRes.data?.length || 0;
    const totalExpenses = (expensesRes.data || []).reduce((s, e) => s + e.amount, 0);

    const cogs = (salesRes.data || []).reduce((s, t) => {
      const itemsCost = (t.items || []).reduce((is: number, i: { quantity: number; cost_price: number }) => is + i.quantity * i.cost_price, 0);
      return s + itemsCost;
    }, 0);
    const grossProfit = totalSales - cogs;
    const estimatedProfit = grossProfit - totalExpenses;

    const products = productsRes.data || [];
    const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock).length;

    return {
      data: {
        totalSalesToday: totalSales,
        totalTransactionsToday: totalTransactions,
        totalExpensesToday: totalExpenses,
        estimatedProfit,
        lowStockProducts,
        totalProducts: products.length,
      },
      error: null,
    };
  },

  async getSalesChart(days = 30): Promise<{ data: SalesReport[]; error: string | null }> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const { data, error } = await supabase
      .from('transactions')
      .select('created_at, total_amount, items:transaction_items(quantity, cost_price)')
      .eq('status', 'completed')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at');

    if (error) return { data: [], error: error.message };

    // Group by date
    const map: Record<string, SalesReport> = {};
    for (const t of data || []) {
      const date = t.created_at.split('T')[0];
      if (!map[date]) {
        map[date] = { date, total_sales: 0, total_transactions: 0, total_profit: 0 };
      }
      map[date].total_sales += t.total_amount;
      map[date].total_transactions += 1;
      const cogs = (t.items || []).reduce((s: number, i: { quantity: number; cost_price: number }) => s + i.quantity * i.cost_price, 0);
      map[date].total_profit += t.total_amount - cogs;
    }

    return { data: Object.values(map).sort((a, b) => a.date.localeCompare(b.date)), error: null };
  },

  async getExpensesByCategory(start?: string, end?: string): Promise<{ data: ExpenseReport[]; error: string | null }> {
    let query = supabase
      .from('expenses')
      .select('amount, category:expense_categories(name, color)');

    if (start) query = query.gte('expense_date', start);
    if (end) query = query.lte('expense_date', end);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const map: Record<string, ExpenseReport> = {};
    for (const e of data || []) {
      const cat = (e.category as { name: string; color: string } | null);
      const name = cat?.name || 'Tidak Berkategori';
      const color = cat?.color || '#6b7280';
      if (!map[name]) map[name] = { category: name, total: 0, color };
      map[name].total += e.amount;
    }

    return { data: Object.values(map), error: null };
  },

  async getProfitLoss(months = 6): Promise<{ data: ProfitLossReport[]; error: string | null }> {
    const results: ProfitLossReport[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const { start, end } = getMonthRange(d);
      const period = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

      const [salesRes, expRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('total_amount, items:transaction_items(quantity, cost_price)')
          .eq('status', 'completed')
          .gte('created_at', start)
          .lte('created_at', end),
        supabase
          .from('expenses')
          .select('amount')
          .gte('expense_date', start.split('T')[0])
          .lte('expense_date', end.split('T')[0]),
      ]);

      const revenue = (salesRes.data || []).reduce((s, t) => s + t.total_amount, 0);
      const cogs = (salesRes.data || []).reduce((s, t) => {
        return s + (t.items || []).reduce((is: number, i: { quantity: number; cost_price: number }) => is + i.quantity * i.cost_price, 0);
      }, 0);
      const expenses = (expRes.data || []).reduce((s, e) => s + e.amount, 0);
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - expenses;

      results.push({ period, revenue, cogs, gross_profit: grossProfit, expenses, net_profit: netProfit });
    }

    return { data: results, error: null };
  },
};

// ============================================================
// AUDIT LOGS
// ============================================================
export const auditService = {
  async getAll(filters?: { table_name?: string; limit?: number }) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(filters?.limit || 100);

    if (filters?.table_name) query = query.eq('table_name', filters.table_name);

    const { data, error } = await query;
    return { data: data as AuditLog[] | null, error: error?.message };
  },
};
