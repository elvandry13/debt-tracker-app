"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";

type NavLinkProps = {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
};

function NavLink({ href, label, icon, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center text-xs font-medium transition ${
        isActive ? "text-white" : "text-gray-300 hover:text-white"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export function NavBar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  // Jangan tampilkan navbar di halaman login
  if (pathname === "/login") return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <nav className="bg-blue-900 sticky top-0 z-50 shadow-md">
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-sm">
          🏠 Pelunasan Hutang
        </Link>

        <div className="flex items-center gap-1">
          <NavLink
            href="/"
            label="Dashboard"
            icon="📊"
            isActive={pathname === "/"}
          />
          <NavLink
            href="/payments"
            label="Riwayat"
            icon="📋"
            isActive={pathname === "/payments"}
          />
          {userRole === "ADMIN" && (
            <NavLink
              href="/admin"
              label="Admin"
              icon="⚙️"
              isActive={pathname.startsWith("/admin")}
            />
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex flex-col items-center text-xs font-medium text-gray-300 hover:text-white disabled:opacity-50"
          >
            <span className="text-lg">🚪</span>
            <span>{loggingOut ? "..." : "Keluar"}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
