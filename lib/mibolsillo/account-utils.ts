/**
 * Detecta si una cuenta es la cuenta especial de Efectivo.
 * Se puede usar en client y server (no importa nada de Next ni Supabase).
 */
export function esCuentaEfectivo(
  cuenta: { tipo?: string | null; bank_code?: string | null; nombre?: string | null } | null | undefined
): boolean {
  if (!cuenta) return false;
  return (
    cuenta.tipo === "efectivo" ||
    cuenta.bank_code === "efectivo" ||
    (cuenta.nombre ?? "").toLowerCase() === "efectivo"
  );
}