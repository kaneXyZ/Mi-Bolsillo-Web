"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createIngreso(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const monto = Number(formData.get("monto_ingreso"));
  const accountId = Number(formData.get("account_ingreso"));
  const categoryId = Number(formData.get("category_ingreso"));
  const descripcion = formData.get("descripcion_ingreso") as string | null;

  if (!monto || !accountId) {
    redirect("/protected");
  }

  await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: accountId,
    tipo: "ingreso",
    category_id: categoryId || null,
    monto,
    descripcion,
  });

  await supabase.rpc("increment_account_balance", {
    p_account_id: accountId,
    p_delta: monto,
  });

  redirect("/protected");
}

export async function createGasto(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const monto = Number(formData.get("monto_gasto"));
  const accountId = Number(formData.get("account_gasto"));
  const categoryId = Number(formData.get("category_gasto"));
  const descripcion = formData.get("descripcion_gasto") as string | null;

  if (!monto || !accountId) {
    redirect("/protected");
  }

  await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: accountId,
    tipo: "gasto",
    category_id: categoryId || null,
    monto,
    descripcion,
  });

  await supabase.rpc("increment_account_balance", {
    p_account_id: accountId,
    p_delta: -monto,
  });

  redirect("/protected");
}