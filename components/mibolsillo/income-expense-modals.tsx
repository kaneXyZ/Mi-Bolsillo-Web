"use client";

import { useEffect, useState } from "react";

type Account = { id: number; nombre: string | null; tipo: string };
type Category = { id: number; nombre: string };

type Props = {
  cuentas: Account[];
  categoriasIngreso: Category[];
  categoriasGasto: Category[];
  createIngreso: (formData: FormData) => Promise<void>;
  createGasto: (formData: FormData) => Promise<void>;
};

export function IncomeExpenseModals({
  cuentas,
  categoriasIngreso,
  categoriasGasto,
  createIngreso,
  createGasto,
}: Props) {
  const [open, setOpen] = useState<"ingreso" | "gasto" | null>(null);

  // bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpen("ingreso")}
          className="bg-emerald-600 rounded-2xl p-4 text-left flex flex-col justify-between shadow-lg active:scale-[0.98] transition"
        >
          <span className="text-[11px] uppercase font-semibold tracking-wide">
            Ingreso
          </span>
          <span className="text-xs mt-1 opacity-90">
            Registra dinero que entra
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen("gasto")}
          className="bg-rose-600 rounded-2xl p-4 text-left flex flex-col justify-between shadow-lg active:scale-[0.98] transition"
        >
          <span className="text-[11px] uppercase font-semibold tracking-wide">
            Gasto
          </span>
          <span className="text-xs mt-1 opacity-90">
            Registra un gasto rápido
          </span>
        </button>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60"
          onClick={() => setOpen(null)} // cerrar al tocar fondo
        >
          <div
            className="w-full max-w-md bg-background rounded-t-3xl p-4 pb-6 border-t border-border"
            onClick={(e) => e.stopPropagation()} // evitar cerrar al click dentro
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                {open === "ingreso" ? "Nuevo ingreso" : "Nuevo gasto"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Cerrar
              </button>
            </div>

            {open === "ingreso" ? (
              <form
                className="flex flex-col gap-2"
                action={async (formData) => {
                  await createIngreso(formData);
                  setOpen(null);
                }}
              >
                <input
                  name="monto_ingreso"
                  type="number"
                  step="100"
                  placeholder="Monto"
                  className="text-black text-sm rounded px-2 py-1"
                  required
                />
                <select
                  name="account_ingreso"
                  className="text-black text-sm rounded px-2 py-1"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Cuenta
                  </option>
                  {cuentas.map((cta) => (
                    <option key={cta.id} value={cta.id}>
                      {cta.nombre ?? cta.tipo}
                    </option>
                  ))}
                </select>
                <select
                  name="category_ingreso"
                  className="text-black text-sm rounded px-2 py-1"
                  defaultValue=""
                >
                  <option value="">Categoría (opcional)</option>
                  {categoriasIngreso.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                <input
                  name="descripcion_ingreso"
                  placeholder="Descripción (opcional)"
                  className="text-black text-xs rounded px-2 py-1"
                />
                <button
                  type="submit"
                  className="mt-1 w-full bg-emerald-500 text-xs font-semibold py-2 rounded text-white"
                >
                  Guardar ingreso
                </button>
              </form>
            ) : (
              <form
                className="flex flex-col gap-2"
                action={async (formData) => {
                  await createGasto(formData);
                  setOpen(null);
                }}
              >
                <input
                  name="monto_gasto"
                  type="number"
                  step="100"
                  placeholder="Monto"
                  className="text-black text-sm rounded px-2 py-1"
                  required
                />
                <select
                  name="account_gasto"
                  className="text-black text-sm rounded px-2 py-1"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Cuenta
                  </option>
                  {cuentas.map((cta) => (
                    <option key={cta.id} value={cta.id}>
                      {cta.nombre ?? cta.tipo}
                    </option>
                  ))}
                </select>
                <select
                  name="category_gasto"
                  className="text-black text-sm rounded px-2 py-1"
                  defaultValue=""
                >
                  <option value="">Categoría (opcional)</option>
                  {categoriasGasto.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                <input
                  name="descripcion_gasto"
                  placeholder="Descripción (opcional)"
                  className="text-black text-xs rounded px-2 py-1"
                />
                <button
                  type="submit"
                  className="mt-1 w-full bg-rose-500 text-xs font-semibold py-2 rounded text-white"
                >
                  Guardar gasto
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}