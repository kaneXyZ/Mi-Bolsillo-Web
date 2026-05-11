import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedShell } from "@/components/mibolsillo/protected-shell";
import { BalanceCard } from "@/components/mibolsillo/balance-card";
import { DebtCard } from "@/components/mibolsillo/debt-card";
import { IncomeExpenseModals } from "@/components/mibolsillo/income-expense-modals";
import { ProjectionChart } from "@/components/mibolsillo/projection-chart";
import { createIngreso, createGasto } from "./actions";
import { calcularProyeccion } from "@/lib/mibolsillo/projection";


// app/protected/page.tsx
export const metadata = { title: "Dashboard — Mi Bolsillo" };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "preguntas_completadas, nombre, ingreso_mensual_declarado, gasto_fijo_mensual_declarado, gasto_variable_mensual_estimado"
    )
    .eq("id", user.id)
    .single();

  if (!profile?.preguntas_completadas) redirect("/onboarding");

  const [{ data: accounts }, { data: transactions }, { data: categories }] =
    await Promise.all([
      supabase.from("accounts").select("*").eq("user_id", user.id),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("fecha", { ascending: false }),
      supabase
        .from("categories")
        .select("id, nombre, tipo, is_fixed")
        .eq("user_id", user.id),
    ]);

  const cuentas = accounts ?? [];
  const trans = transactions ?? [];
  const cats = categories ?? [];

  // --- Totales generales ---
  const saldoTotal = cuentas.reduce(
    (acc, cta) => acc + Number(cta.saldo_actual ?? 0),
    0
  );
  const deudaCuentas = cuentas.reduce(
    (acc, cta) => acc + Number(cta.deuda_actual ?? 0),
    0
  );
  const gastosTotales = trans
    .filter((t) => t.tipo === "gasto")
    .reduce((acc, t) => acc + Number(t.monto ?? 0), 0);

  // --- Proyección avanzada ---
  const proyeccion = calcularProyeccion(
    new Date(),
    saldoTotal,
    trans.map((t) => ({
      fecha: t.fecha,
      tipo: t.tipo as "ingreso" | "gasto",
      monto: Number(t.monto),
      category_id: t.category_id,
    })),
    cats.map((c) => ({
      id: c.id,
      tipo: c.tipo as "ingreso" | "gasto",
      is_fixed: c.is_fixed ?? false,
    })),
    {
      ingreso_mensual_declarado: Number(
        profile?.ingreso_mensual_declarado ?? 0
      ),
      gasto_fijo_mensual_declarado: Number(
        profile?.gasto_fijo_mensual_declarado ?? 0
      ),
      gasto_variable_mensual_estimado: Number(
        profile?.gasto_variable_mensual_estimado ?? 0
      ),
    }
  );

  const categoriasIngreso = cats.filter((c) => c.tipo === "ingreso");
  const categoriasGasto = cats.filter((c) => c.tipo === "gasto");

  return (
    <main className="min-h-screen flex flex-col items-center bg-background text-foreground">
      <ProtectedShell userName={profile?.nombre}>
        {/* Balance general */}
        <BalanceCard saldoTotal={saldoTotal} cuentasCount={cuentas.length} />

        {/* Deuda */}
        <DebtCard
          endeudamiento={deudaCuentas}
          gastosTotales={gastosTotales}
        />

        {/* Métricas del mes: 2x2 + saldo proyectado full width */}
        <section className="grid grid-cols-2 gap-2">
          <div className="bg-card rounded-xl p-2 border border-border">
            <span className="block text-[10px] text-muted-foreground">
              Ingresos fijos mes
            </span>
            <span className="block text-[11px] font-semibold text-emerald-400">
              {formatCurrency(proyeccion.ingresosMesFijos)}
            </span>
          </div>
          <div className="bg-card rounded-xl p-2 border border-border">
            <span className="block text-[10px] text-muted-foreground">
              Gastos fijos mes
            </span>
            <span className="block text-[11px] font-semibold text-rose-400">
              {formatCurrency(proyeccion.gastosMesFijos)}
            </span>
          </div>
          <div className="bg-card rounded-xl p-2 border border-border">
            <span className="block text-[10px] text-muted-foreground">
              Ingresos variables
            </span>
            <span className="block text-[11px] font-semibold text-emerald-300">
              {formatCurrency(proyeccion.ingresosMesVariables)}
            </span>
          </div>
          <div className="bg-card rounded-xl p-2 border border-border">
            <span className="block text-[10px] text-muted-foreground">
              Gastos variables
            </span>
            <span className="block text-[11px] font-semibold text-rose-300">
              {formatCurrency(proyeccion.gastosMesVariables)}
            </span>
          </div>
          <div className="col-span-2 bg-card rounded-xl p-2 border border-border">
            <span className="block text-[10px] text-muted-foreground">
              Saldo proyectado fin de mes
            </span>
            <span
              className={
                "block text-[13px] font-bold " +
                (proyeccion.saldoProyectado >= saldoTotal
                  ? "text-emerald-400"
                  : "text-rose-400")
              }
            >
              {formatCurrency(proyeccion.saldoProyectado)}
            </span>
          </div>
        </section>

        {/* Gráfico evolutivo de ingresos/gastos */}
        <ProjectionChart
          historial={proyeccion.historial}
          promedioIngresoFijo={proyeccion.promedioIngresoFijo}
          saldoActual={saldoTotal}
        />

        {/* Botones ingreso / gasto */}
        <IncomeExpenseModals
          cuentas={cuentas}
          categoriasIngreso={categoriasIngreso}
          categoriasGasto={categoriasGasto}
          createIngreso={createIngreso}
          createGasto={createGasto}
        />

        {/* Últimos movimientos como tarjetas */}
        <section className="bg-card rounded-2xl p-3 shadow-lg border border-border">
          <h2 className="text-sm font-semibold mb-2">
            Últimos movimientos
          </h2>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {trans.slice(0, 10).map((t) => {
              const cat = cats.find((c) => c.id === t.category_id);
              const esIngreso = t.tipo === "ingreso";
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={
                        "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold " +
                        (esIngreso
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400")
                      }
                    >
                      {esIngreso ? "+" : "-"}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {t.descripcion || (esIngreso ? "Ingreso" : "Gasto")}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        {cat?.nombre || "Sin categoría"}
                        {cat?.is_fixed && (
                          <span className="text-[9px] px-1 rounded-full bg-secondary border border-border">
                            fijo
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={
                        "block font-semibold " +
                        (esIngreso ? "text-emerald-400" : "text-rose-400")
                      }
                    >
                      {esIngreso ? "+" : "-"}
                      {formatCurrency(Number(t.monto))}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {new Date(t.fecha).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            {trans.length === 0 && (
              <span className="text-xs text-muted-foreground">
                Aún no tienes movimientos. Registra tu primer ingreso o gasto.
              </span>
            )}
          </div>
        </section>
      </ProtectedShell>
    </main>
  );
}