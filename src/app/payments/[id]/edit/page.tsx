"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { getPayment, updatePayment } from "@/actions/payments";
import { toast } from "sonner";

export default function EditPaymentPage() {
  const params = useParams();
  const id = params.id as string;

  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState("");
  const [amount, setAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | undefined>(undefined);
  const [receiptFile, setReceiptFile] = useState<File | undefined>(undefined);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [existingProof, setExistingProof] = useState<string | null>(null);
  const [existingReceipt, setExistingReceipt] = useState<string | null>(null);

  useEffect(() => {
    getPayment(id).then((payment) => {
      if (!payment) {
        setError("Data pembayaran tidak ditemukan");
        setLoading(false);
        return;
      }
      setPaymentDate(payment.payment_date);
      setAmount(String(payment.amount));
      setExistingProof(payment.proof_file_url);
      setExistingReceipt(payment.receipt_file_url);
      setLoading(false);
    });
  }, [id]);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | undefined) => void,
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setter(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setter(undefined);
      setPreview(null);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);

    const dateVal = formData.get("payment_date") as string;
    const amountVal = Number(formData.get("amount"));

    if (!dateVal) {
      setError("Tanggal pembayaran wajib diisi");
      return;
    }
    if (!amountVal || amountVal <= 0) {
      setError("Nominal harus lebih dari 0");
      return;
    }

    startTransition(async () => {
      const result = await updatePayment(
        id,
        dateVal,
        amountVal,
        proofFile,
        receiptFile
      );
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-900" />
      </div>
    );
  }

  if (error === "Data pembayaran tidak ditemukan") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <a href="/payments" className="text-blue-600 text-sm hover:underline">
            ← Kembali
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-blue-900">✏️ Edit Pembayaran</h2>

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
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
            {existingProof && (
              <div className="mb-2 flex items-center gap-2">
                <a
                  href={existingProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  📎 Lihat bukti saat ini
                </a>
                <span className="text-xs text-gray-400">
                  (upload baru akan menggantikan)
                </span>
              </div>
            )}
            <input
              id="proof_file"
              name="proof_file"
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleImageChange(e, setProofFile, setProofPreview)
              }
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
            {existingReceipt && (
              <div className="mb-2 flex items-center gap-2">
                <a
                  href={existingReceipt}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  🧾 Lihat kwitansi saat ini
                </a>
                <span className="text-xs text-gray-400">
                  (upload baru akan menggantikan)
                </span>
              </div>
            )}
            <input
              id="receipt_file"
              name="receipt_file"
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleImageChange(e, setReceiptFile, setReceiptPreview)
              }
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
        {error && error !== "Data pembayaran tidak ditemukan" && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <a
            href="/payments"
            className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 text-sm font-semibold text-center hover:bg-gray-200 transition"
          >
            Batal
          </a>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-900 text-white rounded-lg py-3 text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Menyimpan...
              </span>
            ) : (
              "💾 Simpan Perubahan"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}