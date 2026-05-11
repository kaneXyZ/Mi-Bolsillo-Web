"use client";

import { useRef, useState } from "react";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type Account = {
  id: number;
  bank_code: string;
  nombre: string | null;
  tipo: string;
  saldo_actual: number;
  deuda_actual?: number;
  limite_linea_credito?: number;
  deuda_linea_credito?: number;
};

type CreditProduct = {
  id: number;
  account_id: number;
  tipo: string;
  nombre: string | null;
  cupo_total: number;
  deuda_actual: number;
  fecha_corte: string | null;
  fecha_pago: string | null;
  client_tier: string;
  costo_mantencion_base: number;
  beneficio_descuento_pct: number;
};

type Props = {
  cuentas: Account[];
  creditos: CreditProduct[];
};

/* ─────────────────────────────────────────
   Constantes
───────────────────────────────────────── */
const BANK_NAMES: Record<string, string> = {
  bancoestado: "BancoEstado",
  falabella:   "Banco Falabella",
  banco_chile: "Banco de Chile",
  santander:   "Santander",
  bci:         "BCI",
  scotiabank:  "Scotiabank",
  itau:        "Itaú",
  otro:        "Otro / Efectivo",
};

const TIER_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  normal:  { label: "Normal",  color: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/20" },
  premium: { label: "Premium", color: "text-zinc-300",    bg: "bg-zinc-500/20",     border: "border-zinc-400/20"   },
  elite:   { label: "Elite",   color: "text-yellow-400",  bg: "bg-yellow-500/10",   border: "border-yellow-500/20" },
};

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function formatCLP(v: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);
}

function formatFechaCorta(d: Date) {
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

/**
 * Calcula la próxima fecha de corte y de pago a partir del DÍA guardado
 * en fecha_corte / fecha_pago, proyectando al mes actual o al siguiente
 * si ya pasó ese día este mes.
 */
function getProximasFechas(
  fechaCorte: string | null,
  fechaPago: string | null
) {
  // Normalizar a medianoche local para evitar problemas de zona horaria
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let proxCorte: Date | null = null;
  let proxPago: Date | null = null;

  if (fechaCorte) {
    const diaCorte = new Date(fechaCorte).getDate();
    proxCorte = new Date(hoy.getFullYear(), hoy.getMonth(), diaCorte);
    if (proxCorte < hoy) {
      proxCorte = new Date(hoy.getFullYear(), hoy.getMonth() + 1, diaCorte);
    }
  }

  if (fechaPago) {
    const diaPago = new Date(fechaPago).getDate();
    proxPago = new Date(hoy.getFullYear(), hoy.getMonth(), diaPago);
    if (proxPago < hoy) {
      proxPago = new Date(hoy.getFullYear(), hoy.getMonth() + 1, diaPago);
    }
  }

  function diffDias(a: Date, b: Date) {
    return Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    proxCorte,
    diasCorte: proxCorte ? diffDias(proxCorte, hoy) : null,
    proxPago,
    diasPago:  proxPago  ? diffDias(proxPago,  hoy) : null,
  };
}

/* ─────────────────────────────────────────
   Sub-componentes
───────────────────────────────────────── */
function BarDeuda({
  usado,
  total,
  color,
}: {
  usado: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min((usado / total) * 100, 100) : 0;
  return (
    <div className="w-full bg-border/40 rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Pill de cuenta regresiva para corte o pago.
 * - diasRestantes === 0  → "Hoy"
 * - diasRestantes === 1  → "Mañana"
 * - resto               → "en X días"
 * Corte: amarillo/naranja. Pago: rojo.
 */
function CuentaRegresivaPill({
  dias,
  fecha,
  tipo,
}: {
  dias: number;
  fecha: Date;
  tipo: "corte" | "pago";
}) {
  const esHoy    = dias === 0;
  const esMañana = dias === 1;

  const labelTiempo = esHoy
    ? "Hoy"
    : esMañana
    ? "Mañana"
    : `en ${dias} días`;

  const labelTipo = tipo === "corte" ? "Cierra ciclo" : "Fecha pago";

  // Color según urgencia y tipo
  const urgencia =
    dias <= 2
      ? tipo === "pago"
        ? "text-rose-400 bg-rose-500/10 border-rose-500/25"
        : "text-amber-400 bg-amber-500/10 border-amber-500/25"
      : dias <= 7
      ? tipo === "pago"
        ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
        : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
      : "text-muted-foreground bg-border/30 border-border";

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-2 py-1.5 ${urgencia}`}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] uppercase tracking-widest opacity-70">
          {labelTipo}
        </span>
        <span className="text-[11px] font-semibold">{labelTiempo}</span>
      </div>
      <span className="text-[10px] opacity-80">{formatFechaCorta(fecha)}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Componente principal
───────────────────────────────────────── */
export function AccountsCarousel({ cuentas, creditos }: Props) {
  const [idx, setIdx]   = useState(0);
  const startX          = useRef(0);

  // ── Totales globales ──────────────────────────────────────────
  const saldoTotal = cuentas.reduce(
    (a, c) => a + Number(c.saldo_actual ?? 0),
    0
  );
  const deudaTotal =
    creditos.reduce((a, c) => a + Number(c.deuda_actual ?? 0), 0) +
    cuentas.reduce(
      (a, c) =>
        a +
        Number(c.deuda_linea_credito ?? 0) +
        Number(c.deuda_actual ?? 0),
      0
    );
  const cupoTotalCreditos = creditos.reduce(
    (a, c) => a + Number(c.cupo_total ?? 0),
    0
  );
  const deudaUsadaCreditos = creditos.reduce(
    (a, c) => a + Number(c.deuda_actual ?? 0),
    0
  );

  // ── Cards: total + una por banco con créditos ─────────────────
  const bancosConCredito = [
    ...new Set(
      creditos
        .map(
          (cr) => cuentas.find((ct) => ct.id === cr.account_id)?.bank_code
        )
        .filter(Boolean)
    ),
  ] as string[];

  const cards = [
    { type: "total" as const },
    ...bancosConCredito.map((bc) => ({ type: "banco" as const, bank_code: bc })),
  ];
  const totalCards = cards.length;

  // ── Swipe táctil ──────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 50 && idx < totalCards - 1) setIdx(idx + 1);
    if (diff < -50 && idx > 0) setIdx(idx - 1);
  }

  return (
    <div className="w-full select-none">
      <div
        className="overflow-hidden rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {cards.map((card) => {
            /* ── Card 0: Resumen total ── */
            if (card.type === "total") {
              return (
                <div
                  key="total"
                  className="min-w-full bg-card border border-border rounded-2xl p-4 flex flex-col gap-2"
                >
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Resumen total
                  </span>

                  {/* Saldo líquido */}
                  <div>
                    <span className="text-[11px] text-muted-foreground">
                      Saldo líquido disponible
                    </span>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCLP(saldoTotal)}
                    </p>
                  </div>

                  {/* Endeudamiento */}
                  {deudaTotal > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">
                          Endeudamiento total
                        </span>
                        <span className="text-rose-400 font-semibold">
                          {formatCLP(deudaTotal)}
                        </span>
                      </div>
                      <BarDeuda
                        usado={deudaTotal}
                        total={deudaTotal + saldoTotal}
                        color="bg-rose-500"
                      />
                    </div>
                  )}

                  {/* Cupo crédito */}
                  {cupoTotalCreditos > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">
                          Cupo crédito usado
                        </span>
                        <span className="text-amber-400 font-semibold">
                          {formatCLP(deudaUsadaCreditos)} /{" "}
                          {formatCLP(cupoTotalCreditos)}
                        </span>
                      </div>
                      <BarDeuda
                        usado={deudaUsadaCreditos}
                        total={cupoTotalCreditos}
                        color="bg-amber-500"
                      />
                    </div>
                  )}

                  <span className="text-[10px] text-muted-foreground mt-1">
                    {cuentas.length} cuenta{cuentas.length !== 1 ? "s" : ""} ·{" "}
                    {creditos.length} producto
                    {creditos.length !== 1 ? "s" : ""} crediticio
                    {creditos.length !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            }

            /* ── Card por banco ── */
            const bc = card.bank_code;
            const cuentasBanco  = cuentas.filter((c) => c.bank_code === bc);
            const creditosBanco = creditos.filter((cr) =>
              cuentasBanco.some((ct) => ct.id === cr.account_id)
            );
            const saldoBanco = cuentasBanco.reduce(
              (a, c) => a + Number(c.saldo_actual ?? 0),
              0
            );
            const deudaBanco = creditosBanco.reduce(
              (a, c) => a + Number(c.deuda_actual ?? 0),
              0
            );
            const cupoBanco = creditosBanco.reduce(
              (a, c) => a + Number(c.cupo_total ?? 0),
              0
            );

            return (
              <div
                key={bc}
                className="min-w-full bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
              >
                {/* Header banco */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">
                    {BANK_NAMES[bc] ?? bc}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {cuentasBanco.length} cuenta
                    {cuentasBanco.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Saldo del banco */}
                <div>
                  <span className="text-[10px] text-muted-foreground">
                    Saldo disponible
                  </span>
                  <p className="text-xl font-bold text-emerald-400">
                    {formatCLP(saldoBanco)}
                  </p>
                </div>

                {/* Deuda del banco */}
                {deudaBanco > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        Deuda total con banco
                      </span>
                      <span className="text-rose-400 font-semibold">
                        {formatCLP(deudaBanco)}
                      </span>
                    </div>
                    <BarDeuda
                      usado={deudaBanco}
                      total={cupoBanco || deudaBanco * 1.5}
                      color="bg-rose-500"
                    />
                  </div>
                )}

                {/* Productos crediticios */}
                {creditosBanco.map((cr) => {
                  const tier      = TIER_STYLES[cr.client_tier] ?? TIER_STYLES.normal;
                  const cupoLibre = cr.cupo_total - cr.deuda_actual;
                  const costoReal = Math.round(
                    cr.costo_mantencion_base *
                      (1 - cr.beneficio_descuento_pct / 100)
                  );

                  // ← Aquí se integra getProximasFechas
                  const { proxCorte, diasCorte, proxPago, diasPago } =
                    getProximasFechas(cr.fecha_corte, cr.fecha_pago);

                  return (
                    <div
                      key={cr.id}
                      className={`rounded-xl border p-3 flex flex-col gap-1.5 bg-background/60 ${tier.border}`}
                    >
                      {/* Nombre + tier */}
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold">
                          {cr.nombre ?? cr.tipo}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}
                        >
                          {tier.label}
                        </span>
                      </div>

                      {/* Cupo usado / total */}
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">
                          Cupo usado
                        </span>
                        <span className="text-amber-400 font-medium">
                          {formatCLP(cr.deuda_actual)} /{" "}
                          {formatCLP(cr.cupo_total)}
                        </span>
                      </div>
                      <BarDeuda
                        usado={cr.deuda_actual}
                        total={cr.cupo_total}
                        color="bg-amber-500"
                      />

                      {/* Cupo libre */}
                      <div className="flex justify-between text-[10px] mt-0.5">
                        <span className="text-muted-foreground">
                          Cupo libre
                        </span>
                        <span className="text-emerald-400 font-medium">
                          {formatCLP(cupoLibre)}
                        </span>
                      </div>

                      {/* Mantención */}
                      {cr.costo_mantencion_base > 0 && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">
                            Mantención{" "}
                            {cr.beneficio_descuento_pct > 0 && (
                              <span className={tier.color}>
                                (-{cr.beneficio_descuento_pct}%)
                              </span>
                            )}
                          </span>
                          <span
                            className={
                              cr.beneficio_descuento_pct > 0
                                ? tier.color
                                : "text-foreground"
                            }
                          >
                            {formatCLP(costoReal)}/mes
                          </span>
                        </div>
                      )}

                      {/* ── Cuentas regresivas de corte y pago ── */}
                      {(proxCorte || proxPago) && (
                        <div className="flex flex-col gap-1 mt-1">
                          {proxCorte && diasCorte !== null && (
                            <CuentaRegresivaPill
                              dias={diasCorte}
                              fecha={proxCorte}
                              tipo="corte"
                            />
                          )}
                          {proxPago && diasPago !== null && (
                            <CuentaRegresivaPill
                              dias={diasPago}
                              fecha={proxPago}
                              tipo="pago"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots de navegación */}
      {totalCards > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${
                i === idx ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}