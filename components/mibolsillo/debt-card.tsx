"use client";

import { useState } from "react";
import { formatCLP } from "@/lib/mibolsillo/format";

type CatFija = {
  id: number;
  nombre: string;
  totalMes: number;
};

type Props = {
  endeudamiento: number;
  gastosTotales: number;
  saldoActual: number;
  promedioIngresoMensual: number;
  totalGastosFijosMes: number;
  liquidezMensualEstimada: number;
  catsFijasGasto: CatFija[];
};

/* Barra de progreso */
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

/* Proyección simple: saldo + liquidez * n meses */
function calcProyeccion(
  saldo: number,
  liquidez: number,
  meses: number
): { label: string; saldo: number }[] {
  const ahora = new Date();
  return Array.from({ length: meses }, (_, i) => {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() + i + 1, 1);
    return {
      label: d.toLocaleDateString("es-CL", {
        month: "short",
        year: "2-digit",
      }),
      saldo: saldo + liquidez * (i + 1),
    };
  });
}

export function DebtCard({
  endeudamiento,
  gastosTotales,
  saldoActual,
  promedioIngresoMensual,
  totalGastosFijosMes,
  liquidezMensualEstimada,
  catsFijasGasto,
}: Props) {
  const [horizonte, setHorizonte] = useState<3 | 6>(6);

  const proyeccion = calcProyeccion(
    saldoActual,
    liquidezMensualEstimada,
    horizonte
  );

  const liquidezPositiva = liquidezMensualEstimada >= 0;

  /* Color de la barra de deuda vs ingreso */
  const ratioDeuda =
    promedioIngresoMensual > 0
      ? endeudamiento / promedioIngresoMensual
      : 0;
  const colorDeuda =
    ratioDeuda > 2 ? "bg-rose-500" : ratioDeuda > 1 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <section className="flex flex-col gap-3 mt-3 w-full">

      {/* ── Bloque 1: Endeudamiento global ── */}
      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3 shadow-sm">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Endeudamiento global</h2>
          {promedioIngresoMensual > 0 && (
            <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
              {((endeudamiento / promedioIngresoMensual) * 100).toFixed(0)}% del ingreso
            </span>
          )}
        </header>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Deuda total
            </p>
            <p className="text-2xl font-bold text-rose-400 tabular-nums">
              {formatCLP(endeudamiento)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Gastos totales</p>
            <p className="text-sm font-semibold text-muted-foreground tabular-nums">
              {formatCLP(gastosTotales)}
            </p>
          </div>
        </div>

        {promedioIngresoMensual > 0 && (
          <ProgressBar
            value={endeudamiento}
            max={promedioIngresoMensual * 3}
            color={colorDeuda}
          />
        )}
      </div>

      {/* ── Bloque 2: Gastos fijos del mes ── */}
      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3 shadow-sm">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Gastos fijos del mes</h2>
          <span className="text-[10px] text-rose-400 font-semibold tabular-nums">
            {formatCLP(totalGastosFijosMes)}
          </span>
        </header>

        <p className="text-[10px] text-muted-foreground -mt-1">
          Base para proyecciones mensuales.
        </p>

        {catsFijasGasto.length > 0 ? (
          <ul className="flex flex-col gap-2.5" role="list">
            {catsFijasGasto.map((cat) => (
              <li key={cat.id} className="flex flex-col gap-1">
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
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No hay categorías marcadas como fijas aún.
          </p>
        )}
      </div>

      {/* ── Bloque 3: Proyección de liquidez ── */}
      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3 shadow-sm">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Proyección de liquidez</h2>
          {/* Toggle 3M / 6M */}
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-semibold">
            {([3, 6] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setHorizonte(n)}
                className={`px-2.5 py-1 transition ${
                  horizonte === n
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {n}M
              </button>
            ))}
          </div>
        </header>

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
        <div
          className="flex flex-col gap-2 pt-1 border-t border-border"
          role="list"
          aria-label={`Proyección a ${horizonte} meses`}
        >
          {proyeccion.map((p, i) => {
            const positivo = p.saldo >= 0;
            const maxAbs = Math.max(
              ...proyeccion.map((x) => Math.abs(x.saldo)),
              1
            );
            return (
              <div key={i} className="flex flex-col gap-0.5" role="listitem">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground capitalize">
                    {p.label}
                  </span>
                  <span
                    className={`tabular-nums font-semibold ${
                      positivo ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatCLP(p.saldo)}
                  </span>
                </div>
                <ProgressBar
                  value={Math.abs(p.saldo)}
                  max={maxAbs}
                  color={positivo ? "bg-emerald-500" : "bg-rose-500"}
                />
              </div>
            );
          })}
        </div>

        {!liquidezPositiva && (
          <p className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
            ⚠️ Tus gastos fijos superan tu ingreso promedio. La proyección
            muestra déficit acumulado.
          </p>
        )}
      </div>
    </section>
  );
}