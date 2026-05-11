import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedShell } from "@/components/mibolsillo/protected-shell";
import { BalanceCard } from "@/components/mibolsillo/balance-card";
import { DebtCard } from "@/components/mibolsillo/debt-card";
import { IncomeExpenseModals } from "@/components/mibolsillo/income-expense-modals";
import { ProjectionChart } from "@/components/mibolsillo/projection-chart";
import { DashboardCarousel } from "@/components/mibolsillo/dashboard-carousel";
import { EfectivoCard } from "@/components/mibolsillo/efectivo-card";
import { ResumenGlobalCard } from "@/components/mibolsillo/resumen-global-card";
import { createIngreso, createGasto } from "./actions";
import { calcularProyeccion } from "@/lib/mibolsillo/projection";
import {
  ensureCategoriaEfectivo,
  ensureCuentaEfectivo,
} from "@/app/protected/accounts/actions";
import { formatCLP } from "@/lib/mibolsillo/format"; // o define el helper inline si prefieres

export const metadata = { title: "Dashboard — Mi Bolsillo" };

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

  await Promise.all([
    ensureCategoriaEfectivo(user.id),
    ensureCuentaEfectivo(user.id),
  ]);

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
        .select("id, nombre, tipo, is_fixed, is_system")
        .eq("user_id", user.id),
    ]);

  const cuentas = accounts ?? [];
  const trans = transactions ?? [];
  const cats = categories ?? [];

  /* ── Separar cuenta efectivo ── */
  const cuentaEfectivo = cuentas.find(
    (c: any) =>
      c.tipo === "efectivo" ||
      c.bank_code === "efectivo" ||
      (c.nombre ?? "").toLowerCase() === "efectivo"
  );
  const cuentasSinEfectivo = cuentas.filter(
    (c: any) =>
      !(
        c.tipo === "efectivo" ||
        c.bank_code === "efectivo" ||
        (c.nombre ?? "").toLowerCase() === "efectivo"
      )
  );

  /* ── Totales ── */
  const saldoTotal = cuentas.reduce(
    (acc, cta: any) => acc + Number(cta.saldo_actual ?? 0),
    0
  );
  const deudaCuentas = cuentas.reduce(
    (acc, cta: any) => acc + Number(cta.deuda_actual ?? 0),
    0
  );
  const gastosTotales = trans
    .filter((t) => t.tipo === "gasto")
    .reduce((acc, t) => acc + Number(t.monto ?? 0), 0);

  /* ── Proyección base ── */
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

  /* ── Gastos fijos del mes ── */
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anoActual = ahora.getFullYear();

  const catsFijasGasto = cats
    .filter((c) => c.tipo === "gasto" && c.is_fixed)
    .map((c) => {
      const totalMes = trans
        .filter((t) => {
          if (t.tipo !== "gasto" || t.category_id !== c.id) return false;
          const d = new Date(t.fecha);
          return d.getMonth() === mesActual && d.getFullYear() === anoActual;
        })
        .reduce((acc, t) => acc + Number(t.monto ?? 0), 0);
      return { ...c, totalMes };
    })
    .sort((a, b) => b.totalMes - a.totalMes);

  const totalGastosFijosMes = catsFijasGasto.reduce(
    (acc, c) => acc + c.totalMes,
    0
  );

  const promedioIngresoMensual =
    proyeccion.promedioIngresoFijo ??
    Number(profile?.ingreso_mensual_declarado ?? 0);

  const liquidezMensualEstimada = promedioIngresoMensual - totalGastosFijosMes;

  return (
    <main className="min-h-screen flex flex-col items-center bg-background text-foreground">
      <ProtectedShell userName={profile?.nombre}>

        {/* ① Efectivo — siempre arriba, fuera del carrusel */}
        {cuentaEfectivo && (
          <div className="mb-3">
            <EfectivoCard
              saldo={Number(cuentaEfectivo.saldo_actual ?? 0)}
              nombre={cuentaEfectivo.nombre ?? "Efectivo"}
            />
          </div>
        )}

        {/* ② Carrusel — SOLO tarjetas de banco / crédito */}
        <DashboardCarousel
          cuentas={cuentasSinEfectivo as any}
          creditos={[]}
        />

        {/* ③ Resumen global — entre carrusel y Balance general */}
        <div className="mt-3 w-full">
          <ResumenGlobalCard
            saldoTotal={saldoTotal}
            deudaTotal={deudaCuentas}
            cuentasCount={cuentas.length}
            creditosCount={0}
          />
        </div>

        {/* ④ Balance general TODO:// */}
        <BalanceCard saldoTotal={saldoTotal} cuentasCount={cuentas.length} />

        {/* ⑤ Deuda global + gastos fijos + proyección de liquidez */}
        <DebtCard
          endeudamiento={deudaCuentas}
          gastosTotales={gastosTotales}
          saldoActual={saldoTotal}
          promedioIngresoMensual={promedioIngresoMensual}
          totalGastosFijosMes={totalGastosFijosMes}
          liquidezMensualEstimada={liquidezMensualEstimada}
          catsFijasGasto={catsFijasGasto.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            totalMes: c.totalMes,
          }))}
        />
        {/* ⑥ Métricas del mes 2×2 + saldo proyectado */}
        <section className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-card rounded-xl p-2 border border-border">
            <span className="block text-[10px] text-muted-foreground">
              Ingresos fijos mes
            </span>
            <span className="block text-[11px] font-semibold text-emerald-400">
              {formatCLP(proyeccion.ingresosMesFijos)}
            </span>
          </div>
          <div className="bg-card rounded-xl p-2 border border-border">
            <span className="block text-[10px] text-muted-foreground">
              Gastos fijos mes
            </span>
            <span className="block text-[11px] font-semibold text-rose-400">
              {formatCLP(proyeccion.gastosMesFijos)}
            </span>
          </div>
          <div className="bg-card rounded-xl p-2 border border-border">
            <span className="block text-[10px] text-muted-foreground">
              Ingresos variables
            </span>
            <span className="block text-[11px] font-semibold text-emerald-300">
              {formatCLP(proyeccion.ingresosMesVariables)}
            </span>
          </div>
          <div className="bg-card rounded-xl p-2 border border-border">
            <span className="block text-[10px] text-muted-foreground">
              Gastos variables
            </span>
            <span className="block text-[11px] font-semibold text-rose-300">
              {formatCLP(proyeccion.gastosMesVariables)}
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
              {formatCLP(proyeccion.saldoProyectado)}
            </span>
          </div>
        </section>

        {/* ⑦ Gráfico evolutivo */}
        <ProjectionChart
          historial={proyeccion.historial}
          promedioIngresoFijo={proyeccion.promedioIngresoFijo}
          saldoActual={saldoTotal}
        />

        {/* ⑧ Botones ingreso / gasto */}
        <IncomeExpenseModals
          cuentas={cuentas as any}
          categoriasIngreso={categoriasIngreso}
          categoriasGasto={categoriasGasto}
          createIngreso={createIngreso}
          createGasto={createGasto}
        />

        {/* ⑨ Últimos movimientos */}
        <section className="bg-card rounded-2xl p-3 shadow-lg border border-border mt-3">
          <h2 className="text-sm font-semibold mb-2">Últimos movimientos</h2>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {trans.slice(0, 10).map((t) => {
              const cat = cats.find((c) => c.id === t.category_id);
              const esIngreso = t.tipo === "ingreso";
              const esEfectivo =
                cat?.nombre && cat.nombre.toLowerCase() === "efectivo";
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
                        {esEfectivo ? (
                          <span className="inline-flex items-center gap-0.5 text-amber-400">
                            💵 Efectivo
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-2.5 h-2.5"
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </span>
                        ) : (
                          cat?.nombre ?? "Sin categoría"
                        )}
                        {cat?.is_fixed && !esEfectivo && (
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
                      {formatCLP(Number(t.monto))}
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