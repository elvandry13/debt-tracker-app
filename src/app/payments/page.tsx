import { getPayments } from "@/actions/payments";
import { getUser } from "@/actions/auth";
import { PaymentList } from "@/components/payment-list";

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

      <PaymentList
        payments={payments}
        isAdmin={user?.role === "ADMIN"}
      />
    </div>
  );
}