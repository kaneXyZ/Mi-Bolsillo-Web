// components/mibolsillo/projection-chart.tsx
"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import type { MonthBreakdown } from "@/lib/mibolsillo/projection";

type Props = {
    historial: MonthBreakdown[];
    promedioIngresoFijo: number;
    saldoActual: number;
};

function fmt(v: number) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        notation: "compact",
        maximumFractionDigits: 0,
    }).format(v);
}

// Tooltip personalizado
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as MonthBreakdown & { saldoAcumulado?: number };
    return (
        <div className="bg-card border border-border rounded-xl p-2 text-[11px] shadow-lg">
            <p className="font-semibold mb-1">{label}</p>
            <p className="text-emerald-400">
                Ingreso fijo: {fmt(d.ingresoFijo)}
            </p>
            <p className="text-emerald-300">
                Ingreso variable: {fmt(d.ingresoVariable)}
            </p>
            <p className="text-rose-400">
                Gasto fijo: {fmt(d.gastoFijo)}
            </p>
            <p className="text-rose-300">
                Gasto variable: {fmt(d.gastoVariable)}
            </p>
            <p className="font-semibold mt-1 border-t border-border pt-1">
                Neto: {fmt(d.neto)}
            </p>
        </div>
    );
}

export function ProjectionChart({
    historial,
    promedioIngresoFijo,
    saldoActual,
}: Props) {
    // Construimos data para el gráfico, acumulando el saldo
    let acumulado = saldoActual;
    const data = historial.map((m, i) => {
        // Solo acumulamos desde el mes actual (último)
        // los anteriores son históricos, no acumulan sobre saldo
        const esUltimo = i === historial.length - 1;
        if (esUltimo) {
            acumulado = saldoActual + m.neto;
        }
        return {
            ...m,
            saldoAcumulado: esUltimo ? acumulado : null,
        };
    });

    const esCreciendo =
        historial.length > 1 &&
        historial[historial.length - 1].neto >= 0;

    return (
        <section className="bg-card rounded-2xl p-3 border border-border shadow-lg">
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-semibold">
                    Proyección de ingresos
                </h2>
                <span
                    className={
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full " +
                        (esCreciendo
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400")
                    }
                >
                    {esCreciendo ? "▲ En alza" : "▼ En baja"}
                </span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">
                Últimos 3 meses · Promedio ingreso fijo:{" "}
                <span className="text-foreground font-medium">
                    {fmt(promedioIngresoFijo)}
                </span>
            </p>

            <ResponsiveContainer width="100%" height={160}>
                <AreaChart
                    data={data}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="gradIngreso" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradGasto" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        opacity={0.3}
                    />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => fmt(v)}
                        width={52}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />

                    {/* Área de ingresos fijos */}
                    <Area
                        type="monotone"
                        dataKey="ingresoFijo"
                        stroke="#34d399"
                        strokeWidth={2}
                        fill="url(#gradIngreso)"
                        name="Ingreso fijo"
                        dot={{ fill: "#34d399", r: 3 }}
                    />
                    {/* Área de gastos fijos (como negativo visual) */}
                    <Area
                        type="monotone"
                        dataKey="gastoFijo"
                        stroke="#f87171"
                        strokeWidth={2}
                        fill="url(#gradGasto)"
                        name="Gasto fijo"
                        dot={{ fill: "#f87171", r: 3 }}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Mini resumen abajo del gráfico */}
            <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-xl bg-background/60 border border-border px-2 py-1.5">
                    <span className="block text-[10px] text-muted-foreground">
                        Ingreso fijo promedio
                    </span>
                    <span className="block text-[11px] font-semibold text-emerald-400">
                        {fmt(promedioIngresoFijo)}
                    </span>
                </div>
                <div className="rounded-xl bg-background/60 border border-border px-2 py-1.5">
                    <span className="block text-[10px] text-muted-foreground">
                        Neto mes actual
                    </span>
                    <span
                        className={
                            "block text-[11px] font-semibold " +
                            (historial[historial.length - 1]?.neto >= 0
                                ? "text-emerald-400"
                                : "text-rose-400")
                        }
                    >
                        {fmt(historial[historial.length - 1]?.neto ?? 0)}
                    </span>
                </div>
            </div>
        </section>
    );
}