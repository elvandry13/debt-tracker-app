"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function createUser(email: string, password: string, role: "ADMIN" | "VIEWER") {
  // Gunakan Supabase Auth Admin API (service_role key) untuk bypass RLS
  const supabaseAdmin = createAdminClient();

  // Gunakan service_role key untuk admin API call
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return { error: "Gagal membuat user: " + error.message };
  }

  const userId = data?.user?.id;
  if (!userId) {
    return { error: "User berhasil dibuat tapi ID tidak ditemukan" };
  }

  // Update role di public.users
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ role })
    .eq("id", userId);

  if (updateError) {
    return { error: "User dibuat tapi gagal set role: " + updateError.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function getUsers() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return users || [];
}

export async function updateUserRole(userId: string, role: "ADMIN" | "VIEWER") {
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId);

  if (error) {
    return { error: "Gagal mengupdate role: " + error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) {
    return { error: "Gagal mengupdate status: " + error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();

  // Hapus dari public.users (cascade akan menghapus record terkait)
  const { error } = await supabase.from("users").delete().eq("id", userId);

  if (error) {
    return { error: "Gagal menghapus user: " + error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}