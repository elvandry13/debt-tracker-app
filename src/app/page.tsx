import { getDashboardData } from "@/actions/payments";
import { getUser } from "@/actions/auth";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const user = await getUser();
  const data = await getDashboardData();

  const progressPercent =
    data.totalDebt > 0
      ? Math.min(100, Math.round((data.totalPaid / data.totalDebt) * 100))
      : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-blue-900">📊 Dashboard</h2>

      {/* Kartu Ringkasan */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 mb-1">Total Hutang</p>
          <p className="text-lg font-bold text-red-600">
            {formatRupiah(data.totalDebt)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 mb-1">Total Terbayar</p>
          <p className="text-lg font-bold text-green-600">
            {formatRupiah(data.totalPaid)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 mb-1">Sisa Hutang</p>
          <p className="text-lg font-bold text-orange-600">
            {formatRupiah(data.remainingDebt)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 mb-1">Jumlah Cicilan</p>
          <p className="text-lg font-bold text-blue-900">
            {data.paymentCount}x
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-700">
            Progress Pelunasan: {data.description}
          </p>
          <p className="text-sm font-bold text-blue-900">{progressPercent}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Rp 0</span>
          <span>{formatRupiah(data.totalDebt)}</span>
        </div>
      </div>

      {/* Quick Access */}
      <div className="flex gap-2">
        <a
          href="/payments"
          className="flex-1 bg-white rounded-xl shadow p-3 text-center text-sm font-medium text-blue-900 hover:bg-blue-50 transition"
        >
          📋 Lihat Riwayat
        </a>
        {user?.role === "ADMIN" && (
          <a
            href="/payments/new"
            className="flex-1 bg-blue-900 rounded-xl shadow p-3 text-center text-sm font-medium text-white hover:bg-blue-800 transition"
          >
            ✏️ Input Pembayaran
          </a>
        )}
      </div>
    </div>
  );
}