"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/* ─────────────────────────────────────────
   Helper interno: detecta si una cuenta
   es la cuenta especial de Efectivo.
───────────────────────────────────────── */
function cuentaEsEfectivo(cuenta: {
  tipo?: string | null;
  bank_code?: string | null;
  nombre?: string | null;
} | null): boolean {
  if (!cuenta) return false;
  return (
    cuenta.tipo === "efectivo" ||
    cuenta.bank_code === "efectivo" ||
    (cuenta.nombre ?? "").toLowerCase() === "efectivo"
  );
}

/* ─────────────────────────────────────────
   Helper interno: resuelve qué category_id
   usar realmente.

   Regla:
   - Si la cuenta es Efectivo → siempre
     fuerza la categoría is_system Efectivo
     del usuario, ignorando el form.
   - Si no → valida que el categoryId del
     form pertenezca al usuario y sea del
     tipo correcto.
   - Si no viene categoryId → null.
───────────────────────────────────────── */
async function resolverCategoriaId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  accountId: number,
  formCategoryId: number | null,
  tipo: "ingreso" | "gasto"
): Promise<number | null> {
  // 1. Leer la cuenta
  const { data: cuenta } = await supabase
    .from("accounts")
    .select("id, tipo, bank_code, nombre")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  // Si la cuenta no existe o no pertenece al usuario, bloqueamos
  if (!cuenta) return null;

  // 2. ¿Es cuenta Efectivo?
  if (cuentaEsEfectivo(cuenta)) {
    // Buscar categoría Efectivo de sistema del usuario
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("nombre", "Efectivo")
      .eq("tipo", tipo)
      .eq("is_system", true)
      .maybeSingle();

    if (cat) return cat.id;

    // Fallback: crearla si por algún motivo no existe aún
    const { data: nueva } = await supabase
      .from("categories")
      .insert({
        user_id:   userId,
        nombre:    "Efectivo",
        tipo,
        is_fixed:  false,
        is_system: true,
      })
      .select("id")
      .single();

    return nueva?.id ?? null;
  }

  // 3. Cuenta normal: validar categoryId del form
  if (formCategoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("id", formCategoryId)
      .eq("user_id", userId)
      .eq("tipo", tipo)
      .single();

    return cat?.id ?? null;
  }

  return null;
}

/* ─────────────────────────────────────────
   createIngreso
───────────────────────────────────────── */
export async function createIngreso(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const monto       = Number(formData.get("monto_ingreso"));
  const accountId   = Number(formData.get("account_ingreso"));
  const formCatId   = Number(formData.get("category_ingreso")) || null;
  const descripcion = (formData.get("descripcion_ingreso") as string) || null;
  const fechaRaw    = formData.get("fecha_ingreso") as string | null;

  if (!monto || !accountId) redirect("/protected");

  const fecha = fechaRaw?.trim()
    ? fechaRaw
    : new Date().toISOString().split("T")[0];

  // Resolver categoría con regla Efectivo incluida
  const categoryId = await resolverCategoriaId(
    supabase,
    user.id,
    accountId,
    formCatId,
    "ingreso"
  );

  await supabase.from("transactions").insert({
    user_id:     user.id,
    account_id:  accountId,
    tipo:        "ingreso",
    category_id: categoryId,
    monto,
    descripcion,
    fecha,
  });

  await supabase.rpc("increment_account_balance", {
    p_account_id: accountId,
    p_delta:      monto,
  });

  redirect("/protected");
}

/* ─────────────────────────────────────────
   createGasto
───────────────────────────────────────── */
export async function createGasto(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const monto       = Number(formData.get("monto_gasto"));
  const accountId   = Number(formData.get("account_gasto"));
  const formCatId   = Number(formData.get("category_gasto")) || null;
  const descripcion = (formData.get("descripcion_gasto") as string) || null;
  const fechaRaw    = formData.get("fecha_gasto") as string | null;

  if (!monto || !accountId) redirect("/protected");

  const fecha = fechaRaw?.trim()
    ? fechaRaw
    : new Date().toISOString().split("T")[0];

  // Resolver categoría con regla Efectivo incluida
  const categoryId = await resolverCategoriaId(
    supabase,
    user.id,
    accountId,
    formCatId,
    "gasto"
  );

  await supabase.from("transactions").insert({
    user_id:     user.id,
    account_id:  accountId,
    tipo:        "gasto",
    category_id: categoryId,
    monto,
    descripcion,
    fecha,
  });

  await supabase.rpc("increment_account_balance", {
    p_account_id: accountId,
    p_delta:      -monto,
  });

  redirect("/protected");
}