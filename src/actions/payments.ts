"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

function extractStoragePath(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Path format: /storage/v1/object/public/<bucket>/<path>
    const parts = u.pathname.split("/");
    const publicIndex = parts.indexOf("public");
    if (publicIndex === -1 || publicIndex + 2 >= parts.length) return null;
    return parts.slice(publicIndex + 2).join("/");
  } catch {
    return null;
  }
}

async function uploadFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  file: File,
  prefix: string
): Promise<{ url: string | null; error?: string }> {
  if (!file || file.size === 0) return { url: null };

  const fileName = `${userId}/${Date.now()}_${prefix}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("payment_receipts")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { url: null, error: `Gagal mengupload ${prefix}: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage
    .from("payment_receipts")
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl };
}

export async function deletePayment(paymentId: string) {
  const supabase = await createClient();

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
    return { error: "Hanya Admin yang dapat menghapus pembayaran" };
  }

  // Ambil data payment untuk hapus file storage
  const { data: payment } = await supabase
    .from("payments")
    .select("proof_file_url, receipt_file_url")
    .eq("id", paymentId)
    .single();

  if (payment) {
    const proofPath = extractStoragePath(payment.proof_file_url);
    const receiptPath = extractStoragePath(payment.receipt_file_url);

    const toRemove: string[] = [];
    if (proofPath) toRemove.push(proofPath);
    if (receiptPath) toRemove.push(receiptPath);

    if (toRemove.length > 0) {
      await supabase.storage.from("payment_receipts").remove(toRemove);
    }
  }

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId);

  if (error) {
    return { error: "Gagal menghapus pembayaran: " + error.message };
  }

  revalidatePath("/");
  revalidatePath("/payments");
  return { success: true };
}

export async function updatePayment(
  paymentId: string,
  paymentDate: string,
  amount: number,
  proofFile?: File,
  receiptFile?: File
) {
  const supabase = await createClient();

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
    return { error: "Hanya Admin yang dapat mengedit pembayaran" };
  }

  // Ambil data existing untuk hapus file lama jika ada upload baru
  const { data: existing } = await supabase
    .from("payments")
    .select("proof_file_url, receipt_file_url")
    .eq("id", paymentId)
    .single();

  let proofUrl = existing?.proof_file_url ?? null;
  let receiptUrl = existing?.receipt_file_url ?? null;

  // Upload proof baru jika ada
  if (proofFile && proofFile.size > 0) {
    // Hapus file lama
    const oldPath = extractStoragePath(proofUrl);
    if (oldPath) {
      await supabase.storage.from("payment_receipts").remove([oldPath]);
    }

    const result = await uploadFile(supabase, user.id, proofFile, "proof");
    if (result.error) return { error: result.error };
    proofUrl = result.url;
  }

  // Upload receipt baru jika ada
  if (receiptFile && receiptFile.size > 0) {
    const oldPath = extractStoragePath(receiptUrl);
    if (oldPath) {
      await supabase.storage.from("payment_receipts").remove([oldPath]);
    }

    const result = await uploadFile(supabase, user.id, receiptFile, "receipt");
    if (result.error) return { error: result.error };
    receiptUrl = result.url;
  }

  const { error } = await supabase
    .from("payments")
    .update({
      payment_date: paymentDate,
      amount,
      proof_file_url: proofUrl,
      receipt_file_url: receiptUrl,
    })
    .eq("id", paymentId);

  if (error) {
    return { error: "Gagal mengupdate pembayaran: " + error.message };
  }

  revalidatePath("/");
  revalidatePath("/payments");
  redirect("/payments");
}

export async function getPayment(paymentId: string) {
  const supabase = await createClient();

  const { data: payment, error } = await supabase
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
    .eq("id", paymentId)
    .single();

  if (error || !payment) return null;
  return payment;
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