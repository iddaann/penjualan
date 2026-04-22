import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Plus, Search, ShoppingCart, Trash2, X, Check, Receipt } from 'lucide-react';
import { transactionService, productService } from '../lib/services';
import type { Transaction, Product, CartItem, PaymentMethod, TransactionStatus } from '../types';
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS, TRANSACTION_STATUS_CONFIG } from '../utils/helpers';
import { Button, Input, Select, Card, Badge, Modal, EmptyState, LoadingSpinner, Table, Td } from '../components/ui';

const PAYMENT_OPTS = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }));

// ============================================================
// Transaction Form (POS Style)
// ============================================================
function TransactionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', payment_method: 'cash' as PaymentMethod,
    discount_amount: 0, tax_amount: 0, amount_paid: 0, notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    productService.getAll({ is_active: true, search: search || undefined }).then(r => setProducts(r.data || []));
  }, [search]);

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const total = subtotal - form.discount_amount + form.tax_amount;
  const change = form.amount_paid - total;

  function addToCart(p: Product) {
    setCart(c => {
      const existing = c.find(i => i.product.id === p.id);
      if (existing) {
        return c.map(i => i.product.id === p.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
          : i);
      }
      return [...c, { product: p, quantity: 1, unit_price: p.selling_price, discount_amount: 0, subtotal: p.selling_price }];
    });
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) return removeFromCart(id);
    setCart(c => c.map(i => i.product.id === id
      ? { ...i, quantity: qty, subtotal: qty * i.unit_price - i.discount_amount }
      : i));
  }

  function removeFromCart(id: string) {
    setCart(c => c.filter(i => i.product.id !== id));
  }

  async function handleSubmit() {
    if (cart.length === 0) return setError('Keranjang belanja kosong');
    if (form.payment_method === 'cash' && form.amount_paid < total) return setError('Uang bayar kurang');
    setLoading(true);
    const { error: err } = await transactionService.create({ ...form, items: cart });
    setLoading(false);
    if (err) return setError(err);
    onSuccess();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Product Search */}
      <div className="flex-1 space-y-3">
        <Input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search size={14} />} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.current_stock <= 0}
              className="text-left p-3 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <p className="text-xs font-semibold text-slate-800 line-clamp-2">{p.name}</p>
              <p className="text-xs text-indigo-600 font-bold mt-1">{formatCurrency(p.selling_price)}</p>
              <p className="text-xs text-slate-400">Stok: {p.current_stock}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:w-80 flex flex-col gap-3">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <ShoppingCart size={16} />
          Keranjang ({cart.length})
        </h3>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-300 text-sm py-8">
            Belum ada produk
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cart.map(item => (
              <div key={item.product.id} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-indigo-600">{formatCurrency(item.unit_price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded bg-white border text-slate-600 text-xs hover:bg-slate-100">-</button>
                  <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded bg-white border text-slate-600 text-xs hover:bg-slate-100">+</button>
                </div>
                <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="border-t border-slate-200 pt-3 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600">Diskon</span>
            <input type="number" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: +e.target.value }))}
              className="w-28 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600">Pajak</span>
            <input type="number" value={form.tax_amount} onChange={e => setForm(f => ({ ...f, tax_amount: +e.target.value }))}
              className="w-28 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="flex justify-between font-bold text-slate-800 text-base border-t pt-2">
            <span>Total</span><span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment */}
        <Select label="Metode Pembayaran" value={form.payment_method}
          onChange={e => setForm(f => ({ ...f, payment_method: e.target.value as PaymentMethod }))}
          options={PAYMENT_OPTS} />
        {form.payment_method === 'cash' && (
          <>
            <Input label="Uang Bayar" type="number" value={form.amount_paid}
              onChange={e => setForm(f => ({ ...f, amount_paid: +e.target.value }))} />
            {form.amount_paid > 0 && (
              <div className={`text-sm font-semibold px-3 py-2 rounded-lg ${change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                Kembalian: {formatCurrency(Math.max(0, change))}
              </div>
            )}
          </>
        )}
        <Input label="Nama Pelanggan" value={form.customer_name}
          onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Opsional" />

        {error && <p className="text-xs text-red-500 bg-red-50 px-2 py-1.5 rounded-lg">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Batal</Button>
          <Button size="sm" className="flex-1" loading={loading} icon={<Check size={14} />} onClick={handleSubmit}>
            Proses
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Transaction List
// ============================================================
function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await transactionService.getAll({
      status: filterStatus || undefined,
      search: search || undefined,
    });
    setTransactions(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, filterStatus]);

  const statusOpts = Object.entries(TRANSACTION_STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input className="flex-1" placeholder="Cari nomor invoice..." value={search}
          onChange={e => setSearch(e.target.value)} leftIcon={<Search size={15} />} />
        <Select className="sm:w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          options={statusOpts} placeholder="Semua Status" />
        <Button icon={<Plus size={16} />} onClick={() => setModal(true)}>Transaksi Baru</Button>
      </div>

      <Card>
        {loading ? <LoadingSpinner /> : transactions.length === 0 ? (
          <EmptyState icon={<Receipt size={48} />} title="Belum ada transaksi" />
        ) : (
          <Table headers={['Invoice', 'Pelanggan', 'Waktu', 'Pembayaran', 'Total', 'Status', '']}>
            {transactions.map(t => {
              const cfg = TRANSACTION_STATUS_CONFIG[t.status];
              return (
                <tr key={t.id} className="hover:bg-slate-50">
                  <Td><code className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{t.invoice_number}</code></Td>
                  <Td>{t.customer_name || <span className="text-slate-300 text-xs">-</span>}</Td>
                  <Td className="text-xs text-slate-400">{formatDateTime(t.created_at)}</Td>
                  <Td><span className="text-xs">{PAYMENT_METHOD_LABELS[t.payment_method]}</span></Td>
                  <Td className="font-semibold text-slate-800">{formatCurrency(t.total_amount)}</Td>
                  <Td><Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge></Td>
                  <Td>
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm('Hapus transaksi ini?')) return;
                        await transactionService.delete(t.id);
                        load();
                      }} />
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Transaksi Baru" className="max-w-3xl">
        <TransactionForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); load(); }} />
      </Modal>
    </div>
  );
}

export default function TransactionsPage() {
  return <Routes><Route index element={<TransactionList />} /></Routes>;
}
