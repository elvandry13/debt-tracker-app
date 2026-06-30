"use client";

import { useState, useEffect, useCallback } from "react";
import { getLoans, updateLoan, createLoan, deleteLoan } from "@/actions/loans";
import { toast } from "sonner";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editTotalDebt, setEditTotalDebt] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newTotalDebt, setNewTotalDebt] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchLoans = useCallback(async () => {
    const data = await getLoans();
    setLoans(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const startEdit = (loan: any) => {
    setEditingId(loan.id);
    setEditDescription(loan.description);
    setEditTotalDebt(loan.total_debt.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDescription("");
    setEditTotalDebt("");
  };

  const handleUpdate = async (id: string) => {
    const debtNum = parseFloat(editTotalDebt);
    if (!editDescription || isNaN(debtNum) || debtNum <= 0) {
      toast.error("Deskripsi wajib diisi & nominal harus > 0");
      return;
    }
    setActionLoading(id);
    const result = await updateLoan(id, editDescription, debtNum);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Loan berhasil diupdate");
      setEditingId(null);
      fetchLoans();
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string, description: string) => {
    if (!window.confirm(`Yakin hapus loan "${description}"?\nSemua pembayaran terkait akan ikut terhapus.`))
      return;

    setActionLoading(id);
    const result = await deleteLoan(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Loan berhasil dihapus");
      fetchLoans();
    }
    setActionLoading(null);
  };

  const handleAdd = async () => {
    const debtNum = parseFloat(newTotalDebt);
    if (!newDescription || isNaN(debtNum) || debtNum <= 0) {
      toast.error("Deskripsi wajib diisi & nominal harus > 0");
      return;
    }
    setAdding(true);
    const result = await createLoan(newDescription, debtNum);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Loan baru berhasil dibuat!");
      setNewDescription("");
      setNewTotalDebt("");
      setShowAddForm(false);
      fetchLoans();
    }
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-blue-900">🏠 Manajemen Loan</h2>
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-400 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-blue-900">🏠 Manajemen Loan</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm px-3 py-1.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition"
        >
          {showAddForm ? "Tutup" : "+ Tambah Loan"}
        </button>
      </div>

      {/* Form Tambah Loan */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Tambah Loan Baru</h3>
          <input
            type="text"
            placeholder="Deskripsi (contoh: KPR Rumah, Kredit Mobil)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Total Hutang (Rp)"
            value={newTotalDebt}
            onChange={(e) => setNewTotalDebt(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full text-sm px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
          >
            {adding ? "Menyimpan..." : "Simpan Loan"}
          </button>
        </div>
      )}

      {/* Daftar Loan */}
      <div className="space-y-2">
        {loans.map((loan) => (
          <div key={loan.id} className="bg-white rounded-xl shadow p-4 space-y-3">
            {editingId === loan.id ? (
              /* Mode Edit */
              <div className="space-y-3">
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={editTotalDebt}
                  onChange={(e) => setEditTotalDebt(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(loan.id)}
                    disabled={actionLoading === loan.id}
                    className="flex-1 text-xs px-3 py-1.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
                  >
                    {actionLoading === loan.id ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 text-xs px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              /* Mode View */
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{loan.description}</p>
                    <p className="text-xs text-gray-400">
                      Dibuat: {new Date(loan.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-red-600">{formatRupiah(loan.total_debt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(loan)}
                    className="flex-1 text-xs px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(loan.id, loan.description)}
                    disabled={actionLoading === loan.id}
                    className="flex-1 text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {actionLoading === loan.id ? "Menghapus..." : "🗑️ Hapus"}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {loans.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-400 text-sm">Tidak ada loan terdaftar</p>
          </div>
        )}
      </div>
    </div>
  );
}