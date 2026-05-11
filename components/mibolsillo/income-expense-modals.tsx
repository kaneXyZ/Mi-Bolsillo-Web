"use client";

import { useEffect, useState } from "react";

/* ─────────────────────────────────────────
   Tipos
───────────────────────────────────────── */
type Account = {
  id: number;
  nombre: string | null;
  tipo: string;
  bank_code?: string | null;
};

type Category = {
  id: number;
  nombre: string;
  is_fixed?: boolean;
  is_system?: boolean;
};

type Props = {
  cuentas:           Account[];
  categoriasIngreso: Category[];
  categoriasGasto:   Category[];
  createIngreso:     (formData: FormData) => Promise<void>;
  createGasto:       (formData: FormData) => Promise<void>;
};

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function todayLocal() {
  return new Date().toISOString().split("T")[0];
}

/** Detecta si una cuenta es la cuenta Efectivo */
function cuentaEsEfectivo(cuenta: Account | null | undefined): boolean {
  if (!cuenta) return false;
  return (
    cuenta.tipo === "efectivo" ||
    cuenta.bank_code === "efectivo" ||
    (cuenta.nombre ?? "").toLowerCase() === "efectivo"
  );
}

/** Detecta si una categoría es la categoría Efectivo */
function categoriaEsEfectivo(cat: Category): boolean {
  return cat.nombre.toLowerCase() === "efectivo";
}

/* ─────────────────────────────────────────
   Estilos
───────────────────────────────────────── */
const fieldCls =
  "w-full rounded-xl border border-border bg-card text-foreground text-sm px-3 py-2 " +
  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition";

const fieldClsRose =
  "w-full rounded-xl border border-border bg-card text-foreground text-sm px-3 py-2 " +
  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition";

const fieldClsDisabled =
  "w-full rounded-xl border border-border bg-muted/30 text-muted-foreground text-sm px-3 py-2 " +
  "cursor-not-allowed opacity-70 flex items-center gap-2";

/* ─────────────────────────────────────────
   Sub-componente Label
───────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────
   Icono candado inline (SVG)
───────────────────────────────────────── */
function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3 shrink-0"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   Componente principal
───────────────────────────────────────── */
export function IncomeExpenseModals({
  cuentas,
  categoriasIngreso,
  categoriasGasto,
  createIngreso,
  createGasto,
}: Props) {
  const [open, setOpen]                         = useState<"ingreso" | "gasto" | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // Resetear cuenta seleccionada cada vez que se abre/cierra el modal
  useEffect(() => {
    setSelectedAccountId(null);
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const esIngreso = open === "ingreso";

  // Cuenta actualmente seleccionada en el form
  const selectedAccount   = cuentas.find((c) => c.id === selectedAccountId) ?? null;
  const bloqueadaEfectivo = cuentaEsEfectivo(selectedAccount);

  // Categoría Efectivo por tipo (la del sistema)
  const catEfectivoIngreso = categoriasIngreso.find(categoriaEsEfectivo);
  const catEfectivoGasto   = categoriasGasto.find(categoriaEsEfectivo);
  const catEfectivo        = esIngreso ? catEfectivoIngreso : catEfectivoGasto;

  // Categorías para cuentas normales: excluir "Efectivo"
  // (esa categoría solo se asigna automáticamente con cuenta Efectivo)
  const catsIngresoNormal = categoriasIngreso.filter((c) => !categoriaEsEfectivo(c));
  const catsGastoNormal   = categoriasGasto.filter((c)   => !categoriaEsEfectivo(c));

  return (
    <>
      {/* ── Botones de acción rápida ── */}
      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpen("ingreso")}
          className="bg-emerald-600 rounded-2xl p-4 text-left flex flex-col justify-between shadow-lg active:scale-[0.98] transition text-white"
        >
          <span className="text-[11px] uppercase font-semibold tracking-wide">+ Ingreso</span>
          <span className="text-xs mt-1 opacity-80">Registra dinero que entra</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen("gasto")}
          className="bg-rose-600 rounded-2xl p-4 text-left flex flex-col justify-between shadow-lg active:scale-[0.98] transition text-white"
        >
          <span className="text-[11px] uppercase font-semibold tracking-wide">− Gasto</span>
          <span className="text-xs mt-1 opacity-80">Registra un gasto rápido</span>
        </button>
      </section>

      {/* ── Bottom sheet modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-md bg-background rounded-t-3xl pb-8 border-t border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    esIngreso ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <h2 className="text-sm font-semibold">
                  {esIngreso ? "Nuevo ingreso" : "Nuevo gasto"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-card transition"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Form */}
            <form
              className="flex flex-col gap-3 px-5 pt-4"
              action={async (formData) => {
                if (esIngreso) await createIngreso(formData);
                else await createGasto(formData);
                setOpen(null);
              }}
            >
              {/* Monto */}
              <div className="flex flex-col gap-1">
                <Label>Monto (CLP)</Label>
                <input
                  name={esIngreso ? "monto_ingreso" : "monto_gasto"}
                  type="number"
                  step="100"
                  min="0"
                  placeholder="Ej: 150000"
                  className={`${esIngreso ? fieldCls : fieldClsRose} text-base font-semibold`}
                  required
                />
              </div>

              {/* Fecha */}
              <div className="flex flex-col gap-1">
                <Label>Fecha</Label>
                <input
                  name={esIngreso ? "fecha_ingreso" : "fecha_gasto"}
                  type="date"
                  defaultValue={todayLocal()}
                  max={todayLocal()}
                  className={`${esIngreso ? fieldCls : fieldClsRose} [color-scheme:dark]`}
                  required
                />
              </div>

              {/* Cuenta */}
              <div className="flex flex-col gap-1">
                <Label>Cuenta</Label>
                <select
                  name={esIngreso ? "account_ingreso" : "account_gasto"}
                  className={esIngreso ? fieldCls : fieldClsRose}
                  defaultValue=""
                  required
                  onChange={(e) =>
                    setSelectedAccountId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="" disabled>Selecciona una cuenta</option>
                  {cuentas.map((cta) => (
                    <option key={cta.id} value={cta.id}>
                      {cuentaEsEfectivo(cta)
                        ? `💵 ${cta.nombre ?? "Efectivo"}`
                        : (cta.nombre ?? cta.tipo)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoría — condicional según cuenta seleccionada */}
              <div className="flex flex-col gap-1">
                <Label>Categoría</Label>

                {bloqueadaEfectivo ? (
                  <>
                    {/*
                      Input oculto para que el form envíe el valor correcto.
                      No usamos el select deshabilitado porque `disabled`
                      impide que el browser incluya el campo en el FormData.
                    */}
                    <input
                      type="hidden"
                      name={esIngreso ? "category_ingreso" : "category_gasto"}
                      value={catEfectivo?.id ?? ""}
                    />

                    {/* Display visual bloqueado */}
                    <div className={fieldClsDisabled}>
                      <span className="text-amber-400">💵</span>
                      <span className="flex-1">Efectivo</span>
                      <span className="text-amber-400">
                        <LockIcon />
                      </span>
                    </div>

                    {/* Leyenda explicativa */}
                    <span className="text-[10px] text-amber-400/80 flex items-center gap-1 mt-0.5">
                      <LockIcon />
                      Categoría asignada automáticamente para movimientos en efectivo
                    </span>
                  </>
                ) : (
                  <>
                    <select
                      name={esIngreso ? "category_ingreso" : "category_gasto"}
                      className={esIngreso ? fieldCls : fieldClsRose}
                      defaultValue=""
                    >
                      <option value="">Sin categoría</option>
                      {(esIngreso ? catsIngresoNormal : catsGastoNormal).map(
                        (cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                            {cat.is_fixed ? " (fijo)" : ""}
                          </option>
                        )
                      )}
                    </select>
                  </>
                )}
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1">
                <Label>Descripción</Label>
                <input
                  name={esIngreso ? "descripcion_ingreso" : "descripcion_gasto"}
                  placeholder="Ej: Sueldo mayo, Supermercado..."
                  className={esIngreso ? fieldCls : fieldClsRose}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={`mt-1 w-full text-sm font-semibold py-3 rounded-xl text-white transition active:scale-[0.98] shadow-lg ${
                  esIngreso
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {esIngreso ? "Guardar ingreso" : "Guardar gasto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}