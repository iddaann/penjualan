import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Plus, Search, PackagePlus, Trash2, X } from 'lucide-react';
import { restockService, productService } from '../lib/services';
import type { RestockOrder, Product, RestockFormData } from '../types';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { Button, Input, Select, Textarea, Card, Badge, Modal, EmptyState, LoadingSpinner, Table, Td } from '../components/ui';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ordered: { label: 'Dipesan', color: 'text-blue-600', bg: 'bg-blue-100' },
  received: { label: 'Diterima', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  partial: { label: 'Sebagian', color: 'text-amber-600', bg: 'bg-amber-100' },
  cancelled: { label: 'Dibatalkan', color: 'text-red-600', bg: 'bg-red-100' },
};

const STATUS_OPTS = Object.entries(STATUS_CONFIG).map(([v, { label }]) => ({ value: v, label }));

function RestockForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<RestockFormData>({
    supplier_name: '', supplier_phone: '', status: 'received', notes: '', received_at: new Date().toISOString().split('T')[0],
    items: [],
  });
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    productService.getAll({ is_active: true }).then(r => setProducts(r.data || []));
  }, []);

  function addItem() {
    const p = products.find(x => x.id === selectedProduct);
    if (!p) return setError('Pilih produk terlebih dahulu');
    if (qty <= 0) return setError('Jumlah harus lebih dari 0');
    if (unitCost <= 0) return setError('Harga beli harus lebih dari 0');
    setForm(f => ({
      ...f,
      items: [...f.items, { product_id: p.id, product_name: p.name, quantity: qty, unit_cost: unitCost }],
    }));
    setSelectedProduct(''); setQty(1); setUnitCost(0); setError('');
  }

  const totalCost = form.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  async function handleSubmit() {
    if (form.items.length === 0) return setError('Tambahkan minimal satu produk');
    setLoading(true);
    const { error: err } = await restockService.create(form);
    setLoading(false);
    if (err) return setError(err);
    onSuccess();
  }

  const productOpts = products.map(p => ({ value: p.id, label: `${p.name} (Stok: ${p.current_stock})` }));

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nama Supplier" value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} placeholder="Opsional" />
        <Input label="No. HP Supplier" value={form.supplier_phone} onChange={e => setForm(f => ({ ...f, supplier_phone: e.target.value }))} placeholder="Opsional" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as RestockFormData['status'] }))} options={STATUS_OPTS} />
        <Input label="Tanggal Terima" type="date" value={form.received_at} onChange={e => setForm(f => ({ ...f, received_at: e.target.value }))} />
      </div>
      <Textarea label="Catatan" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan tambahan..." />

      {/* Add Item */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Tambah Produk</h4>
        <Select value={selectedProduct} onChange={e => {
          setSelectedProduct(e.target.value);
          const p = products.find(x => x.id === e.target.value);
          if (p) setUnitCost(p.cost_price || 0);
        }} options={productOpts} placeholder="Pilih produk" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Jumlah" type="number" value={qty} onChange={e => setQty(+e.target.value)} />
          <Input label="Harga Beli/unit" type="number" value={unitCost} onChange={e => setUnitCost(+e.target.value)} />
        </div>
        <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={addItem}>Tambah ke Daftar</Button>
      </div>

      {/* Item List */}
      {form.items.length > 0 && (
        <div className="space-y-2">
          {form.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{item.product_name}</p>
                <p className="text-xs text-slate-500">{item.quantity} × {formatCurrency(item.unit_cost)} = {formatCurrency(item.quantity * item.unit_cost)}</p>
              </div>
              <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
                className="text-red-400 hover:text-red-600"><X size={15} /></button>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-slate-800 text-sm px-3 pt-1 border-t">
            <span>Total</span><span>{formatCurrency(totalCost)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
        <Button className="flex-1" loading={loading} onClick={handleSubmit}>Simpan Restok</Button>
      </div>
    </div>
  );
}

function RestockList() {
  const [orders, setOrders] = useState<RestockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await restockService.getAll({ status: filterStatus || undefined, search: search || undefined });
    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, filterStatus]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input className="flex-1" placeholder="Cari nomor order..." value={search}
          onChange={e => setSearch(e.target.value)} leftIcon={<Search size={15} />} />
        <Select className="sm:w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          options={STATUS_OPTS} placeholder="Semua Status" />
        <Button icon={<Plus size={16} />} onClick={() => setModal(true)}>Input Restok</Button>
      </div>

      <Card>
        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <EmptyState icon={<PackagePlus size={48} />} title="Belum ada data restok" />
        ) : (
          <Table headers={['No. Order', 'Supplier', 'Produk', 'Total Biaya', 'Tanggal', 'Status', '']}>
            {orders.map(o => {
              const cfg = STATUS_CONFIG[o.status];
              return (
                <tr key={o.id} className="hover:bg-slate-50">
                  <Td><code className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{o.order_number}</code></Td>
                  <Td>{o.supplier_name || <span className="text-slate-300 text-xs">-</span>}</Td>
                  <Td><span className="text-xs">{o.items?.length || 0} item</span></Td>
                  <Td className="font-semibold">{formatCurrency(o.total_cost)}</Td>
                  <Td className="text-xs text-slate-400">{formatDateTime(o.received_at || o.created_at)}</Td>
                  <Td><Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge></Td>
                  <Td>
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={async () => { if (!confirm('Hapus data restok ini?')) return; await restockService.delete(o.id); load(); }} />
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Input Restok Barang" className="max-w-2xl">
        <RestockForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); load(); }} />
      </Modal>
    </div>
  );
}

export default function RestockPage() {
  return <Routes><Route index element={<RestockList />} /></Routes>;
}
