"use client";

import { useState } from "react";
import {
  updateCategoryFixed,
  deleteCategory,
} from "@/app/protected/categories/actions";

type Category = {
  id: number;
  nombre: string;
  tipo: "ingreso" | "gasto";
  is_fixed: boolean;
  parent_id: number | null;
};

type Props = {
  incomeCats: Category[];
  expenseCats: Category[];
  byId: Record<number, Category>;
};

export function CategoriesList({ incomeCats, expenseCats, byId }: Props) {
  const [editing, setEditing] = useState<number | null>(null);

  return (
    <section className="grid grid-cols-1 gap-3">
      {/* Ingresos */}
      <CatGroup
        titulo="Ingresos"
        color="emerald"
        cats={incomeCats}
        byId={byId}
        editing={editing}
        setEditing={setEditing}
      />
      {/* Gastos */}
      <CatGroup
        titulo="Gastos"
        color="rose"
        cats={expenseCats}
        byId={byId}
        editing={editing}
        setEditing={setEditing}
      />
    </section>
  );
}

function CatGroup({
  titulo,
  color,
  cats,
  byId,
  editing,
  setEditing,
}: {
  titulo: string;
  color: "emerald" | "rose";
  cats: Category[];
  byId: Record<number, Category>;
  editing: number | null;
  setEditing: (id: number | null) => void;
}) {
  const dot =
    color === "emerald" ? "bg-emerald-400" : "bg-rose-400";
  const border =
    color === "emerald"
      ? "border-emerald-500/40"
      : "border-rose-500/40";
  const bg =
    color === "emerald" ? "bg-emerald-500/10" : "bg-rose-500/10";
  const text =
    color === "emerald" ? "text-emerald-100" : "text-rose-100";

  return (
    <div className="bg-card rounded-2xl p-3 shadow-lg border border-border flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold flex items-center gap-1">
          <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
          {titulo}
        </h2>
        <span className="text-[10px] text-muted-foreground">
          {cats.length} categorías
        </span>
      </div>

      <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
        {cats.map((cat) => {
          const parent = cat.parent_id ? byId[cat.parent_id] : null;
          const isEditing = editing === cat.id;

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-border bg-background/60 px-2 py-1.5 text-[11px]"
            >
              {/* Fila principal */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${dot}`}
                  />
                  <span className="font-medium">{cat.nombre}</span>
                  {cat.is_fixed && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                      fijo
                    </span>
                  )}
                  {parent && (
                    <span className="text-[9px] text-muted-foreground">
                      · sub de {parent.nombre}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditing(isEditing ? null : cat.id)
                  }
                  className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-transparent hover:border-border transition"
                >
                  {isEditing ? "Cerrar" : "Editar"}
                </button>
              </div>

              {/* Panel de edición inline */}
              {isEditing && (
                <div className="mt-2 flex flex-col gap-1.5 pt-2 border-t border-border">
                  {/* Toggle fijo/variable */}
                  <form action={updateCategoryFixed}>
                    <input
                      type="hidden"
                      name="category_id"
                      value={cat.id}
                    />
                    <input
                      type="hidden"
                      name="is_fixed"
                      value={cat.is_fixed ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className={
                        "w-full text-[10px] font-semibold py-1 rounded-lg border transition " +
                        (cat.is_fixed
                          ? "border-border text-muted-foreground hover:border-rose-400/60 hover:text-rose-300"
                          : "border-border text-muted-foreground hover:border-emerald-400/60 hover:text-emerald-300")
                      }
                    >
                      {cat.is_fixed
                        ? "Marcar como variable"
                        : "Marcar como fijo"}
                    </button>
                  </form>

                  {/* Eliminar */}
                  <form action={deleteCategory}>
                    <input
                      type="hidden"
                      name="category_id"
                      value={cat.id}
                    />
                    <button
                      type="submit"
                      className="w-full text-[10px] font-semibold py-1 rounded-lg border border-transparent text-rose-400/60 hover:border-rose-500/40 hover:text-rose-400 transition"
                    >
                      Eliminar categoría
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}

        {cats.length === 0 && (
          <span className="text-[11px] text-muted-foreground">
            No tienes categorías de{" "}
            {titulo.toLowerCase()} aún.
          </span>
        )}
      </div>
    </div>
  );
}