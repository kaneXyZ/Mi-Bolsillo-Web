type BalanceCardProps = {
  saldoTotal: number;
  cuentasCount: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function BalanceCard({ saldoTotal, cuentasCount }: BalanceCardProps) {
  return (
    <section className="bg-card rounded-2xl p-4 flex flex-col gap-2 shadow-lg">
      <span className="text-xs text-muted-foreground">Balance general</span>
      <span className="text-3xl font-bold tracking-tight">
        {formatCurrency(saldoTotal)}
      </span>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>Cuentas / efectivo</span>
        <span>{cuentasCount} cuentas</span>
      </div>
    </section>
  );
}