import { getPayments } from "@/actions/payments";
import { getUser } from "@/actions/auth";

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

export default async function PaymentsPage() {
  const user = await getUser();
  const payments = await getPayments();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-blue-900">📋 Riwayat Pembayaran</h2>
        {user?.role === "ADMIN" && (
          <a
            href="/payments/new"
            className="bg-blue-900 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-800 transition"
          >
            + Tambah
          </a>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-400 text-sm">Belum ada riwayat pembayaran</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment: any) => (
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

              {(payment.proof_file_url || payment.receipt_file_url) && (
                <div className="flex gap-2 pt-1 border-t border-gray-100">
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}