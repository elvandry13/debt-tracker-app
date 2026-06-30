-- ============================================================
-- Migrasi Storage: Bucket payment_receipts untuk unggahan bukti bayar
-- ============================================================

-- 1. Buat bucket payment_receipts (public — file bisa diakses via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_receipts', 'payment_receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Authenticated users can SELECT (baca file) dari bucket
CREATE POLICY "Authenticated users can read payment_receipts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment_receipts');

-- 3. RLS Policy: Hanya ADMIN yang bisa INSERT (upload file) ke bucket
CREATE POLICY "Admins can upload to payment_receipts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment_receipts'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = true
    )
  );