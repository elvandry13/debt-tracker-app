"use client";

import { useState } from "react";
import AdminUsersPage from "./users/page";
import AdminLoansPage from "./loans/page";

type Tab = "loans" | "users";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("loans");

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex bg-white rounded-xl shadow p-1 gap-1">
        <button
          onClick={() => setActiveTab("loans")}
          className={`flex-1 text-sm px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "loans"
              ? "bg-blue-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          🏠 Manajemen Loan
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 text-sm px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "users"
              ? "bg-blue-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          👥 Manajemen User
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "loans" ? <AdminLoansPage /> : <AdminUsersPage />}
    </div>
  );
}