"use client";

import { useTransition } from "react";
import { deletePayment } from "@/actions/payments";
import { toast } from "sonner";

interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  proof_file_url: string | null;
  receipt_file_url: string | null;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PaymentList({
  payments,
  isAdmin,
}: {
  payments: Payment[];
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm("Yakin ingin menghapus pembayaran ini?")) return;

    startTransition(async () => {
      const result = await deletePayment(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Pembayaran berhasil dihapus");
      }
    });
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <p className="text-gray-400 text-sm">Belum ada riwayat pembayaran</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="bg-white rounded-xl shadow p-4 space-y-2"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">
                {formatDate(payment.payment_date)}
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatRupiah(payment.amount)}
              </p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Lunas
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <div className="flex gap-2">
              {payment.proof_file_url && (
                <a
                  href={payment.proof_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  📎 Bukti Bayar
                </a>
              )}
              {payment.receipt_file_url && (
                <a
                  href={payment.receipt_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  🧾 Kwitansi
                </a>
              )}
            </div>

            {isAdmin && (
              <div className="flex gap-1">
                <a
                  href={`/payments/${payment.id}/edit`}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition"
                >
                  ✏️ Edit
                </a>
                <button
                  onClick={() => handleDelete(payment.id)}
                  disabled={isPending}
                  className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 transition disabled:opacity-50"
                >
                  🗑️ Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}