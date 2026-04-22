import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

// ============================================================
// CLASS NAME UTILITIES
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// CURRENCY FORMATTING
// ============================================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

// ============================================================
// DATE UTILITIES
// ============================================================
export function formatDate(date: string | Date, formatStr = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: id });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, HH:mm', { locale: id });
}

export function getTodayRange() {
  const now = new Date();
  return {
    start: startOfDay(now).toISOString(),
    end: endOfDay(now).toISOString(),
  };
}

export function getMonthRange(date = new Date()) {
  return {
    start: startOfMonth(date).toISOString(),
    end: endOfMonth(date).toISOString(),
  };
}

// ============================================================
// INVOICE / ORDER NUMBER GENERATION
// ============================================================
export function generateInvoiceNumber(): string {
  const now = new Date();
  const date = format(now, 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${date}-${random}`;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const date = format(now, 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${date}-${random}`;
}

// ============================================================
// STOCK STATUS
// ============================================================
export type StockStatus = 'out' | 'low' | 'ok';

export function getStockStatus(current: number, minimum: number): StockStatus {
  if (current <= 0) return 'out';
  if (current <= minimum) return 'low';
  return 'ok';
}

export const STOCK_STATUS_CONFIG: Record<StockStatus, { label: string; color: string; bg: string }> = {
  out: { label: 'Habis', color: 'text-red-600', bg: 'bg-red-100' },
  low: { label: 'Hampir Habis', color: 'text-amber-600', bg: 'bg-amber-100' },
  ok: { label: 'Tersedia', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

// ============================================================
// PAYMENT METHOD LABELS
// ============================================================
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer Bank',
  qris: 'QRIS',
  credit: 'Kartu Kredit',
  debit: 'Kartu Debit',
};

// ============================================================
// TRANSACTION STATUS
// ============================================================
export const TRANSACTION_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Tertunda', color: 'text-amber-600', bg: 'bg-amber-100' },
  completed: { label: 'Selesai', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  cancelled: { label: 'Dibatalkan', color: 'text-red-600', bg: 'bg-red-100' },
  refunded: { label: 'Direfund', color: 'text-blue-600', bg: 'bg-blue-100' },
};

// ============================================================
// TRUNCATE TEXT
// ============================================================
export function truncate(str: string, max = 30): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ============================================================
// CALCULATE PROFIT MARGIN
// ============================================================
export function calcMargin(sellPrice: number, costPrice: number): number {
  if (sellPrice === 0) return 0;
  return ((sellPrice - costPrice) / sellPrice) * 100;
}
