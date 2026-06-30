-- ============================================================
-- Migrasi Skema Database: Aplikasi Pelunasan Hutang Cicilan Rumah
-- ============================================================

-- 1. Tabel public.users (terhubung dengan auth.users milik Supabase)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('ADMIN', 'VIEWER')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabel loans
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description VARCHAR(255) NOT NULL,
  total_debt NUMERIC(15,2) NOT NULL CHECK (total_debt > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabel payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  proof_file_url VARCHAR(500),
  receipt_file_url VARCHAR(500),
  recorded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Seed data: 1 record loan "Cicilan Rumah"
INSERT INTO public.loans (description, total_debt)
SELECT 'Cicilan Rumah', 500000000
WHERE NOT EXISTS (SELECT 1 FROM public.loans WHERE description = 'Cicilan Rumah');

-- ============================================================
-- 5. Trigger: Auto-sinkronisasi auth.users → public.users
--    Setiap kali user baru mendaftar di Supabase Auth, otomatis
--    dibuatkan record di public.users dengan role VIEWER.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    'VIEWER',
    true
  );
  RETURN NEW;
END;
$$;

-- Hapus trigger lama jika ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Buat trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. Row Level Security (RLS) Policies
-- ============================================================

-- Aktifkan RLS untuk semua tabel
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function: cek apakah user saat ini adalah ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = true
  );
$$;

-- Helper function: cek apakah user saat ini authenticated dan active
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_active = true
  );
$$;

-- ============================================================
-- Policies untuk tabel users
-- ============================================================

-- Semua authenticated user bisa melihat daftar user
CREATE POLICY "Users can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.is_authenticated());

-- Hanya ADMIN yang bisa insert user baru
CREATE POLICY "Admins can insert users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Hanya ADMIN yang bisa update user
CREATE POLICY "Admins can update users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Hanya ADMIN yang bisa delete user
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- Policies untuk tabel loans
-- ============================================================

-- Semua authenticated bisa SELECT loans
CREATE POLICY "Authenticated users can view loans"
  ON public.loans
  FOR SELECT
  TO authenticated
  USING (public.is_authenticated());

-- Hanya ADMIN yang bisa INSERT/UPDATE/DELETE loans
CREATE POLICY "Admins can insert loans"
  ON public.loans
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update loans"
  ON public.loans
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete loans"
  ON public.loans
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- Policies untuk tabel payments
-- ============================================================

-- Semua authenticated bisa SELECT payments
CREATE POLICY "Authenticated users can view payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (public.is_authenticated());

-- Hanya ADMIN yang bisa INSERT/UPDATE/DELETE payments
CREATE POLICY "Admins can insert payments"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update payments"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete payments"
  ON public.payments
  FOR DELETE
  TO authenticated
  USING (public.is_admin());