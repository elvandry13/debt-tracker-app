# Rencana Pengembangan Aplikasi Pelunasan Hutang Cicilan Rumah

## 1. Ringkasan & Fitur Utama

Aplikasi pencatatan pelunasan hutang berorientasi *mobile-first* dengan sistem *Role-Based Access Control* (RBAC) dan dukungan *Progressive Web App* (PWA) untuk instalasi di *smartphone*.

- **Autentikasi**: Login dan Logout (menggunakan Supabase Auth).
- **Role**: Admin (Read/Write) dan Viewer (Read Only).
- **Dashboard**: Menampilkan Total Hutang, Total Terbayar, Sisa Hutang, dan Jumlah Cicilan.
- **Riwayat Pembayaran**: Menampilkan daftar historis pembayaran.
- **Input Pembayaran**: Form untuk input tanggal, nominal, upload bukti bayar, dan foto kwitansi (Hanya Admin).
- **Manajemen User**: CRUD user beserta penentuan role (Hanya Admin).

## 2. Tech Stack

- **Fullstack Framework**: Next.js (App Router direkomendasikan).
- **Styling**: Tailwind CSS.
- **PWA**: `next-pwa` (untuk *caching* dan instalasi di *smartphone*).
- **Database, Auth, & Storage**: Supabase (BaaS berbasis PostgreSQL).

## 3. Skema Database (Supabase / PostgreSQL)

### A. Tabel `users` (Schema `public`)

*Catatan: Tabel ini terhubung secara relasional (One-to-One) dengan tabel bawaan `auth.users` milik Supabase melalui UUID.*

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | UUID/PK | Primary Key, references `auth.users(id)` |
| `email` | VARCHAR | Email untuk login (sinkronisasi dengan auth) |
| `role` | VARCHAR | `ADMIN` atau `VIEWER` (digunakan untuk Row Level Security) |
| `is_active` | BOOLEAN | Status user |

### B. Tabel `loans`

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | UUID/PK | Primary Key |
| `description` | VARCHAR | Deskripsi hutang (contoh: KPR Rumah) |
| `total_debt` | NUMERIC(15,2) | Total keseluruhan hutang |
| `created_at` | TIMESTAMPTZ | Tanggal pencatatan (default: `now()`) |

### C. Tabel `payments`

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | UUID/PK | Primary Key |
| `loan_id` | UUID/FK | Relasi ke tabel `loans` |
| `payment_date` | DATE | Tanggal pembayaran dilakukan |
| `amount` | NUMERIC(15,2) | Nominal yang dibayar |
| `proof_file_url` | VARCHAR | URL foto dari Supabase Storage |
| `receipt_file_url` | VARCHAR | URL foto dari Supabase Storage |
| `recorded_by` | UUID/FK | Relasi ke `public.users` (Admin pencatat) |
| `created_at` | TIMESTAMPTZ | Timestamp pencatatan ke sistem (default: `now()`) |

## 4. Logika Bisnis & Row Level Security (RLS) di Supabase

Alih-alih membuat API khusus di *backend*, keamanan data ditangani langsung di level *database* menggunakan RLS:

- **Tabel `loans` & `payments`**:
  - `SELECT`: Diizinkan untuk semua user yang *authenticated* (Admin & Viewer).
  - `INSERT`, `UPDATE`, `DELETE`: Hanya diizinkan untuk user yang memiliki `role = 'ADMIN'` di tabel `public.users`.
- **Kalkulasi Dashboard**:
  Dilakukan dengan mengeksekusi *Query* Supabase dari sisi klien (atau *Server Components* di Next.js) untuk menjumlahkan `amount` dari `payments` dan mengurangkannya dari `total_debt`.

---

## 5. Referensi untuk Coding Agent (Arsitektur & Standar)

### A. Implementasi Progressive Web App (PWA) di Next.js

- Gunakan *package* `@ducanh2912/next-pwa` atau `next-pwa`.
- Konfigurasi file `manifest.json` di folder `public` dengan `display: "standalone"`.
- Sediakan aset ikon berukuran 192x192 dan 512x512.

### B. Pengelolaan Data & Otentikasi (Supabase Client)

- Gunakan `@supabase/ssr` (Supabase Server-Side Rendering) untuk mengelola *session* *cookie* dengan aman di Next.js App Router (baik di *Server Components*, *Server Actions*, maupun *Middleware*).
- Form Input Pembayaran dan Manajemen User harus diproses menggunakan **Next.js Server Actions** agar tidak mengekspos logika sensitif ke *frontend*.
- File/foto harus diunggah langsung ke **Supabase Storage** (buat *bucket* bernama `payment_receipts`).

### C. Standar Kode & Best Practices

- **Frontend / React**:
  - Terapkan *Middleware* di Next.js (`middleware.ts`) untuk memproteksi *route* (hanya user *login* yang bisa masuk, dan *route* `/admin` hanya untuk role `ADMIN`).
  - Gunakan `browser-image-compression` sebelum mengunggah gambar ke Supabase Storage agar hemat kuota dan *storage*.
- **Linting & Formatting**:
  - Gunakan ESLint dan Prettier secara ketat.

### D. Environment Variables (.env.local)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Khusus untuk Server Actions/Admin API bypass)

---

## 6. Skema Deployment & CI/CD

Arsitektur aplikasi ini memisahkan antara layanan infrastruktur data (Supabase) dan layanan hosting antarmuka (Vercel), yang dihubungkan melalui *Environment Variables*.

### A. Layanan Database & Backend (Supabase Cloud)

Karena Supabase adalah *Backend as a Service* (BaaS) yang terkelola penuh (*fully managed*), Anda tidak perlu melakukan *deployment database* manual.

- **Proyek Supabase**: Buat proyek baru di *dashboard* Supabase. Ini akan secara otomatis menyediakan PostgreSQL, API Endpoint, Auth, dan Storage.
- **Migrasi Skema**: Eksekusi *query* SQL untuk tabel `users`, `loans`, dan `payments`, serta aktifkan kebijakan *Row Level Security* (RLS).
- **Storage Bucket**: Buat *bucket* publik/privat bernama `payment_receipts` untuk menyimpan unggahan foto.

### B. Layanan Frontend & Server (Vercel)

**Vercel** adalah platform terbaik dan paling optimal untuk mendeploy Next.js karena Vercel adalah kreator dari *framework* tersebut. Semua fitur spesifik Next.js (seperti *Server Actions*, *Middleware*, dan *App Router*) akan berjalan tanpa konfigurasi tambahan (*zero-config*).

- **CI/CD via GitHub/GitLab**: Vercel dihubungkan langsung ke *repository* Git. Setiap kali ada *push* atau *merge* ke *branch* `main`, Vercel akan otomatis melakukan *build* dan *deployment* (*Continuous Deployment*).
- **Syarat Mutlak PWA (HTTPS)**: PWA dan *Service Worker* mewajibkan koneksi aman (HTTPS). Vercel sudah menyediakan SSL/HTTPS secara bawaan.

### C. Alur Konfigurasi Environment Variables di Vercel

Saat mengatur *project* di Vercel, pastikan semua variabel lingkungan disalin dari Supabase:

- `NEXT_PUBLIC_SUPABASE_URL` = URL dari Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Kunci anonim untuk akses klien (*frontend*).
- `SUPABASE_SERVICE_ROLE_KEY` = Kunci rahasia untuk akses admin (*Server Actions* di Next.js). **Jangan pernah mengekspos ini ke frontend dengan prefix `NEXT_PUBLIC_`.**
