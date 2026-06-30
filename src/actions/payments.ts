"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const paymentSchema = z.object({
  loan_id: z.string().uuid("ID hutang tidak valid"),
  payment_date: z.string().min(1, "Tanggal wajib diisi"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
});

export async function createPayment(
  paymentDate: string,
  amount: number,
  proofFile?: File,
  receiptFile?: File
) {
  const supabase = await createClient();

  // Verifikasi user adalah ADMIN
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") {
    return { error: "Hanya Admin yang dapat menambah pembayaran" };
  }

  // Ambil loan pertama dari database
  const { data: loans, error: loanError } = await supabase
    .from("loans")
    .select("id")
    .limit(1)
    .single();

  if (loanError || !loans) {
    return { error: "Data hutang tidak ditemukan. Jalankan migrasi terlebih dahulu." };
  }

  const loanId = loans.id;

  // Upload proof file jika ada
  let proofUrl: string | null = null;
  if (proofFile && proofFile.size > 0) {
    const fileName = `${user.id}/${Date.now()}_proof_${proofFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("payment_receipts")
      .upload(fileName, proofFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { error: "Gagal mengupload bukti bayar: " + uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from("payment_receipts")
      .getPublicUrl(fileName);
    proofUrl = urlData.publicUrl;
  }

  // Upload receipt file jika ada
  let receiptUrl: string | null = null;
  if (receiptFile && receiptFile.size > 0) {
    const fileName = `${user.id}/${Date.now()}_receipt_${receiptFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("payment_receipts")
      .upload(fileName, receiptFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { error: "Gagal mengupload kwitansi: " + uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from("payment_receipts")
      .getPublicUrl(fileName);
    receiptUrl = urlData.publicUrl;
  }

  // Insert payment ke database
  const { error: insertError } = await supabase.from("payments").insert({
    loan_id: loanId,
    payment_date: paymentDate,
    amount,
    proof_file_url: proofUrl,
    receipt_file_url: receiptUrl,
    recorded_by: user.id,
  });

  if (insertError) {
    return { error: "Gagal menyimpan data pembayaran: " + insertError.message };
  }

  revalidatePath("/");
  revalidatePath("/payments");
  redirect("/payments");
}

export async function getPayments() {
  const supabase = await createClient();

  const { data: payments, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      payment_date,
      amount,
      proof_file_url,
      receipt_file_url,
      created_at,
      loan_id,
      recorded_by
    `
    )
    .order("payment_date", { ascending: false });

  if (error) {
    console.error("Error fetching payments:", error);
    return [];
  }

  return payments || [];
}

export async function getDashboardData() {
  const supabase = await createClient();

  // Ambil loan
  const { data: loans, error: loanError } = await supabase
    .from("loans")
    .select("id, description, total_debt");

  if (loanError || !loans || loans.length === 0) {
    return {
      totalDebt: 0,
      totalPaid: 0,
      remainingDebt: 0,
      paymentCount: 0,
      description: "Tidak ada data",
    };
  }

  const loan = loans[0];

  // Hitung total pembayaran
  const { data: payments, error: payError } = await supabase
    .from("payments")
    .select("amount")
    .eq("loan_id", loan.id);

  const totalPaid =
    payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const remainingDebt = Number(loan.total_debt) - totalPaid;

  return {
    totalDebt: Number(loan.total_debt),
    totalPaid,
    remainingDebt: Math.max(0, remainingDebt),
    paymentCount: payments?.length || 0,
    description: loan.description,
  };
}