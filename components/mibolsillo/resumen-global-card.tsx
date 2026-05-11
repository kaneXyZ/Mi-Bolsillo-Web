import { formatCLP } from "@/lib/mibolsillo/format";

function BarRatio({
  valor,
  total,
  color,
}: {
  valor: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min((valor / total) * 100, 100) : 0;
  return (
    <div className="w-full bg-border/40 rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

type Props = {
  saldoTotal: number;
  deudaTotal: number;
  cuentasCount: number;
  creditosCount: number;
};

export function ResumenGlobalCard({
  saldoTotal,
  deudaTotal,
  cuentasCount,
  creditosCount,
}: Props) {
  const patrimonio = saldoTotal - deudaTotal;

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
        Resumen global
      </span>

      {/* Saldo total */}
      <div>
        <span className="text-[11px] text-muted-foreground">
          Saldo total en cuentas
        </span>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {formatCLP(saldoTotal)}
        </p>
      </div>

      {/* Barra deuda */}
      {deudaTotal > 0 && (
        <div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Deuda total</span>
            <span className="text-rose-400 font-semibold tabular-nums">
              {formatCLP(deudaTotal)}
            </span>
          </div>
          <BarRatio
            valor={deudaTotal}
            total={saldoTotal + deudaTotal}
            color="bg-rose-500"
          />
        </div>
      )}

      {/* Patrimonio neto */}
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">Patrimonio neto</span>
        <span
          className={
            patrimonio >= 0
              ? "text-emerald-400 font-semibold tabular-nums"
              : "text-rose-400 font-semibold tabular-nums"
          }
        >
          {formatCLP(patrimonio)}
        </span>
      </div>

      {/* Footer */}
      <span className="text-[10px] text-muted-foreground mt-1">
        {cuentasCount} cuenta{cuentasCount !== 1 ? "s" : ""} ·{" "}
        {creditosCount} crédito{creditosCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}