import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Plus, Search, Package, Edit, Trash2 } from 'lucide-react';
import { productService, categoryService } from '../lib/services';
import type { Product, Category, ProductFormData } from '../types';
import { formatCurrency, getStockStatus, STOCK_STATUS_CONFIG, cn } from '../utils/helpers';
import {
  Button, Input, Select, Textarea, Card, Badge,
  Modal, EmptyState, LoadingSpinner, Table, Td
} from '../components/ui';

const DEFAULT_FORM: ProductFormData = {
  name: '', sku: '', category_id: '', description: '',
  unit: 'pcs', selling_price: 0, cost_price: 0, min_stock: 0, is_active: true,
};

function ProductForm({ initial, categories, onSave, onClose }: {
  initial?: Partial<ProductFormData>;
  categories: Category[];
  onSave: (data: ProductFormData) => Promise<string | null>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>({ ...DEFAULT_FORM, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof ProductFormData, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    setError('');
    if (!form.name.trim()) return setError('Nama produk wajib diisi');
    if (!form.selling_price || form.selling_price <= 0) return setError('Harga jual harus lebih dari 0');
    setLoading(true);
    const err = await onSave(form);
    setLoading(false);
    if (err) setError(err);
  }

  const categoryOpts = categories.map(c => ({ value: c.id, label: c.name }));
  const unitOpts = ['pcs', 'kg', 'g', 'liter', 'ml', 'box', 'pack', 'lusin', 'karton'].map(u => ({ value: u, label: u }));

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">
          ⚠️ {error}
        </div>
      )}
      <Input label="Nama Produk *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Masukkan nama produk" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="SKU / Kode" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Opsional" />
        <Select label="Satuan" value={form.unit} onChange={e => set('unit', e.target.value)} options={unitOpts} />
      </div>
      <Select label="Kategori" value={form.category_id} onChange={e => set('category_id', e.target.value)}
        options={categoryOpts} placeholder="— Pilih kategori —" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Harga Jual (Rp) *" type="number" min={0} value={form.selling_price}
          onChange={e => set('selling_price', +e.target.value)} />
        <Input label="Harga Modal (Rp)" type="number" min={0} value={form.cost_price}
          onChange={e => set('cost_price', +e.target.value)} />
      </div>
      <Input label="Stok Minimum" type="number" min={0} value={form.min_stock}
        onChange={e => set('min_stock', +e.target.value)}
        hint="Notifikasi jika stok di bawah angka ini" />
      <Textarea label="Deskripsi" value={form.description}
        onChange={e => set('description', e.target.value)} placeholder="Deskripsi produk (opsional)" />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
          className="w-4 h-4 rounded accent-indigo-600" />
        <span className="text-sm text-slate-700">Produk aktif (tampil untuk transaksi)</span>
      </label>
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Batal</Button>
        <Button className="flex-1" loading={loading} onClick={handleSave}>Simpan Produk</Button>
      </div>
    </div>
  );
}

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [p, c] = await Promise.all([
      productService.getAll({
        search: search || undefined,
        category_id: filterCat || undefined,
      }),
      categoryService.getAll(),
    ]);
    setProducts(p.data || []);
    setCategories(c.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, filterCat]);

  // Returns error string or null on success
  async function handleSave(form: ProductFormData): Promise<string | null> {
    if (editing) {
      const { error } = await productService.update(editing.id, form);
      if (error) return error;
    } else {
      const { error } = await productService.create(form);
      if (error) return error;
    }
    setModal(null);
    setEditing(null);
    load();
    return null;
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    setDeleting(id);
    await productService.delete(id);
    setDeleting(null);
    load();
  }

  const catOpts = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          className="flex-1"
          placeholder="Cari nama produk..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search size={15} />}
        />
        <Select
          className="sm:w-48"
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          options={catOpts}
          placeholder="Semua Kategori"
        />
        <Button icon={<Plus size={16} />} onClick={() => { setEditing(null); setModal('create'); }}>
          Tambah Produk
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 text-sm text-slate-500">
        <span>{products.length} produk</span>
        <span>·</span>
        <span className="text-amber-600 font-medium">
          {products.filter(p => getStockStatus(p.current_stock, p.min_stock) !== 'ok').length} perlu restok
        </span>
      </div>

      {/* Table */}
      <Card>
        {loading ? <LoadingSpinner /> : products.length === 0 ? (
          <EmptyState
            icon={<Package size={48} />}
            title="Belum ada produk"
            description="Klik tombol 'Tambah Produk' untuk menambahkan produk pertama"
            action={
              <Button icon={<Plus size={16} />} onClick={() => { setEditing(null); setModal('create'); }}>
                Tambah Produk
              </Button>
            }
          />
        ) : (
          <Table headers={['Produk', 'SKU', 'Kategori', 'Stok', 'Harga Jual', 'Margin', 'Status', 'Aksi']}>
            {products.map(p => {
              const stockStatus = getStockStatus(p.current_stock, p.min_stock);
              const statusCfg = STOCK_STATUS_CONFIG[stockStatus];
              const margin = p.selling_price > 0
                ? (((p.selling_price - p.cost_price) / p.selling_price) * 100).toFixed(1)
                : '0';
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <Td>
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.unit}</p>
                  </Td>
                  <Td>
                    {p.sku
                      ? <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{p.sku}</code>
                      : <span className="text-slate-300 text-xs">-</span>}
                  </Td>
                  <Td>
                    {p.category ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.category.color }} />
                        <span className="text-xs">{p.category.name}</span>
                      </span>
                    ) : <span className="text-slate-300 text-xs">-</span>}
                  </Td>
                  <Td>
                    <span className={cn('text-sm font-bold', statusCfg.color)}>{p.current_stock}</span>
                    <span className="text-xs text-slate-400 ml-1">{p.unit}</span>
                  </Td>
                  <Td className="font-medium whitespace-nowrap">{formatCurrency(p.selling_price)}</Td>
                  <Td>
                    <span className={cn('text-sm font-semibold', +margin > 20 ? 'text-emerald-600' : 'text-slate-500')}>
                      {margin}%
                    </span>
                  </Td>
                  <Td>
                    <Badge color={statusCfg.color} bg={statusCfg.bg}>{statusCfg.label}</Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="sm" icon={<Edit size={14} />}
                        onClick={() => { setEditing(p); setModal('edit'); }}
                      />
                      <Button
                        variant="ghost" size="sm" icon={<Trash2 size={14} />}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        loading={deleting === p.id}
                        onClick={() => handleDelete(p.id)}
                      />
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Modal */}
      <Modal
        open={!!modal}
        onClose={() => { setModal(null); setEditing(null); }}
        title={modal === 'edit' ? 'Edit Produk' : 'Tambah Produk Baru'}
      >
        <ProductForm
          initial={editing ? {
            name: editing.name,
            sku: editing.sku || '',
            category_id: editing.category_id || '',
            description: editing.description || '',
            unit: editing.unit,
            selling_price: editing.selling_price,
            cost_price: editing.cost_price,
            min_stock: editing.min_stock,
            is_active: editing.is_active,
          } : undefined}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setModal(null); setEditing(null); }}
        />
      </Modal>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Routes>
      <Route index element={<ProductList />} />
    </Routes>
  );
}
