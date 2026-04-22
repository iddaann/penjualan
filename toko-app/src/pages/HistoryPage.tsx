import { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { transactionService, stockMovementService } from '../lib/services';
import type { Transaction, StockMovement } from '../types';
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS, TRANSACTION_STATUS_CONFIG } from '../utils/helpers';
import { Card, Badge, Input, Select, EmptyState, LoadingSpinner, Table, Td } from '../components/ui';

const TAB_OPTIONS = [
  { id: 'transactions', label: 'Riwayat Transaksi' },
  { id: 'stock', label: 'Mutasi Stok' },
];

const STOCK_TYPE_CONFIG = {
  in: { label: 'Stok Masuk', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  out: { label: 'Stok Keluar', color: 'text-rose-600', bg: 'bg-rose-100' },
  adjustment: { label: 'Penyesuaian', color: 'text-amber-600', bg: 'bg-amber-100' },
};

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (activeTab === 'transactions') {
        const { data } = await transactionService.getAll({
          search: search || undefined,
          status: filterStatus || undefined,
        });
        setTransactions(data || []);
      } else {
        const { data } = await stockMovementService.getAll(200);
        setMovements(data || []);
      }
      setLoading(false);
    }
    load();
  }, [activeTab, search, filterStatus]);

  const statusOpts = Object.entries(TRANSACTION_STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }));

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TAB_OPTIONS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab === 'transactions' && (
        <div className="flex gap-3">
          <Input className="flex-1 max-w-xs" placeholder="Cari invoice..." value={search}
            onChange={e => setSearch(e.target.value)} leftIcon={<Search size={15} />} />
          <Select className="w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            options={statusOpts} placeholder="Semua Status" />
        </div>
      )}

      <Card>
        {loading ? <LoadingSpinner /> : (
          <>
            {activeTab === 'transactions' && (
              transactions.length === 0 ? (
                <EmptyState icon={<History size={48} />} title="Belum ada riwayat transaksi" />
              ) : (
                <Table headers={['Invoice', 'Pelanggan', 'Produk', 'Pembayaran', 'Total', 'Waktu', 'Status']}>
                  {transactions.map(t => {
                    const cfg = TRANSACTION_STATUS_CONFIG[t.status];
                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <Td><code className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{t.invoice_number}</code></Td>
                        <Td>{t.customer_name || <span className="text-slate-300 text-xs">-</span>}</Td>
                        <Td className="text-xs text-slate-500">{t.items?.length || 0} item</Td>
                        <Td className="text-xs">{PAYMENT_METHOD_LABELS[t.payment_method]}</Td>
                        <Td className="font-semibold">{formatCurrency(t.total_amount)}</Td>
                        <Td className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(t.created_at)}</Td>
                        <Td><Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge></Td>
                      </tr>
                    );
                  })}
                </Table>
              )
            )}

            {activeTab === 'stock' && (
              movements.length === 0 ? (
                <EmptyState icon={<History size={48} />} title="Belum ada mutasi stok" />
              ) : (
                <Table headers={['Waktu', 'Produk', 'Tipe', 'Jumlah', 'Harga Satuan', 'Referensi', 'Catatan']}>
                  {movements.map(m => {
                    const cfg = STOCK_TYPE_CONFIG[m.type];
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <Td className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(m.created_at)}</Td>
                        <Td>
                          <p className="font-medium text-slate-800 text-sm">{(m.product as { name: string } | undefined)?.name || m.product_id}</p>
                        </Td>
                        <Td><Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge></Td>
                        <Td>
                          <span className={`font-bold text-sm ${m.type === 'in' ? 'text-emerald-600' : m.type === 'out' ? 'text-rose-600' : 'text-amber-600'}`}>
                            {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '='}{m.quantity}
                          </span>
                        </Td>
                        <Td className="text-sm">{m.unit_price ? formatCurrency(m.unit_price) : '-'}</Td>
                        <Td>
                          {m.reference_type && (
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{m.reference_type}</span>
                          )}
                        </Td>
                        <Td className="text-xs text-slate-400">{m.notes || '-'}</Td>
                      </tr>
                    );
                  })}
                </Table>
              )
            )}
          </>
        )}
      </Card>
    </div>
  );
}
