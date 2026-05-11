import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedShell } from "@/components/mibolsillo/protected-shell";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("fecha", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id),
  ]);

  const trans = transactions ?? [];
  const cats = categories ?? [];

  // Totales por categoría de gasto
  const gastosPorCat = cats
    .filter((c) => c.tipo === "gasto")
    .map((c) => {
      const total = trans
        .filter((t) => t.tipo === "gasto" && t.category_id === c.id)
        .reduce((acc, t) => acc + Number(t.monto), 0);
      return { nombre: c.nombre, total, is_fixed: c.is_fixed };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxGasto = gastosPorCat[0]?.total ?? 1;

  const fmt = (v: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <ProtectedShell>
        {/* Gastos por categoría */}
        <section className="bg-card rounded-2xl p-3 border border-border shadow-lg">
          <h2 className="text-xs font-semibold mb-3">
            Gastos por categoría (histórico)
          </h2>
          <div className="flex flex-col gap-2">
            {gastosPorCat.length === 0 && (
              <span className="text-[11px] text-muted-foreground">
                Sin movimientos registrados aún.
              </span>
            )}
            {gastosPorCat.map((c) => (
              <div key={c.nombre} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-medium">
                    {c.nombre}
                    {c.is_fixed && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                        fijo
                      </span>
                    )}
                  </span>
                  <span className="text-rose-400 font-semibold">
                    {fmt(c.total)}
                  </span>
                </div>
                {/* Barra visual */}
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-400/70 transition-all"
                    style={{ width: `${(c.total / maxGasto) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ingresos por categoría */}
        <section className="bg-card rounded-2xl p-3 border border-border shadow-lg">
          <h2 className="text-xs font-semibold mb-3">
            Ingresos por categoría (histórico)
          </h2>
          <div className="flex flex-col gap-2">
            {cats
              .filter((c) => c.tipo === "ingreso")
              .map((c) => {
                const total = trans
                  .filter((t) => t.tipo === "ingreso" && t.category_id === c.id)
                  .reduce((acc, t) => acc + Number(t.monto), 0);
                if (total === 0) return null;
                const maxIng =
                  cats
                    .filter((cc) => cc.tipo === "ingreso")
                    .map((cc) =>
                      trans
                        .filter((t) => t.category_id === cc.id)
                        .reduce((acc, t) => acc + Number(t.monto), 0)
                    )
                    .reduce((a, b) => Math.max(a, b), 1);
                return (
                  <div key={c.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-medium">
                        {c.nombre}
                        {c.is_fixed && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                            fijo
                          </span>
                        )}
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        {fmt(total)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400/70 transition-all"
                        style={{ width: `${(total / maxIng) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {trans.filter((t) => t.tipo === "ingreso").length === 0 && (
              <span className="text-[11px] text-muted-foreground">
                Sin ingresos registrados aún.
              </span>
            )}
          </div>
        </section>

        <p className="text-[10px] text-muted-foreground text-center">
          Próximamente: gráficos de tendencia mensual y comparativa fijo vs
          variable.
        </p>
      </ProtectedShell>
    </main>
  );
}