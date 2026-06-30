import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { NavBar } from "@/components/nav-bar";
import { PwaRegister } from "@/components/pwa-register";
import { getUser } from "@/actions/auth";

export const metadata: Metadata = {
  title: "Pelunasan Hutang",
  description: "Aplikasi pencatatan pelunasan hutang cicilan rumah",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-800 antialiased">
        <NavBar userRole={user?.role} />
        <main className="max-w-lg mx-auto px-4 pb-8 pt-4">{children}</main>
        <Toaster richColors position="top-center" />
        <PwaRegister />
      </body>
    </html>
  );
}