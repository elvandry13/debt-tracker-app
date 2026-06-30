"use client";

import { useState, useRef } from "react";
import { createPayment } from "@/actions/payments";
import { toast } from "sonner";

export default function NewPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const proofRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    const paymentDate = formData.get("payment_date") as string;
    const amount = Number(formData.get("amount"));
    const proofFile = formData.get("proof_file") as File | null;
    const receiptFile = formData.get("receipt_file") as File | null;

    // Validasi dasar
    if (!paymentDate) {
      setError("Tanggal pembayaran wajib diisi");
      setLoading(false);
      return;
    }

    if (!amount || amount <= 0) {
      setError("Nominal harus lebih dari 0");
      setLoading(false);
      return;
    }

    try {
      const result = await createPayment(
        paymentDate,
        amount,
        proofFile || undefined,
        receiptFile || undefined
      );

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    } catch {
      setError("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-blue-900">✏️ Input Pembayaran</h2>

      <form action={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl shadow p-4 space-y-4">
          {/* Tanggal Pembayaran */}
          <div>
            <label
              htmlFor="payment_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tanggal Pembayaran
            </label>
            <input
              id="payment_date"
              name="payment_date"
              type="date"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Nominal */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nominal Pembayaran (Rp)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              required
              min="1"
              step="1"
              placeholder="Contoh: 10000000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Bukti Bayar */}
          <div>
            <label
              htmlFor="proof_file"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bukti Pembayaran (Opsional)
            </label>
            <input
              id="proof_file"
              ref={proofRef}
              name="proof_file"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, setProofPreview)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {proofPreview && (
              <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border">
                <img
                  src={proofPreview}
                  alt="Preview bukti"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Kwitansi */}
          <div>
            <label
              htmlFor="receipt_file"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Foto Kwitansi (Opsional)
            </label>
            <input
              id="receipt_file"
              ref={receiptRef}
              name="receipt_file"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, setReceiptPreview)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {receiptPreview && (
              <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border">
                <img
                  src={receiptPreview}
                  alt="Preview kwitansi"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-900 text-white rounded-lg py-3 text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Menyimpan..." : "💾 Simpan Pembayaran"}
        </button>
      </form>
    </div>
  );
}