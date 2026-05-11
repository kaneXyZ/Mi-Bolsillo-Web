"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  VALID_BANK_CODES,
  getValidAccountTypes,
  getValidProductTypes,
} from "@/components/mibolsillo/bank-catalog";

/* ─────────────────────────────────────────
   ensureCuentaEfectivo
   Crea la cuenta Efectivo si no existe.
   Es idempotente: solo inserta si no hay
   ninguna cuenta con tipo = 'efectivo'.
───────────────────────────────────────── */
export async function ensureCuentaEfectivo(userId: string) {
  const supabase = await createClient();

  const { data: existe } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("tipo", "efectivo")
    .maybeSingle();

  if (!existe) {
    await supabase.from("accounts").insert({
      user_id: userId,
      tipo: "efectivo",
      nombre: "Efectivo",
      saldo_actual: 0,
      bank_code: "efectivo", // código especial, no es un banco real
    });
  }
}
/* ─────────────────────────────────────────
   Helper: garantiza que existan las
   categorías protegidas para el usuario.
   Se llama cada vez que hace falta,
   es idempotente (usa upsert con ON CONFLICT).
───────────────────────────────────────── */
export async function ensureCategoriaEfectivo(userId: string) {
  const supabase = await createClient();

  // Categoría ingreso "Efectivo"
  await supabase.from("categories").upsert(
    {
      user_id: userId,
      nombre: "Efectivo",
      tipo: "ingreso",
      is_fixed: false,
      is_system: true,   // columna que añadiremos en la migración
    },
    {
      onConflict: "user_id,nombre,tipo",
      ignoreDuplicates: true,
    }
  );

  // Categoría gasto "Efectivo"
  await supabase.from("categories").upsert(
    {
      user_id: userId,
      nombre: "Efectivo",
      tipo: "gasto",
      is_fixed: false,
      is_system: true,
    },
    {
      onConflict: "user_id,nombre,tipo",
      ignoreDuplicates: true,
    }
  );
}

/* ─────────────────────────────────────────
   createAccount
───────────────────────────────────────── */
export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const tipo = formData.get("tipo") as string;
  const nombre = (formData.get("nombre") as string) || null;
  const saldo = Number(formData.get("saldo_inicial") || 0);
  const bankCode = formData.get("bank_code") as string;

  // ── Validaciones server-side ──
  if (!tipo || !bankCode) redirect("/protected/accounts");
  if (!VALID_BANK_CODES.has(bankCode)) redirect("/protected/accounts");
  if (!getValidAccountTypes(bankCode).has(tipo)) redirect("/protected/accounts");

  await supabase.from("accounts").insert({
    user_id: user.id,
    tipo,
    nombre,
    saldo_actual: saldo,
    bank_code: bankCode,
  });

  redirect("/protected/accounts");
}

/* ─────────────────────────────────────────
   updateAccount
───────────────────────────────────────── */
export async function updateAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const accountId = Number(formData.get("account_id"));
  if (!accountId) redirect("/protected/accounts");

  const limiteLinea = formData.get("limite_linea_credito");
  const deudaLinea = formData.get("deuda_linea_credito");
  const costoMantencion = formData.get("costo_mantencion_mensual");
  const monedaMantencion = (formData.get("moneda_mantencion") as string) || null;

  await supabase
    .from("accounts")
    .update({
      limite_linea_credito: limiteLinea ? Number(limiteLinea) : null,
      deuda_linea_credito: deudaLinea ? Number(deudaLinea) : null,
      costo_mantencion_mensual: costoMantencion ? Number(costoMantencion) : null,
      moneda_mantencion: monedaMantencion,
    })
    .eq("id", accountId)
    .eq("user_id", user.id);

  redirect("/protected/accounts");
}

/* ─────────────────────────────────────────
   createCreditProduct
───────────────────────────────────────── */
export async function createCreditProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const bankCode = formData.get("bank_code") as string;
  const accountId = Number(formData.get("account_id"));
  const tipo = formData.get("tipo") as string;
  const nombre = (formData.get("nombre") as string) || null;

  // ── Validaciones server-side ──
  if (!bankCode || !VALID_BANK_CODES.has(bankCode)) redirect("/protected/accounts");
  if (!getValidProductTypes(bankCode).has(tipo)) redirect("/protected/accounts");
  if (!accountId) redirect("/protected/accounts");

  // Verificar que la cuenta pertenece al usuario Y al banco indicado
  const { data: cuenta } = await supabase
    .from("accounts")
    .select("id, bank_code")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .eq("bank_code", bankCode)
    .single();

  if (!cuenta) redirect("/protected/accounts");

  const cupoTotal = Number(formData.get("cupo_total") || 0);
  const deudaActual = Number(formData.get("deuda_actual") || 0);
  const fechaCorte = (formData.get("fecha_corte") as string) || null;
  const fechaPago = (formData.get("fecha_pago") as string) || null;
  const tasaMensual = formData.get("tasa_interes_mensual")
    ? Number(formData.get("tasa_interes_mensual")) : null;
  const costoBase = Number(formData.get("costo_mantencion_base") || 0);
  const tier = (formData.get("client_tier") as string) || "normal";
  const puntos = Number(formData.get("puntos_acumulados") || 0);
  const beneficioDesde = (formData.get("beneficio_desde") as string) || null;

  const TIERS_VALIDOS = new Set(["normal", "premium", "elite"]);
  const tierSeguro = TIERS_VALIDOS.has(tier) ? tier : "normal";
  const beneficioPct = tierSeguro === "elite" ? 100 : tierSeguro === "premium" ? 50 : 0;

  const montoOriginal = formData.get("monto_credito_original") ? Number(formData.get("monto_credito_original")) : null;
  const cuotasTotales = formData.get("cuotas_totales") ? Number(formData.get("cuotas_totales")) : null;
  const cuotasPagadas = formData.get("cuotas_pagadas") ? Number(formData.get("cuotas_pagadas")) : null;
  const cuotaMensual = formData.get("cuota_mensual") ? Number(formData.get("cuota_mensual")) : null;

  await supabase.from("credit_products").insert({
    user_id: user.id,
    account_id: accountId,
    tipo,
    nombre,
    cupo_total: cupoTotal,
    deuda_actual: deudaActual,
    fecha_corte: fechaCorte,
    fecha_pago: fechaPago,
    tasa_interes_mensual: tasaMensual,
    costo_mantencion_base: costoBase,
    client_tier: tierSeguro,
    puntos_acumulados: puntos,
    beneficio_descuento_pct: beneficioPct,
    beneficio_desde: beneficioDesde,
    monto_credito_original: montoOriginal,
    cuotas_totales: cuotasTotales,
    cuotas_pagadas: cuotasPagadas,
    cuota_mensual: cuotaMensual,
  });

  redirect("/protected/accounts");
}

/* ─────────────────────────────────────────
   createCreditMovement  (sin cambios lógicos)
───────────────────────────────────────── */
export async function createCreditMovement(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const creditProductId = Number(formData.get("credit_product_id"));
  const fecha = formData.get("fecha") as string;
  const tipo = formData.get("tipo") as string;
  const descripcion = (formData.get("descripcion") as string) || null;
  const monto = Number(formData.get("monto"));
  const cuotas = Number(formData.get("cuotas") || 1);
  const tasa = formData.get("tasa_interes") ? Number(formData.get("tasa_interes")) : null;
  const esAuto = formData.get("es_automatico") === "true";

  if (!creditProductId || !fecha || !tipo || !monto) redirect("/protected/accounts");

  const delta = tipo === "pago" ? -monto : monto;

  await supabase.rpc("increment_credit_debt", {
    p_credit_id: creditProductId,
    p_delta: delta,
  });

  const estadoInicial =
    tipo === "compra" ? "pendiente" :
      tipo === "pago" ? "pagada" : "facturada";

  const d = new Date(fecha);
  const cicloAno = d.getFullYear();
  const cicloMes = d.getMonth() + 1;

  await supabase.from("credit_movements").insert({
    user_id: user.id,
    credit_product_id: creditProductId,
    fecha, tipo, descripcion, monto, cuotas,
    tasa_interes: tasa,
    es_automatico: esAuto,
    estado: estadoInicial,
    ciclo_ano: cicloAno,
    ciclo_mes: cicloMes,
  });

  redirect("/protected/accounts");
}

/* ─────────────────────────────────────────
   updateCategory — protege Efectivo
───────────────────────────────────────── */
export async function updateCategory(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const categoryId = Number(formData.get("category_id"));
  const nuevoNombre = (formData.get("nombre") as string)?.trim();

  if (!categoryId || !nuevoNombre) redirect("/protected/settings");

  // Verificar que no sea sistema
  const { data: cat } = await supabase
    .from("categories")
    .select("is_system, nombre")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .single();

  if (!cat) redirect("/protected/settings");
  if (cat.is_system) redirect("/protected/settings"); // silencioso — la UI ya lo bloquea

  await supabase
    .from("categories")
    .update({ nombre: nuevoNombre })
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .eq("is_system", false); // doble seguro

  redirect("/protected/settings");
}

/* ─────────────────────────────────────────
   deleteCategory — protege Efectivo
───────────────────────────────────────── */
export async function deleteCategory(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const categoryId = Number(formData.get("category_id"));
  if (!categoryId) redirect("/protected/settings");

  // Nunca borrar categorías de sistema
  await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .eq("is_system", false); // el filtro protege Efectivo en DB

  redirect("/protected/settings");
}

/* ─────────────────────────────────────────
   generarMantencionTarjeta (sin cambios)
───────────────────────────────────────── */
const MANTENCION_UMBRAL = 10001;

export async function generarMantencionTarjeta(
  creditProductId: number,
  fechaCiclo: Date
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tarjeta, error: errTarjeta } = await supabase
    .from("credit_products")
    .select("id, account_id, costo_mantencion_base, beneficio_descuento_pct")
    .eq("id", creditProductId)
    .eq("user_id", user.id)
    .single();

  if (errTarjeta || !tarjeta) throw new Error("Tarjeta no encontrada o sin permisos");

  const inicioCiclo = new Date(fechaCiclo.getFullYear(), fechaCiclo.getMonth(), 1);
  const finCiclo = new Date(fechaCiclo.getFullYear(), fechaCiclo.getMonth() + 1, 0);
  const cicloAno = fechaCiclo.getFullYear();
  const cicloMes = fechaCiclo.getMonth() + 1;
  const desdeISO = inicioCiclo.toISOString().slice(0, 10);
  const hastaISO = finCiclo.toISOString().slice(0, 10);

  const { data: movs } = await supabase
    .from("credit_movements")
    .select("id, monto, tipo, estado")
    .eq("credit_product_id", creditProductId)
    .eq("user_id", user.id)
    .eq("tipo", "compra")
    .eq("estado", "pendiente")
    .gte("fecha", desdeISO)
    .lte("fecha", hastaISO);

  const comprasPendientes = movs ?? [];
  const usoCiclo = comprasPendientes.reduce((acc, m) => acc + Number(m.monto ?? 0), 0);

  const marcarFacturadas = async () => {
    if (comprasPendientes.length > 0) {
      await supabase
        .from("credit_movements")
        .update({ estado: "facturada", ciclo_ano: cicloAno, ciclo_mes: cicloMes })
        .in("id", comprasPendientes.map((m) => m.id));
    }
  };

  if (usoCiclo < MANTENCION_UMBRAL) {
    await marcarFacturadas();
    return { aplicado: false as const, motivo: "uso_bajo_umbral" as const };
  }

  const costoBase = Number(tarjeta.costo_mantencion_base ?? 0);
  if (costoBase <= 0) {
    await marcarFacturadas();
    return { aplicado: false as const, motivo: "sin_costo_configurado" as const };
  }

  const costoReal = Math.round(costoBase * (1 - Number(tarjeta.beneficio_descuento_pct ?? 0) / 100));
  const hoyISO = new Date().toISOString().slice(0, 10);

  await marcarFacturadas();

  await supabase.from("credit_movements").insert({
    user_id: user.id, credit_product_id: tarjeta.id,
    fecha: hoyISO, tipo: "mantencion",
    descripcion: "Mantención mensual tarjeta de crédito",
    monto: costoReal, cuotas: 1, es_automatico: true,
    estado: "facturada", ciclo_ano: cicloAno, ciclo_mes: cicloMes,
  });

  const { data: catMantencion } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", user.id)
    .eq("nombre", "Mantención tarjeta")
    .eq("tipo", "gasto")
    .maybeSingle();

  await supabase.from("transactions").insert({
    user_id: user.id, account_id: tarjeta.account_id,
    category_id: catMantencion?.id ?? null,
    tipo: "gasto", monto: costoReal, fecha: hoyISO,
    descripcion: "Mantención mensual tarjeta de crédito",
  });

  return { aplicado: true as const, monto: costoReal };
}