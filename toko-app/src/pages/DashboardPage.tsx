import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ShoppingCart, TrendingUp, Wallet, Package, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { reportService } from '../lib/services';
import type { DashboardSummary, SalesReport, ExpenseReport, ProfitLossReport } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Card, StatCard, LoadingSpinner } from '../components/ui';

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6'];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesData, setSalesData] = useState<SalesReport[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseReport[]>([]);
  const [plData, setPlData] = useState<ProfitLossReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [sum, sales, expenses, pl] = await Promise.all([
        reportService.getDashboardSummary(),
        reportService.getSalesChart(30),
        reportService.getExpensesByCategory(),
        reportService.getProfitLoss(6),
      ]);
      setSummary(sum.data);
      setSalesData(sales.data);
      setExpenseData(expenses.data);
      setPlData(pl.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const formatTooltipValue = (value: number) => formatCurrency(value);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Penjualan Hari Ini"
          value={formatCurrency(summary?.totalSalesToday || 0)}
          icon={<ShoppingCart size={20} />}
          color="bg-indigo-500"
          sub={`${summary?.totalTransactionsToday || 0} transaksi`}
        />
        <StatCard
          label="Pengeluaran Hari Ini"
          value={formatCurrency(summary?.totalExpensesToday || 0)}
          icon={<Wallet size={20} />}
          color="bg-rose-500"
        />
        <StatCard
          label="Estimasi Laba"
          value={formatCurrency(summary?.estimatedProfit || 0)}
          icon={<TrendingUp size={20} />}
          color={summary?.estimatedProfit && summary.estimatedProfit > 0 ? 'bg-emerald-500' : 'bg-slate-400'}
        />
        <StatCard
          label="Stok Hampir Habis"
          value={`${summary?.lowStockProducts || 0} produk`}
          icon={<AlertTriangle size={20} />}
          color="bg-amber-500"
          sub={`dari ${summary?.totalProducts || 0} produk aktif`}
        />
      </div>

      {/* Sales Area Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-slate-800">Penjualan 30 Hari Terakhir</h2>
            <p className="text-sm text-slate-400 mt-0.5">Revenue dan profit harian</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
            <ArrowUpRight size={12} />
            30 hari
          </div>
        </div>
        {salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={salesData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d, 'dd/MM')}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={formatTooltipValue}
                labelFormatter={(l) => formatDate(l, 'dd MMM yyyy')}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="total_sales" name="Penjualan" stroke="#6366f1" fill="url(#colorSales)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="total_profit" name="Profit" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Belum ada data penjualan
          </div>
        )}
      </Card>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit & Loss Bar Chart */}
        <Card className="p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-800">Laba Rugi 6 Bulan</h2>
            <p className="text-sm text-slate-400 mt-0.5">Perbandingan revenue vs pengeluaran</p>
          </div>
          {plData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={plData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={formatTooltipValue} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Pengeluaran" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_profit" name="Laba Bersih" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              Belum ada data
            </div>
          )}
        </Card>

        {/* Expense Pie Chart */}
        <Card className="p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-800">Komposisi Pengeluaran</h2>
            <p className="text-sm text-slate-400 mt-0.5">Berdasarkan kategori bulan ini</p>
          </div>
          {expenseData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="total"
                    nameKey="category"
                  >
                    {expenseData.map((entry, i) => (
                      <Cell key={entry.category} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatTooltipValue} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {expenseData.map((e, i) => (
                  <div key={e.category} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: e.color || CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-600 font-medium truncate">{e.category}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(e.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              Belum ada pengeluaran bulan ini
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
