# 🏠 Debt Tracker App

Aplikasi pencatatan pelunasan hutang cicilan rumah berbasis **Next.js + Supabase** dengan dukungan PWA.

## ✨ Fitur

- 📊 Dashboard ringkasan hutang
- 📋 Riwayat pembayaran
- ✏️ Input pembayaran (Admin)
- ⚙️ Manajemen user & role (Admin)
- 🔐 Role-Based Access Control (Admin / Viewer)
- 📱 Progressive Web App (bisa di-install di smartphone)
- 🖼️ Upload bukti bayar & kwitansi

## 🛠️ Tech Stack

| Teknologi | Fungsi |
|-----------|--------|
| Next.js 16 (App Router) | Fullstack framework |
| Supabase | Auth, Database, Storage |
| Tailwind CSS | Styling |
| Sonner | Toast notifications |
| Zod | Form validation |
| next-pwa | PWA support |

## 📁 Struktur Proyek

```
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── icon-192x192.png
│   └── icon-512x512.png
├── scripts/
│   └── generate-icons.js     # Generate ikon PWA
├── supabase/
│   └── migrations/
│       └── 001_schema.sql     # Skema database
├── src/
│   ├── actions/              # Server Actions
│   │   ├── auth.ts
│   │   ├── payments.ts
│   │   └── users.ts
│   ├── app/                  # App Router pages
│   │   ├── admin/
│   │   │   ├── page.tsx      # Redirect ke /admin/users
│   │   │   └── users/
│   │   │       └── page.tsx  # Manajemen user
│   │   ├── login/
│   │   │   └── page.tsx      # Form login
│   │   ├── payments/
│   │   │   ├── page.tsx      # Riwayat pembayaran
│   │   │   └── new/
│   │   │       └── page.tsx  # Input pembayaran
│   │   ├── layout.tsx        # Root layout + Toaster
│   │   ├── page.tsx          # Dashboard
│   │   └── globals.css       # Tailwind imports
│   ├── components/
│   │   └── nav-bar.tsx       # Navigasi mobile
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts     # Browser client
│   │       ├── server.ts     # Server client
│   │       └── middleware.ts # Session middleware
│   └── middleware.ts         # Next.js middleware (auth guard + RBAC)
├── .env.local                # Environment variables
├── .gitignore
├── next.config.ts            # Next.js config + PWA
├── package.json
├── plan.md                   # Rencana pengembangan
└── README.md
```

## 🚀 Deployment ke Vercel + Supabase

### 1. Supabase Setup

1. Buat proyek di [supabase.com](https://supabase.com/dashboard)
2. Jalankan SQL dari file `supabase/migrations/001_schema.sql` di **SQL Editor**
   - Ini akan membuat: tabel `users`, `loans`, `payments`, RLS policies, trigger `handle_new_user`
3. Buat **Storage Bucket** bernama `payment_receipts` (public)

### 2. Vercel Setup

1. Push repository ini ke GitHub
2. Di [vercel.com](https://vercel.com), import repository
3. Tambahkan **Environment Variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key dari Supabase |

4. Deploy!

### 3. Setup User Pertama

Setelah login pertama, user otomatis terdaftar sebagai `VIEWER` via trigger `handle_new_user`. Untuk mengubah ke Admin:

```sql
-- Jalankan di Supabase SQL Editor
UPDATE public.users SET role = 'ADMIN' WHERE email = 'admin@email.com';
```

### 4. Insert Data Hutang Awal

```sql
-- Jalankan di Supabase SQL Editor
INSERT INTO public.loans (description, total_debt)
VALUES ('KPR Rumah', 500000000); -- Sesuaikan nominal
```

## 🔧 Development Lokal

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local dengan kredensial Supabase

# Jalankan migrasi SQL di Supabase dashboard

# Generate ikon PWA
node scripts/generate-icons.js

# Jalankan dev server
npm run dev
```

## 📝 Lisensi

Private use only.