type DebtCardProps = {
  endeudamiento: number;
  gastosTotales: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DebtCard({ endeudamiento, gastosTotales }: DebtCardProps) {
  return (
    <section className="bg-card rounded-2xl p-4 flex justify-between items-center shadow-lg">
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Endeudamiento</span>
        <span className="text-xl font-semibold">
          {formatCurrency(endeudamiento)}
        </span>
      </div>
      <div className="text-right text-xs text-slate-500">
        <div>Gastos totales</div>
        <div className="font-medium">
          {formatCurrency(gastosTotales)}
        </div>
      </div>
    </section>
  );
}