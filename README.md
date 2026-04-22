# 🏪 Toko App — Aplikasi Manajemen Toko

Aplikasi manajemen toko berbasis web yang dibangun dengan React + TypeScript + Supabase.

---

## ✨ Fitur

| Modul | Fitur |
|---|---|
| **Dashboard** | Ringkasan harian, chart penjualan & pengeluaran, laba estimasi |
| **Manajemen Produk** | CRUD produk, kategori, stok masuk/keluar, tracking margin |
| **Transaksi** | Input penjualan (POS-style), multi metode pembayaran, kembalian otomatis |
| **Restok Barang** | Input stok masuk, update harga modal, tracking supplier |
| **Pengeluaran** | Catat biaya per kategori, riwayat pengeluaran |
| **Laporan Keuangan** | Laporan penjualan, pengeluaran, dan laba rugi |
| **Riwayat & Audit** | Log semua transaksi & mutasi stok |

---

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Routing**: React Router v6
- **Icons**: Lucide React

---

## 🚀 Cara Menjalankan

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd toko-app
npm install
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** di dashboard Supabase
3. Copy seluruh isi file `supabase/schema.sql` dan jalankan
4. Salin **Project URL** dan **Anon Key** dari Settings → API

### 3. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit file `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka http://localhost:5173

---

## 📁 Struktur Proyek

```
toko-app/
├── supabase/
│   └── schema.sql          # Database schema & seed data
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Layout.tsx  # Sidebar + Topbar layout
│   │   └── ui/
│   │       └── index.tsx   # Reusable UI components
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   └── services.ts     # Semua API calls ke Supabase
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   ├── RestockPage.tsx
│   │   ├── ExpensesPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── HistoryPage.tsx
│   ├── types/
│   │   └── index.ts        # Semua TypeScript types
│   ├── utils/
│   │   └── helpers.ts      # Utility functions
│   ├── App.tsx             # Router setup
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🗄️ Struktur Database

```
categories          → Kategori produk
products            → Data produk
stock_movements     → Log stok masuk/keluar/penyesuaian
transactions        → Header transaksi penjualan
transaction_items   → Detail item transaksi
restock_orders      → Header order restok
restock_items       → Detail item restok
expense_categories  → Kategori pengeluaran
expenses            → Data pengeluaran
audit_logs          → Audit trail semua perubahan
```

---

## 🔧 Pengembangan Lanjutan

### Menambahkan Fitur Baru

1. **Tambah type** di `src/types/index.ts`
2. **Tambah service function** di `src/lib/services.ts`
3. **Buat page component** di `src/pages/`
4. **Daftarkan route** di `src/App.tsx`
5. **Tambahkan nav item** di `src/components/layout/Layout.tsx`

### Environment Production

```bash
npm run build
```

Output di folder `dist/` — deploy ke Vercel, Netlify, atau hosting statis lainnya.

---

## 📋 Catatan Keamanan

- Pastikan file `.env` **tidak** di-commit ke git
- Setup **Row Level Security (RLS)** di Supabase untuk production
- Gunakan Supabase Auth untuk autentikasi multi-user

---

## 📝 License

MIT
