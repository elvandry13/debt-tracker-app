"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getUsers,
  createUser,
  updateUserRole,
  toggleUserActive,
  deleteUser,
} from "@/actions/users";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "VIEWER">("VIEWER");
  const [adding, setAdding] = useState(false);

  const fetchUsers = useCallback(async () => {
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, role: "ADMIN" | "VIEWER") => {
    setActionLoading(userId + "role");
    const result = await updateUserRole(userId, role);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Role berhasil diupdate");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    }
    setActionLoading(null);
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId + "active");
    const result = await toggleUserActive(userId, !currentStatus);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Status user berhasil diubah");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        )
      );
    }
    setActionLoading(null);
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!window.confirm(`Yakin hapus user ${email}?\nData terkait akan ikut terhapus.`))
      return;

    setActionLoading(userId + "delete");
    const result = await deleteUser(userId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("User berhasil dihapus");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-blue-900">⚙️ Manajemen User</h2>
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-400 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-blue-900">⚙️ Manajemen User</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm px-3 py-1.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition"
        >
          {showAddForm ? "Tutup" : "+ Tambah User"}
        </button>
      </div>

      {/* Form Tambah User */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Tambah User Baru</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newEmail || newPassword.length < 6) {
                toast.error("Email wajib diisi & password minimal 6 karakter");
                return;
              }
              setAdding(true);
              const result = await createUser(newEmail, newPassword, newRole);
              if (result?.error) {
                toast.error(result.error);
              } else {
                toast.success("User berhasil dibuat!");
                setNewEmail("");
                setNewPassword("");
                setNewRole("VIEWER");
                setShowAddForm(false);
                fetchUsers();
              }
              setAdding(false);
            }}
            className="space-y-3"
          >
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password (min 6 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "ADMIN" | "VIEWER")}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="VIEWER">Viewer (Read Only)</option>
              <option value="ADMIN">Admin (Read/Write)</option>
            </select>
            <button
              type="submit"
              disabled={adding}
              className="w-full text-sm px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
            >
              {adding ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Membuat...
                </span>
              ) : (
                "Tambah User"
              )}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-xl shadow p-4 space-y-3"
          >
            {/* Info User */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {user.email}
                </p>
                <p className="text-xs text-gray-400">
                  ID: {user.id.substring(0, 8)}...
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {user.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            {/* Role Selector & Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Role */}
              <select
                value={user.role}
                onChange={(e) =>
                  handleRoleChange(
                    user.id,
                    e.target.value as "ADMIN" | "VIEWER"
                  )
                }
                disabled={actionLoading === user.id + "role"}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>

              {/* Toggle Active */}
              <button
                onClick={() => handleToggleActive(user.id, user.is_active)}
                disabled={actionLoading === user.id + "active"}
                className={`text-xs px-3 py-1 rounded-lg border font-medium transition disabled:opacity-50 ${
                  user.is_active
                    ? "border-red-300 text-red-600 hover:bg-red-50"
                    : "border-green-300 text-green-600 hover:bg-green-50"
                }`}
              >
                {actionLoading === user.id + "active" ? (
                  <span className="inline-flex items-center justify-center gap-1">
                    <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                    Memproses...
                  </span>
                ) : user.is_active ? (
                  "Nonaktifkan"
                ) : (
                  "Aktifkan"
                )}
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(user.id, user.email)}
                disabled={actionLoading === user.id + "delete"}
                className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium transition disabled:opacity-50"
              >
                {actionLoading === user.id + "delete" ? (
                  <span className="inline-flex items-center justify-center gap-1">
                    <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                    Menghapus...
                  </span>
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-400 text-sm">Tidak ada user terdaftar</p>
          </div>
        )}
      </div>
    </div>
  );
}