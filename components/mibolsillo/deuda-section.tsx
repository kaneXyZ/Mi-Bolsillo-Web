"use client";

import { useState } from "react";

/* ─────────────────────────────────────────
   Tipos
───────────────────────────────────────── */
type CatFija = {
  id: number;
  nombre: string;
  totalMes: number;
  is_fixed?: boolean;
};

type Credito = {
  id: number;
  nombre?: string | null;
  tipo?: string | null;          // "tarjeta_credito" | "hipotecario" | "consumo" | etc
  deuda_actual?: number | null;
  cuota_mensual?: number | null;
  tasa_interes?: number | null;
};

type Props = {
  creditos:                  Credito[];
  catsFijasGasto:            CatFija[];
  deudaTotal:                number;
  saldoActual:               number;
  promedioIngresoMensual:    number;
  totalGastosFijosMes:       number;
  liquidezMensualEstimada:   number;
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

function tipoLabel(tipo: string | null | undefined) {
  const map: Record<string, string> = {
    tarjeta_credito: "Tarjeta de crédito",
    hipotecario:     "Crédito hipotecario",
    consumo:         "Crédito de consumo",
    automotriz:      "Crédito automotriz",
    educacion:       "Crédito educación",
    otro:            "Otro crédito",
  };
  return map[tipo ?? ""] ?? "Crédito";
}

function tipoIcon(tipo: string | null | undefined) {
  const map: Record<string, string> = {
    tarjeta_credito: "💳",
    hipotecario:     "🏠",
    consumo:         "📋",
    automotriz:      "🚗",
    educacion:       "🎓",
    otro:            "📌",
  };
  return map[tipo ?? ""] ?? "📌";
}

/* ─────────────────────────────────────────
   Proyección de liquidez N meses
   Formula por mes:
   liquidez acumulada = saldo + (ingresoFijo - gastosFijos) * n
───────────────────────────────────────── */
function calcularProyeccionLiquidez(
  saldoActual: number,
  liquidezMensual: number,
  meses: number
): { mes: number; label: string; saldo: number }[] {
  const ahora = new Date();
  return Array.from({ length: meses }, (_, i) => {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() + i + 1, 1);
    return {
      mes:   i + 1,
      label: d.toLocaleDateString("es-CL", { month: "short", year: "2-digit" }),
      saldo: saldoActual + liquidezMensual * (i + 1),
    };
  });
}

/* ─────────────────────────────────────────
   Barra de progreso simple
───────────────────────────────────────── */
function ProgressBar({
  value,
  max,
  color = "bg-rose-500",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   Componente principal
───────────────────────────────────────── */
export function DeudaSection({
  creditos,
  catsFijasGasto,
  deudaTotal,
  saldoActual,
  promedioIngresoMensual,
  totalGastosFijosMes,
  liquidezMensualEstimada,
}: Props) {
  const [horizonte, setHorizonte] = useState<3 | 6>(6);

  const proyeccion = calcularProyeccionLiquidez(
    saldoActual,
    liquidezMensualEstimada,
    horizonte
  );

  const maxSaldo = Math.max(...proyeccion.map((p) => Math.abs(p.saldo)), 1);
  const liquidezPositiva = liquidezMensualEstimada >= 0;

  return (
    <section className="flex flex-col gap-3">

      {/* ── Cabecera global ── */}
      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Endeudamiento global</h2>
          <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
            {creditos.length} producto{creditos.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Deuda total
            </p>
            <p className="text-2xl font-bold text-rose-400 tabular-nums">
              {formatCLP(deudaTotal)}
            </p>
          </div>
          {promedioIngresoMensual > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">
                % del ingreso mensual
              </p>
              <p className="text-sm font-semibold text-rose-400">
                {((deudaTotal / promedioIngresoMensual) * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* Lista de productos de deuda ordenados de mayor a menor */}
        {creditos.length > 0 && (
          <div className="flex flex-col gap-2 pt-1 border-t border-border">
            {[...creditos]
              .sort(
                (a, b) =>
                  Number(b.deuda_actual ?? 0) - Number(a.deuda_actual ?? 0)
              )
              .map((cr) => (
                <div key={cr.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{tipoIcon(cr.tipo)}</span>
                    <div>
                      <p className="text-xs font-medium">
                        {cr.nombre ?? tipoLabel(cr.tipo)}
                      </p>
                      {cr.cuota_mensual && (
                        <p className="text-[10px] text-muted-foreground">
                          Cuota: {formatCLP(Number(cr.cuota_mensual))}/mes
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-rose-400 tabular-nums">
                    {formatCLP(Number(cr.deuda_actual ?? 0))}
                  </span>
                </div>
              ))}
          </div>
        )}

        {creditos.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            🎉 Sin productos de deuda registrados
          </p>
        )}
      </div>

      {/* ── Gastos fijos obligatorios (categorías is_fixed) ── */}
      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Gastos fijos del mes</h2>
          <span className="text-[10px] text-rose-400 font-semibold tabular-nums">
            {formatCLP(totalGastosFijosMes)}
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground -mt-1">
          Se cobran todos los meses. Base para proyecciones.
        </p>

        {catsFijasGasto.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {catsFijasGasto.map((cat) => (
              <div key={cat.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{cat.nombre}</span>
                  <span className="tabular-nums text-rose-400">
                    {formatCLP(cat.totalMes)}
                  </span>
                </div>
                <ProgressBar
                  value={cat.totalMes}
                  max={totalGastosFijosMes}
                  color="bg-rose-500"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No hay categorías marcadas como fijas aún
          </p>
        )}
      </div>

      {/* ── Proyección de liquidez ── */}
      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3 shadow-sm">
        {/* Cabecera + toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Proyección de liquidez</h2>
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-semibold">
            {([3, 6] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setHorizonte(n)}
                className={`px-2.5 py-1 transition ${
                  horizonte === n
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-card"
                }`}
              >
                {n}M
              </button>
            ))}
          </div>
        </div>

        {/* Fórmula visual */}
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="bg-background rounded-xl p-2 border border-border">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
              Ingreso prom.
            </p>
            <p className="text-[11px] font-semibold text-emerald-400 tabular-nums">
              {formatCLP(promedioIngresoMensual)}
            </p>
          </div>
          <div className="bg-background rounded-xl p-2 border border-border">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
              Gastos fijos
            </p>
            <p className="text-[11px] font-semibold text-rose-400 tabular-nums">
              {formatCLP(totalGastosFijosMes)}
            </p>
          </div>
          <div className="bg-background rounded-xl p-2 border border-border">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
              Líquido/mes
            </p>
            <p
              className={`text-[11px] font-bold tabular-nums ${
                liquidezPositiva ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatCLP(liquidezMensualEstimada)}
            </p>
          </div>
        </div>

        {/* Barras de proyección por mes */}
        <div className="flex flex-col gap-2 pt-1 border-t border-border">
          {proyeccion.map((p) => {
            const positivo = p.saldo >= 0;
            return (
              <div key={p.mes} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-8 shrink-0">
                  {p.label}
                </span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      positivo ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (Math.abs(p.saldo) / maxSaldo) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold tabular-nums w-24 text-right shrink-0 ${
                    positivo ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatCLP(p.saldo)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Sugerencia destino del líquido */}
        {liquidezPositiva && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2">
            <span className="text-base shrink-0">💡</span>
            <p className="text-[11px] text-emerald-400/90">
              Podrías destinar{" "}
              <strong>{formatCLP(liquidezMensualEstimada)}</strong>/mes a ahorro
              o inversiones. En {horizonte} meses acumularías{" "}
              <strong>
                {formatCLP(liquidezMensualEstimada * horizonte)}
              </strong>
              .
            </p>
          </div>
        )}
        {!liquidezPositiva && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <p className="text-[11px] text-rose-400/90">
              Tus gastos fijos superan tu ingreso promedio en{" "}
              <strong>{formatCLP(Math.abs(liquidezMensualEstimada))}</strong>
              /mes. Considera revisar tus categorías fijas.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}