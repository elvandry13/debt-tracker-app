# Panduan Setup & Login Pertama Kali

## Langkah 1: Buat Project Supabase
1. Buka [supabase.com/dashboard](https://supabase.com/dashboard) dan login
2. Klik **New project**, isi nama dan password database
3. Setelah project siap, buka **Project Settings → API**:
   - Copy `URL` → ini adalah `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public key` → ini adalah `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role key` (secret) → ini adalah `SUPABASE_SERVICE_ROLE_KEY`

## Langkah 2: Konfigurasi .env.local
Buat/edit file `.env.local` di root project:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
```

## Langkah 3: Jalankan Migrasi Database
1. Buka **SQL Editor** di Supabase Dashboard (ikon `</>`)
2. Klik **New query**
3. Copy-paste **SELURUH isi** file `supabase/migrations/001_schema.sql`
4. Klik **Run** (Ctrl+Enter)

Ini akan otomatis membuat:
- `public.users` (relasi ke `auth.users`)
- `public.loans` + seed data "Cicilan Rumah" Rp500,000,000
- `public.payments`
- Trigger: user baru di auth → otomatis masuk `public.users` sebagai VIEWER
- Row Level Security (Admin = Read/Write, Viewer = Read only)

5. Klik **New query** lagi, buka file `supabase/migrations/002_storage.sql`, copy-paste seluruh isinya, lalu **Run**
   - Ini akan membuat **Storage Bucket** `payment_receipts` untuk menyimpan unggahan bukti bayar dan foto kwitansi
   - Tanpa langkah ini, upload bukti pembayaran akan gagal dengan error "Bucket not found"

## Langkah 4: Buat Admin Pertama
1. Di Supabase Dashboard → **Authentication → Users**
2. Klik **Add user → Create new user**
3. Isi email (contoh: `admin@contoh.com`) dan password (min 6 karakter)
4. Klik **Create user**
5. User baru otomatis masuk `public.users` sebagai VIEWER (via trigger)
6. Ubah ke ADMIN — buka **SQL Editor** dan jalankan:
   ```sql
   UPDATE public.users SET role = 'ADMIN' WHERE email = 'admin@contoh.com';
   ```

## Langkah 5: Jalankan Aplikasi & Login
```bash
npm run dev
```
1. Buka `http://localhost:3000` → akan redirect ke `/login`
2. Login dengan email & password dari Langkah 4
3. Sebagai Admin, Anda bisa:
   - Akses **Dashboard** (/) — ringkasan hutang
   - Akses **Pembayaran** (/payments) — lihat riwayat
   - Akses **Input Bayar** (/payments/new) — tambah pembayaran
   - Akses **Admin Panel** (/admin) — kelola user

---

## Catatan
- Aplikasi ini **tidak memiliki halaman register**. Semua user dibuat oleh Admin lewat `/admin/users`
- Admin pertama **HARUS dibuat manual** di Supabase seperti dijelaskan di Langkah 4