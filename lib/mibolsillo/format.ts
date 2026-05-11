/**
 * Formatea un número como moneda CLP.
 * Uso: formatCLP(12500) → "$12.500"
 */
export function formatCLP(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}