import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Plus, Search, Wallet, Edit, Trash2 } from 'lucide-react';
import { expenseService } from '../lib/services';
import type { Expense, ExpenseCategory, ExpenseFormData } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Button, Input, Select, Textarea, Card, Modal, EmptyState, LoadingSpinner, Table, Td } from '../components/ui';

const PAYMENT_OPTS = [
  { value: 'cash', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer Bank' },
  { value: 'qris', label: 'QRIS' },
  { value: 'credit', label: 'Kartu Kredit' },
];

function ExpenseForm({ initial, categories, onSave, onClose }: {
  initial?: Partial<Expense>;
  categories: ExpenseCategory[];
  onSave: (data: ExpenseFormData) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ExpenseFormData>({
    category_id: initial?.category_id || '',
    title: initial?.title || '',
    description: initial?.description || '',
    amount: initial?.amount || 0,
    payment_method: initial?.payment_method || 'cash',
    expense_date: initial?.expense_date || new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof ExpenseFormData, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title) return setError('Judul pengeluaran wajib diisi');
    if (form.amount <= 0) return setError('Jumlah harus lebih dari 0');
    setLoading(true);
    await onSave(form);
    setLoading(false);
  }

  const catOpts = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <Input label="Judul Pengeluaran *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Contoh: Bayar listrik bulan Januari" />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Kategori" value={form.category_id} onChange={e => set('category_id', e.target.value)} options={catOpts} placeholder="Pilih kategori" />
        <Input label="Tanggal" type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Jumlah *" type="number" value={form.amount} onChange={e => set('amount', +e.target.value)} />
        <Select label="Metode Bayar" value={form.payment_method} onChange={e => set('payment_method', e.target.value)} options={PAYMENT_OPTS} />
      </div>
      <Textarea label="Keterangan" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Catatan tambahan..." />
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
        <Button className="flex-1" loading={loading} onClick={handleSave}>Simpan</Button>
      </div>
    </div>
  );
}

function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);

  async function load() {
    setLoading(true);
    const [e, c] = await Promise.all([
      expenseService.getAll({ category_id: filterCat || undefined }),
      expenseService.getCategories(),
    ]);
    setExpenses(e.data || []);
    setCategories(c.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterCat]);

  async function handleSave(form: ExpenseFormData) {
    if (editing) await expenseService.update(editing.id, form);
    else await expenseService.create(form);
    setModal(null); setEditing(null); load();
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const catOpts = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select className="sm:w-52" value={filterCat} onChange={e => setFilterCat(e.target.value)}
          options={catOpts} placeholder="Semua Kategori" />
        <div className="flex-1" />
        {expenses.length > 0 && (
          <div className="text-sm font-semibold text-slate-700 flex items-center">
            Total: <span className="text-rose-600 ml-2">{formatCurrency(totalExpenses)}</span>
          </div>
        )}
        <Button icon={<Plus size={16} />} onClick={() => { setEditing(null); setModal('create'); }}>Catat Pengeluaran</Button>
      </div>

      <Card>
        {loading ? <LoadingSpinner /> : expenses.length === 0 ? (
          <EmptyState icon={<Wallet size={48} />} title="Belum ada pengeluaran" />
        ) : (
          <Table headers={['Tanggal', 'Judul', 'Kategori', 'Metode', 'Jumlah', '']}>
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50">
                <Td className="text-xs text-slate-500 whitespace-nowrap">{formatDate(e.expense_date)}</Td>
                <Td>
                  <p className="font-medium text-slate-800">{e.title}</p>
                  {e.description && <p className="text-xs text-slate-400">{e.description}</p>}
                </Td>
                <Td>
                  {e.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: e.category.color }} />
                      <span className="text-xs">{e.category.name}</span>
                    </span>
                  ) : <span className="text-slate-300 text-xs">-</span>}
                </Td>
                <Td className="text-xs">{e.payment_method}</Td>
                <Td className="font-semibold text-rose-600">{formatCurrency(e.amount)}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => { setEditing(e); setModal('edit'); }} />
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={async () => { if (!confirm('Hapus pengeluaran ini?')) return; await expenseService.delete(e.id); load(); }} />
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={!!modal} onClose={() => { setModal(null); setEditing(null); }}
        title={modal === 'edit' ? 'Edit Pengeluaran' : 'Catat Pengeluaran'}>
        <ExpenseForm initial={editing || undefined} categories={categories} onSave={handleSave}
          onClose={() => { setModal(null); setEditing(null); }} />
      </Modal>
    </div>
  );
}

export default function ExpensesPage() {
  return <Routes><Route index element={<ExpenseList />} /></Routes>;
}
