import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { reportService } from '../lib/services';
import type { SalesReport, ExpenseReport, ProfitLossReport } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Card, LoadingSpinner } from '../components/ui';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6'];

const TAB_OPTIONS = [
  { id: 'sales', label: 'Laporan Penjualan' },
  { id: 'expenses', label: 'Laporan Pengeluaran' },
  { id: 'pl', label: 'Laba Rugi' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState<SalesReport[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseReport[]>([]);
  const [plData, setPlData] = useState<ProfitLossReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, e, p] = await Promise.all([
        reportService.getSalesChart(+period),
        reportService.getExpensesByCategory(),
        reportService.getProfitLoss(6),
      ]);
      setSalesData(s.data);
      setExpenseData(e.data);
      setPlData(p.data);
      setLoading(false);
    }
    load();
  }, [period]);

  const fmt = (v: number) => formatCurrency(v);
  const totalSales = salesData.reduce((s, d) => s + d.total_sales, 0);
  const totalProfit = salesData.reduce((s, d) => s + d.total_profit, 0);
  const totalExpenses = expenseData.reduce((s, e) => s + e.total, 0);

  return (
    <div className="space-y-6">
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

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {['7', '30', '90'].map(d => (
                    <button key={d} onClick={() => setPeriod(d)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${period === d ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {d} hari
                    </button>
                  ))}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-slate-500">Total Penjualan: <strong className="text-indigo-600">{fmt(totalSales)}</strong></span>
                  <span className="text-slate-500">Total Profit: <strong className="text-emerald-600">{fmt(totalProfit)}</strong></span>
                </div>
              </div>

              <Card className="p-6">
                <h3 className="font-semibold text-slate-800 mb-5">Tren Penjualan Harian</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={d => formatDate(d, 'dd/MM')} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={fmt} labelFormatter={l => formatDate(l, 'dd MMM yyyy')} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="total_sales" name="Penjualan" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="total_profit" name="Profit" stroke="#10b981" strokeWidth={2.5} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="total_transactions" name="Transaksi" stroke="#f59e0b" strokeWidth={2} dot={false} yAxisId="right" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-slate-800 mb-5">Volume Penjualan per Hari</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={d => formatDate(d, 'dd/MM')} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={fmt} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="total_sales" name="Penjualan" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex items-end justify-end">
                <span className="text-sm text-slate-500">Total Pengeluaran: <strong className="text-rose-600">{fmt(totalExpenses)}</strong></span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold text-slate-800 mb-5">Distribusi Pengeluaran</h3>
                  {expenseData.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-16">Belum ada data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={expenseData} dataKey="total" nameKey="category" cx="50%" cy="50%"
                          outerRadius={110} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                          labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}>
                          {expenseData.map((e, i) => (
                            <Cell key={e.category} fill={e.color || COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={fmt} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-slate-800 mb-5">Perbandingan Kategori</h3>
                  {expenseData.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-16">Belum ada data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={expenseData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip formatter={fmt} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="total" name="Pengeluaran" radius={[0, 4, 4, 0]}>
                          {expenseData.map((e, i) => (
                            <Cell key={e.category} fill={e.color || COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* P&L Tab */}
          {activeTab === 'pl' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-slate-800 mb-5">Laporan Laba Rugi 6 Bulan</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={plData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={fmt} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cogs" name="HPP" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Pengeluaran" fill="#f87171" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="net_profit" name="Laba Bersih" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* P&L Table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Periode</th>
                        <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Revenue</th>
                        <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase">HPP</th>
                        <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Laba Kotor</th>
                        <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Pengeluaran</th>
                        <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Laba Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plData.map(row => (
                        <tr key={row.period} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{row.period}</td>
                          <td className="px-4 py-3 text-right text-indigo-600 font-medium">{fmt(row.revenue)}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{fmt(row.cogs)}</td>
                          <td className="px-4 py-3 text-right text-slate-700 font-medium">{fmt(row.gross_profit)}</td>
                          <td className="px-4 py-3 text-right text-rose-500">{fmt(row.expenses)}</td>
                          <td className={`px-4 py-3 text-right font-bold ${row.net_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {fmt(row.net_profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
