"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const tipo = formData.get("tipo") as string;
  const nombre = (formData.get("nombre") as string) || null;
  const saldo = Number(formData.get("saldo_inicial") || 0);
  const bankCode = formData.get("bank_code") as string;

  if (!tipo || !bankCode) redirect("/protected/accounts");

  await supabase.from("accounts").insert({
    user_id: user.id,
    tipo,
    nombre,
    saldo_actual: saldo,
    bank_code: bankCode,
  });

  redirect("/protected/accounts");
}

export async function updateAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const accountId = Number(formData.get("account_id"));
  if (!accountId) redirect("/protected/accounts");

  const limiteLinea = formData.get("limite_linea_credito");
  const deudaLinea = formData.get("deuda_linea_credito");
  const costoMantencion = formData.get("costo_mantencion_mensual");
  const monedaMantencion =
    (formData.get("moneda_mantencion") as string) || null;

  await supabase
    .from("accounts")
    .update({
      limite_linea_credito: limiteLinea ? Number(limiteLinea) : null,
      deuda_linea_credito: deudaLinea ? Number(deudaLinea) : null,
      costo_mantencion_mensual: costoMantencion
        ? Number(costoMantencion)
        : null,
      moneda_mantencion: monedaMantencion,
    })
    .eq("id", accountId)
    .eq("user_id", user.id);

  redirect("/protected/accounts");
}