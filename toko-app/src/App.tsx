import { Component, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import TransactionsPage from './pages/TransactionsPage';
import RestockPage from './pages/RestockPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import HistoryPage from './pages/HistoryPage';
import { isSupabaseConfigured } from './lib/supabase';
import './index.css';

// ─── Error Boundary ───────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: 'sans-serif', padding: 40, maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#ef4444', marginBottom: 8 }}>Terjadi Error</h2>
          <pre style={{ background: '#fef2f2', color: '#b91c1c', padding: 16, borderRadius: 8, textAlign: 'left', fontSize: 12, overflow: 'auto' }}>
            {(this.state.error as Error).message}
          </pre>
          <p style={{ color: '#64748b', marginTop: 16, fontSize: 14 }}>
            Pastikan file <code>.env</code> sudah dikonfigurasi dengan benar, lalu refresh halaman.
          </p>
          <button onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            Refresh Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Setup Banner (shown when Supabase not configured) ────
function SetupBanner() {
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 40, maxWidth: 520, width: '100%' }}>
        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>🏪</div>
        <h1 style={{ textAlign: 'center', color: '#1e293b', fontSize: 22, marginBottom: 4 }}>Toko App</h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32, fontSize: 14 }}>Konfigurasi Supabase untuk memulai</p>

        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <p style={{ color: '#92400e', fontSize: 13, margin: 0 }}>
            ⚠️ <strong>File .env belum dikonfigurasi.</strong> Ikuti langkah berikut:
          </p>
        </div>

        <ol style={{ color: '#334155', fontSize: 14, lineHeight: 2, paddingLeft: 20, margin: 0 }}>
          <li>Buat project di <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>supabase.com</a></li>
          <li>Jalankan <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>supabase/schema.sql</code> di SQL Editor</li>
          <li>Buat file <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>.env</code> di root project</li>
          <li>Isi dengan nilai dari <strong>Settings → API</strong> di Supabase</li>
          <li>Restart dev server: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>npm run dev</code></li>
        </ol>

        <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 16, marginTop: 24, fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>
          <div style={{ color: '#94a3b8', marginBottom: 4 }}># .env</div>
          <div>VITE_SUPABASE_URL=https://xxx.supabase.co</div>
          <div>VITE_SUPABASE_ANON_KEY=eyJhbGci...</div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────
export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupBanner />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products/*" element={<ProductsPage />} />
            <Route path="transactions/*" element={<TransactionsPage />} />
            <Route path="restock/*" element={<RestockPage />} />
            <Route path="expenses/*" element={<ExpensesPage />} />
            <Route path="reports/*" element={<ReportsPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
