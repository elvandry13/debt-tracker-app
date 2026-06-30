"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getLoans() {
  const supabase = await createClient();

  const { data: loans, error } = await supabase
    .from("loans")
    .select("id, description, total_debt, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching loans:", error);
    return [];
  }

  return loans || [];
}

export async function updateLoan(id: string, description: string, totalDebt: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("loans")
    .update({ description, total_debt: totalDebt })
    .eq("id", id);

  if (error) {
    return { error: "Gagal mengupdate loan: " + error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function createLoan(description: string, totalDebt: number) {
  const supabase = await createClient();

  const { error } = await supabase.from("loans").insert({ description, total_debt: totalDebt });

  if (error) {
    return { error: "Gagal membuat loan: " + error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteLoan(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("loans").delete().eq("id", id);

  if (error) {
    return { error: "Gagal menghapus loan: " + error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}